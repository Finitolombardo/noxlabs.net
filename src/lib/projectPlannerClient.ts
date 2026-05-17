// Phase 2A — Browser client for /api/operator/projects/:projectId/plan/preview.
// Phase 2A/2B — Optional Operator API key.
//
// Same-origin only. No Notion direct calls. No writes. When supplied, the
// Operator API key is passed in *exclusively* via the `apiKey` argument
// coming from the React component's in-memory state — never read from
// localStorage, sessionStorage, cookies, env, or any persistence layer.
//
// `apiKey` is OPTIONAL: when the server is configured with
// NOX_OPERATOR_COCKPIT_PRIVATE_MODE=true, the read-only Preview/Validate
// endpoints accept requests without the `x-nox-operator-key` header. The
// browser still calls those endpoints over same-origin fetch; nothing
// secret lives in the bundle.
//
// The endpoints are read-only: they echo a normalised version of the draft
// plus a deterministic digest, and (for /validate) a Notion schema-read
// report. They do not write to Notion and do not persist anything beyond
// the in-memory audit ring buffer.

import type {
  PlanPreviewResponseWire,
  PlanValidationReportWire,
  ProjectPlanDraftRequest,
} from '../types/projectPlanner';
import type { OperatorApiErrorBody } from '../types/operatorContext';

const ENDPOINT_BASE = '/api/operator/projects';

export type PlanPreviewResult =
  | {
      ok: true;
      status: number;
      data: PlanPreviewResponseWire;
    }
  | {
      ok: false;
      status: number;
      errorCode?: string;
      errorMessage?: string;
      raw?: unknown;
    };

export interface FetchPlanPreviewArgs {
  projectId: string;
  /**
   * Optional Operator API key. Only sent as `x-nox-operator-key` when
   * present. Leave undefined / empty when the server is in
   * `private_cockpit_readonly` mode.
   */
  apiKey?: string;
  draft: ProjectPlanDraftRequest;
  signal?: AbortSignal;
}

// Shared header builder. `Content-Type`/`Accept` are constant; the operator
// key header is only added when a non-empty trimmed key is supplied. We never
// emit an empty `x-nox-operator-key` header — the server treats missing and
// empty identically, but cleaner outbound headers keep the network panel
// honest.
function buildPlannerHeaders(apiKey: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (typeof apiKey === 'string') {
    const trimmed = apiKey.trim();
    if (trimmed.length > 0) {
      headers['x-nox-operator-key'] = trimmed;
    }
  }
  return headers;
}

export async function fetchPlanPreview(
  args: FetchPlanPreviewArgs,
): Promise<PlanPreviewResult> {
  const trimmedProjectId = args.projectId.trim();

  if (!trimmedProjectId) {
    return {
      ok: false,
      status: 0,
      errorCode: 'client_validation',
      errorMessage: 'Project ID darf nicht leer sein.',
    };
  }
  if (!args.draft.projectGoal.trim()) {
    return {
      ok: false,
      status: 0,
      errorCode: 'client_validation',
      errorMessage: 'Projektziel darf nicht leer sein.',
    };
  }
  if (args.draft.planSteps.length === 0) {
    return {
      ok: false,
      status: 0,
      errorCode: 'client_validation',
      errorMessage: 'Mindestens ein Plan-Schritt erforderlich.',
    };
  }

  const url = `${ENDPOINT_BASE}/${encodeURIComponent(trimmedProjectId)}/plan/preview`;

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: buildPlannerHeaders(args.apiKey),
      cache: 'no-store',
      signal: args.signal,
      body: JSON.stringify(args.draft),
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      errorCode: aborted ? 'aborted' : 'network_error',
      errorMessage: aborted
        ? 'Anfrage abgebrochen.'
        : 'Netzwerkfehler beim Aufruf der Plan-Preview.',
    };
  }

  let body: unknown = null;
  try {
    body = await resp.json();
  } catch {
    // Non-JSON body — fall through to status-only handling.
  }

  if (resp.ok) {
    if (body && typeof body === 'object') {
      return { ok: true, status: resp.status, data: body as PlanPreviewResponseWire };
    }
    return {
      ok: false,
      status: resp.status,
      errorCode: 'invalid_response',
      errorMessage: 'Antwort enthielt keinen verwertbaren JSON-Body.',
    };
  }

  if (body && typeof body === 'object') {
    const env = body as Partial<OperatorApiErrorBody>;
    return {
      ok: false,
      status: resp.status,
      errorCode: typeof env.error === 'string' ? env.error : undefined,
      errorMessage: typeof env.message === 'string' ? env.message : undefined,
      raw: body,
    };
  }
  return { ok: false, status: resp.status };
}

