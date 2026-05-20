// Phase 2D-Plus — Audit-Persistenz.
//
// Storage abstraction for the operator audit log. Lives behind a narrow
// interface (`appendAuditEventPersistent` / `listAuditEvents`) so the
// concrete backend can be swapped via env without touching call sites.
//
// Default: process-local ring buffer (same posture as before this file
// existed — see `api/_lib/audit.ts`). Survives a single warm function
// instance and resets on every Vercel cold start / deploy.
//
// Optional: Upstash-compatible Redis REST adapter. Activates only when
// BOTH env vars are set:
//   - NOX_AUDIT_KV_REST_URL    (e.g. https://<region>-<id>.upstash.io)
//   - NOX_AUDIT_KV_REST_TOKEN  (Upstash REST token; never logged)
//
// The REST adapter uses plain `fetch` — no SDK dependency. Events are
// pushed to a single Redis LIST (`NOX_AUDIT_KV_LIST_KEY`, default
// `nox:audit:operator`) via LPUSH+LTRIM, and read back via LRANGE. The
// list is bounded to `MAX_PERSISTENT_EVENTS` to keep storage cost
// predictable.
//
// Strict invariants:
//   - No new hard dependencies. The KV adapter is `fetch`-only and is
//     a no-op when env is unset.
//   - Persistent write is BEST-EFFORT. Failure NEVER crashes the
//     parent request — it falls back to the ring buffer and surfaces a
//     sanitised `console.warn`.
//   - Token values are never logged, never echoed, never put on the
//     wire.
//   - No personally identifying data beyond what the in-memory buffer
//     already accepts (the sanitised `clientKeyLabel` from rateLimit.ts).

import type { AuditEvent, AuditEventType, AuditOutcome } from './audit.js';

// --- Shared types --------------------------------------------------------

export interface AuditListFilter {
  /** Maximum number of events to return (newest-first). */
  limit?: number;
  projectId?: string;
  eventType?: AuditEventType;
  planDigest?: string;
}

export interface AuditListResult {
  events: AuditEvent[];
  /** Backend that actually served the read. */
  source: 'persistent' | 'memory';
  /** Number of events returned (post-filter, post-limit). */
  count: number;
  /** Effective limit applied. */
  limit: number;
  /** Total number of events the backend currently holds, pre-filter. */
  totalAvailable: number;
}

// --- Configuration -------------------------------------------------------

const MAX_MEMORY_EVENTS = 200;
const MAX_PERSISTENT_EVENTS = 1000;
const DEFAULT_LIST_KEY = 'nox:audit:operator';
const KV_TIMEOUT_MS = 2500;

function readKvConfig(): { url: string; token: string; listKey: string } | undefined {
  const url = (process.env.NOX_AUDIT_KV_REST_URL ?? '').trim();
  const token = (process.env.NOX_AUDIT_KV_REST_TOKEN ?? '').trim();
  if (url.length === 0 || token.length === 0) return undefined;
  const listKey = (process.env.NOX_AUDIT_KV_LIST_KEY ?? '').trim() || DEFAULT_LIST_KEY;
  return { url, token, listKey };
}

export function isPersistentAuditEnabled(): boolean {
  return readKvConfig() !== undefined;
}

// --- Memory backend (always present, also serves as fallback) -----------

const memoryRing: AuditEvent[] = [];

function memoryAppend(event: AuditEvent): void {
  memoryRing.push(event);
  if (memoryRing.length > MAX_MEMORY_EVENTS) {
    memoryRing.splice(0, memoryRing.length - MAX_MEMORY_EVENTS);
  }
}

function memoryList(filter: AuditListFilter): AuditListResult {
  const limit = clampLimit(filter.limit);
  const reversed: AuditEvent[] = [];
  for (let i = memoryRing.length - 1; i >= 0; i--) {
    reversed.push(memoryRing[i] as AuditEvent);
  }
  const filtered = applyFilters(reversed, filter);
  return {
    events: filtered.slice(0, limit),
    source: 'memory',
    count: Math.min(filtered.length, limit),
    limit,
    totalAvailable: memoryRing.length,
  };
}

export function getMemoryBufferStats(): { count: number; max: number } {
  return { count: memoryRing.length, max: MAX_MEMORY_EVENTS };
}

// --- Persistent backend (Upstash-compatible REST, fetch-only) ----------

function safeWarn(scope: string, summary: string): void {
  try {
    // No tokens. No URLs (the URL itself is benign but we keep logs lean).
    console.warn(
      JSON.stringify({
        src: 'auditStore',
        scope,
        // Truncate hard so a runaway message can't blow the log line.
        summary: summary.slice(0, 240),
      }),
    );
  } catch {
    // Never let logging itself throw.
  }
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Upstash Redis REST returns `{ result: ... }` for command responses.
 * We accept the shape defensively — anything else is treated as failure.
 */
async function kvCommand(
  cfg: { url: string; token: string },
  command: (string | number)[],
): Promise<unknown> {
  const url = cfg.url.replace(/\/+$/, '');
  const body = JSON.stringify(command);
  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      body,
    },
    KV_TIMEOUT_MS,
  );
  if (!res.ok) {
    throw new Error(`kv_http_${res.status}`);
  }
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json && typeof json === 'object' && 'error' in json && typeof json.error === 'string') {
    throw new Error(`kv_cmd_error:${json.error.slice(0, 80)}`);
  }
  return json?.result;
}

