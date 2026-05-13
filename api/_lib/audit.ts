// APP-X-BRIDGE-03 — Minimal audit log for operator API events.
//
// Skeleton only. Process-local ring buffer (max 200 events); resets on every
// Vercel cold start. Different serverless instances do NOT share state.
//
// Persistence-layer expectations (TODO for real integration):
//   - Replace `ring` with a real append-only store (Vercel KV / Postgres /
//     Supabase) plus an index by route / commandId / clientKeyLabel.
//   - Add per-user identity once Phase 2 ships real auth.
//   - Add retention policy + scrub for older than N days.
//
// Privacy rules enforced here (callers must follow them too):
//   - No raw IPs. Use the keyLabel produced by rateLimit.ts.
//   - No request bodies. Only commandId, action, and a short summary.
//   - No secrets. The configured operator key is never read by this file.

export type AuditEventType =
  | 'COMMAND_CREATE_ATTEMPT'
  | 'COMMAND_CREATED'
  | 'COMMAND_LIST'
  | 'COMMAND_READ'
  | 'COMMAND_ACTION_ATTEMPT'
  | 'COMMAND_DRY_RUN'
  | 'COMMAND_APPROVAL_REQUESTED'
  | 'COMMAND_APPROVED'
  | 'COMMAND_REJECTED'
  | 'COMMAND_EXECUTE_BLOCKED'
  | 'AUTH_NOT_CONFIGURED'
  | 'AUTH_FAILED'
  | 'RATE_LIMITED'
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'AUDIT_LIST'
  | 'PROJECT_CONTEXT_READ_ATTEMPT'
  | 'PROJECT_CONTEXT_READ'
  | 'PROJECT_CONTEXT_NOT_CONFIGURED'
  | 'PROJECT_CONTEXT_VALIDATION_FAILED'
  | 'PROJECT_CONTEXT_UPSTREAM_FAILED';

export type AuditOutcome = 'success' | 'attempt' | 'blocked' | 'failure';

export interface AuditEventInput {
  eventType: AuditEventType;
  route: string;
  method: string;
  outcome: AuditOutcome;
  clientKeyLabel: string;
  statusCode?: number;
  commandId?: string;
  action?: string;
  detailsSummary?: string;
}

export interface AuditEvent extends AuditEventInput {
  id: string;
  timestamp: string;
}

const MAX_EVENTS = 200;
const ring: AuditEvent[] = [];
let counter = 0;

export function appendAuditEvent(input: AuditEventInput): AuditEvent {
  counter += 1;
  const event: AuditEvent = {
    ...input,
    id: `AUD-${Date.now().toString(36).toUpperCase()}-${counter.toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
  };
  ring.push(event);
  if (ring.length > MAX_EVENTS) {
    ring.splice(0, ring.length - MAX_EVENTS);
  }
  return event;
}

export function listAuditEvents(limit?: number): AuditEvent[] {
  // Newest first. Defensive copy so callers can't mutate the ring.
  const reversed: AuditEvent[] = [];
  for (let i = ring.length - 1; i >= 0; i--) {
    reversed.push(ring[i] as AuditEvent);
  }
  if (typeof limit === 'number' && limit > 0 && limit < reversed.length) {
    return reversed.slice(0, limit);
  }
  return reversed;
}

export function getAuditBufferStats(): { count: number; max: number } {
  return { count: ring.length, max: MAX_EVENTS };
}
