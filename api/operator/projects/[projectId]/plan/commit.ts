// Phase 2C-Pre — POST /api/operator/projects/:projectId/plan/commit
//
// Hard-locked Notion-write pipeline for the Project Auto Planner. The
// endpoint exists in the deployed artefact so the wire shape and gates are
// reviewable, but it does NOT write to Notion unless every one of the
// stacked gates passes:
//
//   1.  setNoStore
//   2.  rate limit
//   3.  STRICT operator auth — `checkOperatorAuth`, NOT
//       `checkReadOnlyPlannerAuth`. Private-Cockpit read-only mode does NOT
//       open this route. The operator must hold the actual API key.
//   4.  method allowlist (POST)
//   5.  projectId regex validation
//   6.  payload structural validation (shared validator with
//       /plan/preview + /plan/validate)
//   7.  commitToken / explicitConfirmPhrase gate (placeholder confirm)
//   8.  planDigest recompute and compare to request — 409 on mismatch
//   9.  Feature-flag check: NOX_NOTION_WRITE_ENABLED MUST equal "true"
//       (lowercased/trimmed). Anything else => 423 locked.
//   10. Write-token check: NOX_NOTION_WRITE_TOKEN must be set AND
//       differ from NOX_NOTION_READONLY_TOKEN. No fallback.
//   11. Schema re-validation (read-only). schemaOk must be true.
//   12. Idempotency precheck: query Master-Tasks for any page with
//       `Plan Draft Digest = <digest>`. If hit => 200 duplicate_risk,
//       zero writes.
//   13. ONLY IF all the above hold, the handler calls
//       `createMasterTaskPage` per step using the WRITE token.
//
// Strict invariants:
//   - No fallback to the read-only token for writes.
//   - No reuse of the Private-Cockpit auth helper for write authentication.
//   - No secret values are echoed in audit events or responses.
//   - The handler's default in production is 423 locked because the flag
//     is intentionally unset.

import type { ApiHandler } from '../../../../_lib/handler.js';
import {
  badRequest,
  methodAllowed,
  readBodyAsObject,
  sendError,
  setNoStore,
} from '../../../../_lib/handler.js';
import { checkPrivateWritePlannerAuth, respondAuthFailure } from '../../../../_lib/auth.js';
import type { WriteAuthMode } from '../../../../_lib/auth.js';
import { checkRateLimit, respondRateLimited } from '../../../../_lib/rateLimit.js';
import { appendAuditEvent } from '../../../../_lib/audit.js';
import {
  createMasterTaskPage,
  getDatabaseSchema,
  queryMasterTasksByPlanDraftDigest,
  queryProjectsByProjectId,
  readNotionConfig,
} from '../../../../_lib/notion.js';
import type {
  NotionDatabaseProperty,
  NotionSchemaResult,
} from '../../../../_lib/notion.js';
import type {
  PlanCommitPageResult,
  PlanCommitRequestBody,
  PlanCommitResponse,
  PlanCommitResultCode,
} from '../../../../_lib/types.js';
import {
  ALLOWED_MASTER_TASKS_WRITE_PROPERTIES,
  PLAN_COMMIT_PHRASE,
  PLAN_COMMIT_TOKEN_RE,
} from '../../../../_lib/types.js';
import {
  buildPlannedMutations,
  computePlanDraftDigest,
  IDEMPOTENCY_KEY_RE,
  mapPlanMutationToNotionProperties,
  PLAN_STEP_ID_RE,
  PROJECT_ID_RE,
  validatePlanDraftPayload,
} from '../../../../_lib/planDraft.js';

const ROUTE_LABEL = '/api/operator/projects/:projectId/plan/commit';

// Commit-500-Diagnostics — short, request-scoped id for safe correlation
// between server logs and the response body. Never includes secrets.
function newRequestId(): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `cmt_${stamp}_${rand}`;
}

// Sanitised structured logger. Vercel function logs surface anything
// written to stdout/stderr; we keep the payload to a known allowlist of
// safe fields. No tokens, no env values, no headers, no request bodies.
function logCommitEvent(
  level: 'info' | 'warn' | 'error',
  requestId: string,
  fields: {
    projectId?: string;
    planSteps?: number;
    code?: string;
    statusCode?: number;
    notionStatus?: number;
    notionCode?: string;
    propertyName?: string;
    summary?: string;
  },
): void {
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  const safe = {
    src: 'plan/commit',
    requestId,
    projectId: fields.projectId,
    planSteps: typeof fields.planSteps === 'number' ? fields.planSteps : undefined,
    code: fields.code,
    statusCode: fields.statusCode,
    notionStatus: fields.notionStatus,
    notionCode: fields.notionCode,
    propertyName: fields.propertyName,
    summary: typeof fields.summary === 'string' ? fields.summary.slice(0, 240) : undefined,
  };
  try {
    fn(JSON.stringify(safe));
  } catch {
    // Never let logging itself throw out of the handler.
  }
}

