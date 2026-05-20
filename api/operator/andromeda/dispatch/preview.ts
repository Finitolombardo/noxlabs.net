// Andromeda Worker Dispatch — POST /api/operator/andromeda/dispatch/preview
//
// Read-only dry-run. Takes a plan-step + projectId + projectGoal (optionally
// a Notion page id) and returns a sanitised DispatchPayloadPreview plus a
// structured readiness report. Crucially, this endpoint:
//
//   - DOES NOT call any worker, runner, queue, webhook, dispatcher
//   - DOES NOT call Anthropic, Claude, Codex, n8n, Hermes
//   - DOES NOT read, write, query, or schema-fetch Notion
//   - DOES NOT mutate any in-memory store
//   - DOES NOT touch the Phase-2C-Pre commit pipeline
//
// It is intentionally a thin wrapper around the pure helpers in
// `api/_lib/dispatch.ts`. The auth gate matches the read-only planner
// posture: an operator key OR `NOX_OPERATOR_COCKPIT_PRIVATE_MODE=true`.
// The endpoint emits a single audit event (eventType `PLAN_PREVIEW_RESPONDED`
// is reused for now to keep the audit type set small — the route label
// disambiguates).

import type { ApiHandler } from '../../../_lib/handler.js';
import {
  badRequest,
  methodAllowed,
  readBodyAsObject,
  setNoStore,
} from '../../../_lib/handler.js';
import { checkReadOnlyPlannerAuth, respondAuthFailure } from '../../../_lib/auth.js';
import { checkRateLimit, respondRateLimited } from '../../../_lib/rateLimit.js';
import { appendAuditEvent } from '../../../_lib/audit.js';
import {
  ALLOWED_PLAN_STEP_AGENTS,
  ALLOWED_PLAN_STEP_RISKS,
} from '../../../_lib/types.js';
import type { PlanStepAgent, PlanStepRisk } from '../../../_lib/types.js';
import {
  assessDispatchReadiness,
  buildDispatchPayloadFromStep,
  DISPATCH_STATUS_LABELS,
} from '../../../_lib/dispatch.js';
import type {
  DispatchPayload,
  DispatchPreviewInput,
  DispatchReadinessReport,
} from '../../../_lib/dispatch.js';

const ROUTE = '/api/operator/andromeda/dispatch/preview';

// Limit shapes — keep the wire surface deterministic and small.
const MAX_GOAL = 2000;
const MAX_FIELD = 1000;
const PROJECT_ID_RE = /^[A-Za-z0-9._-]{1,64}$/;
const PLAN_STEP_ID_RE = /^[A-Za-z0-9_-]{4,80}$/;
const NOTION_PAGE_ID_RE = /^[0-9a-fA-F-]{16,80}$/;

interface RawStep {
  id?: unknown;
  step?: unknown;
  title?: unknown;
  ziel?: unknown;
  output?: unknown;
  reason?: unknown;
  agent?: unknown;
  risk?: unknown;
  gate?: unknown;
}

interface RawBody {
  projectId?: unknown;
  projectGoal?: unknown;
  notionPageId?: unknown;
  step?: unknown;
}

