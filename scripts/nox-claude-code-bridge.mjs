#!/usr/bin/env node
// NOX Claude Code Bridge — lokaler MVP-Prototyp.
//
// ZIEL
// ====
// Minimaler Loopback-HTTP-Server, mit dem das NOX Operator Cockpit Claude
// über das lokal installierte `claude`-CLI ansprechen kann. Claude Code
// nutzt das Abo/Login des Operators; diese Bridge führt KEINE
// Anthropic-API-Calls aus, liest KEINE Tokens und kennt KEINE Secrets.
//
// SICHERHEITS-DEFAULTS
// ====================
// - Bindet NUR auf 127.0.0.1. Kein 0.0.0.0.
// - CORS erlaubt nur lokale Vite-Origins (5173) — kein Internet-Origin.
// - Default: **Dry-Run.** Es wird KEIN `claude`-Prozess gestartet. Die
//   Bridge antwortet mit dem Prompt, den sie *senden würde*.
// - Echte Claude-Code-Ausführung passiert NUR, wenn
//     * `NOX_CLAUDE_CODE_BRIDGE_EXEC === '1'` UND
//     * der angefragte `workspacePath` exakt in
//       `NOX_CLAUDE_CODE_BRIDGE_ALLOWED_WORKSPACES` (semikolon-/`,`-
//       separiert) auftaucht UND
//     * der Pfad nicht auf eine System-Root zeigt.
// - Allowed-Origins-Liste ist hardcoded auf localhost-Vite plus
//   `NOX_CLAUDE_CODE_BRIDGE_ALLOWED_ORIGINS` (Komma-getrennt).
// - Schreibt ein Append-Only-Log nach `<homedir>/.nox-claude-bridge.log`.
//   Loggt KEINE Prompts roh — nur einen FNV-1a-Hash + Längen.
//
// AUFRUF
// ======
//   node scripts/nox-claude-code-bridge.mjs
//   node scripts/nox-claude-code-bridge.mjs --help
//   node scripts/nox-claude-code-bridge.mjs --port 8799
//
// ENDPOINTS
// =========
//   GET  /health
//   POST /claude-code/message
//
// EXIT-CODES
// ==========
//   0 — normaler Stop (SIGINT)
//   1 — Bind-Fehler / falsche Args

import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

/* ============================================================================
 * Constants
 * ============================================================================
 */

const BRIDGE_VERSION = '0.1.0';
const DEFAULT_PORT = 8799;
const DEFAULT_HOST = '127.0.0.1';
const LOG_FILE = path.join(os.homedir(), '.nox-claude-bridge.log');

const ALLOWED_MODES = new Set(['ask', 'code_task', 'plan']);

const FORBIDDEN_SUBSTRINGS = [
  'place_trade',
  'submit_broker_order',
  'live_patch_n8n',
  'production_8788',
  'dump_env',
  'reveal_secret',
  'reveal_api_key',
];

const SYSTEM_ROOTS = ['/', '/usr', '/etc', '/System', 'C:\\Windows', 'C:\\Program Files'];

/* ============================================================================
 * CLI args
 * ============================================================================
 */

function parseArgs(argv) {
  const args = { port: DEFAULT_PORT, host: DEFAULT_HOST, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--port' && argv[i + 1]) {
      const n = Number.parseInt(argv[i + 1], 10);
      if (Number.isFinite(n) && n > 0) args.port = n;
      i++;
    } else if (a === '--host' && argv[i + 1]) {
      args.host = argv[i + 1];
      i++;
    }
  }
  return args;
}

function printHelp() {
  process.stdout.write(`NOX Claude Code Bridge v${BRIDGE_VERSION}\n\n` +
`Lokaler Loopback-Server für das NOX Operator Cockpit.\n` +
`Default: Dry-Run. Keine Claude-Aufrufe ohne explizites Opt-in.\n\n` +
`Aufruf:\n` +
`  node scripts/nox-claude-code-bridge.mjs [--port 8799] [--host 127.0.0.1]\n\n` +
`Endpoints:\n` +
`  GET  /health\n` +
`  POST /claude-code/message\n\n` +
`Environment:\n` +
`  NOX_CLAUDE_CODE_BRIDGE_EXEC=1           Echte 'claude -p' Aufrufe erlauben.\n` +
`  NOX_CLAUDE_CODE_BRIDGE_ALLOWED_WORKSPACES=/abs/path1;/abs/path2\n` +
`                                           Allowlist erlaubter Workspaces.\n` +
`  NOX_CLAUDE_CODE_BRIDGE_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173\n` +
`                                           Zusätzliche CORS-Origins.\n` +
`  NOX_CLAUDE_CODE_BRIDGE_CLI=claude        CLI-Binary (Default: 'claude').\n\n` +
`Sicherheit:\n` +
`  - Bindet nur auf Loopback.\n` +
`  - Schreibt keinen Roh-Prompt ins Log; nur Hash + Länge.\n` +
`  - Keine Anthropic-API. Keine Secrets. Keine Token-Reads.\n`);
}

