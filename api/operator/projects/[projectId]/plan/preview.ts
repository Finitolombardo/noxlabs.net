// Phase 2A — POST /api/operator/projects/:projectId/plan/preview
//
// Read-only echo + structural validation for the Project Auto Planner.
// The handler intentionally does NOT:
//   - call Notion (no read, no write, no schema lookup)
//   - call any dispatcher / Telegram / agent
//   - read any environment variable other than NOX_OPERATOR_API_KEY
//     (transitively, via the operator-auth gate)
//   - persist anything beyond the in-memory audit ring buffer
//
// The response echoes a normalised version of the operator's draft, a
// deterministic per-payload digest, and a list of "projected" Notion
// mutations that Phase 2B will later validate against the live Notion
// schema and Phase 2C will execute. Phase 2A emits the mutation list
// purely so the operator can visually confirm the shape of the writes
// before they are wired up.
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
// Phase 2A. Phase 2C will replace it with a SHA-256 digest computed via
// Web Crypto / node:crypto before the first real Notion write.

import type { ApiHandler, ApiResponse } from '../../../../_lib/handler.js';
import {
  badRequest,
  methodAllowed,
  readBodyAsObject,
  setNoStore,
} from '../../../../_lib/handler.js';
import { checkOperatorAuth, respondAuthFailure } from '../../../../_lib/auth.js';
import { checkRateLimit, respondRateLimited } from '../../../../_lib/rateLimit.js';
import { appendAuditEvent } from '../../../../_lib/audit.js';
import type {
  PlanMutation,
  PlanPreviewResponse,
  PlanProposedProperty,
  PlanStepAgent,
  PlanStepRating,
  PlanStepRisk,
  PlanStepWire,
} from '../../../../_lib/types.js';
import {
  ALLOWED_PLAN_STEP_AGENTS,
  ALLOWED_PLAN_STEP_RATINGS,
  ALLOWED_PLAN_STEP_RISKS,
} from '../../../../_lib/types.js';

const ROUTE_LABEL = '/api/operator/projects/:projectId/plan/preview';

// Same shape as the read-only /context endpoint — kept identical so any
// future projectId validation tightening lands on both routes together.
const PROJECT_ID_RE = /^[A-Za-z0-9._-]{1,64}$/;
const PLAN_STEP_ID_RE = /^[A-Za-z0-9_-]{4,80}$/;
const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_:.-]{4,128}$/;

const MAX_STEPS = 30;
const LIMITS = {
  projectGoal: 2000,
  title: 200,
  ziel: 1000,
  output: 500,
  gate: 200,
  reason: 1000,
  feedback: 1000,
} as const;

interface ValidationFailure {
  field: string;
  message: string;
}

interface NormalisedDraft {
  projectId: string;
  projectGoal: string;
  planSteps: PlanStepWire[];
  idempotencyKey: string;
}

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
  failure: ValidationFailure,
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

function asString(v: unknown): v is string {
  return typeof v === 'string';
}

function asNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isAllowedAgent(v: unknown): v is PlanStepAgent {
  return (
    typeof v === 'string' &&
    (ALLOWED_PLAN_STEP_AGENTS as readonly string[]).includes(v)
  );
}

function isAllowedRisk(v: unknown): v is PlanStepRisk {
  return (
    typeof v === 'string' &&
    (ALLOWED_PLAN_STEP_RISKS as readonly string[]).includes(v)
  );
}

function isAllowedRatingOrNull(v: unknown): v is PlanStepRating | null {
  if (v === null) return true;
  return (
    typeof v === 'string' &&
    (ALLOWED_PLAN_STEP_RATINGS as readonly string[]).includes(v)
  );
}

