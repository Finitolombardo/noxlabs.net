// APP-X-BRIDGE-04a — Minimal Notion read-only adapter.
//
// Server-side only. Uses the global `fetch` available in the Vercel Node 18+
// runtime — no new npm dependency.
//
// Strict read-only semantics enforced here:
//   - Only one Notion endpoint is called: POST /v1/databases/{id}/query.
//     Notion's HTTP verb is POST, but the operation has read-only semantics —
//     it returns rows, never mutates them. No PATCH, no page-update, no
//     block-append, no schema mutation is implemented in this module.
//   - The integration token configured in NOX_NOTION_READONLY_TOKEN must
//     itself be scoped read-only at the Notion side. This module never
//     enforces scope on Notion's behalf; treat it as belt-and-suspenders.
//   - Token is read from process.env on every call (no module-level capture)
//     so it never lands in bundled output and never appears in any response
//     or error body returned to the client.
//
// Configuration:
//   NOX_NOTION_READONLY_TOKEN — read-only Notion integration token.
//   NOX_MASTER_TASKS_DB_ID    — Master Tasks database ID (UUID, dashed or
//                               undashed; both work against Notion API).

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export type NotionReadonlyStatus =
  | { ok: true; token: string; dbId: string }
  | { ok: false; reason: 'not_configured'; missing: string[] };

export type NotionQueryResult =
  | { ok: true; results: NotionPage[]; hasMore: boolean }
  | { ok: false; reason: 'upstream_error'; statusCode?: number; summary: string };

export interface NotionPage {
  id: string;
  last_edited_time?: string;
  created_time?: string;
  url?: string;
  properties: Record<string, unknown>;
}

/**
 * Reads token + db id from env. Returns a configured status without exposing
 * the token to the caller in error paths. The token is exposed only in the
 * `ok: true` branch so callers can pass it straight to `queryDatabase`.
 */
export function readNotionConfig(): NotionReadonlyStatus {
  const token = (process.env.NOX_NOTION_READONLY_TOKEN ?? '').trim();
  const dbId = (process.env.NOX_MASTER_TASKS_DB_ID ?? '').trim();
  const missing: string[] = [];
  if (token.length === 0) missing.push('NOX_NOTION_READONLY_TOKEN');
  if (dbId.length === 0) missing.push('NOX_MASTER_TASKS_DB_ID');
  if (missing.length > 0) {
    return { ok: false, reason: 'not_configured', missing };
  }
  return { ok: true, token, dbId };
}

/**
 * Read-only Notion database query. POST per Notion API, but the operation
 * is purely a row-fetch — no mutation is sent.
 *
 * The Notion-Version header is pinned; the token is sent via Authorization
 * Bearer. The token is never echoed back into the returned object on error.
 */
