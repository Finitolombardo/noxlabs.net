// NOX Claude Code Bridge — Browser-Client (read + dry-run only in this PR).
//
// ZIEL
// ====
// Das Operator Cockpit redet ÜBER eine lokale Bridge mit Claude Code.
// Claude Code nutzt das Abo/Login des Operators. Diese Datei spricht
// AUSSCHLIESSLICH mit dem lokalen Bridge-Prozess auf
// `http://127.0.0.1:8799` (override via `VITE_NOX_CLAUDE_CODE_BRIDGE_URL`).
//
// HARTE REGELN
// ============
// - Keine Anthropic-API-Calls. Keine claude.ai-Cookies. Kein Token-Lesen.
// - Kein localStorage-/sessionStorage-Schreiben von Secrets.
// - Die Bridge-URL ist KEIN Secret — sie ist eine Loopback-Adresse, die
//   der Operator selbst startet. Vite darf den Wert in den Bundle
//   bauen.
// - In der Vercel-Production gibt es KEINE Bridge: dann gibt
//   `checkBridgeHealth()` einen `offline`-Status zurück und das UI
//   schaltet auf den Fallback (lokaler Regex-Pfad / „Lokale
//   Schnellbefehle").
//
// FAILURE-MODES
// =============
// - Bridge nicht erreichbar (ECONNREFUSED, Timeout) → `offline`.
// - HTTP 4xx/5xx mit JSON-Body → `error` + structured message.
// - CLI fehlt auf dem Host → `degraded` (Bridge antwortet 200 auf
//   /health, aber `claudeCli: 'missing'`).

const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:8799';

function readBridgeUrl(): string {
  // Vite-Env wird statisch ersetzt. Wir lesen sie defensiv — falls
  // jemand das Vite-Setup migriert und `import.meta.env` weggeht,
  // bleibt der Default-Fallback intakt.
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    const raw = env?.VITE_NOX_CLAUDE_CODE_BRIDGE_URL;
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw.trim().replace(/\/+$/, '');
    }
  } catch {
    // ignore
  }
  return DEFAULT_BRIDGE_URL;
}

/* ============================================================================
 * Public types
 * ============================================================================
 */

export type BridgeHealthStatus =
  | 'online'         // Bridge antwortet, CLI vorhanden, Exec aktiv
  | 'dry_run'        // Bridge antwortet, aber Default-Dry-Run
  | 'degraded'       // Bridge antwortet, aber CLI fehlt
  | 'offline'        // Bridge unreachable
  | 'unknown';       // noch nicht geprüft

export interface BridgeHealth {
  status: BridgeHealthStatus;
  bridgeUrl: string;
  bridgeVersion?: string;
  claudeCli?: 'detected' | 'missing';
  exec?: boolean;
  /** Letzter Health-Check als ISO-Timestamp. */
  checkedAt: string;
  /** Operator-facing reason — z. B. „ECONNREFUSED". */
  reason?: string;
}

export type BridgeMessageMode = 'ask' | 'code_task' | 'plan';

export interface BridgeMessageContext {
  projectName?: string;
  projectGoal?: string;
  planSteps?: Array<{ step: number; title: string }>;
  recentActivity?: Array<{ ts: string; summary: string }>;
}

export interface BridgeMessageArgs {
  projectId: string;
  message: string;
  workspacePath: string;
  mode?: BridgeMessageMode;
  context?: BridgeMessageContext;
  signal?: AbortSignal;
}

export interface BridgeSuggestedAction {
  label: string;
  kind: string;
}

export interface BridgeMessageResultPayload {
  status: 'ok' | 'error' | 'blocked' | 'dry_run';
  reply: string;
  rawTail?: string;
  sessionId?: string | null;
  riskFlags?: string[];
  suggestedActions?: BridgeSuggestedAction[];
}

export type BridgeMessageResult =
  | { ok: true; status: number; data: BridgeMessageResultPayload }
  | {
      ok: false;
      status: number;
      errorCode?: string;
      errorMessage?: string;
      /** Set when the bridge could not be reached (ECONNREFUSED, timeout, …). */
      offline?: boolean;
    };

/* ============================================================================
 * /health
 * ============================================================================
 */

const HEALTH_TIMEOUT_MS = 2000;
const MESSAGE_TIMEOUT_MS = 30_000;

function timeoutSignal(ms: number, external?: AbortSignal): {
  signal: AbortSignal;
  cancel: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  let externalListener: (() => void) | null = null;
  if (external) {
    if (external.aborted) {
      controller.abort();
    } else {
      externalListener = () => controller.abort();
      external.addEventListener('abort', externalListener, { once: true });
    }
  }
  return {
    signal: controller.signal,
    cancel: () => {
      clearTimeout(timer);
      if (externalListener && external) external.removeEventListener('abort', externalListener);
    },
  };
}