function validateStep(
  raw: unknown,
  index: number,
): { ok: true; value: PlanStepWire } | { ok: false; failure: ValidationFailure } {
  const prefix = `planSteps[${index}]`;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ok: false,
      failure: { field: prefix, message: `Field '${prefix}' must be an object.` },
    };
  }
  const r = raw as Record<string, unknown>;

  if (!asString(r.id) || !PLAN_STEP_ID_RE.test(r.id)) {
    return {
      ok: false,
      failure: {
        field: `${prefix}.id`,
        message: `Field '${prefix}.id' must match ${PLAN_STEP_ID_RE.source}.`,
      },
    };
  }

  if (!asNumber(r.step) || r.step < 1 || r.step > 50 || !Number.isInteger(r.step)) {
    return {
      ok: false,
      failure: {
        field: `${prefix}.step`,
        message: `Field '${prefix}.step' must be an integer in [1, 50].`,
      },
    };
  }

  const stringFields: Array<{
    key: keyof PlanStepWire;
    max: number;
    required: boolean;
  }> = [
    { key: 'title', max: LIMITS.title, required: true },
    { key: 'ziel', max: LIMITS.ziel, required: true },
    { key: 'output', max: LIMITS.output, required: true },
    { key: 'gate', max: LIMITS.gate, required: false },
    { key: 'reason', max: LIMITS.reason, required: false },
    { key: 'feedback', max: LIMITS.feedback, required: false },
  ];

  const trimmedStrings: Partial<Record<keyof PlanStepWire, string>> = {};
  for (const f of stringFields) {
    const raw = r[f.key];
    if (!asString(raw)) {
      return {
        ok: false,
        failure: {
          field: `${prefix}.${f.key}`,
          message: `Field '${prefix}.${String(f.key)}' must be a string.`,
        },
      };
    }
    if (raw.length > f.max) {
      return {
        ok: false,
        failure: {
          field: `${prefix}.${f.key}`,
          message: `Field '${prefix}.${String(f.key)}' exceeds ${f.max} chars.`,
        },
      };
    }
    const trimmed = raw.trim();
    if (f.required && trimmed.length === 0) {
      return {
        ok: false,
        failure: {
          field: `${prefix}.${f.key}`,
          message: `Field '${prefix}.${String(f.key)}' must be non-empty.`,
        },
      };
    }
    trimmedStrings[f.key] = trimmed;
  }

  if (!isAllowedAgent(r.agent)) {
    return {
      ok: false,
      failure: {
        field: `${prefix}.agent`,
        message: `Field '${prefix}.agent' must be one of: ${ALLOWED_PLAN_STEP_AGENTS.join(
          ', ',
        )}.`,
      },
    };
  }
  if (!isAllowedRisk(r.risk)) {
    return {
      ok: false,
      failure: {
        field: `${prefix}.risk`,
        message: `Field '${prefix}.risk' must be one of: ${ALLOWED_PLAN_STEP_RISKS.join(
          ', ',
        )}.`,
      },
    };
  }
  if (!isAllowedRatingOrNull(r.rating)) {
    return {
      ok: false,
      failure: {
        field: `${prefix}.rating`,
        message: `Field '${prefix}.rating' must be null or one of: ${ALLOWED_PLAN_STEP_RATINGS.join(
          ', ',
        )}.`,
      },
    };
  }

  return {
    ok: true,
    value: {
      id: r.id,
      step: r.step,
      title: trimmedStrings.title ?? '',
      ziel: trimmedStrings.ziel ?? '',
      agent: r.agent,
      output: trimmedStrings.output ?? '',
      risk: r.risk,
      gate: trimmedStrings.gate ?? '',
      reason: trimmedStrings.reason ?? '',
      feedback: trimmedStrings.feedback ?? '',
      rating: r.rating,
    },
  };
}

