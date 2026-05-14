// APP-X-BRIDGE-01 — POST /api/operator/commands (create) + GET (list).
// APP-X-BRIDGE-03 — Rate-limit + audit wiring.
// Skeleton only. No external calls. No persistent storage. No live execution.

import type { ApiHandler } from '../_lib/handler.js';
import { badRequest, methodAllowed, readBodyAsObject, setNoStore } from '../_lib/handler.js';
import { checkOperatorAuth, respondAuthFailure } from '../_lib/auth.js';
import { checkRateLimit, respondRateLimited } from '../_lib/rateLimit.js';
import { appendAuditEvent } from '../_lib/audit.js';
import {
  isAllowedCommandType,
  isAllowedRiskLevel,
  optionalBoolean,
  optionalIdempotencyKey,
  optionalString,
  requireString,
} from '../_lib/validation.js';
import type { OperatorCommand, RiskLevel } from '../_lib/types.js';
import { listCommands, nextAuditId, nextCommandId, saveCommand } from '../_lib/store.js';

const ROUTE = '/api/operator/commands';

const handler: ApiHandler = async (req, res) => {
  const method = req.method ?? '?';

  setNoStore(res);

  // 1. Rate limit (before auth so 503/401 spam also gets throttled).
  const rl = checkRateLimit(req);
  if (!rl.ok) {
    appendAuditEvent({
      eventType: 'RATE_LIMITED', route: ROUTE, method, statusCode: 429,
      outcome: 'blocked', clientKeyLabel: rl.keyLabel,
    });
    return respondRateLimited(res, rl);
  }
  const clientKeyLabel = rl.keyLabel;

  // 2. Auth gate.
  const auth = checkOperatorAuth(req);
  if (!auth.ok) {
    appendAuditEvent({
      eventType: auth.reason === 'not_configured' ? 'AUTH_NOT_CONFIGURED' : 'AUTH_FAILED',
      route: ROUTE, method, statusCode: auth.statusCode, outcome: 'blocked', clientKeyLabel,
    });
    return respondAuthFailure(res, auth);
  }

  // 3. Method allowlist.
  if (!methodAllowed(req, res, ['GET', 'POST'])) {
    appendAuditEvent({
      eventType: 'VALIDATION_FAILED', route: ROUTE, method, statusCode: 405,
      outcome: 'blocked', clientKeyLabel, detailsSummary: 'method_not_allowed',
    });
    return;
  }

  if (req.method === 'GET') {
    const commands = listCommands().map(stripInternal);
    appendAuditEvent({
      eventType: 'COMMAND_LIST', route: ROUTE, method, statusCode: 200,
      outcome: 'success', clientKeyLabel, detailsSummary: `count=${commands.length}`,
    });
    res.status(200).json({ commands, meta: { skeleton: true, liveExecution: 'locked' } });
    return;
  }

  // POST = create
  appendAuditEvent({
    eventType: 'COMMAND_CREATE_ATTEMPT', route: ROUTE, method,
    outcome: 'attempt', clientKeyLabel,
  });

  const body = readBodyAsObject(req);

  const idem = optionalIdempotencyKey(body.idempotencyKey);
  if (!idem.ok) return failValidation(res, clientKeyLabel, method, 'idempotencyKey', idem.error);

  if (!isAllowedCommandType(body.commandType)) {
    return failValidation(res, clientKeyLabel, method, 'commandType', `Field 'commandType' is not on the server allowlist.`);
  }

  const projectId = requireString(body.projectId, 'projectId', 64);
  if (!projectId.ok) return failValidation(res, clientKeyLabel, method, 'projectId', projectId.error);

  const questId = optionalString(body.questId, 'questId', 64);
  if (!questId.ok) return failValidation(res, clientKeyLabel, method, 'questId', questId.error);

  const title = requireString(body.title, 'title', 200);
  if (!title.ok) return failValidation(res, clientKeyLabel, method, 'title', title.error);

  const intent = requireString(body.intent, 'intent', 1000);
  if (!intent.ok) return failValidation(res, clientKeyLabel, method, 'intent', intent.error);

  const payloadSummary = requireString(body.payloadSummary, 'payloadSummary', 2000);
  if (!payloadSummary.ok) return failValidation(res, clientKeyLabel, method, 'payloadSummary', payloadSummary.error);

  const requestedBy = requireString(body.requestedBy, 'requestedBy', 80);
  if (!requestedBy.ok) return failValidation(res, clientKeyLabel, method, 'requestedBy', requestedBy.error);

  const requiresApproval = optionalBoolean(body.requiresApproval, 'requiresApproval');
  if (!requiresApproval.ok) return failValidation(res, clientKeyLabel, method, 'requiresApproval', requiresApproval.error);

  let riskLevel: RiskLevel = 'Mittel';
  if (body.riskLevel !== undefined && body.riskLevel !== null) {
    if (!isAllowedRiskLevel(body.riskLevel)) {
      return failValidation(res, clientKeyLabel, method, 'riskLevel', `Field 'riskLevel' must be one of: Niedrig, Mittel, Hoch.`);
    }
    riskLevel = body.riskLevel;
  }

  const now = new Date().toISOString();
  const command: OperatorCommand = {
    id: nextCommandId(),
    commandType: body.commandType,
    projectId: projectId.value,
    questId: questId.value,
    title: title.value,
    intent: intent.value,
    payloadSummary: payloadSummary.value,
    requestedBy: requestedBy.value,
    status: requiresApproval.value === false ? 'Draft' : 'Freigabe noetig',
    riskLevel,
    requiresApproval: requiresApproval.value !== false,
    createdAt: now,
    dryRunResult: null,
    history: [
      { at: now, by: requestedBy.value, event: 'Command erstellt (Skeleton-Stub).' },
    ],
  };

  saveCommand(command);

  appendAuditEvent({
    eventType: 'COMMAND_CREATED', route: ROUTE, method, statusCode: 201,
    outcome: 'success', clientKeyLabel, commandId: command.id,
    detailsSummary: `commandType=${command.commandType} riskLevel=${command.riskLevel}`,
  });

  res.status(201).json({
    command: stripInternal(command),
    auditEventId: nextAuditId('AUD-CREATE'),
    meta: { skeleton: true, liveExecution: 'locked' },
  });
};

function failValidation(
  res: Parameters<ApiHandler>[1],
  clientKeyLabel: string,
  method: string,
  field: string,
  message: string,
): void {
  appendAuditEvent({
    eventType: 'VALIDATION_FAILED', route: ROUTE, method, statusCode: 400,
    outcome: 'blocked', clientKeyLabel, detailsSummary: `field=${field}`,
  });
  badRequest(res, message);
}

function stripInternal(c: OperatorCommand): OperatorCommand {
  // Reserved for future: redact secrets / private URLs. Currently a no-op
  // because skeleton never stores anything sensitive.
  return c;
}

export default handler;
