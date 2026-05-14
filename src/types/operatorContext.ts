// APP-X-BRIDGE-05a — Frontend type contracts for the read-only project
// context endpoint. Intentionally re-declared here (not imported from
// `api/_lib/types.ts`) so the React bundle never pulls server-side code
// or types into the browser tree.
//
// Mirrors the response shape of GET /api/operator/projects/:projectId/context
// at the date of 05a. All nested fields are optional/defensive — Notion
// schema drift must never throw the UI.

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

export interface OperatorApiErrorBody {
  error: string;
  message: string;
  details?: unknown;
  diagnostic?: NotionUpstreamDiagnostic;
}

export interface ProjectContextProject {
  projectId: string;
  title: string;
  summary?: string;
  status?: string;
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
  status?: string;
  agent?: string;
  result?: string;
  blocker?: string;
  lastEditedAt?: string;
  url?: string;
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
  type: string;
  summary: string;
  questId?: string;
}

export interface ProjectContextArtifact {
  id?: string;
  title?: string;
  sourceType?: string;
  storageRef?: string;
  url?: string;
  // 05a: artifacts are returned `[]` server-side. Kept open for forward-
  // compat with ReferenceArtifact (BRIDGE-04a) — frontend renders an
  // explanatory empty state.
}

export interface ProjectContextMeta {
  skeleton?: boolean;
  readOnly?: boolean;
  projectMappingConfigured?: boolean;
  liveExecution?: string;
}

export interface ProjectContextResponse {
  project: ProjectContextProject;
  quests: ProjectContextQuest[];
  openApprovals: ProjectContextApproval[];
  blockers: ProjectContextBlocker[];
  recentEvents: ProjectContextEvent[];
  artifacts: ProjectContextArtifact[];
  contextSummary?: string;
  nextSuggestedReadOnlyActions?: string[];
  meta?: ProjectContextMeta;
}
