// APP-X-BRIDGE-01 — POST /api/operator/commands/:id/:action
// Skeleton only. Allowed actions: dry-run, request-approval, approve, reject, execute.
// `execute` is always locked (HTTP 423) until backend proxy, HMAC secret,
// approval gate and operator confirmation are wired up.

import type { ApiHandler } from '../../../_lib/handler';
import { badRequest, locked, methodAllowed, notFound, readBodyAsObject, readQueryString, sendError } from '../../../_lib/handler';
import { requireOperatorAuth } from '../../../_lib/auth';
import { isAllowedAction, optionalIdempotencyKey, requireString } from '../../../_lib/validation';
import { getCommand, nextAuditId, saveCommand } from '../../../_lib/store';
import type { CommandAction, DryRunResult, OperatorCommand } from '../../../_lib/types';

const handler: ApiHandler = async (req, res) => {
  if (!requireOperatorAuth(req, res)) return;
  if (!methodAllowed(req, res, ['POST'])) return;

  const id = readQueryString(req, 'id');
  const action = readQueryString(req, 'action');

  if (!id) return notFound(res, 'Command id missing in path.');
  if (!action || !isAllowedAction(action)) {
    return badRequest(res, `Unknown action. Allowed: dry-run, request-approval, approve, reject, execute.`);
  }

  const command = getCommand(id);
  if (!command) return notFound(res, `Command '${id}' not found.`);

  const body = readBodyAsObject(req);

  switch (action satisfies CommandAction) {
    case 'execute':
      // Live execution is permanently locked in this skeleton.
      return locked(
        res,
        'Live execution is locked. Backend proxy, HMAC secret, approval gate and operator confirmation required.',
      );

    case 'dry-run': {
      const requestedBy = requireString(body.requestedBy, 'requestedBy', 80);
      if (!requestedBy.ok) return badRequest(res, requestedBy.error);
      const idem = optionalIdempotencyKey(body.idempotencyKey);
      if (!idem.ok) return badRequest(res, idem.error);

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
      if (!requestedBy.ok) return badRequest(res, requestedBy.error);
      const reason = requireString(body.reason, 'reason', 500);
      if (!reason.ok) return badRequest(res, reason.error);

      const updated: OperatorCommand = {
        ...command,
        status: command.status === 'Gesperrt' ? 'Gesperrt' : 'Freigabe noetig',
        history: [
          ...command.history,
          { at: new Date().toISOString(), by: requestedBy.value, event: `Freigabe angefordert: ${reason.value}` },
        ],
      };
      saveCommand(updated);

      res.status(200).json({
        approval: { id: nextAuditId('APR'), commandId: updated.id, status: 'Wartet' },
        meta: { skeleton: true, liveExecution: 'locked' },
      });
      return;
    }

    case 'approve': {
      const approvedBy = requireString(body.approvedBy, 'approvedBy', 80);
      if (!approvedBy.ok) return badRequest(res, approvedBy.error);

      if (command.status === 'Gesperrt') {
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
      if (!rejectedBy.ok) return badRequest(res, rejectedBy.error);
      const reason = requireString(body.reason, 'reason', 500);
      if (!reason.ok) return badRequest(res, reason.error);

      const updated: OperatorCommand = {
        ...command,
        status: 'Gesperrt',
        history: [
          ...command.history,
          { at: new Date().toISOString(), by: rejectedBy.value, event: `Command abgelehnt: ${reason.value}` },
        ],
      };
      saveCommand(updated);

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