function validateDraft(
  projectId: string,
  body: Record<string, unknown>,
): { ok: true; draft: NormalisedDraft } | { ok: false; failure: ValidationFailure } {
  // projectGoal — non-empty after trim, length-capped.
  if (!asString(body.projectGoal)) {
    return {
      ok: false,
      failure: {
        field: 'projectGoal',
        message: `Field 'projectGoal' must be a string.`,
      },
    };
  }
  if (body.projectGoal.length > LIMITS.projectGoal) {
    return {
      ok: false,
      failure: {
        field: 'projectGoal',
        message: `Field 'projectGoal' exceeds ${LIMITS.projectGoal} chars.`,
      },
    };
  }
  const projectGoal = body.projectGoal.trim();
  if (projectGoal.length === 0) {
    return {
      ok: false,
      failure: {
        field: 'projectGoal',
        message: `Field 'projectGoal' must be non-empty.`,
      },
    };
  }

  // idempotencyKey — required for Phase 2A. The /preview endpoint does
  // not persist it, but enforcing it here keeps the wire format aligned
  // with Phase 2B/2C, where the same key MUST be carried through.
  if (!asString(body.idempotencyKey) || !IDEMPOTENCY_KEY_RE.test(body.idempotencyKey)) {
    return {
      ok: false,
      failure: {
        field: 'idempotencyKey',
        message: `Field 'idempotencyKey' must match ${IDEMPOTENCY_KEY_RE.source}.`,
      },
    };
  }

  // Path projectId and body.projectId must agree if body.projectId is set.
  // Path wins as the canonical source; we only echo it back.
  if (body.projectId !== undefined && body.projectId !== null) {
    if (!asString(body.projectId) || body.projectId.trim() !== projectId) {
      return {
        ok: false,
        failure: {
          field: 'projectId',
          message: `Field 'projectId' in body must match the URL path.`,
        },
      };
    }
  }

  if (!Array.isArray(body.planSteps)) {
    return {
      ok: false,
      failure: {
        field: 'planSteps',
        message: `Field 'planSteps' must be an array.`,
      },
    };
  }
  if (body.planSteps.length === 0) {
    return {
      ok: false,
      failure: {
        field: 'planSteps',
        message: `Field 'planSteps' must contain at least 1 step.`,
      },
    };
  }
  if (body.planSteps.length > MAX_STEPS) {
    return {
      ok: false,
      failure: {
        field: 'planSteps',
        message: `Field 'planSteps' exceeds ${MAX_STEPS} steps.`,
      },
    };
  }

  const normalisedSteps: PlanStepWire[] = [];
  const seenIds = new Set<string>();
  for (let i = 0; i < body.planSteps.length; i++) {
    const result = validateStep(body.planSteps[i], i);
    if (!result.ok) return { ok: false, failure: result.failure };
    if (seenIds.has(result.value.id)) {
      return {
        ok: false,
        failure: {
          field: `planSteps[${i}].id`,
          message: `Duplicate planStep id '${result.value.id}'.`,
        },
      };
    }
    seenIds.add(result.value.id);
    normalisedSteps.push(result.value);
  }

  // Re-number `step` so the wire is always 1..N in array order. The
  // frontend may have moved/added/removed steps before sending; we do
  // not trust the inbound `step` numbering, only the array order.
  const renumbered = normalisedSteps.map((s, idx) => ({ ...s, step: idx + 1 }));

  return {
    ok: true,
    draft: {
      projectId,
      projectGoal,
      planSteps: renumbered,
      idempotencyKey: body.idempotencyKey as string,
    },
  };
}

