// APP-X-BRIDGE-01 — Operator Cockpit / NOX Agent Bridge
// Shared command contract types. Skeleton only — no live execution.

export type CommandType =
  | 'PREPARE_PROJECT_X_HANDOFF'
  | 'RUN_PROJECT_X_DRY_RUN'
  | 'REQUEST_APPROVAL'
  | 'MARK_READY_FOR_EXECUTION'
  | 'GENERATE_HANDOFF_SPEC'
  | 'GENERATE_OUTPUT_MAP';

export type CommandStatus =
  | 'Draft'
  | 'Dry-Run bereit'
  | 'Freigabe noetig'
  | 'Freigegeben'
  | 'Gesperrt'
  | 'Erledigt';

export type RiskLevel = 'Niedrig' | 'Mittel' | 'Hoch';

export type CommandAction =
  | 'dry-run'
  | 'request-approval'
  | 'approve'
  | 'reject'
  | 'execute';

export const ALLOWED_COMMAND_TYPES: readonly CommandType[] = [
  'PREPARE_PROJECT_X_HANDOFF',
  'RUN_PROJECT_X_DRY_RUN',
  'REQUEST_APPROVAL',
  'MARK_READY_FOR_EXECUTION',
  'GENERATE_HANDOFF_SPEC',
  'GENERATE_OUTPUT_MAP',
];

export const ALLOWED_ACTIONS: readonly CommandAction[] = [
  'dry-run',
  'request-approval',
  'approve',
  'reject',
  'execute',
];

export const ALLOWED_RISK_LEVELS: readonly RiskLevel[] = ['Niedrig', 'Mittel', 'Hoch'];

export interface DryRunResult {
  summary: string;
  estimatedImpact: string;
  requiredInputs: string[];
  missingArtifacts: string[];
  recommendedNextAction: string;
}

export interface HistoryEntry {
  at: string;
  by: string;
  event: string;
}

export interface OperatorCommand {
  id: string;
  commandType: CommandType;
  projectId: string;
  questId?: string;
  title: string;
  intent: string;
  payloadSummary: string;
  requestedBy: string;
  status: CommandStatus;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  createdAt: string;
  dryRunResult: DryRunResult | null;
  history: HistoryEntry[];
}

export interface CreateCommandBody {
  idempotencyKey?: string;
  commandType: string;
  projectId: string;
  questId?: string;
  title: string;
  intent: string;
  payloadSummary: string;
  requestedBy: string;
  requiresApproval?: boolean;
  riskLevel?: string;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  details?: unknown;
  // APP-X-BRIDGE-04e — authenticated-only Notion upstream diagnostic.
  // Populated only on 502 `notion_upstream_error` after the auth gate.
  // All fields are sanitized at the adapter layer (no header, no token,
  // no request body, no env value); `upstreamMessage` capped at 300 chars.
  diagnostic?: NotionUpstreamDiagnostic;
}

export type NotionUpstreamStep =
  | 'projects_lookup'
  | 'master_tasks_relation_query'
  | 'master_tasks_query';

export interface NotionUpstreamDiagnostic {
  step: NotionUpstreamStep;
  upstreamStatus?: number;
  upstreamCode?: string;
  upstreamMessage?: string;
}

// APP-X-BRIDGE-04a — ReferenceArtifact contract (skeleton only).
// Metadata-only. APP-X does not upload, store, OCR, transcribe, or summarise
// artifacts. Ingestion lives downstream (NOX Agent / dedicated worker).
// `storageRef` is either a URL or a logical reference like
// `notion:<page>/<block>` or `drive:<fileId>` — never raw bytes.

export type ArtifactSourceType =
  | 'upload'
  | 'notion'
  | 'drive'
  | 'miro'
  | 'excalidraw'
  | 'url'
  | 'screenshot'
  | 'file';

export type ArtifactVisibility = 'private' | 'team' | 'project';

export type ArtifactIngestionStatus = 'pending' | 'indexed' | 'failed' | 'skipped';

export const ALLOWED_ARTIFACT_SOURCE_TYPES: readonly ArtifactSourceType[] = [
  'upload',
  'notion',
  'drive',
  'miro',
  'excalidraw',
  'url',
  'screenshot',
  'file',
];

