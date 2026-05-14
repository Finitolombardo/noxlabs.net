// APP-X-BRIDGE-05a — Read-only client for /api/operator/projects/:projectId/context.
//
// Same-origin only. No Notion direct calls. No writes. The Operator API
// key is passed in *exclusively* via the `apiKey` argument coming from
// the React component's in-memory state — never read from localStorage,
// sessionStorage, cookies, env, or any persistence layer.
//
// The helper returns a structured result so the UI can render the
// authenticated-only diagnostic block (BRIDGE-04e) on 502.

import type {
  OperatorApiErrorBody,
  ProjectContextResponse,
} from '../types/operatorContext';

const ENDPOINT_BASE = '/api/operator/projects';

export type OperatorContextResult =
  | {
      ok: true;
      status: number;
      data: ProjectContextResponse;
    }
  | {
      ok: false;
      status: number;
      // Sanitized for UI surface — derived from the response body.
      // Never includes the request key, the Authorization header, or
      // any other client-side secret.
      errorCode?: string;
      errorMessage?: string;
      diagnostic?: OperatorApiErrorBody['diagnostic'];
      raw?: unknown;
    };

export interface FetchProjectContextArgs {
  projectId: string;
  apiKey: string;
  signal?: AbortSignal;
}

export async function fetchOperatorProjectContext(
  args: FetchProjectContextArgs,
): Promise<OperatorContextResult> {
  const trimmedProjectId = args.projectId.trim();
  const trimmedKey = args.apiKey.trim();

  if (!trimmedProjectId) {
    return {
      ok: false,
      status: 0,
      errorCode: 'client_validation',
      errorMessage: 'Project ID darf nicht leer sein.',
    };
  }
  if (!trimmedKey) {
    return {
      ok: false,
      status: 0,
      errorCode: 'client_validation',
      errorMessage: 'Operator API Key darf nicht leer sein.',
    };
  }

  const url = `${ENDPOINT_BASE}/${encodeURIComponent(trimmedProjectId)}/context`;

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: 'GET',
      headers: {
        'x-nox-operator-key': trimmedKey,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: args.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      errorCode: aborted ? 'aborted' : 'network_error',
      errorMessage: aborted
        ? 'Anfrage abgebrochen.'
        : 'Netzwerkfehler beim Laden des Kontexts.',
    };
  }

  let body: unknown = null;
  try {
    body = await resp.json();
  } catch {
    // Non-JSON body — keep raw null, fall through to status-only handling.
  }

  if (resp.ok) {
    if (body && typeof body === 'object') {
      return { ok: true, status: resp.status, data: body as ProjectContextResponse };
    }
    return {
      ok: false,
      status: resp.status,
      errorCode: 'invalid_response',
      errorMessage: 'Antwort enthielt keinen verwertbaren JSON-Body.',
    };
  }

  // Error path — try to extract the standardised operator error envelope.
  if (body && typeof body === 'object') {
    const env = body as Partial<OperatorApiErrorBody>;
    return {
      ok: false,
      status: resp.status,
      errorCode: typeof env.error === 'string' ? env.error : undefined,
      errorMessage: typeof env.message === 'string' ? env.message : undefined,
      diagnostic: env.diagnostic,
      raw: body,
    };
  }
  return { ok: false, status: resp.status };
}
