// Andromeda Worker Dispatch — MVP contract + pure readiness logic.
//
// SCOPE
// =====
// This module is intentionally inert. It defines the *shape* of a
// dispatch payload and computes whether a given plan-step / quest looks
// ready to be handed off to a worker. It DOES NOT:
//   - call any external worker, queue, runner, API
//   - call Anthropic / Claude / Codex
//   - call Notion (no read, no write, no schema lookup)
//   - read any environment variable that could leak a secret
//   - touch the existing Project Auto Planner write pipeline
//
// The dispatch-preview endpoint imports `buildDispatchPayloadFromStep`
// + `assessDispatchReadiness` and renders the result as a sanitised
// JSON envelope. Until a real runner is wired up by a separate quest,
// `dispatchMode` will resolve to `'manual'` or `'dry_run'`, never to
// `'runner'`.
//
// Strict invariants:
//   - Pure functions only. No I/O.
//   - No throwing. Every failure path returns a `missingFields[]` /
//     `riskFlags[]` entry.
//   - Field clipping keeps payload sizes bounded so the wire shape is
//     predictable even when the upstream plan step is poorly formed.

import type { PlanStepAgent, PlanStepRisk } from './types.js';

// ---------------------------------------------------------------------
// Status model — proposed; not yet wired to Notion property values. The
// existing Master Tasks write allowlist does not include a status
// property today, so any Notion-side persistence of this status would
// require either an additional allowlist entry or an explicit mapping
// fallback documented in the runbook. The dispatch-preview endpoint
// surfaces this list so the operator can map it to a future
// `Bearbeitungsstatus` select.
// ---------------------------------------------------------------------

export type DispatchStatus =
  | 'draft'
  | 'ready_for_agent'
  | 'dispatch_queued'
  | 'in_progress'
  | 'blocked'
  | 'needs_operator_review'
  | 'done'
  | 'failed';

export const DISPATCH_STATUS_LABELS: Record<DispatchStatus, string> = {
  draft: 'Draft',
  ready_for_agent: 'Ready for Agent',
  dispatch_queued: 'Dispatch Queued',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  needs_operator_review: 'Needs Operator Review',
  done: 'Done',
  failed: 'Failed',
};

// `dispatchMode` reflects what the system would actually DO with the
// payload if the operator pressed an "agent starten" button right now.
// Today only the first two values are reachable.
export type DispatchMode = 'dry_run' | 'manual' | 'runner';

// `outputTarget` documents where the agent result is expected to land.
// MVP only supports the operator's own follow-up (no Notion writeback,
// no webhook callback, no queue).
export type DispatchOutputTarget =
  | 'operator_inbox'        // operator reads the agent reply manually
  | 'notion_master_task'    // patch the same Master-Tasks row (NOT IMPLEMENTED)
  | 'noop';                 // dry-run / dispatch preview only

export interface DispatchPayload {
  /** Stable id, either the Notion page id (post-commit) or the local plan-step id (pre-commit). */
  taskId: string;
  /** Notion Master-Tasks page id. Empty pre-commit; required for runner mode. */
  notionPageId: string;
  projectId: string;
  title: string;
  objective: string;        // plan step `ziel`
  context: string;          // projectGoal + reason concatenated, clipped
  expectedOutput: string;   // plan step `output`
  assignedAgent: PlanStepAgent;
  risk: PlanStepRisk;
  status: DispatchStatus;
  createdAt: string;        // ISO-8601, stamped server-side
  dispatchMode: DispatchMode;
  operatorApprovalRequired: boolean;
  outputTarget: DispatchOutputTarget;
}

// ---------------------------------------------------------------------
// Input shape for the dispatch-preview endpoint. We accept a plan-step
// either by its full PlanStepWire shape OR by a slimmer subset so the
// UI can call the endpoint with whatever it has at hand. The server
// re-validates the inputs that matter for the readiness signal.
// ---------------------------------------------------------------------

export interface DispatchPreviewInputStep {
  id: string;
  step?: number;
  title: string;
  ziel: string;
  output: string;
  reason: string;
  agent: PlanStepAgent;
  risk: PlanStepRisk;
  gate?: string;
}

export interface DispatchPreviewInput {
  projectId: string;
  projectGoal: string;
  /** Optional Notion page id (post-commit). Empty pre-commit. */
  notionPageId?: string;
  /** Plan-step source — see DispatchPreviewInputStep. */
  step: DispatchPreviewInputStep;
}