// 32-bit FNV-1a -> 8-char hex over the canonical JSON of the draft.
// Phase 2A only. Phase 2C will swap this for a real cryptographic hash.
function computeEchoedDigest(draft: NormalisedDraft): string {
  const canonical = JSON.stringify({
    projectId: draft.projectId,
    projectGoal: draft.projectGoal,
    planSteps: draft.planSteps,
  });
  let h = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function buildProposedProperties(
  step: PlanStepWire,
  digest: string,
  projectId: string,
): PlanProposedProperty[] {
  // The property names mirror the Master-Tasks/Projects DB conventions
  // captured in the Phase 2 architecture report. Phase 2B will check
  // that each of these actually exists in the live schema; Phase 2C
  // will only write a server-side allowlisted subset. Phase 2A simply
  // emits the proposed shape for visual review.
  const props: PlanProposedProperty[] = [
    {
      notionPropertyName: 'Titel',
      notionPropertyType: 'title',
      value: step.title,
      sourcePlanField: 'title',
    },
    {
      notionPropertyName: 'Agent',
      notionPropertyType: 'select',
      value: step.agent,
      sourcePlanField: 'agent',
    },
    {
      notionPropertyName: 'Project',
      notionPropertyType: 'relation',
      value: projectId,
      sourcePlanField: 'projectRelation',
    },
    {
      notionPropertyName: 'Plan Draft ID',
      notionPropertyType: 'rich_text',
      value: step.id,
      sourcePlanField: 'planDraftId',
    },
    {
      notionPropertyName: 'Plan Draft Digest',
      notionPropertyType: 'rich_text',
      value: digest,
      sourcePlanField: 'planDraftDigest',
    },
    {
      notionPropertyName: 'Schritt-Reihenfolge',
      notionPropertyType: 'number',
      value: step.step,
      sourcePlanField: 'reihenfolge',
    },
  ];

  if (step.ziel.length > 0) {
    props.push({
      notionPropertyName: '🤖 Ziel',
      notionPropertyType: 'rich_text',
      value: step.ziel,
      sourcePlanField: 'ziel',
    });
  }
  if (step.output.length > 0) {
    props.push({
      notionPropertyName: '🤖 Erwarteter Output',
      notionPropertyType: 'rich_text',
      value: step.output,
      sourcePlanField: 'output',
    });
  }
  if (step.reason.length > 0) {
    props.push({
      notionPropertyName: 'Reason',
      notionPropertyType: 'rich_text',
      value: step.reason,
      sourcePlanField: 'reason',
    });
  }
  if (step.gate.length > 0) {
    props.push({
      notionPropertyName: 'Operator-Check',
      notionPropertyType: 'rich_text',
      value: step.gate,
      sourcePlanField: 'gate',
    });
  }
  return props;
}

function buildMutation(
  step: PlanStepWire,
  digest: string,
  projectId: string,
): PlanMutation {
  const warnings: string[] = [];
  if (step.gate.length > 0 && step.risk === 'Hoch') {
    warnings.push(
      'Hohes Risiko + Operator-Check gesetzt — Quest braucht explizite Operator-Freigabe vor Live-Run.',
    );
  }
  if (step.rating === 'aendern') {
    warnings.push(
      'Operator hat diesen Schritt zur Anpassung markiert — vor Commit überarbeiten.',
    );
  }
  if (step.agent === 'Manuell') {
    warnings.push(
      'Agent = Manuell: diese Quest wird in Phase 2E NICHT automatisch an einen Agenten dispatched.',
    );
  }
  return {
    kind: 'create_task',
    planStepId: step.id,
    proposedTitle: step.title,
    proposedProperties: buildProposedProperties(step, digest, projectId),
    warnings,
  };
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

  // 2. Auth gate.
  const auth = checkOperatorAuth(req);
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

  // 5. Structural payload validation.
  const body = readBodyAsObject(req);
  const validation = validateDraft(projectId, body);
  if (!validation.ok) {
    return failValidation(res, clientKeyLabel, method, validation.failure);
  }
  const draft = validation.draft;

  // 6. Deterministic echo digest (FNV-1a in Phase 2A).
  const echoedDigest = computeEchoedDigest(draft);

  // 7. Build projected mutations.
  const plannedMutations: PlanMutation[] = draft.planSteps.map((s) =>
    buildMutation(s, echoedDigest, projectId),
  );

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
    },
  };

  appendAuditEvent({
    eventType: 'PLAN_PREVIEW_RESPONDED',
    route,
    method,
    statusCode: 200,
    outcome: 'success',
    clientKeyLabel,
    detailsSummary: `projectId=${projectId} steps=${draft.planSteps.length} digest=${echoedDigest}`,
  });

  res.status(200).json(response);
};

export default handler;