export const ALLOWED_ARTIFACT_VISIBILITIES: readonly ArtifactVisibility[] = [
  'private',
  'team',
  'project',
];

export const ALLOWED_ARTIFACT_INGESTION_STATUSES: readonly ArtifactIngestionStatus[] = [
  'pending',
  'indexed',
  'failed',
  'skipped',
];

export interface ReferenceArtifact {
  artifactId: string;
  projectId: string;
  commandId?: string;
  questId?: string;
  sourceType: ArtifactSourceType;
  mimeType: string;
  storageRef: string;
  checksum?: string;
  sizeBytes?: number;
  title: string;
  summary: string;
  usageHint: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  visibility: ArtifactVisibility;
  ingestionStatus: ArtifactIngestionStatus;
  extractedText?: string;
  imageSummary?: string;
  safetyNotes?: string;
}

// APP-X-BRIDGE-04a — Project Context Response.
// Read-only projection over Notion Master Tasks. No writes, no NOX Agent
// upstream calls. Empty arrays are valid: when no project mapping is
// configured, quests/openApprovals/blockers/recentEvents/artifacts stay [].

export interface ProjectContextProject {
  projectId: string;
  title: string;
  summary?: string;
  status?: string;
  // APP-X-BRIDGE-04c — optional metadata from the Projects DB
  // (`🧭 Projects / System Map`). All fields stay optional so other
  // mapping modes (`none`, `title-prefix`) can omit them safely.
  typ?: string;
  priority?: string;
  vision?: string;
  andromedaContext?: string;
  currentState?: string;
  nextAction?: string;
  allowedActions?: string;
  forbiddenActions?: string;
  artifactLinks?: string;
  primaryUrl?: string;
}

export interface ProjectContextQuest {
  questId: string;
  title: string;
  status: string;
  agent: string;
  result?: string;
  lastEditedAt?: string;
  url?: string;
  // APP-X-BRIDGE-04c — extra read-only fields from Master Tasks.
  blocker?: string;
  approved?: boolean;
  approvalNeeded?: boolean;
  questStarten?: boolean;
  questAbgeschlossen?: boolean;
}

export interface ProjectContextApproval {
  questId: string;
  title: string;
  reason: string;
}

export interface ProjectContextBlocker {
  questId: string;
  title: string;
  blocker: string;
}

export interface ProjectContextEvent {
  at: string;
  type: 'dispatched' | 'callback' | 'approval' | 'review' | 'edited' | 'other';
  summary: string;
  questId?: string;
}

export interface ProjectContextResponse {
  project: ProjectContextProject;
  quests: ProjectContextQuest[];
  openApprovals: ProjectContextApproval[];
  blockers: ProjectContextBlocker[];
  recentEvents: ProjectContextEvent[];
  artifacts: ReferenceArtifact[];
  contextSummary: string;
  nextSuggestedReadOnlyActions: string[];
  meta: {
    skeleton: true;
    readOnly: true;
    projectMappingConfigured: boolean;
    liveExecution: 'locked';
  };
}

// =============================================================================
// Phase 2A — Project Auto Planner Draft Preview wire-format.
//
// Read-only echo + validation endpoint. The Phase 2A handler MUST NOT
// perform any Notion write, any Notion read (schema lookup is Phase 2B),
// any dispatcher call, or any token-other-than-NOX_OPERATOR_API_KEY env
// read. The response only echoes back a normalised version of the draft
// the operator just clicked on, plus a deterministic per-payload digest
// and a structural validation report.
//
// Phase boundaries explicitly visible on the wire:
//   - `meta.phase: '2a'`               -> tells the UI this is preview-only
//   - `meta.notionWritesEnabled: false`-> no Notion writes happened here
//   - `meta.liveExecution: 'locked'`   -> same invariant as commands.ts
//
// The mirror types for the browser live in `src/types/projectPlanner.ts`.
// Keep both files in lockstep when extending the wire format.
// =============================================================================

export type PlanStepAgent = 'NOX Agent' | 'Claude' | 'Codex' | 'Manuell';
export type PlanStepRisk = 'Niedrig' | 'Mittel' | 'Hoch';
export type PlanStepRating = 'gut' | 'unklar' | 'aendern';