// ---- helpers ----

function readProjectIdParam(
  query: Record<string, string | string[] | undefined>,
): string | undefined {
  const v = query.projectId;
  if (Array.isArray(v)) return v[0];
  if (typeof v === 'string') return v;
  return undefined;
}

function readMappingMode(): 'none' | 'title-prefix' | 'notion-relation' {
  const v = (process.env.NOX_PROJECT_MAPPING_MODE ?? '').trim().toLowerCase();
  if (v === 'title-prefix') return 'title-prefix';
  if (v === 'notion-relation') return 'notion-relation';
  return 'none';
}

function readProjectsDbId(): string {
  return (process.env.NOX_PROJECTS_DB_ID ?? '').trim();
}

function isWriteFlagEnabled(): boolean {
  // Must be EXACTLY "true" (lowercased, trimmed). Anything else, including
  // accidental "True", "1", "yes", or empty string, leaves the gate closed.
  return (process.env.NOX_NOTION_WRITE_ENABLED ?? '').trim().toLowerCase() === 'true';
}

// Shared-Notion-Token-Fix — explicit opt-in to allow a single Notion
// integration token to serve both the read-only schema lookups and the
// write-side page creates. Default-off; the operator must consciously
// flip this env var. Strictly "true" only — every other value keeps the
// historical collision-with-readonly hard block in place.
function isSharedReadWriteTokenAllowed(): boolean {
  return (
    (process.env.NOX_NOTION_ALLOW_SHARED_READ_WRITE_TOKEN ?? '')
      .trim()
      .toLowerCase() === 'true'
  );
}

interface WriteTokenStatus {
  /** Resolved write token, only present in the success branches. */
  token?: string;
  /** Failure reason — only set on `not_configured` or `collision_with_readonly`. */
  reason?: 'not_configured' | 'collision_with_readonly';
  /**
   * Diagnostic flag: true when the resolved write token is identical to the
   * read-only token AND the operator opted in via
   * NOX_NOTION_ALLOW_SHARED_READ_WRITE_TOKEN=true. The token value itself
   * is never echoed; this boolean is the only signal that leaves the
   * resolver.
   */
  sharedReadWrite?: boolean;
}

function resolveWriteToken(readonlyToken: string): WriteTokenStatus {
  const raw = (process.env.NOX_NOTION_WRITE_TOKEN ?? '').trim();
  if (raw.length === 0) return { reason: 'not_configured' };
  if (raw === readonlyToken) {
    // Shared-Notion-Token-Fix — collision is a hard block by default
    // because two distinct integrations make rotation safer and reduce
    // blast radius on a write-side leak. Operators with intentionally
    // shared single-integration setups opt in via the env var below.
    if (!isSharedReadWriteTokenAllowed()) {
      return { reason: 'collision_with_readonly' };
    }
    return { token: raw, sharedReadWrite: true };
  }
  return { token: raw, sharedReadWrite: false };
}

// Build a baseline response object so every early-return path produces the
// same wire shape. `code` is the discriminator the operator inspects.
function buildResponse(
  base: {
    code: PlanCommitResultCode;
    ok: boolean;
    projectId: string;
    clientPlanId: string;
    planDigest: string;
    idempotencyKey: string;
    wouldCreateNTasks: number;
    writeEnabled: boolean;
    notionWritesExecuted: boolean;
    duplicateRisk: boolean;
    pageResults: PlanCommitPageResult[];
    diagnostics: string[];
    authMode: WriteAuthMode;
  },
): PlanCommitResponse {
  return {
    ok: base.ok,
    code: base.code,
    projectId: base.projectId,
    clientPlanId: base.clientPlanId,
    planDigest: base.planDigest,
    idempotencyKey: base.idempotencyKey,
    wouldCreateNTasks: base.wouldCreateNTasks,
    writeEnabled: base.writeEnabled,
    notionWritesExecuted: base.notionWritesExecuted,
    duplicateRisk: base.duplicateRisk,
    pageResults: base.pageResults,
    diagnostics: base.diagnostics,
    meta: {
      skeleton: false,
      phase: '2c-pre',
      readOnly: !base.notionWritesExecuted,
      notionWritesEnabled: base.writeEnabled,
      liveExecution: base.notionWritesExecuted ? 'live' : 'locked',
      authMode: base.authMode,
    },
  };
}

interface BodyValidationOK {
  ok: true;
  body: PlanCommitRequestBody;
}
interface BodyValidationFail {
  ok: false;
  field: string;
  message: string;
}

