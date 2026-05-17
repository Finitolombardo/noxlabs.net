// Phase 2A — Frontend mirror types for the Project Auto Planner
// preview endpoint. Intentionally re-declared here (not imported from
// `api/_lib/types.ts`) so the React bundle never pulls server-side code
// or types into the browser tree.
//
// Mirrors `api/_lib/types.ts` Phase-2A section. Keep both files in
// lockstep when extending the wire format.

export type PlanStepAgentWire = 'NOX Agent' | 'Claude' | 'Codex' | 'Manuell';
export type PlanStepRiskWire = 'Niedrig' | 'Mittel' | 'Hoch';
export type PlanStepRatingWire = 'gut' | 'unklar' | 'aendern';

export interface PlanStepWire {
  id: string;
  step: number;
  title: string;
  ziel: string;
  agent: PlanStepAgentWire;
  output: string;
  risk: PlanStepRiskWire;
  gate: string;
  reason: string;
  feedback: string;
  rating: PlanStepRatingWire | null;
}

export interface ProjectPlanDraftRequest {
  projectId: string;
  projectGoal: string;
  planSteps: PlanStepWire[];
  idempotencyKey: string;
}

export type PlanMutationKindWire = 'create_task' | 'update_task' | 'noop';

export type PlanProposedPropertyTypeWire =
  | 'title'
  | 'rich_text'
  | 'select'
  | 'checkbox'
  | 'number'
  | 'relation'
  | 'url';

export interface PlanProposedPropertyWire {
  notionPropertyName: string;
  notionPropertyType: PlanProposedPropertyTypeWire;
  value: string | number | boolean | string[];
  sourcePlanField: string;
}

export interface PlanMutationWire {
  kind: PlanMutationKindWire;
  planStepId: string;
  proposedTitle: string;
  proposedProperties: PlanProposedPropertyWire[];
  warnings: string[];
}

export interface PlanPreviewMetaWire {
  skeleton?: boolean;
  phase?: string;
  readOnly?: boolean;
  notionWritesEnabled?: boolean;
  liveExecution?: string;
}

export interface PlanPreviewResponseWire {
  ok: true;
  projectId: string;
  normalisedPlan: PlanStepWire[];
  plannedMutations: PlanMutationWire[];
  echoedDigest: string;
  idempotencyKey: string;
  meta: PlanPreviewMetaWire;
}
