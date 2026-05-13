// APP-X-BRIDGE-01 — Minimal Vercel-compatible handler types.
// Avoids pulling @vercel/node as a hard dependency. Compatible with the
// runtime objects Vercel injects into Node serverless functions.

import type { ApiErrorBody } from './types.js';

export interface ApiRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query: Record<string, string | string[] | undefined>;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string | string[]): void;
  json(body: unknown): ApiResponse;
  end(body?: string): void;
}

export type ApiHandler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void;

export function methodAllowed(req: ApiRequest, res: ApiResponse, allowed: readonly string[]): boolean {
  if (!req.method || !allowed.includes(req.method)) {
    res.setHeader('Allow', allowed.join(', '));
    sendError(res, 405, 'method_not_allowed', `Allowed: ${allowed.join(', ')}.`);
    return false;
  }
  return true;
}

export function sendError(res: ApiResponse, status: number, code: string, message: string, details?: unknown): void {
  const body: ApiErrorBody = { error: code, message };
  if (details !== undefined) body.details = details;
  res.status(status).json(body);
}

export function badRequest(res: ApiResponse, message: string, details?: unknown): void {
  sendError(res, 400, 'bad_request', message, details);
}

export function notFound(res: ApiResponse, message: string): void {
  sendError(res, 404, 'not_found', message);
}

export function locked(res: ApiResponse, message: string): void {
  sendError(res, 423, 'locked', message);
}

export function tooManyRequests(res: ApiResponse, retryAfterSec: number, message: string): void {
  res.setHeader('Retry-After', String(Math.max(1, Math.floor(retryAfterSec))));
  sendError(res, 429, 'rate_limited', message);
}

export function readBodyAsObject(req: ApiRequest): Record<string, unknown> {
  const b = req.body;
  if (b && typeof b === 'object' && !Array.isArray(b)) {
    return b as Record<string, unknown>;
  }
  return {};
}

export function readQueryString(req: ApiRequest, key: string): string | undefined {
  const v = req.query[key];
  if (Array.isArray(v)) return v[0];
  if (typeof v === 'string') return v;
  return undefined;
}
