// APP-X-BRIDGE-04a + APP-X-BRIDGE-04c — GET /api/operator/projects/:projectId/context
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
//   6. project mapping mode
//
// Project mapping modes (env NOX_PROJECT_MAPPING_MODE):
//   - `none` (default)
//        Empty quest projection. Safe baseline. contextSummary explains
//        that no mapping is configured. Use when the operator has not yet
//        chosen a strategy.
//
//   - `title-prefix`
//        Match `[<projectId>] ...`, `<projectId>:`, `<projectId> —`,
//        `<projectId> -` in the quest title. Cheap fallback; only partial
//        coverage. No Projects DB needed.
//
//   - `notion-relation`  (APP-X-BRIDGE-04c — canonical)
//        Look up the project page in the Projects DB by the human-readable
//        `Project ID` rich_text. Then filter Master Tasks by the `Project`
//        relation. Requires NOX_PROJECTS_DB_ID. Returns rich project metadata
//        (Andromeda Kontext, Erlaubte/Verbotene Aktionen, Vision, etc.).
//
// Strict invariants:
//   - The handler never mutates Notion. The only Notion HTTP verbs used are
//     POST /v1/databases/{id}/query (read-only semantic) and GET /v1/pages/*
//     (none used in this file today).
//   - The Notion token is read only by the adapter, only per-request, and is
//     never echoed into the JSON response or audit events.

import type { ApiHandler } from '../../../_lib/handler.js';
import { methodAllowed, sendError, setNoStore } from '../../../_lib/handler.js';
import { checkOperatorAuth, respondAuthFailure } from '../../../_lib/auth.js';
import { checkRateLimit, respondRateLimited } from '../../../_lib/rateLimit.js';
import { appendAuditEvent } from '../../../_lib/audit.js';
import {
  extractProjectFields,
  propCheckbox,
  propRichText,
  propSelect,
  propTitle,
  queryDatabase,
  queryMasterTasksByProjectRelation,
  queryProjectsByProjectId,
  readNotionConfig,
} from '../../../_lib/notion.js';
import type { NotionPage } from '../../../_lib/notion.js';
import type {
  NotionUpstreamDiagnostic,
  NotionUpstreamStep,
  ProjectContextApproval,
  ProjectContextBlocker,
  ProjectContextEvent,
  ProjectContextProject,
  ProjectContextQuest,
  ProjectContextResponse,
} from '../../../_lib/types.js';
import type { ApiResponse } from '../../../_lib/handler.js';
import type { NotionQueryResult } from '../../../_lib/notion.js';

const ROUTE_LABEL = '/api/operator/projects/:projectId/context';

// Conservative — alphanumerics, dash, underscore, dot. Length-capped.
// Keeps the value safe to echo back into JSON without injection risk.
const PROJECT_ID_RE = /^[A-Za-z0-9._-]{1,64}$/;

type MappingMode = 'none' | 'title-prefix' | 'notion-relation';

function readMappingMode(): MappingMode {
  const v = (process.env.NOX_PROJECT_MAPPING_MODE ?? '').trim().toLowerCase();
  if (v === 'title-prefix') return 'title-prefix';
  if (v === 'notion-relation') return 'notion-relation';
  return 'none';
}

function readProjectsDbId(): string {
  return (process.env.NOX_PROJECTS_DB_ID ?? '').trim();
}

function readProjectIdParam(query: Record<string, string | string[] | undefined>): string | undefined {
  const v = query.projectId;
  if (Array.isArray(v)) return v[0];
  if (typeof v === 'string') return v;
  return undefined;
}

