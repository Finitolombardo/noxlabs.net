// Phase 2A/2B — Shared Project Auto Planner draft validator + mutation
// projector. Pure logic, no I/O, no Notion calls, no env reads. Used by
// both /plan/preview (Phase 2A) and /plan/validate (Phase 2B).
//
// Strict invariants:
//   - No fetch.
//   - No `process.env` access.
//   - No mutation of input objects.
//   - No throwing — every failure path returns `{ ok: false, failure }`.
//
// The mutation projector (`buildPlannedMutations`) emits the SAME shape
// in Phase 2A and Phase 2B. Phase 2B then re-checks each proposed
// property against the live Notion schema. Phase 2C will eventually
// take the same list and execute the writes, filtered through the
// server-side allowlist.

import type {
  PlanMutation,
  PlanProposedProperty,
  PlanStepAgent,
  PlanStepRating,
  PlanStepRisk,
  PlanStepWire,
} from './types.js';
import {
  ALLOWED_PLAN_STEP_AGENTS,
  ALLOWED_PLAN_STEP_RATINGS,
  ALLOWED_PLAN_STEP_RISKS,
} from './types.js';

// projectId regex matches /context and Phase-2A preview — keep in sync
// so all three routes accept the same identifier shape.
export const PROJECT_ID_RE = /^[A-Za-z0-9._-]{1,64}$/;
export const PLAN_STEP_ID_RE = /^[A-Za-z0-9_-]{4,80}$/;
export const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_:.-]{4,128}$/;

export const MAX_STEPS = 30;
export const PLAN_DRAFT_LIMITS = {
  projectGoal: 2000,
  title: 200,
  ziel: 1000,
  output: 500,
  gate: 200,
  reason: 1000,
  feedback: 1000,
} as const;

export interface PlanDraftValidationFailure {
  field: string;
  message: string;
}

export interface NormalisedPlanDraft {
  projectId: string;
  projectGoal: string;
  planSteps: PlanStepWire[];
  idempotencyKey: string;
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
):
  | { ok: true; value: PlanStepWire }
  | { ok: false; failure: PlanDraftValidationFailure } {
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
    { key: 'title', max: PLAN_DRAFT_LIMITS.title, required: true },
    { key: 'ziel', max: PLAN_DRAFT_LIMITS.ziel, required: true },
    { key: 'output', max: PLAN_DRAFT_LIMITS.output, required: true },
    { key: 'gate', max: PLAN_DRAFT_LIMITS.gate, required: false },
    { key: 'reason', max: PLAN_DRAFT_LIMITS.reason, required: false },
    { key: 'feedback', max: PLAN_DRAFT_LIMITS.feedback, required: false },
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

/**
 * Validate + normalise a ProjectPlanDraft payload. Pure: no I/O, no env
 * access, no logging. Returns either a normalised draft (steps re-numbered
 * 1..N in array order, strings trimmed) or the first structural failure.
 */
export function validatePlanDraftPayload(
  projectId: string,
  body: Record<string, unknown>,
):
  | { ok: true; draft: NormalisedPlanDraft }
  | { ok: false; failure: PlanDraftValidationFailure } {
  if (!asString(body.projectGoal)) {
    return {
      ok: false,
      failure: {
        field: 'projectGoal',
        message: `Field 'projectGoal' must be a string.`,
      },
    };
  }
  if (body.projectGoal.length > PLAN_DRAFT_LIMITS.projectGoal) {
    return {
      ok: false,
      failure: {
        field: 'projectGoal',
        message: `Field 'projectGoal' exceeds ${PLAN_DRAFT_LIMITS.projectGoal} chars.`,
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

  if (!asString(body.idempotencyKey) || !IDEMPOTENCY_KEY_RE.test(body.idempotencyKey)) {
    return {
      ok: false,
      failure: {
        field: 'idempotencyKey',
        message: `Field 'idempotencyKey' must match ${IDEMPOTENCY_KEY_RE.source}.`,
      },
    };
  }

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

/**
 * 32-bit FNV-1a -> 8-char hex over the canonical JSON of the draft.
 * Phase 2A/2B only. Phase 2C will swap this for a real cryptographic hash.
 */
export function computePlanDraftDigest(draft: NormalisedPlanDraft): string {
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

/**
 * Build one PlanMutation per step. Pure projection — does NOT touch Notion
 * and does NOT enforce the server-side write allowlist. The allowlist is
 * applied later by Phase 2C; Phase 2B uses this list to compute schema
 * issues against the actual Notion DB schema.
 */
export function buildPlannedMutations(
  draft: NormalisedPlanDraft,
  digest: string,
): PlanMutation[] {
  return draft.planSteps.map((s) => buildMutation(s, digest, draft.projectId));
}
