// APP-X-BRIDGE-01 — Operator Cockpit / Andromeda Bridge
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
}

// APP-X-BRIDGE-04a — ReferenceArtifact contract (skeleton only).
// Metadata-only. APP-X does not upload, store, OCR, transcribe, or summarise
// artifacts. Ingestion lives downstream (Andromeda / dedicated worker).
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
// Read-only projection over Notion Master Tasks. No writes, no Andromeda
// upstream calls. Empty arrays are valid: when no project mapping is
// configured, quests/openApprovals/blockers/recentEvents/artifacts stay [].

export interface ProjectContextProject {
  projectId: string;
  title: string;
  summary?: string;
  status?: string;
}

export interface ProjectContextQuest {
  questId: string;
  title: string;
  status: string;
  agent: string;
  result?: string;
  lastEditedAt?: string;
  url?: string;
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