function validateCommitBody(
  raw: Record<string, unknown>,
  opts: { requireCommitTokenOrPhrase: boolean },
): BodyValidationOK | BodyValidationFail {
  const clientPlanId = raw.clientPlanId;
  if (typeof clientPlanId !== 'string' || !PLAN_STEP_ID_RE.test(clientPlanId)) {
    return {
      ok: false,
      field: 'clientPlanId',
      message: `Field 'clientPlanId' must match ${PLAN_STEP_ID_RE.source}.`,
    };
  }
  if (typeof raw.idempotencyKey !== 'string' || !IDEMPOTENCY_KEY_RE.test(raw.idempotencyKey)) {
    return {
      ok: false,
      field: 'idempotencyKey',
      message: `Field 'idempotencyKey' must match ${IDEMPOTENCY_KEY_RE.source}.`,
    };
  }
  if (typeof raw.planDigest !== 'string' || !/^[0-9a-f]{8}$/i.test(raw.planDigest)) {
    return {
      ok: false,
      field: 'planDigest',
      message: `Field 'planDigest' must be an 8-char hex digest as returned by /plan/preview.`,
    };
  }
  // commitToken / explicitConfirmPhrase. In `private_write_mode` the
  // server-side flag IS the conscious confirmation, so neither needs to be
  // present on the wire. In `operator_key` mode (the default) the operator
  // must supply one of them — the body validator enforces that here so the
  // operator sees the spec via 400 even before the lock returns 423.
  const ct = raw.commitToken;
  const ph = raw.explicitConfirmPhrase;
  const ctOk = typeof ct === 'string' && PLAN_COMMIT_TOKEN_RE.test(ct);
  const phOk = typeof ph === 'string' && ph === PLAN_COMMIT_PHRASE;
  if (opts.requireCommitTokenOrPhrase && !ctOk && !phOk) {
    return {
      ok: false,
      field: 'commitToken|explicitConfirmPhrase',
      message: `Either 'commitToken' (regex ${PLAN_COMMIT_TOKEN_RE.source}) or 'explicitConfirmPhrase' (exact '${PLAN_COMMIT_PHRASE}') is required.`,
    };
  }
  // projectGoal + planSteps + projectId are re-validated by the shared
  // payload validator further down, so we don't duplicate it here.
  return {
    ok: true,
    body: {
      projectId: typeof raw.projectId === 'string' ? raw.projectId : undefined,
      clientPlanId,
      projectGoal: typeof raw.projectGoal === 'string' ? raw.projectGoal : '',
      planSteps: Array.isArray(raw.planSteps) ? (raw.planSteps as PlanCommitRequestBody['planSteps']) : [],
      idempotencyKey: raw.idempotencyKey,
      planDigest: raw.planDigest,
      ...(ctOk ? { commitToken: ct as string } : {}),
      ...(phOk ? { explicitConfirmPhrase: ph as string } : {}),
    },
  };
}

// Re-run the same property/schema checks Phase 2B performs. Kept inline so
// the commit endpoint never depends on the validate endpoint at the HTTP
// level (function-internal calls only). Phase-2B import would create a
// cyclic dependency since commit.ts and validate.ts are siblings.
type SchemaCheckResult =
  | { ok: true; masterPropMap: Record<string, NotionDatabaseProperty>; projectPageId?: string }
  | { ok: false; reason: 'schema_unreadable' | 'schema_mismatch' | 'project_not_found' | 'projects_db_missing'; summary: string };

async function recheckSchemaForCommit(
  token: string,
  masterDbId: string,
  projectId: string,
): Promise<SchemaCheckResult> {
  const schemaRes: NotionSchemaResult = await getDatabaseSchema(token, masterDbId);
  if (!schemaRes.ok) {
    return { ok: false, reason: 'schema_unreadable', summary: schemaRes.summary.slice(0, 200) };
  }
  // Allowlist must be fully present + correctly typed. We only check the
  // properties the commit endpoint would actually write.
  for (const propName of ALLOWED_MASTER_TASKS_WRITE_PROPERTIES) {
    const found = schemaRes.properties[propName];
    if (!found) {
      return { ok: false, reason: 'schema_mismatch', summary: `Property '${propName}' missing in Master Tasks.` };
    }
  }
  // Project-relation resolution (only when mapping mode is notion-relation).
  const mode = readMappingMode();
  if (mode === 'notion-relation') {
    const projectsDbId = readProjectsDbId();
    if (!projectsDbId) {
      return { ok: false, reason: 'projects_db_missing', summary: 'NOX_PROJECTS_DB_ID unset.' };
    }
    const lookup = await queryProjectsByProjectId(token, projectsDbId, projectId);
    if (!lookup.ok || lookup.results.length === 0) {
      return {
        ok: false,
        reason: 'project_not_found',
        summary: `Project '${projectId}' not found in Projects DB.`,
      };
    }
    return { ok: true, masterPropMap: schemaRes.properties, projectPageId: lookup.results[0].id };
  }
  return { ok: true, masterPropMap: schemaRes.properties };
}