export const ALLOWED_PLAN_STEP_AGENTS: readonly PlanStepAgent[] = [
  'NOX Agent',
  'Claude',
  'Codex',
  'Manuell',
];

export const ALLOWED_PLAN_STEP_RISKS: readonly PlanStepRisk[] = [
  'Niedrig',
  'Mittel',
  'Hoch',
];

export const ALLOWED_PLAN_STEP_RATINGS: readonly PlanStepRating[] = [
  'gut',
  'unklar',
  'aendern',
];

// Plan step on the wire. Mirrors the frontend PlanStep type. Bounded
// lengths are enforced server-side in the preview handler.
export interface PlanStepWire {
  id: string;        // /^[A-Za-z0-9_-]{4,80}$/, generated by the frontend
  step: number;      // 1..50
  title: string;     // <= 200 chars
  ziel: string;      // <= 1000 chars
  agent: PlanStepAgent;
  output: string;    // <= 500 chars
  risk: PlanStepRisk;
  gate: string;      // <= 200 chars, may be empty
  reason: string;    // <= 1000 chars, may be empty
  feedback: string;  // <= 1000 chars, may be empty
  rating: PlanStepRating | null;
}

// Top-level draft payload sent by the operator from the cockpit.
export interface ProjectPlanDraft {
  projectId: string;            // echoed back in the response
  projectGoal: string;          // <= 2000 chars
  planSteps: PlanStepWire[];    // 1..30
  idempotencyKey: string;       // /^[A-Za-z0-9_:.-]{4,128}$/
}

// One projected mutation per plan step. Phase 2A emits these for visual
// review only. Phase 2B will validate them against the actual Notion
// schema; Phase 2C will execute them. Phase 2A NEVER touches Notion.
export type PlanMutationKind = 'create_task' | 'update_task' | 'noop';

export type PlanProposedPropertySource =
  | keyof PlanStepWire
  | 'projectRelation'
  | 'planDraftId'
  | 'planDraftDigest'
  | 'reihenfolge';

export type PlanProposedPropertyType =
  | 'title'
  | 'rich_text'
  | 'select'
  | 'checkbox'
  | 'number'
  | 'relation'
  | 'url';

export interface PlanProposedProperty {
  notionPropertyName: string;
  notionPropertyType: PlanProposedPropertyType;
  value: string | number | boolean | string[];
  sourcePlanField: PlanProposedPropertySource;
}

export interface PlanMutation {
  kind: PlanMutationKind;
  planStepId: string;
  proposedTitle: string;
  proposedProperties: PlanProposedProperty[];
  warnings: string[];
}

// Phase 2A/2B — Auth mode echoed in response meta. The flag itself is server
// side only; the UI just needs to know whether the operator-key field is
// still required for subsequent calls. Phase 2D adds `private_write_mode`
// for the commit endpoint.
export type PlannerAuthModeWire =
  | 'operator_key'
  | 'private_cockpit_readonly'
  | 'private_write_mode';

export interface PlanPreviewResponse {
  ok: true;
  projectId: string;
  normalisedPlan: PlanStepWire[];
  plannedMutations: PlanMutation[];
  echoedDigest: string;          // deterministic, server-computed
  idempotencyKey: string;        // echoed back, never persisted in Phase 2A
  meta: {
    skeleton: false;
    phase: '2a';
    readOnly: true;
    notionWritesEnabled: false;
    liveExecution: 'locked';
    authMode: PlannerAuthModeWire;
  };
}

// =============================================================================
// Phase 2B — Project Auto Planner Schema Validation wire-format.
//
// `POST /api/operator/projects/:projectId/plan/validate`
//
// Same payload shape as Phase 2A (`ProjectPlanDraft`). The handler is
// STRICTLY read-only against Notion:
//   - GET /v1/databases/{id}      -> schema header (no mutation)
//   - POST /v1/databases/{id}/query -> Projects-DB row lookup for the
//                                       project relation (read semantic)
// No POST /v1/pages. No PATCH. No schema-add. No dispatcher.
//
// The handler reads the SAME read-only token used by /context
// (`NOX_NOTION_READONLY_TOKEN`). It does NOT read any write-scoped token,
// and the architecture intentionally keeps write-token plumbing out of
// Phase 2B entirely (it lives in Phase 2C).
//
// The browser mirror lives in `src/types/projectPlanner.ts`. Keep both
// in lockstep when extending the wire format.
// =============================================================================

