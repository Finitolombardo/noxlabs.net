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

// APP-X-BRIDGE-04d — fetch timeout to avoid hanging Vercel functions on slow
// Notion responses. Operator can override via NOX_NOTION_FETCH_TIMEOUT_MS,
// clamped to [1000, 15000] ms. Default 8000 ms keeps headroom under the
// 10s Vercel Hobby function timeout.
const FETCH_TIMEOUT_DEFAULT_MS = 8000;
const FETCH_TIMEOUT_MIN_MS = 1000;
const FETCH_TIMEOUT_MAX_MS = 15000;

function resolveFetchTimeoutMs(): number {
  const raw = (process.env.NOX_NOTION_FETCH_TIMEOUT_MS ?? '').trim();
  if (!raw) return FETCH_TIMEOUT_DEFAULT_MS;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return FETCH_TIMEOUT_DEFAULT_MS;
  if (n < FETCH_TIMEOUT_MIN_MS) return FETCH_TIMEOUT_MIN_MS;
  if (n > FETCH_TIMEOUT_MAX_MS) return FETCH_TIMEOUT_MAX_MS;
  return n;
}

export type NotionReadonlyStatus =
  | { ok: true; token: string; dbId: string }
  | { ok: false; reason: 'not_configured'; missing: string[] };

