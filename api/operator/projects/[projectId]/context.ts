// APP-X-BRIDGE-04a — GET /api/operator/projects/:projectId/context
//
// Read-only Notion projection. No writes. No Andromeda upstream calls.
// No uploads. No Drive/Miro. No Telegram.
//
// Pipeline:
//   1. rate limit         (process-local sliding window)
//   2. auth gate          (NOX_OPERATOR_API_KEY)
//   3. method allowlist   (GET only)
//   4. projectId validation (path-injected, sanitised)
//   5. notion read-only adapter (NOX_NOTION_READONLY_TOKEN + DB id)
//   6. project mapping heuristic (currently `none` or `title-prefix`)
//
// Project mapping:
//   APP-X has no Projects DB. Master Tasks is flat. Until a real mapping
//   exists, this endpoint runs in one of two modes:
//     - default (`none`)         → empty quests, contextSummary explains it
//     - `title-prefix`           → match `[<projectId>] ...` or `<projectId>:`
//
//   Selected via env NOX_PROJECT_MAPPING_MODE (`none` | `title-prefix`).
//   Anything else falls back to `none`. No client-controllable mapping.

import type { ApiHandler } from '../../../_lib/handler.js';
import { methodAllowed, sendError } from '../../../_lib/handler.js';
import { checkOperatorAuth, respondAuthFailure } from '../../../_lib/auth.js';
import { checkRateLimit, respondRateLimited } from '../../../_lib/rateLimit.js';
import { appendAuditEvent } from '../../../_lib/audit.js';
import {
  propCheckbox,
  propRichText,
  propSelect,
  propTitle,
  queryDatabase,
  readNotionConfig,
} from '../../../_lib/notion.js';
import type {
  ProjectContextApproval,
  ProjectContextBlocker,
  ProjectContextEvent,
  ProjectContextQuest,
  ProjectContextResponse,
} from '../../../_lib/types.js';

const ROUTE_LABEL = '/api/operator/projects/:projectId/context';

// Conservative — alphanumerics, dash, underscore, dot. Length-capped.
// Keeps the value safe to echo back into JSON without injection risk.
const PROJECT_ID_RE = /^[A-Za-z0-9._-]{1,64}$/;

type MappingMode = 'none' | 'title-prefix';

function readMappingMode(): MappingMode {
  const v = (process.env.NOX_PROJECT_MAPPING_MODE ?? '').trim().toLowerCase();
  return v === 'title-prefix' ? 'title-prefix' : 'none';
}

function titleMatchesProject(title: string, projectId: string): boolean {
  if (!title || !projectId) return false;
  const lower = title.toLowerCase();
  const id = projectId.toLowerCase();
  return (
    lower.startsWith(`[${id}]`) ||
    lower.startsWith(`${id}:`) ||
    lower.startsWith(`${id} —`) ||
    lower.startsWith(`${id} -`)
  );
}

function readProjectIdParam(query: Record<string, string | string[] | undefined>): string | undefined {
  const v = query.projectId;
  if (Array.isArray(v)) return v[0];
  if (typeof v === 'string') return v;
  return undefined;
}