// Server-side allowlist of Master-Tasks properties that Phase 2C *might*
// write. Phase 2B re-uses this list to flag proposed mutations against
// properties outside the allowlist as `unsafe` (they would never make it
// past Phase 2C even if the live Notion schema accepted them).
//
// Mapping decision (Phase 2A/2B): plan-step `ziel` and `output` land on
// the operator's primary quest columns instead of emoji-prefixed sidecar
// fields:
//   - `Prompt`                        ← step.ziel
//   - `Ergebnis / Definition of Done` ← step.output
// Emoji-prefixed columns like `🎯 Ziel` / `🤖 Erwarteter Output` are
// deliberately NOT on this list and are no longer emitted at all.
export const ALLOWED_MASTER_TASKS_WRITE_PROPERTIES: readonly string[] = [
  'Titel',
  'Agent',
  'Project',
  'Plan Draft ID',
  'Plan Draft Digest',
  'Schritt-Reihenfolge',
  'Reason',
  'Operator-Check',
  'Prompt',
  'Ergebnis / Definition of Done',
];

export type PlanValidationIssueCode =
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
  | 'agent_not_allowed';

export interface PlanValidationIssue {
  code: PlanValidationIssueCode;
  planStepId?: string;
  notionPropertyName?: string;
  expected?: string;
  actual?: string;
  message: string;
}

export interface PlanValidationWarning {
  code: string;
  message: string;
}

export interface PlanCheckedDatabase {
  // Logical role of the DB inside Phase 2B — operator never sees the
  // raw env name in error paths.
  role: 'master_tasks' | 'projects';
  // Source of the DB id (env var name). Used purely as a diagnostic label
  // so the operator can find which env knob to set if `ok: false`.
  envVar: string;
  ok: boolean;
  // Status the operator should react to:
  //   - 'ok'                 -> schema fetched and parsed
  //   - 'not_configured'     -> env var unset
  //   - 'upstream_error'     -> Notion returned 4xx/5xx or timed out
  //   - 'project_not_found'  -> Projects DB lookup found no row (only on
  //                             role='projects' and mapping-mode active)
  status:
    | 'ok'
    | 'not_configured'
    | 'upstream_error'
    | 'project_not_found'
    | 'skipped';
  // Optional short summary string (no token, no header, no env values).
  summary?: string;
}

export interface PlanProposedPropertyCheck {
  notionPropertyName: string;
  expectedType: PlanProposedPropertyType;
  // 'safe'         -> in allowlist, exists in schema, type matches
  // 'unsafe'       -> not in allowlist; Phase 2C would skip
  // 'missing'      -> in allowlist but property missing from Notion schema
  // 'type_mismatch'-> in allowlist, property exists but wrong type
  // 'skipped'      -> schema not available (e.g. master_tasks read failed)
  status: 'safe' | 'unsafe' | 'missing' | 'type_mismatch' | 'skipped';
  // Actual Notion type if the property was found in the schema.
  actualType?: string;
}

export interface PlanValidationReport {
  ok: true;
  projectId: string;
  normalisedPlan: PlanStepWire[];
  plannedMutations: PlanMutation[];
  echoedDigest: string;
  idempotencyKey: string;
  schemaOk: boolean;
  wouldCreateNTasks: number;
  wouldUpdateNTasks: number;
  checkedDatabases: PlanCheckedDatabase[];
  propertyChecks: PlanProposedPropertyCheck[];
  missingProperties: string[];
  typeMismatches: Array<{ notionPropertyName: string; expectedType: string; actualType: string }>;
  unsafeProperties: string[];
  issues: PlanValidationIssue[];
  warnings: PlanValidationWarning[];
  meta: {
    skeleton: false;
    phase: '2b';
    readOnly: true;
    notionWritesEnabled: false;
    liveExecution: 'locked';
    authMode: PlannerAuthModeWire;
  };
}

