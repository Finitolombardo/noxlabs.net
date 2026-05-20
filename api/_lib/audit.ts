// APP-X-BRIDGE-03 — Audit log for operator API events.
//
// Phase 2D-Plus — events are now persisted best-effort through
// `auditStore.ts`. A small in-memory ring buffer is still kept here so
// the legacy `/api/operator/audit` endpoint and existing synchronous
// callers keep working without changes. The new `/audit/recent`
// endpoint reads directly from the store, which transparently routes to
// the persistent backend when configured.
//
// Privacy rules enforced here (callers must follow them too):
//   - No raw IPs. Use the keyLabel produced by rateLimit.ts.
//   - No request bodies. Only a small allowlist of semantic fields plus
//     a short `detailsSummary` sanitised by the caller.
//   - No secrets. The configured operator key / Notion tokens are never
//     read by this file.
//
// Backwards compatibility:
//   - The existing `AuditEventInput` shape is preserved.
//   - The synchronous `appendAuditEvent(input)` signature is preserved.
//     Every previously-valid call still compiles and behaves identically
//     from the caller's perspective.
//   - New optional fields (projectId, planDigest, idempotencyKey,
//     clientPlanId, planStepsCount, notionPageId, errorCode, requestId,
//     source) are additive and can be supplied incrementally by each
//     endpoint.

import {
  appendAuditEventFireAndForget,
  isPersistentAuditEnabled,
} from './auditStore.js';

export type AuditEventType =
  | 'COMMAND_CREATE_ATTEMPT'
  | 'COMMAND_CREATED'
  | 'COMMAND_LIST'
  | 'COMMAND_READ'
  | 'COMMAND_ACTION_ATTEMPT'
  | 'COMMAND_DRY_RUN'
  | 'COMMAND_APPROVAL_REQUESTED'
  | 'COMMAND_APPROVED'
  | 'COMMAND_REJECTED'
  | 'COMMAND_EXECUTE_BLOCKED'
  | 'AUTH_NOT_CONFIGURED'
  | 'AUTH_FAILED'
  | 'RATE_LIMITED'
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'AUDIT_LIST'
  | 'PROJECT_CONTEXT_READ_ATTEMPT'
  | 'PROJECT_CONTEXT_READ'
  | 'PROJECT_CONTEXT_NOT_CONFIGURED'
  | 'PROJECT_CONTEXT_VALIDATION_FAILED'
  | 'PROJECT_CONTEXT_UPSTREAM_FAILED'
  | 'PROJECT_CONTEXT_PROJECT_LOOKUP'
  | 'PROJECT_CONTEXT_PROJECT_NOT_FOUND'
  | 'PROJECT_CONTEXT_RELATION_READ'
  // Phase 2A — Project Auto Planner draft preview. Read-only echo + structural
  // validation. No Notion call, no dispatcher, no write. The `_RESPONDED`
  // event is emitted only on the 200 success path.
  | 'PLAN_PREVIEW_REQUESTED'
  | 'PLAN_PREVIEW_VALIDATION_FAILED'
  | 'PLAN_PREVIEW_RESPONDED'
  // Phase 2B — Project Auto Planner schema validation. Read-only Notion
  // schema fetch (GET /v1/databases/{id}) + Projects-DB row lookup. No
  // Notion writes, no dispatcher, no Phase-2C execution path.
  | 'PLAN_VALIDATE_REQUESTED'
  | 'PLAN_VALIDATE_VALIDATION_FAILED'
  | 'PLAN_VALIDATE_NOT_CONFIGURED'
  | 'PLAN_VALIDATE_UPSTREAM_FAILED'
  | 'PLAN_VALIDATE_SCHEMA_OK'
  | 'PLAN_VALIDATE_SCHEMA_MISMATCH'
  // Phase 2C-Pre — locked commit pipeline. The endpoint exists but every
  // path that could touch Notion goes through stacked gates: feature flag,
  // dedicated write token, digest re-match, schema re-validate, commit
  // token / phrase, and idempotency precheck. Until the operator flips
  // NOX_NOTION_WRITE_ENABLED to exactly "true" *and* provides a distinct
  // NOX_NOTION_WRITE_TOKEN, the handler returns 423 locked. Even with the
  // flag on, the digest/schema/duplicate gates can still abort the write.
  | 'PLAN_COMMIT_REQUESTED'
  | 'PLAN_COMMIT_VALIDATION_FAILED'
  | 'PLAN_COMMIT_DIGEST_MISMATCH'
  | 'PLAN_COMMIT_TOKEN_MISSING'
  | 'PLAN_COMMIT_LOCKED'
  | 'PLAN_COMMIT_WRITE_NOT_CONFIGURED'
  | 'PLAN_COMMIT_WRITE_TOKEN_COLLISION'
  | 'PLAN_COMMIT_SCHEMA_NOT_READY'
  | 'PLAN_COMMIT_DUPLICATE_RISK'
  | 'PLAN_COMMIT_PAGE_CREATED'
  | 'PLAN_COMMIT_PAGE_FAILED'
  | 'PLAN_COMMIT_SUCCESS'
  | 'PLAN_COMMIT_PARTIAL_FAILURE'
  // Commit-500-Diagnostics — fine-grained envelope so the audit log can
  // distinguish the failure path even when the HTTP shape collapses to
  // a generic 500 (sanitised JSON).
  | 'PLAN_COMMIT_PROPERTY_MAPPING_FAILED'
  | 'PLAN_COMMIT_ALL_FAILED'
  | 'PLAN_COMMIT_INTERNAL_ERROR';

