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

// Phase 2A/2B — Auth mode echoed back by the server so the UI can switch
// between "Operator-Key needed" and "Private-Cockpit read-only" displays.
// `operator_key` is the historical default; `private_cockpit_readonly` is
// only set when NOX_OPERATOR_COCKPIT_PRIVATE_MODE is enabled server-side.
// Kept as a wide union so unknown future modes don't break the bundle.
export type PlannerAuthModeWire = 'operator_key' | 'private_cockpit_readonly' | string;

export interface PlanPreviewMetaWire {
  skeleton?: boolean;
  phase?: string;
  readOnly?: boolean;
  notionWritesEnabled?: boolean;
  liveExecution?: string;
  authMode?: PlannerAuthModeWire;
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

// Phase 2B — Schema-Validation report.
export type PlanValidationIssueCodeWire =
  | 'project_not_found'
  | 'project_relation_skipped'
  | 'project_id_mismatch'
  | 'master_tasks_db_missing'
  | 'master_tasks_schema_unreadable'
  | 'projects_db_missing'
  | 'projects_schema_unreadable'
  | 'property_missing'
  | 'property_type_mismatch'
  | 'unsafe_property'
  | 'select_option_missing'
  | 'plan_too_large'
  | 'agent_not_allowed'
  // open-ended catch-all so future server-side codes never break the
  // browser bundle; the UI treats unknown codes as plain `message`.
  | string;

export interface PlanValidationIssueWire {
  code: PlanValidationIssueCodeWire;
  planStepId?: string;
  notionPropertyName?: string;
  expected?: string;
  actual?: string;
  message: string;
}

export interface PlanValidationWarningWire {
  code: string;
  message: string;
}

export interface PlanCheckedDatabaseWire {
  role: 'master_tasks' | 'projects' | string;
  envVar: string;
  ok: boolean;
  status:
    | 'ok'
    | 'not_configured'
    | 'upstream_error'
    | 'project_not_found'
    | 'skipped'
    | string;
  summary?: string;
}

export type PlanProposedPropertyCheckStatusWire =
  | 'safe'
  | 'unsafe'
  | 'missing'
  | 'type_mismatch'
  | 'skipped'
  | string;

export interface PlanProposedPropertyCheckWire {
  notionPropertyName: string;
  expectedType: PlanProposedPropertyTypeWire;
  status: PlanProposedPropertyCheckStatusWire;
  actualType?: string;
}

export interface PlanValidationMetaWire {
  skeleton?: boolean;
  phase?: string;
  readOnly?: boolean;
  notionWritesEnabled?: boolean;
  liveExecution?: string;
  authMode?: PlannerAuthModeWire;
}

export interface PlanValidationReportWire {
  ok: true;
  projectId: string;
  normalisedPlan: PlanStepWire[];
  plannedMutations: PlanMutationWire[];
  echoedDigest: string;
  idempotencyKey: string;
  schemaOk: boolean;
  wouldCreateNTasks: number;
  wouldUpdateNTasks: number;
  checkedDatabases: PlanCheckedDatabaseWire[];
  propertyChecks: PlanProposedPropertyCheckWire[];
  missingProperties: string[];
  typeMismatches: Array<{ notionPropertyName: string; expectedType: string; actualType: string }>;
  unsafeProperties: string[];
  issues: PlanValidationIssueWire[];
  warnings: PlanValidationWarningWire[];
  meta: PlanValidationMetaWire;
}

// =============================================================================
// Phase 2C-Pre — Browser mirror for the commit endpoint.
//
// The endpoint is hard-locked behind the server-side flag
// `NOX_OPERATOR_COCKPIT_PRIVATE_MODE` is irrelevant — `commit` always uses
// the strict operator-key auth, never Private-Cockpit bypass. There is NO
// UI button for this endpoint yet; the types and client stub exist so a
// future UI iteration can import them without re-defining the wire shape.
// =============================================================================

export type PlanCommitResultCodeWire =
  | 'writes_locked'
  | 'write_not_configured'
  | 'write_token_collision'
  | 'commit_token_missing'
  | 'plan_digest_mismatch'
  | 'schema_not_ready'
  | 'duplicate_risk'
  | 'committed'
  | 'partial_failure'
  // Defensive — any future server-side code surfaces as plain string so the
  // browser bundle does not have to be re-deployed when the server grows.
  | string;

export interface PlanCommitRequestWire {
  projectId: string;
  clientPlanId: string;
  projectGoal: string;
  planSteps: PlanStepWire[];
  idempotencyKey: string;
  planDigest: string;
  /**
   * One of `commitToken` or `explicitConfirmPhrase` is required. The
   * browser must NEVER auto-fill either — they exist exactly so the
   * operator has to deliberately construct the request.
   */
  commitToken?: string;
  explicitConfirmPhrase?: string;
}

export interface PlanCommitPageResultWire {
  planStepId: string;
  ok: boolean;
  notionPageId?: string;
  notionUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface PlanCommitMetaWire {
  skeleton?: boolean;
  phase?: string;
  readOnly?: boolean;
  notionWritesEnabled?: boolean;
  liveExecution?: string;
  authMode?: PlannerAuthModeWire;
}

export interface PlanCommitResponseWire {
  ok: boolean;
  code: PlanCommitResultCodeWire;
  projectId: string;
  clientPlanId: string;
  planDigest: string;
  idempotencyKey: string;
  wouldCreateNTasks: number;
  notionWritesExecuted: boolean;
  writeEnabled: boolean;
  duplicateRisk: boolean;
  pageResults: PlanCommitPageResultWire[];
  diagnostics: string[];
  meta: PlanCommitMetaWire;
}
