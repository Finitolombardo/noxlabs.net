// APP-X-BRIDGE-01 — Input validation for skeleton endpoints.

import {
  ALLOWED_COMMAND_TYPES,
  ALLOWED_RISK_LEVELS,
  ALLOWED_ACTIONS,
  CommandType,
  RiskLevel,
  CommandAction,
} from './types.js';

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

export function isAllowedCommandType(x: unknown): x is CommandType {
  return typeof x === 'string' && (ALLOWED_COMMAND_TYPES as readonly string[]).includes(x);
}

export function isAllowedRiskLevel(x: unknown): x is RiskLevel {
  return typeof x === 'string' && (ALLOWED_RISK_LEVELS as readonly string[]).includes(x);
}

export function isAllowedAction(x: unknown): x is CommandAction {
  return typeof x === 'string' && (ALLOWED_ACTIONS as readonly string[]).includes(x);
}

export function requireString(v: unknown, field: string, max = 500): Validated<string> {
  if (typeof v !== 'string') return { ok: false, error: `Field '${field}' must be a string.` };
  const trimmed = v.trim();
  if (trimmed.length === 0) return { ok: false, error: `Field '${field}' must be non-empty.` };
  if (v.length > max) return { ok: false, error: `Field '${field}' exceeds ${max} chars.` };
  return { ok: true, value: trimmed };
}

export function optionalString(v: unknown, field: string, max = 500): Validated<string | undefined> {
  if (v === undefined || v === null) return { ok: true, value: undefined };
  const r = requireString(v, field, max);
  if (!r.ok) return r;
  return { ok: true, value: r.value };
}

export function optionalBoolean(v: unknown, field: string): Validated<boolean | undefined> {
  if (v === undefined || v === null) return { ok: true, value: undefined };
  if (typeof v !== 'boolean') return { ok: false, error: `Field '${field}' must be boolean.` };
  return { ok: true, value: v };
}

// Lightweight idempotency-key validation (printable, bounded). Real impl needs
// a persistent store keyed by this value.
export function optionalIdempotencyKey(v: unknown): Validated<string | undefined> {
  if (v === undefined || v === null) return { ok: true, value: undefined };
  if (typeof v !== 'string') return { ok: false, error: `Field 'idempotencyKey' must be a string.` };
  if (!/^[A-Za-z0-9_:.-]{4,128}$/.test(v)) return { ok: false, error: `Field 'idempotencyKey' must match /^[A-Za-z0-9_:.-]{4,128}$/.` };
  return { ok: true, value: v };
}
