// APP-X-BRIDGE-02 — Operator API auth gate.
// APP-X-BRIDGE-03 — Split into pure check + response helper so callers can
// audit before responding.
//
// Server-side only. The configured secret is never written to logs, responses,
// or error details. This module is NOT a user/session login — it is a single
// shared static key that keeps the skeleton inert in production until the
// operator explicitly sets it.
//
// Behaviour summary:
//   - NOX_OPERATOR_API_KEY unset/empty -> 503 service_unavailable, reason: not_configured
//   - Header missing or wrong          -> 401 unauthorized,         reason: unauthorized
//   - Header matches                   -> { ok: true }
//
// Accepted headers (case-insensitive, primary wins):
//   - `x-nox-operator-key: <secret>`
//   - `Authorization: Bearer <secret>`

import type { ApiRequest, ApiResponse } from './handler.js';
import { sendError } from './handler.js';

const HEADER_PRIMARY = 'x-nox-operator-key';
const HEADER_BEARER = 'authorization';

export type AuthFailure =
  | { ok: false; statusCode: 503; reason: 'not_configured' }
  | { ok: false; statusCode: 401; reason: 'unauthorized' };

export type AuthResult = { ok: true } | AuthFailure;

function readHeader(req: ApiRequest, name: string): string | undefined {
  const v = req.headers[name];
  if (Array.isArray(v)) return v[0];
  if (typeof v === 'string') return v;
  return undefined;
}

function extractPresentedKey(req: ApiRequest): string | undefined {
  const primary = readHeader(req, HEADER_PRIMARY);
  if (typeof primary === 'string' && primary.trim().length > 0) {
    return primary.trim();
  }
  const auth = readHeader(req, HEADER_BEARER);
  if (typeof auth === 'string' && /^Bearer\s+/i.test(auth)) {
    return auth.replace(/^Bearer\s+/i, '').trim();
  }
  return undefined;
}

// Constant-time string compare. Pure ECMAScript, no Node-only types required.
// Iterates the longer length to keep timing independent of the inputs.
function constantTimeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    const x = i < a.length ? a.charCodeAt(i) : 0;
    const y = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= x ^ y;
  }
  return mismatch === 0;
}

/**
 * Pure check — no response side-effects. Use this when you need to audit
 * before sending the response.
 */
export function checkOperatorAuth(req: ApiRequest): AuthResult {
  const configured = (process.env.NOX_OPERATOR_API_KEY ?? '').trim();
  if (configured.length === 0) {
    return { ok: false, statusCode: 503, reason: 'not_configured' };
  }
  const presented = extractPresentedKey(req);
  if (!presented || !constantTimeEqual(presented, configured)) {
    return { ok: false, statusCode: 401, reason: 'unauthorized' };
  }
  return { ok: true };
}

/**
 * Write the standard auth-failure response. The configured secret is never
 * referenced in the body or headers.
 */
export function respondAuthFailure(res: ApiResponse, failure: AuthFailure): void {
  if (failure.reason === 'not_configured') {
    sendError(
      res,
      503,
      'service_unavailable',
      'Operator API is not configured. Set NOX_OPERATOR_API_KEY server-side.',
    );
    return;
  }
  sendError(res, 401, 'unauthorized', 'Unauthorized operator API request.');
}

// =============================================================================
// Phase 2A/2B — Private-Cockpit read-only auth mode.
//
// SCOPE: This helper is intentionally NARROW. It is only consumed by the two
// read-only project-plan endpoints:
//   - POST /api/operator/projects/:projectId/plan/preview
//   - POST /api/operator/projects/:projectId/plan/validate
//
// It MUST NOT be used by:
//   - any write/command endpoint
//   - any dispatcher route
//   - any future Phase-2C commit path
//
// Behaviour:
//   - NOX_OPERATOR_COCKPIT_PRIVATE_MODE truthy + endpoint is in scope
//        -> request accepted without any header; authMode='private_cockpit_readonly'
//   - Otherwise: fall back to checkOperatorAuth() (unchanged write-grade gate);
//     on success authMode='operator_key'.
//
// The flag value is read once per request. We deliberately do NOT cache it —
// Vercel cold starts already amortise env reads, and re-reading per request
// keeps unit tests + local toggles trivial.
//
// SECURITY: The flag is server-side ONLY. It is never echoed back as the env
// name in any response or audit detail, never logged, and never exposed to the
// browser bundle.
// =============================================================================