// Phase 2B — Schema validation call. Same payload as preview, but the
// server additionally reads the live Notion schema (read-only) and
// returns a PlanValidationReport. No Notion writes happen on this path.
export type PlanValidateResult =
  | {
      ok: true;
      status: number;
      data: PlanValidationReportWire;
    }
  | {
      ok: false;
      status: number;
      errorCode?: string;
      errorMessage?: string;
      raw?: unknown;
    };

export interface FetchPlanValidateArgs {
  projectId: string;
  /** Optional Operator API key — see {@link FetchPlanPreviewArgs.apiKey}. */
  apiKey?: string;
  draft: ProjectPlanDraftRequest;
  signal?: AbortSignal;
}

export async function fetchPlanValidate(
  args: FetchPlanValidateArgs,
): Promise<PlanValidateResult> {
  const trimmedProjectId = args.projectId.trim();

  if (!trimmedProjectId) {
    return {
      ok: false,
      status: 0,
      errorCode: 'client_validation',
      errorMessage: 'Project ID darf nicht leer sein.',
    };
  }
  if (!args.draft.projectGoal.trim()) {
    return {
      ok: false,
      status: 0,
      errorCode: 'client_validation',
      errorMessage: 'Projektziel darf nicht leer sein.',
    };
  }
  if (args.draft.planSteps.length === 0) {
    return {
      ok: false,
      status: 0,
      errorCode: 'client_validation',
      errorMessage: 'Mindestens ein Plan-Schritt erforderlich.',
    };
  }

  const url = `${ENDPOINT_BASE}/${encodeURIComponent(trimmedProjectId)}/plan/validate`;

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: buildPlannerHeaders(args.apiKey),
      cache: 'no-store',
      signal: args.signal,
      body: JSON.stringify(args.draft),
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      errorCode: aborted ? 'aborted' : 'network_error',
      errorMessage: aborted
        ? 'Anfrage abgebrochen.'
        : 'Netzwerkfehler beim Aufruf der Schema-Validierung.',
    };
  }

  let body: unknown = null;
  try {
    body = await resp.json();
  } catch {
    // Non-JSON body — fall through to status-only handling.
  }

  if (resp.ok) {
    if (body && typeof body === 'object') {
      return { ok: true, status: resp.status, data: body as PlanValidationReportWire };
    }
    return {
      ok: false,
      status: resp.status,
      errorCode: 'invalid_response',
      errorMessage: 'Antwort enthielt keinen verwertbaren JSON-Body.',
    };
  }

  if (body && typeof body === 'object') {
    const env = body as Partial<OperatorApiErrorBody>;
    return {
      ok: false,
      status: resp.status,
      errorCode: typeof env.error === 'string' ? env.error : undefined,
      errorMessage: typeof env.message === 'string' ? env.message : undefined,
      raw: body,
    };
  }
  return { ok: false, status: resp.status };
}

// Build a stable per-click idempotencyKey on the browser side. Phase 2A
// does not persist this key server-side, but enforces the same format
// regex Phase 2B/2C will use. Length stays within 4..128.
export function generatePreviewIdempotencyKey(prefix = 'plan-preview'): string {
  const stamp = Date.now().toString(36);
  let rand = '';
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(2);
    crypto.getRandomValues(arr);
    rand = `${arr[0].toString(36)}-${arr[1].toString(36)}`;
  } else {
    rand = `${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`;
  }
  const candidate = `${prefix}_${stamp}_${rand}`.replace(/[^A-Za-z0-9_:.-]/g, '-');
  // 4..128 chars
  return candidate.slice(0, 120);
}
