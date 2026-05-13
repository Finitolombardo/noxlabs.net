// APP-X-BRIDGE-01 — GET /api/operator/commands/:id
// APP-X-BRIDGE-03 — Rate-limit + audit wiring.
// Skeleton only.

import type { ApiHandler } from '../../_lib/handler.js';
import { methodAllowed, notFound, readQueryString } from '../../_lib/handler.js';
import { checkOperatorAuth, respondAuthFailure } from '../../_lib/auth.js';
import { checkRateLimit, respondRateLimited } from '../../_lib/rateLimit.js';
import { appendAuditEvent } from '../../_lib/audit.js';
import { getCommand } from '../../_lib/store.js';

const ROUTE = '/api/operator/commands/:id';

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

  if (!methodAllowed(req, res, ['GET'])) {
    appendAuditEvent({
      eventType: 'VALIDATION_FAILED', route: ROUTE, method, statusCode: 405,
      outcome: 'blocked', clientKeyLabel, detailsSummary: 'method_not_allowed',
    });
    return;
  }

  const id = readQueryString(req, 'id');
  if (!id) {
    appendAuditEvent({
      eventType: 'NOT_FOUND', route: ROUTE, method, statusCode: 404,
      outcome: 'failure', clientKeyLabel, detailsSummary: 'id_missing',
    });
    return notFound(res, 'Command id missing in path.');
  }

  const command = getCommand(id);
  if (!command) {
    appendAuditEvent({
      eventType: 'NOT_FOUND', route: ROUTE, method, statusCode: 404,
      outcome: 'failure', clientKeyLabel, commandId: id,
    });
    return notFound(res, `Command '${id}' not found.`);
  }

  appendAuditEvent({
    eventType: 'COMMAND_READ', route: ROUTE, method, statusCode: 200,
    outcome: 'success', clientKeyLabel, commandId: command.id,
  });

  res.status(200).json({
    command,
    meta: { skeleton: true, liveExecution: 'locked' },
  });
};

export default handler;
