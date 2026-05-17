// Phase 2A — POST /api/operator/projects/:projectId/plan/preview
//
// Read-only echo + structural validation for the Project Auto Planner.
// The handler intentionally does NOT:
//   - call Notion (no read, no write, no schema lookup — that is Phase 2B)
//   - call any dispatcher / Telegram / agent
//   - read any environment variable other than NOX_OPERATOR_API_KEY
//     (transitively, via the operator-auth gate)
//   - persist anything beyond the in-memory audit ring buffer
//
// The shared validator + mutation projector lives in `api/_lib/planDraft.ts`
// so Phase 2A (this file) and Phase 2B (`./validate.ts`) speak the same
// payload contract.
//
// Pipeline (same shape as commands.ts + context.ts):
//   1. setNoStore
//   2. rate limit
//   3. operator auth
//   4. method allowlist (POST)
//   5. projectId regex validation
//   6. structural payload validation (length-capped, allowlisted enums)
//   7. compute echoedDigest (deterministic, non-cryptographic hash)
//   8. emit `PLAN_PREVIEW_RESPONDED` audit event
//   9. respond with PlanPreviewResponse
//
// `echoedDigest` is a 32-bit FNV-1a hex string over the canonical JSON
// of the normalised draft. It is intentionally non-cryptographic in
// Phase 2A/2B. Phase 2C will replace it with a SHA-256 digest computed
// via Web Crypto / node:crypto before the first real Notion write.

import type { ApiHandler, ApiResponse } from '../../../../_lib/handler.js';
import {
  badRequest,
  methodAllowed,
  readBodyAsObject,
  setNoStore,
} from '../../../../_lib/handler.js';
import { checkReadOnlyPlannerAuth, respondAuthFailure } from '../../../../_lib/auth.js';
import { checkRateLimit, respondRateLimited } from '../../../../_lib/rateLimit.js';
import { appendAuditEvent } from '../../../../_lib/audit.js';
import type { PlanPreviewResponse } from '../../../../_lib/types.js';
import {
  buildPlannedMutations,
  computePlanDraftDigest,
  PROJECT_ID_RE,
  validatePlanDraftPayload,
} from '../../../../_lib/planDraft.js';
import type { PlanDraftValidationFailure } from '../../../../_lib/planDraft.js';

const ROUTE_LABEL = '/api/operator/projects/:projectId/plan/preview';

function readProjectIdParam(
  query: Record<string, string | string[] | undefined>,
): string | undefined {
  const v = query.projectId;
  if (Array.isArray(v)) return v[0];
  if (typeof v === 'string') return v;
  return undefined;
}

function failValidation(
  res: ApiResponse,
  clientKeyLabel: string,
  method: string,
  failure: PlanDraftValidationFailure,
): void {
  appendAuditEvent({
    eventType: 'PLAN_PREVIEW_VALIDATION_FAILED',
    route: ROUTE_LABEL,
    method,
    statusCode: 400,
    outcome: 'blocked',
    clientKeyLabel,
    detailsSummary: `field=${failure.field}`,
  });
  badRequest(res, failure.message);
}

const handler: ApiHandler = async (req, res) => {
  const method = req.method ?? '?';
  const route = ROUTE_LABEL;

  setNoStore(res);

  // 1. Rate limit (before auth so unauthenticated spam also gets throttled).
  const rl = checkRateLimit(req);
  if (!rl.ok) {
    appendAuditEvent({
      eventType: 'RATE_LIMITED',
      route,
      method,
      statusCode: 429,
      outcome: 'blocked',
      clientKeyLabel: rl.keyLabel,
    });
    return respondRateLimited(res, rl);
  }
  const clientKeyLabel = rl.keyLabel;

  // 2. Auth gate. Scope is intentionally narrow: this endpoint accepts
  // `private_cockpit_readonly` mode when the server-side flag is set; all
  // other operator endpoints continue to require the explicit operator key.
  const auth = checkReadOnlyPlannerAuth(req);
  if (!auth.ok) {
    appendAuditEvent({
      eventType: auth.reason === 'not_configured' ? 'AUTH_NOT_CONFIGURED' : 'AUTH_FAILED',
      route,
      method,
      statusCode: auth.statusCode,
      outcome: 'blocked',
      clientKeyLabel,
    });
    return respondAuthFailure(res, auth);
  }
  const authMode = auth.authMode;

  // 3. Method.
  if (!methodAllowed(req, res, ['POST'])) {
    appendAuditEvent({
      eventType: 'PLAN_PREVIEW_VALIDATION_FAILED',
      route,
      method,
      statusCode: 405,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'method_not_allowed',
    });
    return;
  }

  // 4. projectId validation.
  const projectIdRaw = readProjectIdParam(req.query);
  if (!projectIdRaw || !PROJECT_ID_RE.test(projectIdRaw)) {
    appendAuditEvent({
      eventType: 'PLAN_PREVIEW_VALIDATION_FAILED',
      route,
      method,
      statusCode: 400,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'projectId_invalid',
    });
    badRequest(
      res,
      `Path parameter 'projectId' must match ${PROJECT_ID_RE.source} (max 64).`,
    );
    return;
  }
  const projectId = projectIdRaw;

  appendAuditEvent({
    eventType: 'PLAN_PREVIEW_REQUESTED',
    route,
    method,
    outcome: 'attempt',
    clientKeyLabel,
    detailsSummary: `projectId=${projectId}`,
  });

  // 5. Structural payload validation (shared with Phase 2B).
  const body = readBodyAsObject(req);
  const validation = validatePlanDraftPayload(projectId, body);
  if (!validation.ok) {
    return failValidation(res, clientKeyLabel, method, validation.failure);
  }
  const draft = validation.draft;

  // 6. Deterministic echo digest (FNV-1a in Phase 2A/2B).
  const echoedDigest = computePlanDraftDigest(draft);

  // 7. Build projected mutations (shared with Phase 2B).
  const plannedMutations = buildPlannedMutations(draft, echoedDigest);

  const response: PlanPreviewResponse = {
    ok: true,
    projectId: draft.projectId,
    normalisedPlan: draft.planSteps,
    plannedMutations,
    echoedDigest,
    idempotencyKey: draft.idempotencyKey,
    meta: {
      skeleton: false,
      phase: '2a',
      readOnly: true,
      notionWritesEnabled: false,
      liveExecution: 'locked',
      authMode,
    },
  };

  appendAuditEvent({
    eventType: 'PLAN_PREVIEW_RESPONDED',
    route,
    method,
    statusCode: 200,
    outcome: 'success',
    clientKeyLabel,
    detailsSummary: `projectId=${projectId} steps=${draft.planSteps.length} digest=${echoedDigest} authMode=${authMode}`,
  });

  res.status(200).json(response);
};

export default handler;
