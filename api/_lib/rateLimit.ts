// APP-X-BRIDGE-03 — In-memory sliding-window rate limit for /api/operator/*.
//
// Skeleton only. Process-local Map; resets on every Vercel cold start.
// Different serverless instances do NOT share state — this only throttles
// repeated calls hitting the same warm function instance. For real
// production limits, replace with Upstash / Vercel KV / Cloudflare.
//
// Design notes:
//   - Client key derives from `x-forwarded-for[0]` (the original client
//     when behind Vercel's edge), falling back to `x-real-ip`, then
//     'unknown'. We never store the raw IP in any response or audit body;
//     we only expose a non-reversible hex label.
//   - 60 requests per 60-second sliding window per client key.
//   - On rejection: 429 with JSON body `{error:"rate_limited", message}`
//     plus a `Retry-After` header.

import type { ApiRequest, ApiResponse } from './handler.js';
import { tooManyRequests } from './handler.js';

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;

const buckets = new Map<string, number[]>();

export interface RateLimitOk {
  ok: true;
  keyLabel: string;
}

export interface RateLimitBlocked {
  ok: false;
  keyLabel: string;
  retryAfterSec: number;
}

export type RateLimitResult = RateLimitOk | RateLimitBlocked;

function readHeader(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  if (typeof v === 'string') return v;
  return undefined;
}

function pickFirstIp(forwarded: string | undefined): string | undefined {
  if (!forwarded) return undefined;
  const first = forwarded.split(',')[0]?.trim();
  return first && first.length > 0 ? first : undefined;
}

// 32-bit FNV-1a -> 8-char hex. Stable label without storing raw IPs.
function fnv1aHashLabel(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function clientKeyFor(req: ApiRequest): { key: string; label: string } {
  const xff = pickFirstIp(readHeader(req.headers['x-forwarded-for']));
  const real = readHeader(req.headers['x-real-ip']);
  const raw = xff ?? real ?? 'unknown';
  return { key: raw, label: fnv1aHashLabel(raw) };
}

/**
 * Pure check — no response side-effects. Call this BEFORE auth so that
 * even unauthenticated spam gets throttled in-process.
 */
export function checkRateLimit(req: ApiRequest): RateLimitResult {
  const { key, label } = clientKeyFor(req);
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  let arr = buckets.get(key);
  if (!arr) {
    arr = [];
    buckets.set(key, arr);
  }
  // Drop entries older than the window.
  while (arr.length > 0 && (arr[0] ?? 0) <= cutoff) {
    arr.shift();
  }
  if (arr.length >= MAX_PER_WINDOW) {
    const oldest = arr[0] ?? now;
    const retryAfter = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
    return { ok: false, keyLabel: label, retryAfterSec: retryAfter };
  }
  arr.push(now);
  return { ok: true, keyLabel: label };
}

export function respondRateLimited(res: ApiResponse, r: RateLimitBlocked): void {
  tooManyRequests(res, r.retryAfterSec, 'Too many operator API requests. Try again later.');
}
