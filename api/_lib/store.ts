// APP-X-BRIDGE-01 — In-memory command store.
// Skeleton only. Process-local Map; resets on every serverless cold start.
// Real implementation requires persistent storage with an audit log
// (Postgres / Supabase / KV) and an idempotency-key index.

import type { OperatorCommand } from './types.js';

const store: Map<string, OperatorCommand> = new Map();
let counter = 0;

export function nextCommandId(): string {
  counter += 1;
  return `CMD-${String(counter).padStart(3, '0')}`;
}

export function nextAuditId(prefix = 'AUD'): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1e6).toString(36).toUpperCase()}`;
}

export function saveCommand(c: OperatorCommand): OperatorCommand {
  store.set(c.id, c);
  return c;
}

export function getCommand(id: string): OperatorCommand | undefined {
  return store.get(id);
}

export function listCommands(): OperatorCommand[] {
  return Array.from(store.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