/* ============================================================================
 * Utilities
 * ============================================================================
 */

function nowIso() {
  return new Date().toISOString();
}

function fnv1aHex(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function logAppend(record) {
  try {
    const line = JSON.stringify({ ts: nowIso(), ...record }) + '\n';
    fs.appendFileSync(LOG_FILE, line);
  } catch {
    // Logging-Ausfall darf den Service nicht killen.
  }
}

function readAllowedWorkspaces() {
  const raw = (process.env.NOX_CLAUDE_CODE_BRIDGE_ALLOWED_WORKSPACES ?? '').trim();
  if (raw.length === 0) return [];
  return raw
    .split(/[;,]/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => path.resolve(p));
}

function readAllowedOrigins() {
  const baseline = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]);
  const raw = (process.env.NOX_CLAUDE_CODE_BRIDGE_ALLOWED_ORIGINS ?? '').trim();
  if (raw.length > 0) {
    raw.split(',').map((o) => o.trim()).filter((o) => o.length > 0).forEach((o) => baseline.add(o));
  }
  return baseline;
}

function execEnabled() {
  return (process.env.NOX_CLAUDE_CODE_BRIDGE_EXEC ?? '').trim() === '1';
}

function claudeCliBinary() {
  const raw = (process.env.NOX_CLAUDE_CODE_BRIDGE_CLI ?? '').trim();
  return raw.length > 0 ? raw : 'claude';
}

function detectClaudeCli() {
  // Sync detection. Probiert `claude --version`. Wir prüfen NICHT mit
  // `which/where` weil das plattformabhängig ist; spawnSync mit -v
  // funktioniert überall, wo `claude` im PATH oder über die Env-
  // Variable angegeben ist.
  try {
    const r = spawnSync(claudeCliBinary(), ['--version'], { timeout: 3000 });
    if (r.status === 0) return 'detected';
    return 'missing';
  } catch {
    return 'missing';
  }
}

function isUnderSystemRoot(absPath) {
  const lowered = absPath.toLowerCase();
  return SYSTEM_ROOTS.some((root) => {
    const r = root.toLowerCase();
    // Wir wollen blocken, wenn der Pfad genau gleich Root ist oder
    // direkt darunter, OHNE Unterverzeichnis-Workspace-Match.
    if (lowered === r) return true;
    if (r === '/' && lowered.startsWith('/')) {
      // Spezialfall Unix-Root: blocke wenn Pfad in '/usr', '/etc', '/System'
      // — die werden ohnehin oben gematcht. '/' allein matchen wir nur,
      // wenn der workspacePath buchstäblich '/' ist.
      return lowered === '/';
    }
    return lowered.startsWith(r + path.sep.toLowerCase());
  });
}

function isWorkspaceAllowed(workspacePath, allowList) {
  if (!workspacePath || typeof workspacePath !== 'string') return false;
  const abs = path.resolve(workspacePath);
  if (isUnderSystemRoot(abs)) return false;
  return allowList.includes(abs);
}

function looksForbidden(text) {
  const lower = String(text ?? '').toLowerCase();
  return FORBIDDEN_SUBSTRINGS.some((needle) => lower.includes(needle));
}

function buildPrompt(body) {
  const lines = [
    `# NOX Cockpit Message`,
    `projectId: ${body.projectId}`,
    body.context?.projectName ? `projectName: ${body.context.projectName}` : '',
    body.context?.projectGoal ? `projektZiel: ${String(body.context.projectGoal).slice(0, 1000)}` : '',
    `mode: ${body.mode ?? 'ask'}`,
    '',
    '## Operator-Nachricht',
    String(body.message ?? '').slice(0, 4000),
    '',
    '## Constraints',
    '- Kein Live-Trading.',
    '- Keine Secrets ausgeben.',
    '- Keine n8n-Live-Patches ohne Snapshot.',
    '- Notion-Writes nur über den NOX-Server-Pfad (/plan/commit) mit allen Gates.',
  ].filter((l) => l !== '');
  return lines.join('\n');
}

/* ============================================================================
 * HTTP helpers
 * ============================================================================
 */

