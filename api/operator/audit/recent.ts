// Phase 2D-Plus — GET /api/operator/audit/recent
//
// Persistence-aware read endpoint for the operator audit log. Reads from
// the persistent backend when configured (via `NOX_AUDIT_KV_REST_URL` +
// `NOX_AUDIT_KV_REST_TOKEN`); falls back to the in-memory ring buffer
// otherwise.
//
// Strict invariants:
//   - Read-only. No mutation, no Notion call, no dispatcher.
//   - Auth gate: same `checkOperatorAuth` posture as
//     `/api/operator/audit` (the legacy in-memory endpoint). The
//     read-only-planner / private-write planner helpers are NOT used
//     here — audit reads are sensitive enough to require the explicit
//     operator key whenever the Private-Cockpit mode is off.
//   - Optional Private-Cockpit READ-ONLY mode: when
//     `NOX_OPERATOR_COCKPIT_PRIVATE_MODE` is on, the read is permitted
//     without a header so the operator's own browser can paint the
//     audit modal without exposing the key in the bundle.
//   - No secrets. No env values. The persistent backend's URL/token are
//     never echoed in the response.
//   - No raw client IPs. Only the sanitised `clientKeyLabel` is stored.

import type { ApiHandler } from '../../_lib/handler.js';
import { methodAllowed, sendError, setNoStore } from '../../_lib/handler.js';
import {
  checkReadOnlyPlannerAuth,
  respondAuthFailure,
} from '../../_lib/auth.js';
import { checkRateLimit, respondRateLimited } from '../../_lib/rateLimit.js';
import { appendAuditEvent } from '../../_lib/audit.js';
import type { AuditEventType } from '../../_lib/audit.js';
import { listAuditEvents as listFromStore } from '../../_lib/auditStore.js';

const ROUTE = '/api/operator/audit/recent';

// Allowlist for the `eventType` query filter. We accept ONLY known
// types to keep the wire surface tight and the response predictable.
const KNOWN_EVENT_TYPES: ReadonlySet<AuditEventType> = new Set<AuditEventType>([
  'COMMAND_CREATE_ATTEMPT',
  'COMMAND_CREATED',
  'COMMAND_LIST',
  'COMMAND_READ',
  'COMMAND_ACTION_ATTEMPT',
  'COMMAND_DRY_RUN',
  'COMMAND_APPROVAL_REQUESTED',
  'COMMAND_APPROVED',
  'COMMAND_REJECTED',
  'COMMAND_EXECUTE_BLOCKED',
  'AUTH_NOT_CONFIGURED',
  'AUTH_FAILED',
  'RATE_LIMITED',
  'VALIDATION_FAILED',
  'NOT_FOUND',
  'AUDIT_LIST',
  'PROJECT_CONTEXT_READ_ATTEMPT',
  'PROJECT_CONTEXT_READ',
  'PROJECT_CONTEXT_NOT_CONFIGURED',
  'PROJECT_CONTEXT_VALIDATION_FAILED',
  'PROJECT_CONTEXT_UPSTREAM_FAILED',
  'PROJECT_CONTEXT_PROJECT_LOOKUP',
  'PROJECT_CONTEXT_PROJECT_NOT_FOUND',
  'PROJECT_CONTEXT_RELATION_READ',
  'PLAN_PREVIEW_REQUESTED',
  'PLAN_PREVIEW_VALIDATION_FAILED',
  'PLAN_PREVIEW_RESPONDED',
  'PLAN_VALIDATE_REQUESTED',
  'PLAN_VALIDATE_VALIDATION_FAILED',
  'PLAN_VALIDATE_NOT_CONFIGURED',
  'PLAN_VALIDATE_UPSTREAM_FAILED',
  'PLAN_VALIDATE_SCHEMA_OK',
  'PLAN_VALIDATE_SCHEMA_MISMATCH',
  'PLAN_COMMIT_REQUESTED',
  'PLAN_COMMIT_VALIDATION_FAILED',
  'PLAN_COMMIT_DIGEST_MISMATCH',
  'PLAN_COMMIT_TOKEN_MISSING',
  'PLAN_COMMIT_LOCKED',
  'PLAN_COMMIT_WRITE_NOT_CONFIGURED',
  'PLAN_COMMIT_WRITE_TOKEN_COLLISION',
  'PLAN_COMMIT_SCHEMA_NOT_READY',
  'PLAN_COMMIT_DUPLICATE_RISK',
  'PLAN_COMMIT_PAGE_CREATED',
  'PLAN_COMMIT_PAGE_FAILED',
  'PLAN_COMMIT_SUCCESS',
  'PLAN_COMMIT_PARTIAL_FAILURE',
  'PLAN_COMMIT_PROPERTY_MAPPING_FAILED',
  'PLAN_COMMIT_ALL_FAILED',
  'PLAN_COMMIT_INTERNAL_ERROR',
]);

// projectId / planDigest filters — accept a conservative regex to keep
// the query surface tight. We deliberately re-use the same shape as the
// commit-side validators so the operator gets predictable behaviour.
const PROJECT_ID_FILTER_RE = /^[A-Za-z0-9._\-:/]{1,80}$/;
const PLAN_DIGEST_FILTER_RE = /^[0-9a-fA-F]{6,64}$/;