// =============================================================================
// Phase 2C-Pre — Project Auto Planner Commit wire-format.
//
// `POST /api/operator/projects/:projectId/plan/commit`
//
// The commit endpoint accepts the SAME draft shape as preview/validate plus a
// handful of write-grade fields. Strict invariants:
//   - Private-Cockpit read-only mode does NOT apply. The endpoint uses the
//     full `checkOperatorAuth` gate.
//   - `NOX_NOTION_WRITE_ENABLED` must be exactly "true". Anything else → 423.
//   - `NOX_NOTION_WRITE_TOKEN` must be set AND distinct from
//     `NOX_NOTION_READONLY_TOKEN`. No fallback to the read-only token.
//   - The request must include either `commitToken` (regex below) or
//     `explicitConfirmPhrase` (constant string). Missing → 403.
//   - The request must include the `planDigest` the operator saw in the last
//     preview/validate call. The server recomputes the digest from the same
//     payload and compares — if mismatch → 409.
//   - The server re-runs Phase 2B schema validation; if `schemaOk: false` the
//     handler aborts with 409.
//   - Idempotency precheck: the server queries Master-Tasks for any existing
//     pages tagged with the same `Plan Draft Digest` and aborts before any
//     write if duplicates exist.
//
// Phase 2C-Pre status: the write adapter is wired BUT the default Vercel env
// must NOT have `NOX_NOTION_WRITE_ENABLED=true`. Result: the endpoint
// universally returns 423 in production until the operator consciously flips
// the flag. There is no UI button for this endpoint in Phase 2C-Pre — only
// types and an optional client stub exist on the browser side.
// =============================================================================

// Commit-confirm regex / phrase. Both are placeholder gates that force the
// operator to *deliberately* construct the field. They are NOT cryptographic
// — real cryptographic signing comes with the operator's Phase 2C release.
export const PLAN_COMMIT_TOKEN_RE = /^commit-[A-Za-z0-9_-]{8,128}$/;
export const PLAN_COMMIT_PHRASE = 'Yes, write this plan draft to Notion now';

export interface PlanCommitRequestBody {
  // Echoed from the URL path. Server rejects mismatches.
  projectId?: string;
  // Operator-side identifier for this plan draft. Must be a stable rich
  // string the operator can correlate locally; the server treats it as
  // opaque (no parsing). Length 4..128, regex similar to plan-step ids.
  clientPlanId: string;
  // Same shape as preview/validate — re-validated server-side.
  projectGoal: string;
  planSteps: PlanStepWire[];
  idempotencyKey: string;
  // Server recomputes and compares.
  planDigest: string;
  // One of these is required.
  commitToken?: string;
  explicitConfirmPhrase?: string;
}

// What the commit endpoint did. `writes_locked` is the default state in
// Phase 2C-Pre — the flag is off, no Notion write happened.
export type PlanCommitResultCode =
  | 'writes_locked'
  | 'write_not_configured'
  | 'write_token_collision'
  | 'commit_token_missing'
  | 'plan_digest_mismatch'
  | 'schema_not_ready'
  | 'duplicate_risk'
  | 'committed'
  | 'partial_failure';

export interface PlanCommitPageResult {
  planStepId: string;
  ok: boolean;
  notionPageId?: string;
  notionUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface PlanCommitResponse {
  ok: boolean;
  code: PlanCommitResultCode;
  projectId: string;
  // Echoed back so the operator can correlate with their local state.
  clientPlanId: string;
  planDigest: string;
  idempotencyKey: string;
  wouldCreateNTasks: number;
  // True only when the handler actually executed a Notion write. The
  // operator can rely on this as the single source of truth for "did
  // anything get written".
  notionWritesExecuted: boolean;
  // The current state of the write flag, mirrored to the client so the
  // UI can render the right CTA without re-reading env.
  writeEnabled: boolean;
  // Idempotency precheck signal. `true` means the server found at least
  // one existing Master-Tasks page tagged with this Plan Draft Digest.
  duplicateRisk: boolean;
  // Per-step write report. Empty in locked state.
  pageResults: PlanCommitPageResult[];
  // Diagnostic strings, sanitised. No tokens, no Notion bodies.
  diagnostics: string[];
  meta: {
    skeleton: false;
    phase: '2c-pre';
    readOnly: boolean;
    notionWritesEnabled: boolean;
    liveExecution: 'locked' | 'live';
    authMode: PlannerAuthModeWire;
  };
}