function sendJson(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

function corsHeadersFor(origin, allowedOrigins) {
  if (origin && allowedOrigins.has(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '600',
      Vary: 'Origin',
    };
  }
  return {};
}

async function readJsonBody(req, max = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let received = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      received += chunk.length;
      if (received > max) {
        reject(new Error('payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (raw.length === 0) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('invalid json'));
      }
    });
    req.on('error', reject);
  });
}

/* ============================================================================
 * Handlers
 * ============================================================================
 */

function handleHealth(req, res, allowedOrigins) {
  const origin = req.headers.origin;
  const cors = corsHeadersFor(origin, allowedOrigins);
  const exec = execEnabled();
  const cli = detectClaudeCli();
  const body = {
    ok: true,
    bridgeVersion: BRIDGE_VERSION,
    claudeCli: cli,
    exec,
  };
  sendJson(res, 200, body, cors);
}

async function handleClaudeCodeMessage(req, res, allowedOrigins, allowedWorkspaces) {
  const origin = req.headers.origin;
  const cors = corsHeadersFor(origin, allowedOrigins);

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    sendJson(res, 400, { error: 'bad_request', message: err.message }, cors);
    return;
  }

  if (typeof body !== 'object' || body === null) {
    sendJson(res, 400, { error: 'bad_request', message: 'JSON body required' }, cors);
    return;
  }

  const projectId = String(body.projectId ?? '').trim();
  const message = String(body.message ?? '').trim();
  const workspacePath = String(body.workspacePath ?? '').trim();
  const mode = ALLOWED_MODES.has(body.mode) ? body.mode : 'ask';

  if (!projectId || !message || !workspacePath) {
    sendJson(res, 400, { error: 'bad_request', message: 'projectId/message/workspacePath sind Pflicht.' }, cors);
    return;
  }

  // Forbidden-Pattern Check, BEVOR irgendetwas weiter passiert.
  if (looksForbidden(message) || looksForbidden(workspacePath)) {
    const promptHash = fnv1aHex(message);
    logAppend({ event: 'blocked', reason: 'forbidden_substring', projectId, mode, promptHash, workspacePath: '[blocked]' });
    sendJson(
      res,
      200,
      {
        status: 'blocked',
        reply:
          'Anfrage abgelehnt: enthält ein Muster aus der Forbidden-Liste ' +
          '(Live-Trading, Broker-Order, n8n-Live-Patch, Secrets, Prod-8788).',
        riskFlags: ['forbidden_substring'],
        suggestedActions: [],
      },
      cors,
    );
    return;
  }

  // Workspace-Allowlist.
  if (!isWorkspaceAllowed(workspacePath, allowedWorkspaces)) {
    logAppend({ event: 'blocked', reason: 'workspace_not_allowed', projectId, mode, workspacePath: '[blocked]' });
    sendJson(
      res,
      200,
      {
        status: 'blocked',
        reply:
          'Workspace ist nicht in NOX_CLAUDE_CODE_BRIDGE_ALLOWED_WORKSPACES eingetragen ' +
          'oder zeigt auf einen System-Pfad. Bridge führt Claude Code nicht aus.',
        riskFlags: ['workspace_not_allowed'],
        suggestedActions: [],
      },
      cors,
    );
    return;
  }

  const prompt = buildPrompt({ projectId, message, mode, context: body.context ?? {} });
  const promptHash = fnv1aHex(prompt);
  const exec = execEnabled();
  const cli = detectClaudeCli();

  // Dry-Run-Pfad: Default. Wir antworten mit dem Prompt-Hash + einer
  // strukturierten Vorschau, OHNE `claude` aufzurufen.
  if (!exec) {
    logAppend({ event: 'dry_run', projectId, mode, promptHash, workspacePath, cli });
    sendJson(
      res,
      200,
      {
        status: 'dry_run',
        reply:
          'Dry-Run. Bridge hat den Prompt vorbereitet, aber Claude Code nicht aufgerufen. ' +
          'Setze NOX_CLAUDE_CODE_BRIDGE_EXEC=1, um den Aufruf zu erlauben.',
        rawTail: `prompt_hash=${promptHash} chars=${prompt.length}`,
        sessionId: null,
        riskFlags: [],
        suggestedActions: [
          { label: 'Bridge in Exec-Mode neu starten', kind: 'shell_hint' },
        ],
      },
      cors,
    );
    return;
  }

  // Exec-Pfad. CLI muss erkannt sein, sonst lieber blocken als crashen.
  if (cli === 'missing') {
    logAppend({ event: 'blocked', reason: 'cli_missing', projectId, mode, promptHash });
    sendJson(
      res,
      200,
      {
        status: 'blocked',
        reply:
          'Bridge im Exec-Mode, aber das Claude-Code-CLI ist nicht im PATH. ' +
          'Installiere es z. B. mit `npm i -g @anthropic-ai/claude-code` oder setze NOX_CLAUDE_CODE_BRIDGE_CLI.',
        riskFlags: ['cli_missing'],
        suggestedActions: [{ label: 'CLI installieren', kind: 'shell_hint' }],
      },
      cors,
    );
    return;
  }

  // Tatsächlicher Aufruf. Wir nutzen `claude -p` (One-Shot). Output:
  // wir lesen stdout/stderr und schneiden auf 8 KB ab. Timeout: 25s.
  // ACHTUNG: Dieser Pfad ist absichtlich KONSERVATIV — keine
  // Pipe-Verkettung, keine Shell-Interpretation. Wir übergeben den
  // Prompt als Argument; Process-Args sind sicher.
  const child = spawn(claudeCliBinary(), ['-p', prompt, '--output-format', 'text'], {
    cwd: path.resolve(workspacePath),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  const STDOUT_MAX = 8 * 1024;
  child.stdout.on('data', (b) => {
    if (stdout.length < STDOUT_MAX) stdout += b.toString('utf8');
  });
  child.stderr.on('data', (b) => {
    if (stderr.length < STDOUT_MAX) stderr += b.toString('utf8');
  });

  const timer = setTimeout(() => {
    child.kill('SIGTERM');
  }, 25_000);

  const exitCode = await new Promise((resolve) => {
    child.on('close', (code) => resolve(code));
  });
  clearTimeout(timer);

  const rawTail = (stdout || stderr).slice(-2000);
  const stdoutHash = fnv1aHex(stdout);

  logAppend({
    event: exitCode === 0 ? 'exec_ok' : 'exec_fail',
    projectId,
    mode,
    promptHash,
    workspacePath,
    exitCode,
    stdoutTailHash: stdoutHash,
  });

  if (exitCode === 0) {
    sendJson(
      res,
      200,
      {
        status: 'ok',
        reply: stdout.trim().length > 0 ? stdout.trim() : '(Claude Code lieferte keinen Text)',
        rawTail,
        sessionId: null,
        riskFlags: [],
        suggestedActions: [],
      },
      cors,
    );
  } else {
    sendJson(
      res,
      200,
      {
        status: 'error',
        reply: `Claude Code Exit-Code ${exitCode}. stderr-Tail siehe rawTail.`,
        rawTail,
        sessionId: null,
        riskFlags: ['cli_nonzero_exit'],
        suggestedActions: [],
      },
      cors,
    );
  }
}

/* ============================================================================
 * Server
 * ============================================================================
 */

function startServer(args) {
  const allowedOrigins = readAllowedOrigins();
  const allowedWorkspaces = readAllowedWorkspaces();

  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;

    // Preflight
    if (req.method === 'OPTIONS') {
      const cors = corsHeadersFor(origin, allowedOrigins);
      res.writeHead(204, cors);
      res.end();
      return;
    }

    if (req.url === '/health' && req.method === 'GET') {
      return handleHealth(req, res, allowedOrigins);
    }
    if (req.url === '/claude-code/message' && req.method === 'POST') {
      return handleClaudeCodeMessage(req, res, allowedOrigins, allowedWorkspaces);
    }

    sendJson(res, 404, { error: 'not_found', message: `${req.method} ${req.url}` });
  });

  server.listen(args.port, args.host, () => {
    process.stdout.write(
      `[nox-claude-bridge] listening on http://${args.host}:${args.port}\n` +
      `  exec mode: ${execEnabled() ? 'ON (real claude -p calls allowed)' : 'OFF (dry-run)'}\n` +
      `  allowed workspaces: ${allowedWorkspaces.length === 0 ? '(none — every workspace blocked)' : allowedWorkspaces.join(', ')}\n` +
      `  allowed origins: ${Array.from(allowedOrigins).join(', ')}\n` +
      `  log: ${LOG_FILE}\n`,
    );
  });

  server.on('error', (err) => {
    process.stderr.write(`[nox-claude-bridge] server error: ${err.message}\n`);
    process.exit(1);
  });

  // Graceful shutdown
  const stop = () => {
    process.stdout.write(`\n[nox-claude-bridge] shutting down\n`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

/* ============================================================================
 * Entrypoint
 * ============================================================================
 */

const args = parseArgs(process.argv);
if (args.help) {
  printHelp();
  process.exit(0);
}
startServer(args);