export type PlannerAuthMode = 'operator_key' | 'private_cockpit_readonly';

export type PlannerAuthResult =
  | { ok: true; authMode: PlannerAuthMode }
  | AuthFailure;

const PRIVATE_MODE_TRUE_VALUES = new Set(['true', '1', 'yes', 'on']);

function isPrivateCockpitReadOnlyEnabled(): boolean {
  const raw = (process.env.NOX_OPERATOR_COCKPIT_PRIVATE_MODE ?? '').trim().toLowerCase();
  return PRIVATE_MODE_TRUE_VALUES.has(raw);
}

/**
 * Read-only-planner-scoped auth gate. Use ONLY for /plan/preview and
 * /plan/validate. Never wire this into a write or execute route.
 */
export function checkReadOnlyPlannerAuth(req: ApiRequest): PlannerAuthResult {
  if (isPrivateCockpitReadOnlyEnabled()) {
    return { ok: true, authMode: 'private_cockpit_readonly' };
  }
  const base = checkOperatorAuth(req);
  if (!base.ok) return base;
  return { ok: true, authMode: 'operator_key' };
}

// =============================================================================
// Phase 2D/2E — Private-Write planner auth mode.
//
// SCOPE: Used ONLY by `/api/operator/projects/:projectId/plan/commit`. Allows
// a single-cockpit-operator setup to omit the on-screen Operator-Key field
// and the explicit confirm-phrase WITHOUT weakening the write-side gates:
//
//   - Bypasses operator-key auth + commit-token/phrase gate when
//     `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE` is exactly "true".
//   - Does NOT bypass `NOX_NOTION_WRITE_ENABLED` — that flag still must be
//     "true" before any Notion write executes.
//   - Does NOT bypass the dedicated `NOX_NOTION_WRITE_TOKEN` requirement
//     (still must be set AND distinct from the read-only token).
//   - Does NOT bypass digest match, schema re-check, or idempotency
//     precheck.
//
// SECURITY POSTURE: This mode is meant for a privately-hosted Cockpit
// instance where the network boundary is the trust boundary. The web UI
// avoids surfacing any secret in the browser; the actual Notion write
// token never leaves the server.
// =============================================================================

export type WriteAuthMode = 'operator_key' | 'private_write_mode';
export type WriteAuthResult = { ok: true; authMode: WriteAuthMode } | AuthFailure;

function isPrivateWriteModeEnabled(): boolean {
  const raw = (process.env.NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE ?? '').trim().toLowerCase();
  return PRIVATE_MODE_TRUE_VALUES.has(raw);
}

/**
 * Phase 2D/2E write-side auth gate. Use ONLY for /plan/commit.
 *   - Flag on  → `{ ok: true, authMode: 'private_write_mode' }`
 *   - Flag off → fall back to `checkOperatorAuth` (operator key required).
 *
 * The caller decides what to do with each `authMode`. In `commit.ts` the
 * commit-token gate is intentionally skipped for `private_write_mode` —
 * the conscious flag is itself the explicit confirmation.
 */
export function checkPrivateWritePlannerAuth(req: ApiRequest): WriteAuthResult {
  if (isPrivateWriteModeEnabled()) {
    return { ok: true, authMode: 'private_write_mode' };
  }
  const base = checkOperatorAuth(req);
  if (!base.ok) return base;
  return { ok: true, authMode: 'operator_key' };
}