// ---------------------------------------------------------------------
// Pure helpers.
// ---------------------------------------------------------------------

function clip(s: string | undefined, max: number): string {
  if (typeof s !== 'string') return '';
  if (s.length <= max) return s.trim();
  return s.slice(0, max).trim();
}

function joinContext(projectGoal: string, reason: string): string {
  const a = clip(projectGoal, 1000);
  const b = clip(reason, 1000);
  if (a && b) return `${a}\n\n— Begründung —\n${b}`;
  return a || b;
}

// Resolve which dispatch mode the system *could* run today for this
// agent, given that no real runner is wired up. The result is always
// `'dry_run'` or `'manual'` until a follow-up quest adds runner
// adapters. We never auto-promote to `'runner'` from here.
function resolveDispatchModeForAgent(agent: PlanStepAgent): DispatchMode {
  switch (agent) {
    case 'NOX Agent':
    case 'Claude':
    case 'Codex':
    case 'Manuell':
    default:
      return 'manual';
  }
}

// `risk` → operator-approval requirement. Phase-2C-Pre already enforces
// commit-token / phrase / private-write-mode at the Notion write layer,
// but the dispatch layer adds an extra signal: high-risk quests should
// not be auto-dispatched even when a real runner exists.
function requiresOperatorApproval(risk: PlanStepRisk): boolean {
  if (risk === 'Hoch') return true;
  if (risk === 'Mittel') return true;
  return false;
}

export function buildDispatchPayloadFromStep(
  input: DispatchPreviewInput,
): DispatchPayload {
  const step = input.step;
  const notionPageId = clip(input.notionPageId ?? '', 80);
  const taskId = notionPageId.length > 0 ? notionPageId : clip(step.id, 80);
  return {
    taskId,
    notionPageId,
    projectId: clip(input.projectId, 80),
    title: clip(step.title, 200),
    objective: clip(step.ziel, 1000),
    context: joinContext(input.projectGoal, step.reason),
    expectedOutput: clip(step.output, 500),
    assignedAgent: step.agent,
    risk: step.risk,
    status: 'draft',
    createdAt: new Date().toISOString(),
    dispatchMode: resolveDispatchModeForAgent(step.agent),
    operatorApprovalRequired: requiresOperatorApproval(step.risk),
    outputTarget: 'noop',
  };
}

// ---------------------------------------------------------------------
// Readiness assessment. Returns a structured report that the UI uses to
// render "kann das an einen Agent gehen?" without ever invoking one.
// ---------------------------------------------------------------------

export type DispatchMissingFieldCode =
  | 'title_empty'
  | 'objective_empty'
  | 'expected_output_empty'
  | 'agent_unset'
  | 'project_id_empty'
  | 'project_goal_empty';

export type DispatchRiskFlagCode =
  | 'high_risk_requires_operator'
  | 'medium_risk_requires_operator'
  | 'agent_has_no_runner_yet'
  | 'output_target_unimplemented'
  | 'no_notion_page_id'
  | 'gate_text_present'
  | 'objective_very_short'
  | 'context_very_short';

export interface DispatchMissingField {
  code: DispatchMissingFieldCode;
  field: string;
  message: string;
}

export interface DispatchRiskFlag {
  code: DispatchRiskFlagCode;
  severity: 'info' | 'warn' | 'block';
  message: string;
}

export interface DispatchReadinessReport {
  dispatchReady: boolean;
  missingFields: DispatchMissingField[];
  riskFlags: DispatchRiskFlag[];
  recommendedNextAction: string;
}

