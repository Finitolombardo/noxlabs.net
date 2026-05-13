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