async function persistentAppend(event: AuditEvent): Promise<boolean> {
  const cfg = readKvConfig();
  if (!cfg) return false;
  try {
    const serialised = JSON.stringify(event);
    // LPUSH newest, then LTRIM to cap. Two commands keep the wire shape
    // trivial; Upstash also exposes pipelining but we deliberately stay
    // on the lowest-common-denominator REST verb to avoid lock-in.
    await kvCommand(cfg, ['LPUSH', cfg.listKey, serialised]);
    await kvCommand(cfg, ['LTRIM', cfg.listKey, 0, MAX_PERSISTENT_EVENTS - 1]);
    return true;
  } catch (err) {
    safeWarn(
      'persistentAppend',
      `failed: ${err instanceof Error ? err.message : 'unknown'}`,
    );
    return false;
  }
}

async function persistentList(filter: AuditListFilter): Promise<AuditListResult | undefined> {
  const cfg = readKvConfig();
  if (!cfg) return undefined;
  const limit = clampLimit(filter.limit);
  try {
    // Pull a generous window so filters still surface enough hits; cap
    // hard to MAX_PERSISTENT_EVENTS so memory stays bounded.
    const fetchN = Math.min(MAX_PERSISTENT_EVENTS, Math.max(limit * 4, limit));
    const raw = await kvCommand(cfg, ['LRANGE', cfg.listKey, 0, fetchN - 1]);
    if (!Array.isArray(raw)) {
      return undefined;
    }
    const parsed: AuditEvent[] = [];
    for (const entry of raw) {
      if (typeof entry !== 'string') continue;
      try {
        const obj = JSON.parse(entry) as AuditEvent;
        if (obj && typeof obj.id === 'string' && typeof obj.timestamp === 'string') {
          parsed.push(obj);
        }
      } catch {
        // Skip corrupt entries; never throw out of the read path.
      }
    }
    // LRANGE is already newest-first thanks to LPUSH-on-write.
    const filtered = applyFilters(parsed, filter);
    // Best-effort total: LLEN keeps the persistent total accurate without
    // requiring us to materialise the whole list. If LLEN fails we fall
    // back to `parsed.length`.
    let totalAvailable = parsed.length;
    try {
      const len = await kvCommand(cfg, ['LLEN', cfg.listKey]);
      if (typeof len === 'number' && Number.isFinite(len)) {
        totalAvailable = len;
      }
    } catch {
      // ignore
    }
    return {
      events: filtered.slice(0, limit),
      source: 'persistent',
      count: Math.min(filtered.length, limit),
      limit,
      totalAvailable,
    };
  } catch (err) {
    safeWarn(
      'persistentList',
      `failed: ${err instanceof Error ? err.message : 'unknown'}`,
    );
    return undefined;
  }
}

// --- Filters / limits ---------------------------------------------------

function clampLimit(raw: number | undefined): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return 50;
  return Math.min(Math.max(Math.floor(raw), 1), 500);
}

function applyFilters(events: AuditEvent[], filter: AuditListFilter): AuditEvent[] {
  const pid = filter.projectId?.trim();
  const ev = filter.eventType;
  const digest = filter.planDigest?.trim().toLowerCase();
  if (!pid && !ev && !digest) return events;
  return events.filter((e) => {
    if (pid && e.projectId !== pid) return false;
    if (ev && e.eventType !== ev) return false;
    if (digest && (e.planDigest ?? '').toLowerCase() !== digest) return false;
    return true;
  });
}

// --- Public API ---------------------------------------------------------

/**
 * Append an event to the memory ring (always) and, best-effort, to the
 * persistent backend. The memory ring is the source of truth for the
 * current function instance; the persistent backend is the cross-instance
 * truth used by the read endpoint when configured.
 *
 * Returns `{ persisted }` to let callers log whether persistence
 * actually fired. Never throws.
 */
export async function appendAuditEventPersistent(
  event: AuditEvent,
): Promise<{ persisted: boolean }> {
  memoryAppend(event);
  const persisted = await persistentAppend(event);
  return { persisted };
}

/**
 * Synchronous append — used by call sites that cannot await (existing
 * `appendAuditEvent` signature). The persistent write is kicked off via
 * a fire-and-forget Promise. Errors are swallowed by `persistentAppend`.
 */
export function appendAuditEventFireAndForget(event: AuditEvent): void {
  memoryAppend(event);
  // Fire-and-forget. Vercel's runtime keeps the function alive long
  // enough for the promise to resolve in the common warm path. On cold
  // shutdown the persistent write is best-effort by definition.
  void persistentAppend(event).catch(() => {
    /* already logged inside persistentAppend */
  });
}

/**
 * Read newest-first events. Reads persistent first when configured; falls
 * back to memory on any failure. Result includes the source the data came
 * from so the UI can warn the operator when persistence is unavailable.
 */
export async function listAuditEvents(filter: AuditListFilter = {}): Promise<AuditListResult> {
  if (isPersistentAuditEnabled()) {
    const remote = await persistentList(filter);
    if (remote) return remote;
  }
  return memoryList(filter);
}

// --- Type re-exports (small ergonomic shim) ----------------------------

export type { AuditEvent, AuditEventType, AuditOutcome };
