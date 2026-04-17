// ============================================================
// NOX Labs - Solution Finder Routing Logic
// Drop-in: src/lib/solutionFinderRouting.ts
//
// Identische Logik wird auch in n8n (Code-Node) verwendet, damit
// Client-Preview und Server-Routing garantiert dieselben Tags
// liefern. Bei Aenderungen BEIDE Seiten updaten.
// ============================================================

export type SystemId = 'leadgen_engine' | 'pitch_mutation_engine' | 'youtube_engine';

export const SYSTEM_LABELS: Record<SystemId, string> = {
  leadgen_engine: 'Leadgen Engine',
  pitch_mutation_engine: 'Pitch Mutation Engine',
  youtube_engine: 'YouTube Engine',
};

export type IntakePayload = {
  name: string;
  email: string;
  company_name: string;
  website: string;
  industry: string;
  main_problem: 'leads' | 'pitch' | 'reach' | 'multi' | '';
  goals: string[];              // more_meetings, reply_rate, pipeline, content_system, authority, multi_system
  current_tools: string[];
  crm_status: string;           // no | basic | clean
  outreach_status: string;      // none | manual | systematic
  content_status: string;       // none | occasional | regular
  team_size: string;            // solo | 2-5 | 6-20 | 20+
  maturity_stage: string;       // stage_zero | basic_tools | chaotic_existing_stack | advanced_needs_optimization
  additional_notes: string;
  source: 'nox_solution_finder';
  submitted_at: string;
};

export type RoutingResult = {
  primary_system: SystemId;
  primary_system_label: string;
  secondary_systems: SystemId[];
  combination_case: 'single' | 'leadgen_pitch' | 'pitch_youtube' | 'leadgen_youtube' | 'full_stack';
  combination_label: string;
  maturity_stage: string;
  routing_tags: string[];
  scores: Record<SystemId, number>;
};

// ------------------------------------------------------------
// Scoring
// ------------------------------------------------------------

const PROBLEM_WEIGHTS: Record<string, Partial<Record<SystemId, number>>> = {
  leads: { leadgen_engine: 5 },
  pitch: { pitch_mutation_engine: 5 },
  reach: { youtube_engine: 5 },
  multi: { leadgen_engine: 2, pitch_mutation_engine: 2, youtube_engine: 2 },
};

const GOAL_WEIGHTS: Record<string, Partial<Record<SystemId, number>>> = {
  more_meetings:    { leadgen_engine: 3, pitch_mutation_engine: 1 },
  reply_rate:       { pitch_mutation_engine: 3, leadgen_engine: 1 },
  pipeline:         { leadgen_engine: 3 },
  content_system:   { youtube_engine: 3 },
  authority:        { youtube_engine: 3 },
  multi_system:     { leadgen_engine: 1, pitch_mutation_engine: 1, youtube_engine: 1 },
};

const OUTREACH_WEIGHTS: Record<string, Partial<Record<SystemId, number>>> = {
  none:       { leadgen_engine: 2 },
  manual:     { leadgen_engine: 2, pitch_mutation_engine: 1 },
  systematic: { pitch_mutation_engine: 2 },
};

const CONTENT_WEIGHTS: Record<string, Partial<Record<SystemId, number>>> = {
  none:       { youtube_engine: 1 },
  occasional: { youtube_engine: 2 },
  regular:    { youtube_engine: 1 },
};

function addWeights(target: Record<SystemId, number>, weights: Partial<Record<SystemId, number>> | undefined) {
  if (!weights) return;
  (Object.keys(weights) as SystemId[]).forEach((k) => {
    target[k] = (target[k] ?? 0) + (weights[k] ?? 0);
  });
}

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------

export function routeIntake(payload: IntakePayload): RoutingResult {
  const scores: Record<SystemId, number> = {
    leadgen_engine: 0,
    pitch_mutation_engine: 0,
    youtube_engine: 0,
  };

  addWeights(scores, PROBLEM_WEIGHTS[payload.main_problem]);
  payload.goals.forEach((g) => addWeights(scores, GOAL_WEIGHTS[g]));
  addWeights(scores, OUTREACH_WEIGHTS[payload.outreach_status]);
  addWeights(scores, CONTENT_WEIGHTS[payload.content_status]);

  // Primary = hoechster Score (Tiebreaker: Problem-Direktzuordnung > leadgen > pitch > youtube)
  const primary = pickPrimary(scores, payload.main_problem);

  // Secondary = alle mit Score >= 0.6 * primary, ausser primary selbst
  const primaryScore = scores[primary];
  const threshold = Math.max(3, primaryScore * 0.6);
  const secondary = (Object.keys(scores) as SystemId[])
    .filter((s) => s !== primary && scores[s] >= threshold)
    .sort((a, b) => scores[b] - scores[a]);

  const combination = resolveCombination(primary, secondary);

  const tags: string[] = [
    primary,
    ...secondary,
    `stage:${payload.maturity_stage || 'unknown'}`,
    `combo:${combination.case}`,
    `team:${payload.team_size || 'unknown'}`,
  ];

  // Sondertags
  if (payload.crm_status === 'no') tags.push('needs_crm_setup');
  if (payload.outreach_status === 'none' && primary === 'leadgen_engine') tags.push('cold_outreach_greenfield');
  if (payload.content_status === 'none' && primary === 'youtube_engine') tags.push('content_greenfield');
  if (secondary.length >= 2) tags.push('multi_system_candidate');

  return {
    primary_system: primary,
    primary_system_label: SYSTEM_LABELS[primary],
    secondary_systems: secondary,
    combination_case: combination.case,
    combination_label: combination.label,
    maturity_stage: payload.maturity_stage || 'unknown',
    routing_tags: Array.from(new Set(tags)),
    scores,
  };
}

function pickPrimary(scores: Record<SystemId, number>, mainProblem: string): SystemId {
  const order: SystemId[] = ['leadgen_engine', 'pitch_mutation_engine', 'youtube_engine'];
  const max = Math.max(...order.map((k) => scores[k]));
  const candidates = order.filter((k) => scores[k] === max);
  if (candidates.length === 1) return candidates[0];
  // Tiebreaker: explizite Problemwahl
  if (mainProblem === 'leads' && candidates.includes('leadgen_engine')) return 'leadgen_engine';
  if (mainProblem === 'pitch' && candidates.includes('pitch_mutation_engine')) return 'pitch_mutation_engine';
  if (mainProblem === 'reach' && candidates.includes('youtube_engine')) return 'youtube_engine';
  return candidates[0];
}

function resolveCombination(primary: SystemId, secondary: SystemId[]): { case: RoutingResult['combination_case']; label: string } {
  const all = new Set<SystemId>([primary, ...secondary]);
  if (all.size === 1) return { case: 'single', label: SYSTEM_LABELS[primary] };
  if (all.size >= 3) return { case: 'full_stack', label: 'Full Stack (Leadgen + Pitch + YouTube)' };
  if (all.has('leadgen_engine') && all.has('pitch_mutation_engine')) return { case: 'leadgen_pitch', label: 'Leadgen + Pitch' };
  if (all.has('pitch_mutation_engine') && all.has('youtube_engine')) return { case: 'pitch_youtube', label: 'Pitch + YouTube' };
  if (all.has('leadgen_engine') && all.has('youtube_engine')) return { case: 'leadgen_youtube', label: 'Leadgen + YouTube' };
  return { case: 'single', label: SYSTEM_LABELS[primary] };
}