export function assessDispatchReadiness(
  payload: DispatchPayload,
  input: DispatchPreviewInput,
): DispatchReadinessReport {
  const missing: DispatchMissingField[] = [];
  const flags: DispatchRiskFlag[] = [];

  if (!payload.projectId)
    missing.push({
      code: 'project_id_empty',
      field: 'projectId',
      message: 'projectId fehlt — Dispatch ohne Projektbezug ist nicht erlaubt.',
    });
  if (!input.projectGoal || input.projectGoal.trim().length === 0)
    missing.push({
      code: 'project_goal_empty',
      field: 'projectGoal',
      message: 'Projektziel fehlt — der Agent braucht den Gesamtkontext.',
    });
  if (!payload.title)
    missing.push({
      code: 'title_empty',
      field: 'step.title',
      message: 'Quest-Titel ist leer.',
    });
  if (!payload.objective)
    missing.push({
      code: 'objective_empty',
      field: 'step.ziel',
      message: 'Quest-Ziel ist leer.',
    });
  if (!payload.expectedOutput)
    missing.push({
      code: 'expected_output_empty',
      field: 'step.output',
      message: 'Erwartetes Ergebnis ist leer.',
    });
  if (!payload.assignedAgent)
    missing.push({
      code: 'agent_unset',
      field: 'step.agent',
      message: 'Agent-Zuordnung fehlt.',
    });

  // Risk-Flags — non-blocking by default; the UI surfaces them so the
  // operator can decide.
  if (payload.risk === 'Hoch')
    flags.push({
      code: 'high_risk_requires_operator',
      severity: 'block',
      message: 'Risiko = Hoch. Operator-Freigabe ist erforderlich, kein Auto-Dispatch.',
    });
  if (payload.risk === 'Mittel')
    flags.push({
      code: 'medium_risk_requires_operator',
      severity: 'warn',
      message: 'Risiko = Mittel. Operator sollte explizit prüfen, bevor ein Worker startet.',
    });
  flags.push({
    code: 'agent_has_no_runner_yet',
    severity: 'info',
    message:
      'Kein Server-Worker konfiguriert. Dispatch-Mode bleibt manuell, bis ein Anthropic-API-Runner / Codex-Runner / NOX-Agent-Runner verdrahtet ist.',
  });
  flags.push({
    code: 'output_target_unimplemented',
    severity: 'info',
    message:
      'outputTarget=noop — Worker-Ergebnis landet (noch) nicht automatisch zurück in Notion. Operator schreibt das Ergebnis manuell ins Operator-Check-Feld.',
  });
  if (!payload.notionPageId)
    flags.push({
      code: 'no_notion_page_id',
      severity: 'warn',
      message:
        'Keine Notion Page Id vorhanden — Quest wurde noch nicht committed. Dispatch läuft auf der lokalen Plan-Step-Id.',
    });
  if (input.step.gate && input.step.gate.trim().length > 0)
    flags.push({
      code: 'gate_text_present',
      severity: 'info',
      message: `Plan-Schritt hat ein Freigabe-Gate ("${clip(input.step.gate, 80)}"). Operator-Approval gehört vorgeschaltet.`,
    });
  if (payload.objective && payload.objective.length < 40)
    flags.push({
      code: 'objective_very_short',
      severity: 'warn',
      message: 'Quest-Ziel ist sehr kurz (<40 Zeichen). Worker bekommt evtl. zu wenig Kontext.',
    });
  if (payload.context && payload.context.length < 60)
    flags.push({
      code: 'context_very_short',
      severity: 'info',
      message: 'Kontext ist kurz. Optional projectGoal / Begründung im Plan-Step ergänzen.',
    });

  const hasBlock = flags.some((f) => f.severity === 'block');
  const dispatchReady = missing.length === 0 && !hasBlock;

  let recommendedNextAction: string;
  if (missing.length > 0) {
    recommendedNextAction = `Fehlende Felder ergänzen: ${missing.map((m) => m.field).join(', ')}.`;
  } else if (hasBlock) {
    recommendedNextAction =
      'Risiko = Hoch — Operator muss explizit freigeben, bevor ein Worker (sobald vorhanden) starten darf.';
  } else if (!payload.notionPageId) {
    recommendedNextAction =
      'Erst Plan committen (Quest in Notion anlegen), dann Dispatch erneut prüfen — danach kann der spätere Runner die echte Notion-Page-Id nutzen.';
  } else if (payload.dispatchMode === 'manual') {
    recommendedNextAction =
      'Kein Server-Runner aktiv. Operator führt den Worker manuell aus (Claude-Browser / Codex / NOX Agent) und schreibt das Ergebnis ins Operator-Check-Feld.';
  } else {
    recommendedNextAction =
      'Dispatch-Payload ist plausibel. Sobald ein Runner gebaut wird, kann diese Quest automatisch übergeben werden.';
  }

  return {
    dispatchReady,
    missingFields: missing,
    riskFlags: flags,
    recommendedNextAction,
  };
}