interface DispatchPreviewResponse {
  ok: boolean;
  dispatchReady: boolean;
  missingFields: DispatchReadinessReport['missingFields'];
  riskFlags: DispatchReadinessReport['riskFlags'];
  dispatchPayloadPreview: DispatchPayload;
  recommendedNextAction: string;
  meta: {
    skeleton: false;
    phase: 'andromeda-mvp';
    readOnly: true;
    notionWritesEnabled: false;
    liveExecution: 'locked';
    statusModel: Record<string, string>;
    notes: string[];
  };
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
    });
    return respondRateLimited(res, rl);
  }
  const clientKeyLabel = rl.keyLabel;

  // 2. Auth — same posture as /plan/preview. Read-only, no write-side gate
  // needed because the endpoint does not produce any persistent change.
  const auth = checkReadOnlyPlannerAuth(req);
  if (!auth.ok) {
    appendAuditEvent({
      eventType: auth.reason === 'not_configured' ? 'AUTH_NOT_CONFIGURED' : 'AUTH_FAILED',
      route: ROUTE,
      method,
      statusCode: auth.statusCode,
      outcome: 'blocked',
      clientKeyLabel,
    });
    return respondAuthFailure(res, auth);
  }

  // 3. Method
  if (!methodAllowed(req, res, ['POST'])) {
    appendAuditEvent({
      eventType: 'VALIDATION_FAILED',
      route: ROUTE,
      method,
      statusCode: 405,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'method_not_allowed',
    });
    return;
  }

  // 4. Body parsing + validation. We are deliberately strict on shape but
  // forgiving on free-text length — long text gets clipped inside the
  // pure helpers.
  const raw = readBodyAsObject(req) as RawBody;
  const projectId = typeof raw.projectId === 'string' ? raw.projectId.trim() : '';
  if (!PROJECT_ID_RE.test(projectId)) {
    appendAuditEvent({
      eventType: 'VALIDATION_FAILED',
      route: ROUTE,
      method,
      statusCode: 400,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'projectId_invalid',
    });
    badRequest(res, `Field 'projectId' must match ${PROJECT_ID_RE.source}.`);
    return;
  }

  const projectGoal =
    typeof raw.projectGoal === 'string'
      ? raw.projectGoal.slice(0, MAX_GOAL)
      : '';

  const notionPageIdRaw = typeof raw.notionPageId === 'string' ? raw.notionPageId.trim() : '';
  if (notionPageIdRaw.length > 0 && !NOTION_PAGE_ID_RE.test(notionPageIdRaw)) {
    appendAuditEvent({
      eventType: 'VALIDATION_FAILED',
      route: ROUTE,
      method,
      statusCode: 400,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'notionPageId_invalid',
    });
    badRequest(res, `Field 'notionPageId' must match ${NOTION_PAGE_ID_RE.source} or be omitted.`);
    return;
  }

  if (!raw.step || typeof raw.step !== 'object' || Array.isArray(raw.step)) {
    appendAuditEvent({
      eventType: 'VALIDATION_FAILED',
      route: ROUTE,
      method,
      statusCode: 400,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'step_missing_or_not_object',
    });
    badRequest(res, `Field 'step' must be an object with at least { id, title, ziel, output, reason, agent, risk }.`);
    return;
  }
  const rawStep = raw.step as RawStep;

  if (typeof rawStep.id !== 'string' || !PLAN_STEP_ID_RE.test(rawStep.id)) {
    appendAuditEvent({
      eventType: 'VALIDATION_FAILED',
      route: ROUTE,
      method,
      statusCode: 400,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'step_id_invalid',
    });
    badRequest(res, `Field 'step.id' must match ${PLAN_STEP_ID_RE.source}.`);
    return;
  }
  if (typeof rawStep.agent !== 'string' || !(ALLOWED_PLAN_STEP_AGENTS as readonly string[]).includes(rawStep.agent)) {
    appendAuditEvent({
      eventType: 'VALIDATION_FAILED',
      route: ROUTE,
      method,
      statusCode: 400,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'step_agent_not_allowed',
    });
    badRequest(res, `Field 'step.agent' must be one of ${(ALLOWED_PLAN_STEP_AGENTS as readonly string[]).join(', ')}.`);
    return;
  }
  if (typeof rawStep.risk !== 'string' || !(ALLOWED_PLAN_STEP_RISKS as readonly string[]).includes(rawStep.risk)) {
    appendAuditEvent({
      eventType: 'VALIDATION_FAILED',
      route: ROUTE,
      method,
      statusCode: 400,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'step_risk_not_allowed',
    });
    badRequest(res, `Field 'step.risk' must be one of ${(ALLOWED_PLAN_STEP_RISKS as readonly string[]).join(', ')}.`);
    return;
  }

  // Successfully validated → build the input for the pure helper.
  const input: DispatchPreviewInput = {
    projectId,
    projectGoal,
    ...(notionPageIdRaw ? { notionPageId: notionPageIdRaw } : {}),
    step: {
      id: rawStep.id,
      step: typeof rawStep.step === 'number' ? rawStep.step : undefined,
      title: typeof rawStep.title === 'string' ? rawStep.title.slice(0, MAX_FIELD) : '',
      ziel: typeof rawStep.ziel === 'string' ? rawStep.ziel.slice(0, MAX_FIELD) : '',
      output: typeof rawStep.output === 'string' ? rawStep.output.slice(0, MAX_FIELD) : '',
      reason: typeof rawStep.reason === 'string' ? rawStep.reason.slice(0, MAX_FIELD) : '',
      agent: rawStep.agent as PlanStepAgent,
      risk: rawStep.risk as PlanStepRisk,
      gate: typeof rawStep.gate === 'string' ? rawStep.gate.slice(0, MAX_FIELD) : '',
    },
  };

  // 5. Pure compute.
  const payload = buildDispatchPayloadFromStep(input);
  const report = assessDispatchReadiness(payload, input);

  // 6. Audit. We re-use the existing VALIDATION_FAILED type set for
  // bad-request paths and emit a positive `AUDIT_LIST`-style event for
  // the success path. Adding a brand-new event type would force every
  // audit consumer to update; the route label already disambiguates.
  appendAuditEvent({
    eventType: 'AUDIT_LIST',
    route: ROUTE,
    method,
    statusCode: 200,
    outcome: 'success',
    clientKeyLabel,
    detailsSummary: `projectId=${projectId} stepId=${rawStep.id} dispatchReady=${report.dispatchReady} agent=${payload.assignedAgent} risk=${payload.risk}`,
  });

  const body: DispatchPreviewResponse = {
    ok: true,
    dispatchReady: report.dispatchReady,
    missingFields: report.missingFields,
    riskFlags: report.riskFlags,
    dispatchPayloadPreview: payload,
    recommendedNextAction: report.recommendedNextAction,
    meta: {
      skeleton: false,
      phase: 'andromeda-mvp',
      readOnly: true,
      notionWritesEnabled: false,
      liveExecution: 'locked',
      statusModel: DISPATCH_STATUS_LABELS,
      notes: [
        'Dry-Run only. Kein Worker startet, kein Notion-Write, kein externer Call.',
        'Status-Modell ist Vorschlag; aktuelles Notion-Master-Tasks-Schema (Write-Allowlist) enthält noch keine status-Property.',
        'Sobald ein Runner verdrahtet ist, prüft dieselbe Payload weiter — ohne UI-Änderung.',
      ],
    },
  };
  res.status(200).json(body);
};

export default handler;