export async function queryDatabase(
  token: string,
  dbId: string,
  body: {
    page_size?: number;
    start_cursor?: string;
    sorts?: unknown[];
    filter?: unknown;
  } = {},
): Promise<NotionQueryResult> {
  const safeBody = {
    page_size: typeof body.page_size === 'number' ? Math.min(100, Math.max(1, body.page_size)) : 50,
    ...(body.start_cursor ? { start_cursor: body.start_cursor } : {}),
    ...(body.sorts ? { sorts: body.sorts } : {}),
    ...(body.filter ? { filter: body.filter } : {}),
  };

  let resp: Response;
  try {
    resp = await fetch(`${NOTION_API}/databases/${encodeURIComponent(dbId)}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(safeBody),
    });
  } catch (err) {
    return {
      ok: false,
      reason: 'upstream_error',
      summary: `notion fetch failed: ${err instanceof Error ? err.name : 'unknown'}`,
    };
  }

  if (!resp.ok) {
    return {
      ok: false,
      reason: 'upstream_error',
      statusCode: resp.status,
      summary: `notion query returned HTTP ${resp.status}`,
    };
  }

  let json: unknown;
  try {
    json = await resp.json();
  } catch {
    return { ok: false, reason: 'upstream_error', statusCode: resp.status, summary: 'invalid json from notion' };
  }

  if (!json || typeof json !== 'object' || !Array.isArray((json as { results?: unknown }).results)) {
    return { ok: false, reason: 'upstream_error', statusCode: resp.status, summary: 'unexpected notion payload shape' };
  }
  const obj = json as { results: unknown[]; has_more?: boolean };
  const pages: NotionPage[] = [];
  for (const r of obj.results) {
    if (r && typeof r === 'object') {
      const rec = r as { id?: unknown; properties?: unknown };
      if (typeof rec.id === 'string' && rec.properties && typeof rec.properties === 'object') {
        const page = r as Record<string, unknown>;
        pages.push({
          id: rec.id,
          last_edited_time: typeof page.last_edited_time === 'string' ? (page.last_edited_time as string) : undefined,
          created_time: typeof page.created_time === 'string' ? (page.created_time as string) : undefined,
          url: typeof page.url === 'string' ? (page.url as string) : undefined,
          properties: rec.properties as Record<string, unknown>,
        });
      }
    }
  }
  return { ok: true, results: pages, hasMore: Boolean(obj.has_more) };
}

// ---- Property extractors (defensive; tolerate missing/wrong-shaped fields) ----

function richTextToPlain(rt: unknown): string {
  if (!Array.isArray(rt)) return '';
  let out = '';
  for (const span of rt) {
    if (span && typeof span === 'object') {
      const s = span as { plain_text?: unknown };
      if (typeof s.plain_text === 'string') out += s.plain_text;
    }
  }
  return out;
}

export function propTitle(props: Record<string, unknown>, name: string): string {
  const p = props[name];
  if (!p || typeof p !== 'object') return '';
  const t = (p as { title?: unknown }).title;
  return richTextToPlain(t);
}

export function propRichText(props: Record<string, unknown>, ...names: string[]): string {
  for (const name of names) {
    const p = props[name];
    if (!p || typeof p !== 'object') continue;
    const rt = (p as { rich_text?: unknown }).rich_text;
    const v = richTextToPlain(rt).trim();
    if (v) return v;
  }
  return '';
}

export function propSelect(props: Record<string, unknown>, name: string): string {
  const p = props[name];
  if (!p || typeof p !== 'object') return '';
  const sel = (p as { select?: { name?: unknown } | null }).select;
  if (sel && typeof sel === 'object' && typeof sel.name === 'string') return sel.name;
  return '';
}

export function propMultiSelectNames(props: Record<string, unknown>, name: string): string[] {
  const p = props[name];
  if (!p || typeof p !== 'object') return [];
  const arr = (p as { multi_select?: unknown }).multi_select;
  if (!Array.isArray(arr)) return [];
  const out: string[] = [];
  for (const opt of arr) {
    if (opt && typeof opt === 'object') {
      const n = (opt as { name?: unknown }).name;
      if (typeof n === 'string') out.push(n);
    }
  }
  return out;
}

export function propCheckbox(props: Record<string, unknown>, name: string): boolean {
  const p = props[name];
  if (!p || typeof p !== 'object') return false;
  return Boolean((p as { checkbox?: unknown }).checkbox);
}

// `relation`-typed Notion property — returns the list of related page IDs.
export function propRelationIds(props: Record<string, unknown>, name: string): string[] {
  const p = props[name];
  if (!p || typeof p !== 'object') return [];
  const arr = (p as { relation?: unknown }).relation;
  if (!Array.isArray(arr)) return [];
  const out: string[] = [];
  for (const r of arr) {
    if (r && typeof r === 'object') {
      const id = (r as { id?: unknown }).id;
      if (typeof id === 'string') out.push(id);
    }
  }
  return out;
}

// `url`-typed Notion property — returns the trimmed URL or empty string.
export function propUrl(props: Record<string, unknown>, name: string): string {
  const p = props[name];
  if (!p || typeof p !== 'object') return '';
  const u = (p as { url?: unknown }).url;
  return typeof u === 'string' ? u.trim() : '';
}

// ---- APP-X-BRIDGE-04c — Notion Project Relation Mapping helpers ----

/**
 * Look up a project page in the Projects DB by its human-readable
 * `Project ID` rich_text field. Returns the first match (page_size=5,
 * defensive against duplicates) or an empty result. No mutation.
 */
export async function queryProjectsByProjectId(
  token: string,
  projectsDbId: string,
  projectId: string,
): Promise<NotionQueryResult> {
  return queryDatabase(token, projectsDbId, {
    page_size: 5,
    filter: {
      property: 'Project ID',
      rich_text: { equals: projectId },
    },
  });
}

/**
 * Filter Master Tasks by the `Project` relation, returning quests linked to
 * the given project page id. Sorted by last_edited_time descending.
 */
export async function queryMasterTasksByProjectRelation(
  token: string,
  masterTasksDbId: string,
  projectPageId: string,
): Promise<NotionQueryResult> {
  return queryDatabase(token, masterTasksDbId, {
    page_size: 100,
    sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
    filter: {
      property: 'Project',
      relation: { contains: projectPageId },
    },
  });
}

/**
 * Defensive extractor for the `🧭 Projects / System Map` DB. Every field is
 * optional — Notion schema drift returns empty strings, never throws.
 */
export interface ExtractedProject {
  title: string;
  projectId: string;
  status: string;
  typ: string;
  priority: string;
  vision: string;
  andromedaContext: string;
  currentState: string;
  nextAction: string;
  allowedActions: string;
  forbiddenActions: string;
  artifactLinks: string;
  primaryUrl: string;
}

export function extractProjectFields(props: Record<string, unknown>): ExtractedProject {
  return {
    title: propTitle(props, 'Projekt') || propTitle(props, 'Project') || propTitle(props, 'Name') || propTitle(props, 'Titel'),
    projectId: propRichText(props, 'Project ID'),
    status: propSelect(props, 'Status'),
    typ: propSelect(props, 'Typ'),
    priority: propSelect(props, 'Priorität') || propSelect(props, 'Priority'),
    vision: propRichText(props, 'Vision'),
    andromedaContext: propRichText(props, 'Andromeda Kontext'),
    currentState: propRichText(props, 'Aktueller Stand'),
    nextAction: propRichText(props, 'Nächste Aktion'),
    allowedActions: propRichText(props, 'Erlaubte Aktionen'),
    forbiddenActions: propRichText(props, 'Verbotene Aktionen'),
    artifactLinks: propRichText(props, 'Artifact Links'),
    primaryUrl: propUrl(props, 'Primary URL'),
  };
}