// ---- handler ----

const handler: ApiHandler = async (req, res) => {
  const method = req.method ?? '?';
  const route = ROUTE_LABEL;
  const requestId = newRequestId();

  setNoStore(res);
  // Echo the request id back so the operator can grep server logs.
  res.setHeader('x-nox-request-id', requestId);

  // Commit-500-Diagnostics — top-level guard. Any throw inside the gates
  // collapses to a sanitised JSON 500 with `code: 'internal_commit_error'`
  // instead of leaking Vercel's default HTML error page. The frontend
  // can then read `error` / `code` / `message` consistently.
  try {

  // 1. Rate limit
  const rl = checkRateLimit(req);
  if (!rl.ok) {
    appendAuditEvent({
      eventType: 'RATE_LIMITED',
      route,
      method,
      statusCode: 429,
      outcome: 'blocked',
      clientKeyLabel: rl.keyLabel,
    });
    return respondRateLimited(res, rl);
  }
  const clientKeyLabel = rl.keyLabel;

  // 2. Auth gate — Private-Cockpit READ-ONLY mode is NOT honoured here;
  // only the explicit Private-Write mode flag bypasses the operator-key
  // check. The flag's job is the conscious confirmation; all *write-side*
  // server gates (flag, write token, digest, schema, idempotency) still
  // run in full.
  const auth = checkPrivateWritePlannerAuth(req);
  if (!auth.ok) {
    appendAuditEvent({
      eventType: auth.reason === 'not_configured' ? 'AUTH_NOT_CONFIGURED' : 'AUTH_FAILED',
      route,
      method,
      statusCode: auth.statusCode,
      outcome: 'blocked',
      clientKeyLabel,
    });
    return respondAuthFailure(res, auth);
  }
  const authModeWire: WriteAuthMode = auth.authMode;

  // 3. Method
  if (!methodAllowed(req, res, ['POST'])) {
    appendAuditEvent({
      eventType: 'PLAN_COMMIT_VALIDATION_FAILED',
      route,
      method,
      statusCode: 405,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'method_not_allowed',
    });
    return;
  }

  // 4. projectId regex
  const projectIdRaw = readProjectIdParam(req.query);
  if (!projectIdRaw || !PROJECT_ID_RE.test(projectIdRaw)) {
    appendAuditEvent({
      eventType: 'PLAN_COMMIT_VALIDATION_FAILED',
      route,
      method,
      statusCode: 400,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'projectId_invalid',
    });
    badRequest(
      res,
      `Path parameter 'projectId' must match ${PROJECT_ID_RE.source} (max 64).`,
    );
    return;
  }
  const projectId = projectIdRaw;

  appendAuditEvent({
    eventType: 'PLAN_COMMIT_REQUESTED',
    route,
    method,
    outcome: 'attempt',
    clientKeyLabel,
    detailsSummary: `projectId=${projectId}`,
    projectId,
    requestId,
    source: 'plan-commit',
  });

  // 5. Body — commit-specific fields first, then shared payload. The
  // commit-token/phrase gate is enforced only when authMode === operator_key.
  // In private-write mode the flag itself is the deliberate confirmation,
  // so the wire-format gate is relaxed (other server gates remain).
  const body = readBodyAsObject(req);
  const commitFieldCheck = validateCommitBody(body, {
    requireCommitTokenOrPhrase: authModeWire === 'operator_key',
  });
  if (!commitFieldCheck.ok) {
    appendAuditEvent({
      eventType:
        commitFieldCheck.field === 'commitToken|explicitConfirmPhrase'
          ? 'PLAN_COMMIT_TOKEN_MISSING'
          : 'PLAN_COMMIT_VALIDATION_FAILED',
      route,
      method,
      statusCode: 400,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: `field=${commitFieldCheck.field}`,
    });
    badRequest(res, commitFieldCheck.message);
    return;
  }
  const commit = commitFieldCheck.body;

  // 6. Shared payload validation (re-uses planDraft.ts).
  const payloadCheck = validatePlanDraftPayload(projectId, body);
  if (!payloadCheck.ok) {
    appendAuditEvent({
      eventType: 'PLAN_COMMIT_VALIDATION_FAILED',
      route,
      method,
      statusCode: 400,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: `payload_field=${payloadCheck.failure.field}`,
    });
    badRequest(res, payloadCheck.failure.message);
    return;
  }
  const draft = payloadCheck.draft;

  // 7. Recompute digest and compare.
  const recomputedDigest = computePlanDraftDigest(draft);
  if (recomputedDigest !== commit.planDigest.toLowerCase()) {
    appendAuditEvent({
      eventType: 'PLAN_COMMIT_DIGEST_MISMATCH',
      route,
      method,
      statusCode: 409,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: `expected=${recomputedDigest} provided=${commit.planDigest.slice(0, 32)}`,
      projectId,
      planDigest: recomputedDigest,
      clientPlanId: commit.clientPlanId,
      idempotencyKey: commit.idempotencyKey,
      planStepsCount: Array.isArray(commit.planSteps) ? commit.planSteps.length : undefined,
      errorCode: 'plan_digest_mismatch',
      requestId,
      source: 'plan-commit',
    });
    sendError(
      res,
      409,
      'plan_digest_mismatch',
      'Provided planDigest does not match server-computed digest. Re-run preview/validate, then resubmit.',
    );
    return;
  }

  // 8. Feature-flag gate. This is the primary lock that keeps Phase 2C-Pre
  // inert in production.
  const writeEnabled = isWriteFlagEnabled();
  if (!writeEnabled) {
    appendAuditEvent({
      eventType: 'PLAN_COMMIT_LOCKED',
      route,
      method,
      statusCode: 423,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: `projectId=${projectId} steps=${draft.planSteps.length} digest=${recomputedDigest}`,
      projectId,
      planDigest: recomputedDigest,
      idempotencyKey: draft.idempotencyKey,
      clientPlanId: commit.clientPlanId,
      planStepsCount: draft.planSteps.length,
      errorCode: 'writes_locked',
      requestId,
      source: 'plan-commit',
    });
    res.status(423).json(
      buildResponse({
        code: 'writes_locked',
        ok: false,
        projectId,
        clientPlanId: commit.clientPlanId,
        planDigest: recomputedDigest,
        idempotencyKey: draft.idempotencyKey,
        wouldCreateNTasks: draft.planSteps.length,
        writeEnabled: false,
        notionWritesExecuted: false,
        duplicateRisk: false,
        pageResults: [],
        diagnostics: [
          'NOX_NOTION_WRITE_ENABLED is not set to exactly "true". Phase 2C-Pre keeps every commit path locked until the operator consciously flips the flag.',
        ],
        authMode: authModeWire,
      }),
    );
    return;
  }

  // 9. Notion config — even with the flag on, we still need a configured
  // read-only token (for schema re-check + idempotency lookup).
  const notion = readNotionConfig();
  if (!notion.ok) {
    // Commit-500-Diagnostics — distinguish which env var is actually
    // missing so the response code is actionable.
    const tokenMissing = notion.missing.includes('NOX_NOTION_READONLY_TOKEN');
    const dbMissing = notion.missing.includes('NOX_MASTER_TASKS_DB_ID');
    const specificCode: PlanCommitResultCode = dbMissing && !tokenMissing
      ? 'notion_database_missing'
      : tokenMissing && !dbMissing
        ? 'notion_write_token_missing'
        : 'write_not_configured';
    appendAuditEvent({
      eventType: 'PLAN_COMMIT_WRITE_NOT_CONFIGURED',
      route,
      method,
      statusCode: 503,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: `missing=${notion.missing.join(',')}`,
    });
    logCommitEvent('warn', requestId, {
      projectId,
      code: specificCode,
      statusCode: 503,
      summary: `missing=${notion.missing.join(',')}`,
    });
    res.status(503).json(
      buildResponse({
        code: specificCode,
        ok: false,
        projectId,
        clientPlanId: commit.clientPlanId,
        planDigest: recomputedDigest,
        idempotencyKey: draft.idempotencyKey,
        wouldCreateNTasks: draft.planSteps.length,
        writeEnabled: true,
        notionWritesExecuted: false,
        duplicateRisk: false,
        pageResults: [],
        diagnostics: [
          `Notion read-only adapter is not configured server-side (missing: ${notion.missing.join(', ')}).`,
        ],
        authMode: authModeWire,
      }),
    );
    return;
  }

  // 10. Write-token check. NEVER falls back to the read-only token.
  const writeStatus = resolveWriteToken(notion.token);
  if (writeStatus.reason === 'not_configured') {
    appendAuditEvent({
      eventType: 'PLAN_COMMIT_WRITE_NOT_CONFIGURED',
      route,
      method,
      statusCode: 503,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'NOX_NOTION_WRITE_TOKEN unset',
    });
    logCommitEvent('warn', requestId, {
      projectId,
      code: 'notion_write_token_missing',
      statusCode: 503,
      summary: 'NOX_NOTION_WRITE_TOKEN unset',
    });
    res.status(503).json(
      buildResponse({
        code: 'notion_write_token_missing',
        ok: false,
        projectId,
        clientPlanId: commit.clientPlanId,
        planDigest: recomputedDigest,
        idempotencyKey: draft.idempotencyKey,
        wouldCreateNTasks: draft.planSteps.length,
        writeEnabled: true,
        notionWritesExecuted: false,
        duplicateRisk: false,
        pageResults: [],
        diagnostics: [
          'NOX_NOTION_WRITE_TOKEN is not set. Phase 2C-Pre refuses to fall back to NOX_NOTION_READONLY_TOKEN.',
        ],
        authMode: authModeWire,
      }),
    );
    return;
  }
  if (writeStatus.reason === 'collision_with_readonly') {
    appendAuditEvent({
      eventType: 'PLAN_COMMIT_WRITE_TOKEN_COLLISION',
      route,
      method,
      statusCode: 500,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'write_token_equals_readonly_token',
    });
    res.status(500).json(
      buildResponse({
        code: 'write_token_collision',
        ok: false,
        projectId,
        clientPlanId: commit.clientPlanId,
        planDigest: recomputedDigest,
        idempotencyKey: draft.idempotencyKey,
        wouldCreateNTasks: draft.planSteps.length,
        writeEnabled: true,
        notionWritesExecuted: false,
        duplicateRisk: false,
        pageResults: [],
        diagnostics: [
          'NOX_NOTION_WRITE_TOKEN is identical to NOX_NOTION_READONLY_TOKEN. Use a dedicated write-scope integration token, or set NOX_NOTION_ALLOW_SHARED_READ_WRITE_TOKEN=true if a single integration is intended.',
        ],
        authMode: authModeWire,
      }),
    );
    return;
  }
  const writeToken = writeStatus.token!;
  // Shared-Notion-Token-Fix — pre-allocate a diagnostics array so the
  // shared-token opt-in surfaces as a single sanitised string in the
  // final response (and in the structured log). The token VALUE is
  // never written here.
  const baseDiagnostics: string[] = [];
  if (writeStatus.sharedReadWrite) {
    baseDiagnostics.push(
      'shared_read_write_token_allowed: write token equals read token; opt-in via NOX_NOTION_ALLOW_SHARED_READ_WRITE_TOKEN=true is active.',
    );
    logCommitEvent('warn', requestId, {
      projectId,
      code: 'shared_read_write_token_allowed',
      summary: 'sharedReadWriteTokenAllowed=true',
    });
  }

  // 11. Re-run schema validation against the live Notion DB.
  const schemaRecheck = await recheckSchemaForCommit(notion.token, notion.dbId, projectId);
  if (!schemaRecheck.ok) {
    appendAuditEvent({
      eventType: 'PLAN_COMMIT_SCHEMA_NOT_READY',
      route,
      method,
      statusCode: 409,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: `reason=${schemaRecheck.reason} ${schemaRecheck.summary.slice(0, 120)}`,
    });
    res.status(409).json(
      buildResponse({
        code: 'schema_not_ready',
        ok: false,
        projectId,
        clientPlanId: commit.clientPlanId,
        planDigest: recomputedDigest,
        idempotencyKey: draft.idempotencyKey,
        wouldCreateNTasks: draft.planSteps.length,
        writeEnabled: true,
        notionWritesExecuted: false,
        duplicateRisk: false,
        pageResults: [],
        diagnostics: [`schema-recheck: ${schemaRecheck.reason} — ${schemaRecheck.summary}`],
        authMode: authModeWire,
      }),
    );
    return;
  }

  // 12. Idempotency precheck. We query Master-Tasks (read-only) for existing
  // pages tagged with this digest. Any hit aborts the commit before any
  // write happens.
  const dupCheck = await queryMasterTasksByPlanDraftDigest(
    notion.token,
    notion.dbId,
    recomputedDigest,
  );
  if (!dupCheck.ok) {
    appendAuditEvent({
      eventType: 'PLAN_COMMIT_SCHEMA_NOT_READY',
      route,
      method,
      statusCode: 409,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: `idempotency_query: ${dupCheck.summary.slice(0, 120)}`,
    });
    res.status(409).json(
      buildResponse({
        code: 'schema_not_ready',
        ok: false,
        projectId,
        clientPlanId: commit.clientPlanId,
        planDigest: recomputedDigest,
        idempotencyKey: draft.idempotencyKey,
        wouldCreateNTasks: draft.planSteps.length,
        writeEnabled: true,
        notionWritesExecuted: false,
        duplicateRisk: false,
        pageResults: [],
        diagnostics: [`idempotency precheck failed: ${dupCheck.summary}`],
        authMode: authModeWire,
      }),
    );
    return;
  }
  if (dupCheck.results.length > 0) {
    appendAuditEvent({
      eventType: 'PLAN_COMMIT_DUPLICATE_RISK',
      route,
      method,
      statusCode: 200,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: `digest=${recomputedDigest} existing=${dupCheck.results.length}`,
      projectId,
      planDigest: recomputedDigest,
      idempotencyKey: draft.idempotencyKey,
      clientPlanId: commit.clientPlanId,
      planStepsCount: draft.planSteps.length,
      errorCode: 'duplicate_risk',
      requestId,
      source: 'plan-commit',
    });
    res.status(200).json(
      buildResponse({
        code: 'duplicate_risk',
        ok: false,
        projectId,
        clientPlanId: commit.clientPlanId,
        planDigest: recomputedDigest,
        idempotencyKey: draft.idempotencyKey,
        wouldCreateNTasks: draft.planSteps.length,
        writeEnabled: true,
        notionWritesExecuted: false,
        duplicateRisk: true,
        pageResults: [],
        diagnostics: [
          `Found ${dupCheck.results.length} existing Master-Tasks page(s) with Plan Draft Digest='${recomputedDigest}'. Commit aborted to avoid duplicates.`,
        ],
        authMode: authModeWire,
      }),
    );
    return;
  }

  // 13. All gates passed. Build per-step Notion property payloads and
  // execute writes. Each failure is recorded per step; we do NOT abort
  // mid-loop because partial commits are still useful state for the
  // operator. A final response summarises ok/failed counts.
  const mutations = buildPlannedMutations(draft, recomputedDigest);
  const relationOverrides: Record<string, string> = {};
  if (schemaRecheck.projectPageId) {
    relationOverrides.Project = schemaRecheck.projectPageId;
  }

  const pageResults: PlanCommitPageResult[] = [];
  // Shared-Notion-Token-Fix — seed with baseDiagnostics so the
  // shared-token opt-in (when active) is the first entry, ahead of any
  // per-step drop or upstream diagnostics.
  const diagnostics: string[] = [...baseDiagnostics];

  for (const mutation of mutations) {
    const built = mapPlanMutationToNotionProperties(mutation, { relationOverrides });
    for (const drop of built.dropped) {
      diagnostics.push(
        `step=${mutation.planStepId} dropped ${drop.notionPropertyName}: ${drop.reason}`,
      );
      logCommitEvent('warn', requestId, {
        projectId,
        code: 'property_dropped',
        propertyName: drop.notionPropertyName,
        summary: drop.reason,
      });
    }

    // Commit-500-Diagnostics — guard against an empty payload. If every
    // proposed property was dropped (allowlist filtering, unresolved
    // relation, etc.) the create-page call would either be silently
    // accepted by Notion with a "Untitled" page or 400 with a generic
    // schema error. Skip the network call and surface a precise code.
    const propertyCount = Object.keys(built.properties).length;
    if (propertyCount === 0) {
      appendAuditEvent({
        eventType: 'PLAN_COMMIT_PROPERTY_MAPPING_FAILED',
        route,
        method,
        statusCode: 424,
        outcome: 'failure',
        clientKeyLabel,
        detailsSummary: `step=${mutation.planStepId} all_properties_dropped`,
        projectId,
        planDigest: recomputedDigest,
        idempotencyKey: draft.idempotencyKey,
        clientPlanId: commit.clientPlanId,
        errorCode: 'notion_property_mapping_failed',
        requestId,
        source: 'plan-commit',
      });
      logCommitEvent('error', requestId, {
        projectId,
        code: 'notion_property_mapping_failed',
        statusCode: 424,
        summary: `step=${mutation.planStepId} all_properties_dropped`,
      });
      pageResults.push({
        planStepId: mutation.planStepId,
        ok: false,
        errorCode: 'notion_property_mapping_failed',
        errorMessage:
          'Alle für diesen Schritt geplanten Notion-Properties wurden gefiltert (Allowlist / unresolved relation). Prüfe Notion-Schema und Mapping.',
      });
      continue;
    }

    const createRes = await createMasterTaskPage(writeToken, notion.dbId, built.properties);
    if (createRes.ok) {
      appendAuditEvent({
        eventType: 'PLAN_COMMIT_PAGE_CREATED',
        route,
        method,
        statusCode: 200,
        outcome: 'success',
        clientKeyLabel,
        detailsSummary: `step=${mutation.planStepId} pageId=${createRes.pageId}`,
        projectId,
        planDigest: recomputedDigest,
        idempotencyKey: draft.idempotencyKey,
        clientPlanId: commit.clientPlanId,
        notionPageId: createRes.pageId,
        requestId,
        source: 'plan-commit',
      });
      logCommitEvent('info', requestId, {
        projectId,
        code: 'page_created',
        statusCode: 200,
        summary: `step=${mutation.planStepId}`,
      });
      pageResults.push({
        planStepId: mutation.planStepId,
        ok: true,
        notionPageId: createRes.pageId,
        ...(createRes.url ? { notionUrl: createRes.url } : {}),
      });
    } else {
      appendAuditEvent({
        eventType: 'PLAN_COMMIT_PAGE_FAILED',
        route,
        method,
        statusCode: createRes.statusCode ?? 502,
        outcome: 'failure',
        clientKeyLabel,
        detailsSummary: `step=${mutation.planStepId} ${createRes.summary.slice(0, 120)}`,
        projectId,
        planDigest: recomputedDigest,
        idempotencyKey: draft.idempotencyKey,
        clientPlanId: commit.clientPlanId,
        errorCode: createRes.upstreamCode ?? 'upstream_error',
        requestId,
        source: 'plan-commit',
      });
      logCommitEvent('error', requestId, {
        projectId,
        code: 'page_create_failed',
        statusCode: createRes.statusCode,
        notionStatus: createRes.upstreamStatus,
        notionCode: createRes.upstreamCode,
        summary: `step=${mutation.planStepId} ${createRes.summary.slice(0, 200)}`,
      });
      pageResults.push({
        planStepId: mutation.planStepId,
        ok: false,
        errorCode: createRes.upstreamCode ?? 'upstream_error',
        errorMessage: (createRes.upstreamMessage ?? createRes.summary).slice(0, 300),
      });
    }
  }

  const successCount = pageResults.filter((p) => p.ok).length;
  const failureCount = pageResults.length - successCount;
  const allOk = failureCount === 0;
  // Commit-500-Diagnostics — when EVERY per-step create failed, return
  // 502 with `code: 'notion_create_failed'` instead of the misleading
  // 200 `partial_failure`. Partial-success still uses 200.
  const allFailed = pageResults.length > 0 && successCount === 0;

  appendAuditEvent({
    eventType: allOk
      ? 'PLAN_COMMIT_SUCCESS'
      : allFailed
        ? 'PLAN_COMMIT_ALL_FAILED'
        : 'PLAN_COMMIT_PARTIAL_FAILURE',
    route,
    method,
    statusCode: allOk ? 200 : allFailed ? 502 : 200,
    outcome: allOk ? 'success' : 'failure',
    clientKeyLabel,
    detailsSummary: `digest=${recomputedDigest} ok=${successCount} failed=${failureCount}`,
    projectId,
    planDigest: recomputedDigest,
    idempotencyKey: draft.idempotencyKey,
    clientPlanId: commit.clientPlanId,
    planStepsCount: pageResults.length,
    errorCode: allOk ? undefined : allFailed ? 'notion_create_failed' : 'partial_failure',
    requestId,
    source: 'plan-commit',
  });
  logCommitEvent(allOk ? 'info' : 'error', requestId, {
    projectId,
    planSteps: pageResults.length,
    code: allOk ? 'committed' : allFailed ? 'notion_create_failed' : 'partial_failure',
    statusCode: allOk ? 200 : allFailed ? 502 : 200,
    summary: `ok=${successCount} failed=${failureCount}`,
  });

  const finalCode: PlanCommitResultCode = allOk
    ? 'committed'
    : allFailed
      ? 'notion_create_failed'
      : 'partial_failure';
  const finalStatus = allOk ? 200 : allFailed ? 502 : 200;

  res.status(finalStatus).json(
    buildResponse({
      code: finalCode,
      ok: allOk,
      projectId,
      clientPlanId: commit.clientPlanId,
      planDigest: recomputedDigest,
      idempotencyKey: draft.idempotencyKey,
      wouldCreateNTasks: draft.planSteps.length,
      writeEnabled: true,
      notionWritesExecuted: successCount > 0,
      duplicateRisk: false,
      pageResults,
      diagnostics,
      authMode: authModeWire,
    }),
  );
  } catch (err) {
    // Commit-500-Diagnostics — last-resort catch. Any thrown exception
    // collapses to a sanitised JSON 500. The Vercel function would
    // otherwise return a generic HTML 500 with no `error`/`message`,
    // and the frontend would only display "Fehler (HTTP 500)".
    const safeName = err instanceof Error ? err.name : 'UnknownError';
    appendAuditEvent({
      eventType: 'PLAN_COMMIT_INTERNAL_ERROR',
      route: ROUTE_LABEL,
      method,
      statusCode: 500,
      outcome: 'failure',
      clientKeyLabel: 'unknown',
      detailsSummary: `requestId=${requestId} err=${safeName}`,
      errorCode: 'internal_commit_error',
      requestId,
      source: 'plan-commit',
    });
    logCommitEvent('error', requestId, {
      code: 'internal_commit_error',
      statusCode: 500,
      summary: `${safeName}: ${err instanceof Error ? err.message.slice(0, 200) : 'no message'}`,
    });
    // Do NOT include stack traces or the raw error message in the
    // response body — they may leak internal paths or env values.
    try {
      res.status(500).json({
        error: 'internal_commit_error',
        code: 'internal_commit_error',
        message:
          'Interner Fehler im Commit-Endpunkt. Server-Logs (Vercel) für RequestId-Korrelation prüfen.',
        requestId,
      });
    } catch {
      // If even the JSON serialiser fails, fall back to a plain status.
      try {
        res.status(500).end('{"error":"internal_commit_error"}');
      } catch {
        // Give up silently — the runtime will close the connection.
      }
    }
  }
};

export default handler;
