// APP-X-BRIDGE-01 — POST /api/operator/commands/:id/:action
// APP-X-BRIDGE-03 — Rate-limit + audit wiring.
//
// Skeleton only. Allowed actions: dry-run, request-approval, approve, reject, execute.
// `execute` is always locked (HTTP 423) until backend proxy, HMAC secret,
// approval gate and operator confirmation are wired up.

import type { ApiHandler, ApiResponse } from '../../../_lib/handler.js';
import { badRequest, locked, methodAllowed, notFound, readBodyAsObject, readQueryString, sendError } from '../../../_lib/handler.js';
import { checkOperatorAuth, respondAuthFailure } from '../../../_lib/auth.js';
import { checkRateLimit, respondRateLimited } from '../../../_lib/rateLimit.js';
import { appendAuditEvent } from '../../../_lib/audit.js';
import { isAllowedAction, optionalIdempotencyKey, requireString } from '../../../_lib/validation.js';
import { getCommand, nextAuditId, saveCommand } from '../../../_lib/store.js';
import type { CommandAction, DryRunResult, OperatorCommand } from '../../../_lib/types.js';

const ROUTE = '/api/operator/commands/:id/:action';

const handler: ApiHandler = async (req, res) => {
  const method = req.method ?? '?';

  const rl = checkRateLimit(req);
  if (!rl.ok) {
    appendAuditEvent({
      eventType: 'RATE_LIMITED', route: ROUTE, method, statusCode: 429,
      outcome: 'blocked', clientKeyLabel: rl.keyLabel,
    });
    return respondRateLimited(res, rl);
  }
  const clientKeyLabel = rl.keyLabel;

  const auth = checkOperatorAuth(req);
  if (!auth.ok) {
    appendAuditEvent({
      eventType: auth.reason === 'not_configured' ? 'AUTH_NOT_CONFIGURED' : 'AUTH_FAILED',
      route: ROUTE, method, statusCode: auth.statusCode, outcome: 'blocked', clientKeyLabel,
    });
    return respondAuthFailure(res, auth);
  }

  if (!methodAllowed(req, res, ['POST'])) {
    appendAuditEvent({
      eventType: 'VALIDATION_FAILED', route: ROUTE, method, statusCode: 405,
      outcome: 'blocked', clientKeyLabel, detailsSummary: 'method_not_allowed',
    });
    return;
  }

  const id = readQueryString(req, 'id');
  const action = readQueryString(req, 'action');

  if (!id) {
    appendAuditEvent({
      eventType: 'NOT_FOUND', route: ROUTE, method, statusCode: 404,
      outcome: 'failure', clientKeyLabel, detailsSummary: 'id_missing',
    });
    return notFound(res, 'Command id missing in path.');
  }
  if (!action || !isAllowedAction(action)) {
    appendAuditEvent({
      eventType: 'VALIDATION_FAILED', route: ROUTE, method, statusCode: 400,
      outcome: 'blocked', clientKeyLabel, commandId: id, action: action ?? 'unknown',
      detailsSummary: 'unknown_action',
    });
    return badRequest(res, `Unknown action. Allowed: dry-run, request-approval, approve, reject, execute.`);
  }

  appendAuditEvent({
    eventType: 'COMMAND_ACTION_ATTEMPT', route: ROUTE, method, outcome: 'attempt',
    clientKeyLabel, commandId: id, action,
  });

  const command = getCommand(id);
  if (!command) {
    appendAuditEvent({
      eventType: 'NOT_FOUND', route: ROUTE, method, statusCode: 404,
      outcome: 'failure', clientKeyLabel, commandId: id, action,
    });
    return notFound(res, `Command '${id}' not found.`);
  }

  const body = readBodyAsObject(req);

  switch (action satisfies CommandAction) {
    case 'execute':
      // Live execution is permanently locked in this skeleton.
      appendAuditEvent({
        eventType: 'COMMAND_EXECUTE_BLOCKED', route: ROUTE, method, statusCode: 423,
        outcome: 'blocked', clientKeyLabel, commandId: command.id, action,
      });
      return locked(
        res,
        'Live execution is locked. Backend proxy, HMAC secret, approval gate and operator confirmation required.',
      );

    case 'dry-run': {
      const requestedBy = requireString(body.requestedBy, 'requestedBy', 80);
      if (!requestedBy.ok) return failValidation(res, clientKeyLabel, method, command.id, action, 'requestedBy', requestedBy.error);
      const idem = optionalIdempotencyKey(body.idempotencyKey);
      if (!idem.ok) return failValidation(res, clientKeyLabel, method, command.id, action, 'idempotencyKey', idem.error);

      const dryRunResult: DryRunResult = stubDryRun(command);
      const updated: OperatorCommand = {
        ...command,
        status: command.status === 'Gesperrt' ? 'Gesperrt' : 'Dry-Run bereit',
        dryRunResult,
        history: [
          ...command.history,
          { at: new Date().toISOString(), by: requestedBy.value, event: 'Dry-Run ausgefuehrt (Stub).' },
        ],
      };
      saveCommand(updated);

      appendAuditEvent({
        eventType: 'COMMAND_DRY_RUN', route: ROUTE, method, statusCode: 200,
        outcome: 'success', clientKeyLabel, commandId: updated.id, action,
        detailsSummary: `status=${updated.status}`,
      });

      res.status(200).json({
        commandId: updated.id,
        status: updated.status,
        dryRunResult,
        auditEventId: nextAuditId('AUD-DRYRUN'),
        meta: { skeleton: true, liveExecution: 'locked' },
      });
      return;
    }

    case 'request-approval': {
      const requestedBy = requireString(body.requestedBy, 'requestedBy', 80);
      if (!requestedBy.ok) return failValidation(res, clientKeyLabel, method, command.id, action, 'requestedBy', requestedBy.error);
      const reason = requireString(body.reason, 'reason', 500);
      if (!reason.ok) return failValidation(res, clientKeyLabel, method, command.id, action, 'reason', reason.error);

      const updated: OperatorCommand = {
        ...command,
        status: command.status === 'Gesperrt' ? 'Gesperrt' : 'Freigabe noetig',
        history: [
          ...command.history,
          { at: new Date().toISOString(), by: requestedBy.value, event: `Freigabe angefordert: ${reason.value}` },
        ],
      };
      saveCommand(updated);

      appendAuditEvent({
        eventType: 'COMMAND_APPROVAL_REQUESTED', route: ROUTE, method, statusCode: 200,
        outcome: 'success', clientKeyLabel, commandId: updated.id, action,
      });

      res.status(200).json({
        approval: { id: nextAuditId('APR'), commandId: updated.id, status: 'Wartet' },
        meta: { skeleton: true, liveExecution: 'locked' },
      });
      return;
    }

    case 'approve': {
      const approvedBy = requireString(body.approvedBy, 'approvedBy', 80);
      if (!approvedBy.ok) return failValidation(res, clientKeyLabel, method, command.id, action, 'approvedBy', approvedBy.error);

      if (command.status === 'Gesperrt') {
        appendAuditEvent({
          eventType: 'VALIDATION_FAILED', route: ROUTE, method, statusCode: 409,
          outcome: 'blocked', clientKeyLabel, commandId: command.id, action,
          detailsSummary: 'status_locked',
        });
        return sendError(res, 409, 'conflict', 'Command ist gesperrt und kann nicht freigegeben werden.');
      }

      const updated: OperatorCommand = {
        ...command,
        status: 'Freigegeben',
        history: [
          ...command.history,
          { at: new Date().toISOString(), by: approvedBy.value, event: 'Command freigegeben (Stub, keine Live-Ausfuehrung).' },
        ],
      };
      saveCommand(updated);

      appendAuditEvent({
        eventType: 'COMMAND_APPROVED', route: ROUTE, method, statusCode: 200,
        outcome: 'success', clientKeyLabel, commandId: updated.id, action,
      });

      res.status(200).json({
        commandId: updated.id,
        status: updated.status,
        auditEventId: nextAuditId('AUD-APPROVE'),
        meta: { skeleton: true, liveExecution: 'locked' },
      });
      return;
    }

    case 'reject': {
      const rejectedBy = requireString(body.rejectedBy, 'rejectedBy', 80);
      if (!rejectedBy.ok) return failValidation(res, clientKeyLabel, method, command.id, action, 'rejectedBy', rejectedBy.error);
      const reason = requireString(body.reason, 'reason', 500);
      if (!reason.ok) return failValidation(res, clientKeyLabel, method, command.id, action, 'reason', reason.error);

      const updated: OperatorCommand = {
        ...command,
        status: 'Gesperrt',
        history: [
          ...command.history,
          { at: new Date().toISOString(), by: rejectedBy.value, event: `Command abgelehnt: ${reason.value}` },
        ],
      };
      saveCommand(updated);

      appendAuditEvent({
        eventType: 'COMMAND_REJECTED', route: ROUTE, method, statusCode: 200,
        outcome: 'success', clientKeyLabel, commandId: updated.id, action,
      });

      res.status(200).json({
        commandId: updated.id,
        status: updated.status,
        auditEventId: nextAuditId('AUD-REJECT'),
        meta: { skeleton: true, liveExecution: 'locked' },
      });
      return;
    }
  }
};

function failValidation(
  res: ApiResponse,
  clientKeyLabel: string,
  method: string,
  commandId: string,
  action: CommandAction,
  field: string,
  message: string,
): void {
  appendAuditEvent({
    eventType: 'VALIDATION_FAILED', route: ROUTE, method, statusCode: 400,
    outcome: 'blocked', clientKeyLabel, commandId, action,
    detailsSummary: `field=${field}`,
  });
  badRequest(res, message);
}

function stubDryRun(command: OperatorCommand): DryRunResult {
  return {
    summary: `Dry-Run-Stub fuer ${command.commandType} auf Projekt ${command.projectId}.`,
    estimatedImpact: 'Keine Mutation. Skeleton-Antwort. Real-Implementation steht aus.',
    requiredInputs: ['Operator-Freigabe', 'Backend-Proxy-Secrets', 'Audit-Log-Persistenz'],
    missingArtifacts: ['HMAC-Secret', 'Andromeda-Upstream-URL', 'Persistenz-Layer'],
    recommendedNextAction: 'Erst echten Backend-Proxy + Approval-Gate verdrahten, dann Dry-Run ueber Andromeda.',
  };
}

export default handler;