function readQuery(
  query: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = query[key];
  if (Array.isArray(v)) return v[0];
  if (typeof v === 'string') return v;
  return undefined;
}

function parseLimit(raw: string | undefined): number {
  if (!raw) return 50;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return 50;
  return Math.min(Math.max(n, 1), 500);
}

const handler: ApiHandler = async (req, res) => {
  const method = req.method ?? '?';

  setNoStore(res);

  // 1. Rate limit
  const rl = checkRateLimit(req);
  if (!rl.ok) {
    appendAuditEvent({
      eventType: 'RATE_LIMITED',
      route: ROUTE,
      method,
      statusCode: 429,
      outcome: 'blocked',
      clientKeyLabel: rl.keyLabel,
      source: 'operator-api',
    });
    return respondRateLimited(res, rl);
  }
  const clientKeyLabel = rl.keyLabel;

  // 2. Auth — operator-key OR private-cockpit readonly. We re-use the
  // narrow read-only planner gate because its semantics match exactly
  // what we want here: the operator's own private cockpit instance may
  // call the read endpoint without a header (the network boundary is
  // the trust boundary), while every other caller must present the key.
  const auth = checkReadOnlyPlannerAuth(req);
  if (!auth.ok) {
    appendAuditEvent({
      eventType: auth.reason === 'not_configured' ? 'AUTH_NOT_CONFIGURED' : 'AUTH_FAILED',
      route: ROUTE,
      method,
      statusCode: auth.statusCode,
      outcome: 'blocked',
      clientKeyLabel,
      source: 'operator-api',
    });
    return respondAuthFailure(res, auth);
  }

  // 3. Method
  if (!methodAllowed(req, res, ['GET'])) {
    appendAuditEvent({
      eventType: 'VALIDATION_FAILED',
      route: ROUTE,
      method,
      statusCode: 405,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'method_not_allowed',
      source: 'operator-api',
    });
    return;
  }

  // 4. Parse filters.
  const limit = parseLimit(readQuery(req.query, 'limit'));
  const projectIdRaw = readQuery(req.query, 'projectId');
  const eventTypeRaw = readQuery(req.query, 'eventType');
  const planDigestRaw = readQuery(req.query, 'planDigest');

  if (projectIdRaw && !PROJECT_ID_FILTER_RE.test(projectIdRaw)) {
    appendAuditEvent({
      eventType: 'VALIDATION_FAILED',
      route: ROUTE,
      method,
      statusCode: 400,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'projectId_filter_invalid',
      source: 'operator-api',
    });
    return sendError(
      res,
      400,
      'bad_request',
      `Query 'projectId' must match ${PROJECT_ID_FILTER_RE.source}.`,
    );
  }
  let eventTypeFilter: AuditEventType | undefined;
  if (eventTypeRaw) {
    if (!KNOWN_EVENT_TYPES.has(eventTypeRaw as AuditEventType)) {
      appendAuditEvent({
        eventType: 'VALIDATION_FAILED',
        route: ROUTE,
        method,
        statusCode: 400,
        outcome: 'blocked',
        clientKeyLabel,
        detailsSummary: 'eventType_filter_invalid',
        source: 'operator-api',
      });
      return sendError(
        res,
        400,
        'bad_request',
        `Query 'eventType' is not a known audit event type.`,
      );
    }
    eventTypeFilter = eventTypeRaw as AuditEventType;
  }
  if (planDigestRaw && !PLAN_DIGEST_FILTER_RE.test(planDigestRaw)) {
    appendAuditEvent({
      eventType: 'VALIDATION_FAILED',
      route: ROUTE,
      method,
      statusCode: 400,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'planDigest_filter_invalid',
      source: 'operator-api',
    });
    return sendError(
      res,
      400,
      'bad_request',
      `Query 'planDigest' must match ${PLAN_DIGEST_FILTER_RE.source}.`,
    );
  }

  // 5. Read from store.
  let result;
  try {
    result = await listFromStore({
      limit,
      projectId: projectIdRaw,
      eventType: eventTypeFilter,
      planDigest: planDigestRaw,
    });
  } catch (err) {
    appendAuditEvent({
      eventType: 'AUDIT_LIST',
      route: ROUTE,
      method,
      statusCode: 500,
      outcome: 'failure',
      clientKeyLabel,
      detailsSummary: `store_read_failed: ${err instanceof Error ? err.name : 'unknown'}`,
      source: 'operator-api',
    });
    return sendError(
      res,
      500,
      'audit_read_failed',
      'Audit read failed. Server logs hold the sanitised diagnostic.',
    );
  }

  appendAuditEvent({
    eventType: 'AUDIT_LIST',
    route: ROUTE,
    method,
    statusCode: 200,
    outcome: 'success',
    clientKeyLabel,
    detailsSummary: `source=${result.source} count=${result.count} limit=${result.limit}`,
    source: 'operator-api',
  });

  res.status(200).json({
    events: result.events,
    meta: {
      source: result.source,
      limit: result.limit,
      count: result.count,
      totalAvailable: result.totalAvailable,
      authMode: auth.authMode,
    },
  });
};

export default handler;
