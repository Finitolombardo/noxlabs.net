// APP-X-BRIDGE-02 — Operator API auth gate.
//
// Server-side only. The configured secret is never written to logs, responses,
// or error details. This module is NOT a user/session login — it is a single
// shared static key that keeps the skeleton inert in production until the
// operator explicitly sets it.
//
// Behaviour summary:
//   - NOX_OPERATOR_API_KEY unset/empty -> 503 service_unavailable
//   - Header missing or wrong          -> 401 unauthorized
//   - Header matches                   -> returns true (request may proceed)
//
// Accepted headers (case-insensitive, primary wins):
//   - `x-nox-operator-key: <secret>`
//   - `Authorization: Bearer <secret>`

import type { ApiRequest, ApiResponse } from './handler.js';
import { sendError } from './handler.js';

const HEADER_PRIMARY = 'x-nox-operator-key';
const HEADER_BEARER = 'authorization';

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
 * Gate every /api/operator/* endpoint. Returns true when the request may
 * proceed; otherwise the response has already been ended and the caller MUST
 * return immediately.
 */
export function requireOperatorAuth(req: ApiRequest, res: ApiResponse): boolean {
  const configured = (process.env.NOX_OPERATOR_API_KEY ?? '').trim();
  if (configured.length === 0) {
    sendError(
      res,
      503,
      'service_unavailable',
      'Operator API is not configured. Set NOX_OPERATOR_API_KEY server-side.',
    );
    return false;
  }

  const presented = extractPresentedKey(req);
  if (!presented) {
    sendError(res, 401, 'unauthorized', 'Unauthorized operator API request.');
    return false;
  }

  if (!constantTimeEqual(presented, configured)) {
    sendError(res, 401, 'unauthorized', 'Unauthorized operator API request.');
    return false;
  }

  return true;
}