export type AuditOutcome = 'success' | 'attempt' | 'blocked' | 'failure';

/**
 * Origin marker — distinguishes which surface produced the event. Used by
 * the read endpoint and the UI to group / colour events. Optional: legacy
 * callers that don't set it default to `operator-api`.
 */
export type AuditSource =
  | 'operator-api'
  | 'operator-cockpit'
  | 'project-auto-planner'
  | 'plan-commit';

export interface AuditEventInput {
  eventType: AuditEventType;
  route: string;
  method: string;
  outcome: AuditOutcome;
  clientKeyLabel: string;
  statusCode?: number;
  commandId?: string;
  action?: string;
  detailsSummary?: string;
  // Phase 2D-Plus — optional semantic fields. All additive; legacy
  // callers continue to compile unchanged.
  projectId?: string;
  planDigest?: string;
  idempotencyKey?: string;
  clientPlanId?: string;
  planStepsCount?: number;
  notionPageId?: string;
  errorCode?: string;
  requestId?: string;
  source?: AuditSource;
}

export interface AuditEvent extends AuditEventInput {
  id: string;
  timestamp: string;
}

const LEGACY_MIRROR_MAX = 200;
const legacyMirror: AuditEvent[] = [];
let counter = 0;

function nextAuditId(): string {
  counter += 1;
  return `AUD-${Date.now().toString(36).toUpperCase()}-${counter.toString(36).toUpperCase()}`;
}

function clip(v: string | undefined, max: number): string | undefined {
  if (typeof v !== 'string') return undefined;
  if (v.length <= max) return v;
  return v.slice(0, max);
}

function normalise(input: AuditEventInput): AuditEvent {
  return {
    eventType: input.eventType,
    route: input.route,
    method: input.method,
    outcome: input.outcome,
    clientKeyLabel: clip(input.clientKeyLabel, 80) ?? '',
    ...(typeof input.statusCode === 'number' ? { statusCode: input.statusCode } : {}),
    ...(input.commandId ? { commandId: clip(input.commandId, 80) } : {}),
    ...(input.action ? { action: clip(input.action, 80) } : {}),
    ...(input.detailsSummary ? { detailsSummary: clip(input.detailsSummary, 240) } : {}),
    ...(input.projectId ? { projectId: clip(input.projectId, 80) } : {}),
    ...(input.planDigest ? { planDigest: clip(input.planDigest, 64) } : {}),
    ...(input.idempotencyKey ? { idempotencyKey: clip(input.idempotencyKey, 80) } : {}),
    ...(input.clientPlanId ? { clientPlanId: clip(input.clientPlanId, 80) } : {}),
    ...(typeof input.planStepsCount === 'number'
      ? { planStepsCount: input.planStepsCount }
      : {}),
    ...(input.notionPageId ? { notionPageId: clip(input.notionPageId, 80) } : {}),
    ...(input.errorCode ? { errorCode: clip(input.errorCode, 80) } : {}),
    ...(input.requestId ? { requestId: clip(input.requestId, 64) } : {}),
    source: input.source ?? 'operator-api',
    id: nextAuditId(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Synchronous-feel append used by every endpoint. Internally:
 *   1. The event is normalised + stamped with an id + timestamp.
 *   2. The legacy in-memory mirror is updated synchronously so the
 *      pre-existing `/api/operator/audit` endpoint keeps showing
 *      recent events.
 *   3. The persistent backend (when configured) is updated via a
 *      fire-and-forget Promise inside `auditStore`. Errors are
 *      swallowed and surfaced as a sanitised `console.warn`.
 *
 * Never throws. Returns the normalised event for callers that want to
 * correlate (e.g. log the audit id alongside a request id).
 */
export function appendAuditEvent(input: AuditEventInput): AuditEvent {
  const event = normalise(input);
  // Legacy mirror — bounded ring buffer, newest at the tail.
  legacyMirror.push(event);
  if (legacyMirror.length > LEGACY_MIRROR_MAX) {
    legacyMirror.splice(0, legacyMirror.length - LEGACY_MIRROR_MAX);
  }
  // Persistent + store-local mirror. Fire-and-forget; never crashes.
  try {
    appendAuditEventFireAndForget(event);
  } catch {
    // The store's helper already swallows failures, but belt-and-
    // braces: any synchronous throw must never escape the audit path.
  }
  return event;
}

/**
 * Legacy synchronous newest-first snapshot. Used by the pre-existing
 * `/api/operator/audit` endpoint. The new `/audit/recent` endpoint
 * reads through `readAuditEvents` (async, persistence-aware) instead.
 */
export function listAuditEvents(limit?: number): AuditEvent[] {
  const reversed: AuditEvent[] = [];
  for (let i = legacyMirror.length - 1; i >= 0; i--) {
    reversed.push(legacyMirror[i] as AuditEvent);
  }
  if (typeof limit === 'number' && limit > 0 && limit < reversed.length) {
    return reversed.slice(0, limit);
  }
  return reversed;
}

export function getAuditBufferStats(): { count: number; max: number; persistent: boolean } {
  return {
    count: legacyMirror.length,
    max: LEGACY_MIRROR_MAX,
    persistent: isPersistentAuditEnabled(),
  };
}
