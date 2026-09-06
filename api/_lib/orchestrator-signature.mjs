// Signing for calls into the NOX_WEB_ANFRAGE_ZENTRALE workflow.
//
// n8n writes every incoming webhook header into its execution data, and those
// executions are the whole point of routing through it. A static shared secret
// in a header would therefore be stored in readable form on every diagnosis.
//
// So the secret never travels. What travels is a timestamp and an HMAC over
// the action and that timestamp: bound to one action, valid for five minutes,
// and worthless once stored.

import { createHmac } from 'node:crypto';

export const SIGNATURE_WINDOW_MS = 300000;

/** Headers that authenticate one call to the orchestrator. */
export function signOrchestratorRequest(action, secret, now = Date.now()) {
  const ts = String(now);
  return {
    'x-nox-diag-ts': ts,
    'x-nox-diag-sig': createHmac('sha256', secret).update(`${action}:${ts}`).digest('hex'),
  };
}