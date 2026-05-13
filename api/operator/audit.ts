// APP-X-BRIDGE-03 — GET /api/operator/audit
// Read-only listing of the in-memory audit ring buffer.
// Same rate-limit + auth gate as the other operator endpoints.
// Skeleton only — buffer resets on every Vercel cold start.

import type { ApiHandler } from '../_lib/handler.js';
import { methodAllowed } from '../_lib/handler.js';
import { checkOperatorAuth, respondAuthFailure } from '../_lib/auth.js';
import { checkRateLimit, respondRateLimited } from '../_lib/rateLimit.js';
import { appendAuditEvent, getAuditBufferStats, listAuditEvents } from '../_lib/audit.js';

const ROUTE = '/api/operator/audit';

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

  const events = listAuditEvents();
  const stats = getAuditBufferStats();

  appendAuditEvent({
    eventType: 'AUDIT_LIST', route: ROUTE, method, statusCode: 200,
    outcome: 'success', clientKeyLabel, detailsSummary: `count=${events.length}`,
  });

  res.status(200).json({
    events,
    meta: {
      skeleton: true,
      ringBufferMax: stats.max,
      count: stats.count,
      liveExecution: 'locked',
      note: 'In-memory only. Resets on serverless cold start.',
    },
  });
};

export default handler;