export type NotionQueryResult =
  | { ok: true; results: NotionPage[]; hasMore: boolean }
  | {
      ok: false;
      reason: 'upstream_error';
      statusCode?: number;
      summary: string;
      // APP-X-BRIDGE-04e — sanitized diagnostic fields. Populated only from
      // Notion's own JSON error envelope ({object:"error", code, message}).
      // Never includes Authorization header, token, request body, or env
      // values. `upstreamMessage` is capped at 300 chars before storage.
      upstreamStatus?: number;
      upstreamCode?: string;
      upstreamMessage?: string;
    };

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

  const timeoutMs = resolveFetchTimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

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
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      reason: 'upstream_error',
      summary: aborted
        ? `notion_timeout after ${timeoutMs}ms`
        : `notion fetch failed: ${err instanceof Error ? err.name : 'unknown'}`,
    };
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) {
    // APP-X-BRIDGE-04e — safe Notion upstream diagnostics.
    // We read the response body (capped) and try to extract the
    // `{object:"error", code, message}` envelope Notion returns on 4xx/5xx.
    // No header, no token, no request body is ever touched here; the
    // upstream payload is the only source.
    const diag = await readNotionErrorDiagnostics(resp);
    const codePart = diag.upstreamCode ? ` ${diag.upstreamCode}` : '';
    return {
      ok: false,
      reason: 'upstream_error',
      statusCode: resp.status,
      summary: `notion query returned HTTP ${resp.status}${codePart}`,
      upstreamStatus: resp.status,
      ...(diag.upstreamCode ? { upstreamCode: diag.upstreamCode } : {}),
      ...(diag.upstreamMessage ? { upstreamMessage: diag.upstreamMessage } : {}),
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

// ---- APP-X-BRIDGE-04e — safe Notion upstream error diagnostics ----
//
// Notion's HTTP error envelope is documented as:
//   { "object": "error", "status": <number>, "code": "<string>",
//     "message": "<string>", "request_id": "<string>" }
//
// We only extract `code` + `message`, cap them in length, and never include
// the response body verbatim. The Authorization header, the integration
// token, and the request body never enter this function — they live in the
// outer `fetch` call site and are not on `resp`.

const UPSTREAM_MESSAGE_MAX = 300;
const UPSTREAM_CODE_MAX = 80;

interface NotionErrorDiagnostics {
  upstreamCode?: string;
  upstreamMessage?: string;
}

async function readNotionErrorDiagnostics(resp: Response): Promise<NotionErrorDiagnostics> {
  let raw: string;
  try {
    raw = await resp.text();
  } catch {
    return {};
  }
  if (!raw) return {};
  const slice = raw.slice(0, UPSTREAM_MESSAGE_MAX);
  let parsed: unknown;
  try {
    parsed = JSON.parse(slice);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object') return {};
  const env = parsed as { object?: unknown; code?: unknown; message?: unknown };
  // Defensive: Notion sends `object:"error"`, but we don't require it — any
  // JSON body with a `code` or `message` string still gives the operator
  // signal. Both fields are individually optional.
  const out: NotionErrorDiagnostics = {};
  if (typeof env.code === 'string' && env.code.length > 0) {
    out.upstreamCode = env.code.slice(0, UPSTREAM_CODE_MAX);
  }
  if (typeof env.message === 'string' && env.message.length > 0) {
    out.upstreamMessage = env.message.slice(0, UPSTREAM_MESSAGE_MAX);
  }
  return out;
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

// ---- Phase 2B — Read-only database schema fetch ----
//
// Calls `GET /v1/databases/{id}` (Notion's read endpoint for database
// metadata). No mutation, no POST, no PATCH. Returns the property map
// so the Phase 2B validator can check that each planned property name
// exists with the expected type. The same token / timeout / error
// diagnostics pattern as `queryDatabase` is reused, so behaviour stays
// consistent across all read-only Notion calls.
//
// IMPORTANT: this function never creates, updates, deletes, or otherwise
// touches Notion. It exists purely to read the schema header so the
// operator gets a deterministic "this property does/doesn't exist" answer
// before Phase 2C ever attempts a write.

export type NotionSchemaResult =
  | { ok: true; properties: Record<string, NotionDatabaseProperty> }
  | {
      ok: false;
      reason: 'upstream_error';
      statusCode?: number;
      summary: string;
      upstreamStatus?: number;
      upstreamCode?: string;
      upstreamMessage?: string;
    };

export interface NotionDatabaseProperty {
  // Notion's `type` discriminator string (e.g. "title", "rich_text",
  // "select", "checkbox", "number", "relation", "url", "multi_select",
  // "people", "date", "files", "url", "email", "phone_number",
  // "formula", "rollup", "status", "created_time", "last_edited_time",
  // "created_by", "last_edited_by"). Phase 2B only inspects this string.
  type: string;
  // Notion's internal property id (UUID-style or short string).
  id?: string;
  // Notion's display name (Phase 2B uses the key in the property map,
  // which Notion already sets to the display name; this is kept here for
  // completeness in case Notion ever returns a separate `name` field).
  name?: string;
  // Discriminant-typed sub-options. Phase 2B inspects:
  //   - `select.options` for select properties (option name allowlist)
  //   - `multi_select.options` for multi-select
  //   - `relation.database_id` for relation
  select?: { options?: Array<{ name?: string; id?: string }> };
  multi_select?: { options?: Array<{ name?: string; id?: string }> };
  relation?: { database_id?: string };
}

/**
 * Read-only Notion database schema fetch. GET /v1/databases/{id}.
 * No writes. No mutation. Identical timeout + diagnostic pattern as
 * `queryDatabase`.
 */
export async function getDatabaseSchema(
  token: string,
  dbId: string,
): Promise<NotionSchemaResult> {
  const timeoutMs = resolveFetchTimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let resp: Response;
  try {
    resp = await fetch(`${NOTION_API}/databases/${encodeURIComponent(dbId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
      },
      signal: controller.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      reason: 'upstream_error',
      summary: aborted
        ? `notion_timeout after ${timeoutMs}ms`
        : `notion fetch failed: ${err instanceof Error ? err.name : 'unknown'}`,
    };
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) {
    const diag = await readNotionErrorDiagnostics(resp);
    const codePart = diag.upstreamCode ? ` ${diag.upstreamCode}` : '';
    return {
      ok: false,
      reason: 'upstream_error',
      statusCode: resp.status,
      summary: `notion schema returned HTTP ${resp.status}${codePart}`,
      upstreamStatus: resp.status,
      ...(diag.upstreamCode ? { upstreamCode: diag.upstreamCode } : {}),
      ...(diag.upstreamMessage ? { upstreamMessage: diag.upstreamMessage } : {}),
    };
  }

  let json: unknown;
  try {
    json = await resp.json();
  } catch {
    return {
      ok: false,
      reason: 'upstream_error',
      statusCode: resp.status,
      summary: 'invalid json from notion schema',
    };
  }

  if (!json || typeof json !== 'object') {
    return {
      ok: false,
      reason: 'upstream_error',
      statusCode: resp.status,
      summary: 'unexpected notion schema payload shape',
    };
  }
  const obj = json as { properties?: unknown };
  if (!obj.properties || typeof obj.properties !== 'object') {
    return {
      ok: false,
      reason: 'upstream_error',
      statusCode: resp.status,
      summary: 'notion schema payload missing properties',
    };
  }

  const out: Record<string, NotionDatabaseProperty> = {};
  for (const [name, raw] of Object.entries(obj.properties as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const type = typeof r.type === 'string' ? r.type : 'unknown';
    const prop: NotionDatabaseProperty = { type };
    if (typeof r.id === 'string') prop.id = r.id;
    if (typeof r.name === 'string') prop.name = r.name;
    // Select / multi-select option lists (defensive).
    const sel = r.select;
    if (sel && typeof sel === 'object') {
      const opts = (sel as { options?: unknown }).options;
      if (Array.isArray(opts)) {
        const cleaned: Array<{ name?: string; id?: string }> = [];
        for (const opt of opts) {
          if (opt && typeof opt === 'object') {
            const o = opt as { name?: unknown; id?: unknown };
            const entry: { name?: string; id?: string } = {};
            if (typeof o.name === 'string') entry.name = o.name;
            if (typeof o.id === 'string') entry.id = o.id;
            cleaned.push(entry);
          }
        }
        prop.select = { options: cleaned };
      }
    }
    const ms = r.multi_select;
    if (ms && typeof ms === 'object') {
      const opts = (ms as { options?: unknown }).options;
      if (Array.isArray(opts)) {
        const cleaned: Array<{ name?: string; id?: string }> = [];
        for (const opt of opts) {
          if (opt && typeof opt === 'object') {
            const o = opt as { name?: unknown; id?: unknown };
            const entry: { name?: string; id?: string } = {};
            if (typeof o.name === 'string') entry.name = o.name;
            if (typeof o.id === 'string') entry.id = o.id;
            cleaned.push(entry);
          }
        }
        prop.multi_select = { options: cleaned };
      }
    }
    const rel = r.relation;
    if (rel && typeof rel === 'object') {
      const dbId = (rel as { database_id?: unknown }).database_id;
      prop.relation = typeof dbId === 'string' ? { database_id: dbId } : {};
    }
    out[name] = prop;
  }

  return { ok: true, properties: out };
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
