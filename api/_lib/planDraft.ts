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
  PlanProposedPropertyType,
  PlanStepAgent,
  PlanStepRating,
  PlanStepRisk,
  PlanStepWire,
} from './types.js';
import {
  ALLOWED_MASTER_TASKS_WRITE_PROPERTIES,
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

  // Map plan-step semantics onto the Master-Tasks columns the operator
  // already uses for manual quests, instead of emitting emoji-prefixed
  // sidecar fields:
  //   step.ziel   -> Prompt                       (rich_text)
  //   step.output -> Ergebnis / Definition of Done (rich_text)
  // The previous 🤖 Ziel / 🤖 Erwarteter Output projections lived outside
  // the Phase-2C write allowlist and would have been skipped anyway. With
  // the new mapping the two fields land directly in the operator's primary
  // quest columns, so Phase 2C can fill them without a schema migration.
  if (step.ziel.length > 0) {
    props.push({
      notionPropertyName: 'Prompt',
      notionPropertyType: 'rich_text',
      value: step.ziel,
      sourcePlanField: 'ziel',
    });
  }
  if (step.output.length > 0) {
    props.push({
      notionPropertyName: 'Ergebnis / Definition of Done',
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

// =============================================================================
// Phase 2C-Pre — Pure Notion property payload builder.
//
// Converts an allowlisted `PlanProposedProperty[]` into the raw property
// map that Notion's `POST /v1/pages` expects. Pure: no env access, no
// fetch, no mutation of inputs. Always filters strictly to
// `ALLOWED_MASTER_TASKS_WRITE_PROPERTIES`. If an unsupported property
// type or an unknown property name is encountered, it is silently dropped
// AND added to the returned `dropped[]` list so the caller can surface it
// in audit/diagnostics.
//
// `relationOverrides` lets the caller swap the wire value (a human-readable
// projectId like `APP-X`) for a real Notion page id resolved at the
// commit-handler level. Without it, relation properties are dropped.
// =============================================================================

export interface BuildPropertiesOptions {
  /**
   * Map from Notion property name → resolved Notion page id. Used to
   * translate relation wire values (which carry a human-readable project
   * id) into the page id Notion requires. Properties absent from this map
   * are dropped from the output.
   */
  relationOverrides?: Record<string, string>;
}

export interface BuildPropertiesResult {
  /** Raw Notion property payload, safe to ship as `properties` in pages.create. */
  properties: Record<string, unknown>;
  /** Property names that were dropped (not in allowlist, unknown type, or unresolved relation). */
  dropped: Array<{ notionPropertyName: string; reason: string }>;
}

function notionPropertyValue(
  type: PlanProposedPropertyType,
  value: PlanProposedProperty['value'],
  notionPropertyName: string,
  relationOverrides: Record<string, string>,
): { ok: true; payload: Record<string, unknown> } | { ok: false; reason: string } {
  switch (type) {
    case 'title': {
      const text = typeof value === 'string' ? value : String(value);
      return { ok: true, payload: { title: [{ type: 'text', text: { content: text } }] } };
    }
    case 'rich_text': {
      const text = typeof value === 'string' ? value : String(value);
      return { ok: true, payload: { rich_text: [{ type: 'text', text: { content: text } }] } };
    }
    case 'select': {
      if (typeof value !== 'string' || value.length === 0) {
        return { ok: false, reason: 'select_value_not_string' };
      }
      return { ok: true, payload: { select: { name: value } } };
    }
    case 'checkbox': {
      return { ok: true, payload: { checkbox: Boolean(value) } };
    }
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return { ok: false, reason: 'number_value_not_finite' };
      }
      return { ok: true, payload: { number: value } };
    }
    case 'url': {
      if (typeof value !== 'string' || value.length === 0) {
        return { ok: false, reason: 'url_value_not_string' };
      }
      return { ok: true, payload: { url: value } };
    }
    case 'relation': {
      // Wire value is the human-readable id (e.g. `APP-X`). The caller
      // must pre-resolve it to a Notion page id via `relationOverrides`.
      const overrideId = relationOverrides[notionPropertyName];
      if (typeof overrideId !== 'string' || overrideId.length === 0) {
        return { ok: false, reason: 'relation_page_id_unresolved' };
      }
      return { ok: true, payload: { relation: [{ id: overrideId }] } };
    }
    default: {
      // Defensive — TS exhaustiveness above; this branch fires only on
      // future PlanProposedPropertyType additions that forget to update
      // this switch.
      return { ok: false, reason: 'unsupported_property_type' };
    }
  }
}

/**
 * Pure builder. Converts the proposedProperties of a `PlanMutation` into the
 * raw Notion property map for `POST /v1/pages`. Strictly filtered to
 * `ALLOWED_MASTER_TASKS_WRITE_PROPERTIES`.
 */
export function mapPlanMutationToNotionProperties(
  mutation: PlanMutation,
  opts: BuildPropertiesOptions = {},
): BuildPropertiesResult {
  const properties: Record<string, unknown> = {};
  const dropped: Array<{ notionPropertyName: string; reason: string }> = [];
  const relationOverrides = opts.relationOverrides ?? {};

  for (const prop of mutation.proposedProperties) {
    if (!ALLOWED_MASTER_TASKS_WRITE_PROPERTIES.includes(prop.notionPropertyName)) {
      dropped.push({
        notionPropertyName: prop.notionPropertyName,
        reason: 'not_in_allowlist',
      });
      continue;
    }
    const built = notionPropertyValue(
      prop.notionPropertyType,
      prop.value,
      prop.notionPropertyName,
      relationOverrides,
    );
    if (!built.ok) {
      dropped.push({
        notionPropertyName: prop.notionPropertyName,
        reason: built.reason,
      });
      continue;
    }
    properties[prop.notionPropertyName] = built.payload;
  }

  return { properties, dropped };
}

/**
 * Convenience alias. Same behaviour as `mapPlanMutationToNotionProperties`;
 * kept for naming symmetry with the planner spec doc.
 */
export const buildMasterTaskPropertiesFromMutation = mapPlanMutationToNotionProperties;