const handler: ApiHandler = async (req, res) => {
  const method = req.method ?? '?';
  const route = ROUTE_LABEL;

  // 1. Rate limit.
  const rl = checkRateLimit(req);
  if (!rl.ok) {
    appendAuditEvent({
      eventType: 'RATE_LIMITED', route, method, statusCode: 429,
      outcome: 'blocked', clientKeyLabel: rl.keyLabel,
    });
    return respondRateLimited(res, rl);
  }
  const clientKeyLabel = rl.keyLabel;

  // 2. Auth gate.
  const auth = checkOperatorAuth(req);
  if (!auth.ok) {
    appendAuditEvent({
      eventType: auth.reason === 'not_configured' ? 'AUTH_NOT_CONFIGURED' : 'AUTH_FAILED',
      route, method, statusCode: auth.statusCode, outcome: 'blocked', clientKeyLabel,
    });
    return respondAuthFailure(res, auth);
  }

  // 3. Method.
  if (!methodAllowed(req, res, ['GET'])) {
    appendAuditEvent({
      eventType: 'VALIDATION_FAILED', route, method, statusCode: 405,
      outcome: 'blocked', clientKeyLabel, detailsSummary: 'method_not_allowed',
    });
    return;
  }

  // 4. projectId validation.
  const projectIdRaw = readProjectIdParam(req.query);
  if (!projectIdRaw || !PROJECT_ID_RE.test(projectIdRaw)) {
    appendAuditEvent({
      eventType: 'PROJECT_CONTEXT_VALIDATION_FAILED', route, method, statusCode: 400,
      outcome: 'blocked', clientKeyLabel, detailsSummary: 'projectId_invalid',
    });
    sendError(
      res, 400, 'bad_request',
      `Path parameter 'projectId' must match ${PROJECT_ID_RE.source} (max 64).`,
    );
    return;
  }
  const projectId = projectIdRaw;

  // Attempt — recorded before upstream call.
  appendAuditEvent({
    eventType: 'PROJECT_CONTEXT_READ_ATTEMPT', route, method,
    outcome: 'attempt', clientKeyLabel,
    detailsSummary: `projectId=${projectId}`,
  });

  // 5. Notion adapter configuration.
  const notion = readNotionConfig();
  if (!notion.ok) {
    appendAuditEvent({
      eventType: 'PROJECT_CONTEXT_NOT_CONFIGURED', route, method, statusCode: 503,
      outcome: 'blocked', clientKeyLabel,
      detailsSummary: `missing=${notion.missing.join(',')}`,
    });
    sendError(
      res, 503, 'notion_not_configured',
      'Notion read-only adapter is not configured server-side.',
    );
    return;
  }

  // 6. Read-only Notion query.
  const query = await queryDatabase(notion.token, notion.dbId, {
    page_size: 100,
    sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
  });

  if (!query.ok) {
    appendAuditEvent({
      eventType: 'PROJECT_CONTEXT_UPSTREAM_FAILED', route, method, statusCode: 502,
      outcome: 'failure', clientKeyLabel,
      detailsSummary: query.summary.slice(0, 200),
    });
    sendError(
      res, 502, 'notion_upstream_error',
      'Notion read-only query failed.',
    );
    return;
  }

  const mode = readMappingMode();
  const matchedPages =
    mode === 'title-prefix'
      ? query.results.filter((p) => titleMatchesProject(propTitle(p.properties, 'Titel') || propTitle(p.properties, 'Title') || propTitle(p.properties, 'Name'), projectId))
      : [];

  const quests: ProjectContextQuest[] = matchedPages.map((p) => {
    const title = propTitle(p.properties, 'Titel') || propTitle(p.properties, 'Title') || propTitle(p.properties, 'Name');
    const status = propSelect(p.properties, '🤖 Bearbeitungsstatus');
    const agent = propSelect(p.properties, 'Agent') || propSelect(p.properties, '🤖 Nächster Agent');
    const result = propRichText(p.properties, '🤖 Ergebnis');
    return {
      questId: p.id,
      title,
      status,
      agent,
      ...(result ? { result: result.slice(0, 500) } : {}),
      ...(p.last_edited_time ? { lastEditedAt: p.last_edited_time } : {}),
      ...(p.url ? { url: p.url } : {}),
    };
  });

  const openApprovals: ProjectContextApproval[] = matchedPages
    .filter((p) => propCheckbox(p.properties, 'Freigabe nötig'))
    .map((p) => ({
      questId: p.id,
      title: propTitle(p.properties, 'Titel') || propTitle(p.properties, 'Title') || propTitle(p.properties, 'Name'),
      reason: propRichText(p.properties, '🤖 Was fehlt noch') || 'Freigabe nötig flag set',
    }));

  const blockers: ProjectContextBlocker[] = matchedPages
    .filter((p) => propSelect(p.properties, '🤖 Bearbeitungsstatus') === 'Blockiert')
    .map((p) => ({
      questId: p.id,
      title: propTitle(p.properties, 'Titel') || propTitle(p.properties, 'Title') || propTitle(p.properties, 'Name'),
      blocker: propRichText(p.properties, '🤖 Was fehlt noch') || 'No blocker text recorded',
    }));

  const recentEvents: ProjectContextEvent[] = matchedPages
    .slice(0, 20)
    .filter((p) => Boolean(p.last_edited_time))
    .map<ProjectContextEvent>((p) => ({
      at: p.last_edited_time as string,
      type: 'edited',
      summary: `Quest "${(propTitle(p.properties, 'Titel') || propTitle(p.properties, 'Title') || propTitle(p.properties, 'Name')).slice(0, 80)}" edited.`,
      questId: p.id,
    }));

  const projectMappingConfigured = mode !== 'none';

  const contextSummary = projectMappingConfigured
    ? `Project mapping mode=${mode}. Matched ${quests.length} quest(s). Blockers=${blockers.length}, openApprovals=${openApprovals.length}.`
    : 'No project mapping is configured yet. Set NOX_PROJECT_MAPPING_MODE=title-prefix or define a Project field on Master Tasks.';

  const nextSuggestedReadOnlyActions: string[] = projectMappingConfigured
    ? [
        'Review open approvals before any execute unlock.',
        'Triage blockers and refresh their `🤖 Folgeprompt` via the leitstelle.',
      ]
    : [
        'Decide a project mapping strategy: title-prefix, Notion Project field, or separate Projects DB.',
        'Set NOX_PROJECT_MAPPING_MODE server-side once chosen.',
      ];

  const body: ProjectContextResponse = {
    project: {
      projectId,
      title: projectId,
      ...(projectMappingConfigured ? {} : { summary: 'No project mapping configured.' }),
    },
    quests,
    openApprovals,
    blockers,
    recentEvents,
    artifacts: [],
    contextSummary,
    nextSuggestedReadOnlyActions,
    meta: {
      skeleton: true,
      readOnly: true,
      projectMappingConfigured,
      liveExecution: 'locked',
    },
  };

  appendAuditEvent({
    eventType: 'PROJECT_CONTEXT_READ', route, method, statusCode: 200,
    outcome: 'success', clientKeyLabel,
    detailsSummary: `projectId=${projectId} mode=${mode} quests=${quests.length} blockers=${blockers.length} approvals=${openApprovals.length}`,
  });

  res.status(200).json(body);
};

export default handler;