export async function checkBridgeHealth(externalSignal?: AbortSignal): Promise<BridgeHealth> {
  const bridgeUrl = readBridgeUrl();
  const checkedAt = new Date().toISOString();
  const url = `${bridgeUrl}/health`;
  const { signal, cancel } = timeoutSignal(HEALTH_TIMEOUT_MS, externalSignal);

  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal,
    });

    if (!resp.ok) {
      return {
        status: 'offline',
        bridgeUrl,
        checkedAt,
        reason: `HTTP ${resp.status} von /health`,
      };
    }

    let body: unknown = null;
    try {
      body = await resp.json();
    } catch {
      // ignore
    }

    if (!body || typeof body !== 'object') {
      return {
        status: 'offline',
        bridgeUrl,
        checkedAt,
        reason: 'Bridge antwortete ohne JSON-Body.',
      };
    }

    const obj = body as Record<string, unknown>;
    const bridgeVersion = typeof obj.bridgeVersion === 'string' ? obj.bridgeVersion : undefined;
    const claudeCli = obj.claudeCli === 'detected' || obj.claudeCli === 'missing' ? obj.claudeCli : undefined;
    const exec = typeof obj.exec === 'boolean' ? obj.exec : undefined;

    let status: BridgeHealthStatus;
    if (claudeCli === 'missing') {
      status = 'degraded';
    } else if (exec === true) {
      status = 'online';
    } else {
      status = 'dry_run';
    }

    return {
      status,
      bridgeUrl,
      bridgeVersion,
      claudeCli,
      exec,
      checkedAt,
    };
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return {
      status: 'offline',
      bridgeUrl,
      checkedAt,
      reason: aborted ? 'Timeout' : err instanceof Error ? err.message : 'unbekannter Fehler',
    };
  } finally {
    cancel();
  }
}

/* ============================================================================
 * /claude-code/message
 * ============================================================================
 */

export async function sendClaudeCodeMessage(args: BridgeMessageArgs): Promise<BridgeMessageResult> {
  const bridgeUrl = readBridgeUrl();

  if (!args.projectId.trim()) {
    return { ok: false, status: 0, errorCode: 'client_validation', errorMessage: 'projectId fehlt.' };
  }
  if (!args.message.trim()) {
    return { ok: false, status: 0, errorCode: 'client_validation', errorMessage: 'message darf nicht leer sein.' };
  }
  if (!args.workspacePath.trim()) {
    return {
      ok: false,
      status: 0,
      errorCode: 'client_validation',
      errorMessage: 'workspacePath fehlt — die Bridge erlaubt nur Pfade aus ihrer Allowlist.',
    };
  }

  const url = `${bridgeUrl}/claude-code/message`;
  const { signal, cancel } = timeoutSignal(MESSAGE_TIMEOUT_MS, args.signal);

  const requestBody: Record<string, unknown> = {
    projectId: args.projectId,
    message: args.message,
    workspacePath: args.workspacePath,
    mode: args.mode ?? 'ask',
    context: args.context ?? {},
  };

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      cache: 'no-store',
      signal,
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    cancel();
    const aborted = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      errorCode: aborted ? 'timeout' : 'network_error',
      errorMessage: aborted
        ? `Bridge-Aufruf ${MESSAGE_TIMEOUT_MS}ms überschritten.`
        : err instanceof Error
          ? err.message
          : 'Bridge nicht erreichbar.',
      offline: !aborted,
    };
  } finally {
    cancel();
  }

  let body: unknown = null;
  try {
    body = await resp.json();
  } catch {
    // ignore
  }

  if (resp.ok && body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    const statusField =
      obj.status === 'ok' || obj.status === 'error' || obj.status === 'blocked' || obj.status === 'dry_run'
        ? (obj.status as BridgeMessageResultPayload['status'])
        : 'error';
    return {
      ok: true,
      status: resp.status,
      data: {
        status: statusField,
        reply: typeof obj.reply === 'string' ? obj.reply : '',
        rawTail: typeof obj.rawTail === 'string' ? obj.rawTail : undefined,
        sessionId: typeof obj.sessionId === 'string' ? obj.sessionId : null,
        riskFlags: Array.isArray(obj.riskFlags)
          ? (obj.riskFlags.filter((x) => typeof x === 'string') as string[])
          : [],
        suggestedActions: Array.isArray(obj.suggestedActions)
          ? (obj.suggestedActions
              .filter((a) => a && typeof a === 'object')
              .map((a) => {
                const ao = a as Record<string, unknown>;
                return {
                  label: typeof ao.label === 'string' ? ao.label : 'Aktion',
                  kind: typeof ao.kind === 'string' ? ao.kind : 'noop',
                };
              }) as BridgeSuggestedAction[])
          : [],
      },
    };
  }

  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    return {
      ok: false,
      status: resp.status,
      errorCode: typeof obj.error === 'string' ? obj.error : undefined,
      errorMessage: typeof obj.message === 'string' ? obj.message : undefined,
    };
  }

  return {
    ok: false,
    status: resp.status,
    errorMessage: `Unerwartete Bridge-Antwort (HTTP ${resp.status}).`,
  };
}

/* ============================================================================
 * Helpers used by the cockpit UI
 * ============================================================================
 */

export function bridgeStatusLabel(status: BridgeHealthStatus): string {
  switch (status) {
    case 'online':
      return 'Claude Code · online';
    case 'dry_run':
      return 'Bridge · Dry-Run';
    case 'degraded':
      return 'Bridge · CLI fehlt';
    case 'offline':
      return 'Bridge · offline';
    case 'unknown':
    default:
      return 'Bridge · prüfe …';
  }
}

export function bridgeStatusTone(status: BridgeHealthStatus): 'green' | 'amber' | 'red' | 'gray' {
  switch (status) {
    case 'online':
      return 'green';
    case 'dry_run':
    case 'degraded':
      return 'amber';
    case 'offline':
      return 'red';
    case 'unknown':
    default:
      return 'gray';
  }
}