function getQuestTitle(p: NotionPage): string {
  return (
    propTitle(p.properties, 'Titel') ||
    propTitle(p.properties, 'Title') ||
    propTitle(p.properties, 'Name')
  );
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

// Shared projection: turn a list of Master Task pages into the
// quest/approval/blocker/event arrays.
function projectQuests(pages: NotionPage[]): {
  quests: ProjectContextQuest[];
  openApprovals: ProjectContextApproval[];
  blockers: ProjectContextBlocker[];
  recentEvents: ProjectContextEvent[];
} {
  const quests: ProjectContextQuest[] = pages.map((p) => {
    const title = getQuestTitle(p);
    const status = propSelect(p.properties, '🤖 Bearbeitungsstatus');
    const agent =
      propSelect(p.properties, 'Agent') || propSelect(p.properties, '🤖 Nächster Agent');
    const result = propRichText(p.properties, '🤖 Ergebnis');
    const blocker = propRichText(p.properties, '🤖 Was fehlt noch');
    const approved = propCheckbox(p.properties, 'Freigegeben');
    const approvalNeeded = propCheckbox(p.properties, 'Freigabe nötig');
    const questStarten = propCheckbox(p.properties, 'Quest starten');
    const questAbgeschlossen = propCheckbox(p.properties, 'Quest abgeschlossen');
    return {
      questId: p.id,
      title,
      status,
      agent,
      ...(result ? { result: result.slice(0, 500) } : {}),
      ...(blocker ? { blocker: blocker.slice(0, 500) } : {}),
      ...(p.last_edited_time ? { lastEditedAt: p.last_edited_time } : {}),
      ...(p.url ? { url: p.url } : {}),
      approved,
      approvalNeeded,
      questStarten,
      questAbgeschlossen,
    };
  });

  const openApprovals: ProjectContextApproval[] = pages
    .filter(
      (p) =>
        propCheckbox(p.properties, 'Freigabe nötig') ||
        propSelect(p.properties, '🤖 Bearbeitungsstatus') === 'Review nötig',
    )
    .map((p) => ({
      questId: p.id,
      title: getQuestTitle(p),
      reason:
        propRichText(p.properties, '🤖 Was fehlt noch') ||
        propRichText(p.properties, 'Freigabe-Notiz') ||
        'Approval flag or review status set',
    }));

  const blockers: ProjectContextBlocker[] = pages
    .filter((p) => propSelect(p.properties, '🤖 Bearbeitungsstatus') === 'Blockiert')
    .map((p) => ({
      questId: p.id,
      title: getQuestTitle(p),
      blocker:
        propRichText(p.properties, '🤖 Was fehlt noch') || 'No blocker text recorded',
    }));

  const recentEvents: ProjectContextEvent[] = pages
    .slice(0, 20)
    .filter((p) => Boolean(p.last_edited_time))
    .map<ProjectContextEvent>((p) => ({
      at: p.last_edited_time as string,
      type: 'edited',
      summary: `Quest "${getQuestTitle(p).slice(0, 80)}" edited.`,
      questId: p.id,
    }));

  return { quests, openApprovals, blockers, recentEvents };
}

function emptyResponse(projectId: string, contextSummary: string, nextSuggested: string[]): ProjectContextResponse {
  return {
    project: { projectId, title: projectId, summary: 'No project mapping configured.' },
    quests: [],
    openApprovals: [],
    blockers: [],
    recentEvents: [],
    artifacts: [],
    contextSummary,
    nextSuggestedReadOnlyActions: nextSuggested,
    meta: { skeleton: true, readOnly: true, projectMappingConfigured: false, liveExecution: 'locked' },
  };
}

// APP-X-BRIDGE-04e — authenticated-only diagnostic on 502 notion_upstream_error.
// Token, Authorization header, request body and env values never reach this
// function. Only `upstreamStatus` / `upstreamCode` / `upstreamMessage` from
// the adapter (which itself only reads Notion's own error envelope) are
// echoed, all sanitized + length-capped at the adapter layer.
function notionUpstream502(
  res: ApiResponse,
  step: NotionUpstreamStep,
  failure: Extract<NotionQueryResult, { ok: false }>,
): void {
  const diagnostic: NotionUpstreamDiagnostic = {
    step,
    ...(typeof failure.upstreamStatus === 'number' ? { upstreamStatus: failure.upstreamStatus } : {}),
    ...(failure.upstreamCode ? { upstreamCode: failure.upstreamCode } : {}),
    ...(failure.upstreamMessage ? { upstreamMessage: failure.upstreamMessage } : {}),
  };
  res.status(502).json({
    error: 'notion_upstream_error',
    message: 'Notion read-only query failed.',
    diagnostic,
  });
}

function summarise(quests: ProjectContextQuest[], blockers: ProjectContextBlocker[], approvals: ProjectContextApproval[], mode: MappingMode, projectTitle: string): string {
  const head = mode === 'notion-relation' ? `Project "${projectTitle}" (mode=notion-relation)` : `Project mapping mode=${mode}`;
  return `${head}. ${quests.length} linked quest(s), ${approvals.length} open approval(s), ${blockers.length} blocker(s).`;
}

const handler: ApiHandler = async (req, res) => {
  const method = req.method ?? '?';
  const route = ROUTE_LABEL;

  // APP-X-BRIDGE-04d — every response on this route is dynamic operator data.
  // Set Cache-Control once at the top so it applies to all branches below.
  setNoStore(res);

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

  const mode = readMappingMode();

  // ---- mode: notion-relation (canonical, APP-X-BRIDGE-04c) ----
  if (mode === 'notion-relation') {
    const projectsDbId = readProjectsDbId();
    if (!projectsDbId) {
      appendAuditEvent({
        eventType: 'PROJECT_CONTEXT_NOT_CONFIGURED', route, method, statusCode: 503,
        outcome: 'blocked', clientKeyLabel, detailsSummary: 'missing=NOX_PROJECTS_DB_ID',
      });
      sendError(
        res, 503, 'project_mapping_not_configured',
        'Project relation mapping is not configured server-side.',
      );
      return;
    }

    appendAuditEvent({
      eventType: 'PROJECT_CONTEXT_PROJECT_LOOKUP', route, method,
      outcome: 'attempt', clientKeyLabel, detailsSummary: `projectId=${projectId}`,
    });

    const projectLookup = await queryProjectsByProjectId(notion.token, projectsDbId, projectId);
    if (!projectLookup.ok) {
      appendAuditEvent({
        eventType: 'PROJECT_CONTEXT_UPSTREAM_FAILED', route, method, statusCode: 502,
        outcome: 'failure', clientKeyLabel,
        detailsSummary: `projects_lookup: ${projectLookup.summary.slice(0, 150)}`,
      });
      notionUpstream502(res, 'projects_lookup', projectLookup);
      return;
    }

    if (projectLookup.results.length === 0) {
      appendAuditEvent({
        eventType: 'PROJECT_CONTEXT_PROJECT_NOT_FOUND', route, method, statusCode: 404,
        outcome: 'blocked', clientKeyLabel, detailsSummary: `projectId=${projectId}`,
      });
      sendError(
        res, 404, 'project_not_found',
        `No project with Project ID '${projectId}' found in the Projects DB.`,
      );
      return;
    }

    const projectPage = projectLookup.results[0] as NotionPage;
    const proj = extractProjectFields(projectPage.properties);

    const relationLookup = await queryMasterTasksByProjectRelation(
      notion.token,
      notion.dbId,
      projectPage.id,
    );
    if (!relationLookup.ok) {
      appendAuditEvent({
        eventType: 'PROJECT_CONTEXT_UPSTREAM_FAILED', route, method, statusCode: 502,
        outcome: 'failure', clientKeyLabel,
        detailsSummary: `relation_query: ${relationLookup.summary.slice(0, 150)}`,
      });
      notionUpstream502(res, 'master_tasks_relation_query', relationLookup);
      return;
    }

    const { quests, openApprovals, blockers, recentEvents } = projectQuests(relationLookup.results);

    appendAuditEvent({
      eventType: 'PROJECT_CONTEXT_RELATION_READ', route, method, statusCode: 200,
      outcome: 'success', clientKeyLabel,
      detailsSummary: `projectId=${projectId} quests=${quests.length} blockers=${blockers.length} approvals=${openApprovals.length}`,
    });

    const project: ProjectContextProject = {
      projectId: proj.projectId || projectId,
      title: proj.title || projectId,
      ...(proj.status ? { status: proj.status } : {}),
      ...(proj.typ ? { typ: proj.typ } : {}),
      ...(proj.priority ? { priority: proj.priority } : {}),
      ...(proj.vision ? { vision: proj.vision.slice(0, 1000) } : {}),
      ...(proj.andromedaContext ? { andromedaContext: proj.andromedaContext.slice(0, 2000) } : {}),
      ...(proj.currentState ? { currentState: proj.currentState.slice(0, 2000) } : {}),
      ...(proj.nextAction ? { nextAction: proj.nextAction.slice(0, 1000) } : {}),
      ...(proj.allowedActions ? { allowedActions: proj.allowedActions.slice(0, 2000) } : {}),
      ...(proj.forbiddenActions ? { forbiddenActions: proj.forbiddenActions.slice(0, 2000) } : {}),
      ...(proj.artifactLinks ? { artifactLinks: proj.artifactLinks.slice(0, 2000) } : {}),
      ...(proj.primaryUrl ? { primaryUrl: proj.primaryUrl } : {}),
    };

    const body: ProjectContextResponse = {
      project,
      quests,
      openApprovals,
      blockers,
      recentEvents,
      artifacts: [],
      contextSummary: summarise(quests, blockers, openApprovals, mode, project.title),
      nextSuggestedReadOnlyActions: [
        'Review open approvals before any execute unlock.',
        'Inspect blocked quests and refresh their `🤖 Folgeprompt` via the leitstelle.',
        'Decide the next Project X handoff using the project metadata.',
      ],
      meta: { skeleton: true, readOnly: true, projectMappingConfigured: true, liveExecution: 'locked' },
    };

    appendAuditEvent({
      eventType: 'PROJECT_CONTEXT_READ', route, method, statusCode: 200,
      outcome: 'success', clientKeyLabel,
      detailsSummary: `projectId=${projectId} mode=${mode} quests=${quests.length}`,
    });

    res.status(200).json(body);
    return;
  }

  // ---- mode: title-prefix or none ----
  // Both share a flat Master-Tasks query (no filter). title-prefix filters in
  // the handler; none keeps the result empty.

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
    notionUpstream502(res, 'master_tasks_query', query);
    return;
  }

  const matchedPages: NotionPage[] =
    mode === 'title-prefix'
      ? query.results.filter((p) => titleMatchesProject(getQuestTitle(p), projectId))
      : [];

  const projectMappingConfigured = mode !== 'none';

  if (!projectMappingConfigured) {
    const summary =
      'No project mapping is configured yet. Set NOX_PROJECT_MAPPING_MODE=notion-relation (preferred) or =title-prefix.';
    const next = [
      'Decide a project mapping strategy: notion-relation (canonical), title-prefix (degraded), or none.',
      'Set NOX_PROJECT_MAPPING_MODE + NOX_PROJECTS_DB_ID server-side once chosen.',
    ];
    const body = emptyResponse(projectId, summary, next);
    appendAuditEvent({
      eventType: 'PROJECT_CONTEXT_READ', route, method, statusCode: 200,
      outcome: 'success', clientKeyLabel,
      detailsSummary: `projectId=${projectId} mode=none quests=0`,
    });
    return void res.status(200).json(body);
  }

  // title-prefix path.
  const { quests, openApprovals, blockers, recentEvents } = projectQuests(matchedPages);
  const body: ProjectContextResponse = {
    project: { projectId, title: projectId },
    quests,
    openApprovals,
    blockers,
    recentEvents,
    artifacts: [],
    contextSummary: summarise(quests, blockers, openApprovals, mode, projectId),
    nextSuggestedReadOnlyActions: [
      'Review open approvals before any execute unlock.',
      'Triage blockers and refresh their `🤖 Folgeprompt` via the leitstelle.',
      'Switch to NOX_PROJECT_MAPPING_MODE=notion-relation for full coverage.',
    ],
    meta: { skeleton: true, readOnly: true, projectMappingConfigured: true, liveExecution: 'locked' },
  };

  appendAuditEvent({
    eventType: 'PROJECT_CONTEXT_READ', route, method, statusCode: 200,
    outcome: 'success', clientKeyLabel,
    detailsSummary: `projectId=${projectId} mode=${mode} quests=${quests.length} blockers=${blockers.length} approvals=${openApprovals.length}`,
  });

  res.status(200).json(body);
};

export default handler;
