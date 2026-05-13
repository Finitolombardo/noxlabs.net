// APP-X-BRIDGE-01 — POST /api/operator/commands (create) + GET (list).
// Skeleton only. No external calls. No persistent storage. No live execution.

import type { ApiHandler } from '../_lib/handler.js';
import { badRequest, methodAllowed, readBodyAsObject } from '../_lib/handler.js';
import { requireOperatorAuth } from '../_lib/auth.js';
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

const handler: ApiHandler = async (req, res) => {
  if (!requireOperatorAuth(req, res)) return;
  if (!methodAllowed(req, res, ['GET', 'POST'])) return;

  if (req.method === 'GET') {
    const commands = listCommands().map(stripInternal);
    res.status(200).json({ commands, meta: { skeleton: true, liveExecution: 'locked' } });
    return;
  }

  // POST
  const body = readBodyAsObject(req);

  const idem = optionalIdempotencyKey(body.idempotencyKey);
  if (!idem.ok) return badRequest(res, idem.error);

  if (!isAllowedCommandType(body.commandType)) {
    return badRequest(res, `Field 'commandType' is not on the server allowlist.`);
  }

  const projectId = requireString(body.projectId, 'projectId', 64);
  if (!projectId.ok) return badRequest(res, projectId.error);

  const questId = optionalString(body.questId, 'questId', 64);
  if (!questId.ok) return badRequest(res, questId.error);

  const title = requireString(body.title, 'title', 200);
  if (!title.ok) return badRequest(res, title.error);

  const intent = requireString(body.intent, 'intent', 1000);
  if (!intent.ok) return badRequest(res, intent.error);

  const payloadSummary = requireString(body.payloadSummary, 'payloadSummary', 2000);
  if (!payloadSummary.ok) return badRequest(res, payloadSummary.error);

  const requestedBy = requireString(body.requestedBy, 'requestedBy', 80);
  if (!requestedBy.ok) return badRequest(res, requestedBy.error);

  const requiresApproval = optionalBoolean(body.requiresApproval, 'requiresApproval');
  if (!requiresApproval.ok) return badRequest(res, requiresApproval.error);

  let riskLevel: RiskLevel = 'Mittel';
  if (body.riskLevel !== undefined && body.riskLevel !== null) {
    if (!isAllowedRiskLevel(body.riskLevel)) {
      return badRequest(res, `Field 'riskLevel' must be one of: Niedrig, Mittel, Hoch.`);
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

  res.status(201).json({
    command: stripInternal(command),
    auditEventId: nextAuditId('AUD-CREATE'),
    meta: { skeleton: true, liveExecution: 'locked' },
  });
};

function stripInternal(c: OperatorCommand): OperatorCommand {
  // Reserved for future: redact secrets / private URLs. Currently a no-op
  // because skeleton never stores anything sensitive.
  return c;
}

export default handler;
