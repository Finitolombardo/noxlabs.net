// Phase 2B — POST /api/operator/projects/:projectId/plan/validate
//
// Read-only schema validation for the Project Auto Planner draft.
// Accepts the SAME payload as Phase 2A (`ProjectPlanDraft`). The handler:
//
//   1. Re-validates the payload structurally (shared with /plan/preview).
//   2. Computes the same FNV-1a digest as Phase 2A so the operator sees
//      identical mutation projections.
//   3. Reads the live Notion schema for the Master-Tasks DB and (if the
//      operator runs mapping-mode `notion-relation`) the Projects DB.
//   4. Compares each proposed property against the live schema and the
//      server-side write allowlist `ALLOWED_MASTER_TASKS_WRITE_PROPERTIES`.
//   5. Optionally verifies the project row exists in the Projects DB.
//
// Strict invariants:
//   - No Notion write. No POST /v1/pages. No PATCH. No schema-add.
//   - No write-token plumbing. The handler ONLY reads
//     `NOX_NOTION_READONLY_TOKEN`. `NOX_NOTION_WRITE_TOKEN` /
//     `NOX_NOTION_WRITE_ENABLED` are deliberately untouched.
//   - No dispatcher, no Telegram, no agent run.
//   - No mutation of any input object. No persistence beyond the
//     in-memory audit ring buffer.
//
// Failure modes that operators need to act on:
//   - 503 `notion_not_configured`           -> NOX_NOTION_READONLY_TOKEN
//                                              or NOX_MASTER_TASKS_DB_ID
//                                              missing on the server.
//   - 502 `notion_upstream_error`           -> Notion returned 4xx/5xx
//                                              when fetching the schema.
//                                              Sanitised diagnostic
//                                              fields are returned.
//   - 200 with `schemaOk: false`            -> structural validation +
//                                              schema fetch succeeded
//                                              but at least one property
//                                              is `missing` or
//                                              `type_mismatch`.

import type { ApiHandler, ApiResponse } from '../../../../_lib/handler.js';
import {
  badRequest,
  methodAllowed,
  readBodyAsObject,
  sendError,
  setNoStore,
} from '../../../../_lib/handler.js';
import { checkReadOnlyPlannerAuth, respondAuthFailure } from '../../../../_lib/auth.js';
import { checkRateLimit, respondRateLimited } from '../../../../_lib/rateLimit.js';
import { appendAuditEvent } from '../../../../_lib/audit.js';
import {
  getDatabaseSchema,
  queryProjectsByProjectId,
  readNotionConfig,
} from '../../../../_lib/notion.js';
import type {
  NotionDatabaseProperty,
  NotionSchemaResult,
} from '../../../../_lib/notion.js';
import type {
  PlanCheckedDatabase,
  PlanProposedPropertyCheck,
  PlanProposedPropertyType,
  PlanValidationIssue,
  PlanValidationIssueCode,
  PlanValidationReport,
  PlanValidationWarning,
} from '../../../../_lib/types.js';
import { ALLOWED_MASTER_TASKS_WRITE_PROPERTIES } from '../../../../_lib/types.js';
import {
  buildPlannedMutations,
  computePlanDraftDigest,
  PROJECT_ID_RE,
  validatePlanDraftPayload,
} from '../../../../_lib/planDraft.js';
import type { PlanDraftValidationFailure } from '../../../../_lib/planDraft.js';

const ROUTE_LABEL = '/api/operator/projects/:projectId/plan/validate';

function readProjectIdParam(
  query: Record<string, string | string[] | undefined>,
): string | undefined {
  const v = query.projectId;
  if (Array.isArray(v)) return v[0];
  if (typeof v === 'string') return v;
  return undefined;
}

function failPayloadValidation(
  res: ApiResponse,
  clientKeyLabel: string,
  method: string,
  failure: PlanDraftValidationFailure,
): void {
  appendAuditEvent({
    eventType: 'PLAN_VALIDATE_VALIDATION_FAILED',
    route: ROUTE_LABEL,
    method,
    statusCode: 400,
    outcome: 'blocked',
    clientKeyLabel,
    detailsSummary: `field=${failure.field}`,
  });
  badRequest(res, failure.message);
}

// Notion's property `type` strings vs the wire format. Phase 2B only
// accepts exact-string matches; we never auto-coerce (e.g. `formula` is
// not considered equivalent to `rich_text`).
function notionTypeMatches(
  expected: PlanProposedPropertyType,
  actual: string,
): boolean {
  return expected === actual;
}

function checkProperty(
  notionPropertyName: string,
  expectedType: PlanProposedPropertyType,
  masterSchema: Record<string, NotionDatabaseProperty> | null,
): PlanProposedPropertyCheck {
  const isAllowlisted = ALLOWED_MASTER_TASKS_WRITE_PROPERTIES.includes(
    notionPropertyName,
  );

  // Properties outside the Phase-2C write allowlist are surfaced as
  // `unsafe` regardless of schema state. They will never be written by
  // Phase 2C even if Notion has them.
  if (!isAllowlisted) {
    return { notionPropertyName, expectedType, status: 'unsafe' };
  }

  // No schema available (read failed or DB not configured) — defer to
  // `skipped`. The outer validator surfaces the underlying schema error
  // via `checkedDatabases[]`.
  if (!masterSchema) {
    return { notionPropertyName, expectedType, status: 'skipped' };
  }

  const found = masterSchema[notionPropertyName];
  if (!found) {
    return { notionPropertyName, expectedType, status: 'missing' };
  }

  if (!notionTypeMatches(expectedType, found.type)) {
    return {
      notionPropertyName,
      expectedType,
      status: 'type_mismatch',
      actualType: found.type,
    };
  }

  return {
    notionPropertyName,
    expectedType,
    status: 'safe',
    actualType: found.type,
  };
}

// Project-mapping-mode reader, same shape as /context.
type MappingMode = 'none' | 'title-prefix' | 'notion-relation';

function readMappingMode(): MappingMode {
  const v = (process.env.NOX_PROJECT_MAPPING_MODE ?? '').trim().toLowerCase();
  if (v === 'title-prefix') return 'title-prefix';
  if (v === 'notion-relation') return 'notion-relation';
  return 'none';
}

function readProjectsDbId(): string {
  return (process.env.NOX_PROJECTS_DB_ID ?? '').trim();
}

const handler: ApiHandler = async (req, res) => {
  const method = req.method ?? '?';
  const route = ROUTE_LABEL;

  setNoStore(res);

  // 1. Rate limit.
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

  // 2. Auth gate. Same scope rule as /plan/preview: this endpoint is
  // read-only by design and may be opened to Private-Cockpit mode. The
  // helper falls back to the standard operator-key gate when the flag is
  // not set.
  const auth = checkReadOnlyPlannerAuth(req);
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
  const authMode = auth.authMode;

  // 3. Method.
  if (!methodAllowed(req, res, ['POST'])) {
    appendAuditEvent({
      eventType: 'PLAN_VALIDATE_VALIDATION_FAILED',
      route,
      method,
      statusCode: 405,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: 'method_not_allowed',
    });
    return;
  }

  // 4. projectId validation.
  const projectIdRaw = readProjectIdParam(req.query);
  if (!projectIdRaw || !PROJECT_ID_RE.test(projectIdRaw)) {
    appendAuditEvent({
      eventType: 'PLAN_VALIDATE_VALIDATION_FAILED',
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
    eventType: 'PLAN_VALIDATE_REQUESTED',
    route,
    method,
    outcome: 'attempt',
    clientKeyLabel,
    detailsSummary: `projectId=${projectId}`,
  });

  // 5. Payload re-validation (shared with /plan/preview).
  const body = readBodyAsObject(req);
  const validation = validatePlanDraftPayload(projectId, body);
  if (!validation.ok) {
    return failPayloadValidation(res, clientKeyLabel, method, validation.failure);
  }
  const draft = validation.draft;

  // 6. Notion read-only config.
  const notion = readNotionConfig();
  if (!notion.ok) {
    appendAuditEvent({
      eventType: 'PLAN_VALIDATE_NOT_CONFIGURED',
      route,
      method,
      statusCode: 503,
      outcome: 'blocked',
      clientKeyLabel,
      detailsSummary: `missing=${notion.missing.join(',')}`,
    });
    sendError(
      res,
      503,
      'notion_not_configured',
      'Notion read-only adapter is not configured server-side.',
    );
    return;
  }

  // 7. Master-Tasks schema fetch.
  const issues: PlanValidationIssue[] = [];
  const warnings: PlanValidationWarning[] = [];
  const checkedDatabases: PlanCheckedDatabase[] = [];
  let masterSchema: Record<string, NotionDatabaseProperty> | null = null;

  const masterRes: NotionSchemaResult = await getDatabaseSchema(notion.token, notion.dbId);
  if (masterRes.ok) {
    masterSchema = masterRes.properties;
    checkedDatabases.push({
      role: 'master_tasks',
      envVar: 'NOX_MASTER_TASKS_DB_ID',
      ok: true,
      status: 'ok',
      summary: `${Object.keys(masterSchema).length} Properties`,
    });
  } else {
    appendAuditEvent({
      eventType: 'PLAN_VALIDATE_UPSTREAM_FAILED',
      route,
      method,
      statusCode: 502,
      outcome: 'failure',
      clientKeyLabel,
      detailsSummary: `master_tasks_schema: ${masterRes.summary.slice(0, 150)}`,
    });
    checkedDatabases.push({
      role: 'master_tasks',
      envVar: 'NOX_MASTER_TASKS_DB_ID',
      ok: false,
      status: 'upstream_error',
      summary: masterRes.summary.slice(0, 200),
    });
    issues.push({
      code: 'master_tasks_schema_unreadable',
      message: `Master Tasks schema konnte nicht gelesen werden: ${masterRes.summary.slice(0, 200)}`,
    });
  }

  // 8. Optional project-relation check, only when mapping mode is set.
  const mode = readMappingMode();
  const projectsDbId = readProjectsDbId();

  if (mode === 'notion-relation') {
    if (!projectsDbId) {
      checkedDatabases.push({
        role: 'projects',
        envVar: 'NOX_PROJECTS_DB_ID',
        ok: false,
        status: 'not_configured',
        summary: 'NOX_PROJECTS_DB_ID is unset.',
      });
      issues.push({
        code: 'projects_db_missing',
        message:
          'NOX_PROJECT_MAPPING_MODE=notion-relation, aber NOX_PROJECTS_DB_ID ist nicht gesetzt. Projekt-Relation kann nicht validiert werden.',
      });
    } else {
      // Projects-DB schema fetch (defensive — Phase 2C will write the
      // relation, so we want to know the schema is reachable even though
      // Phase 2B never actually uses the property names here).
      const projectsSchemaRes = await getDatabaseSchema(notion.token, projectsDbId);
      if (!projectsSchemaRes.ok) {
        appendAuditEvent({
          eventType: 'PLAN_VALIDATE_UPSTREAM_FAILED',
          route,
          method,
          statusCode: 502,
          outcome: 'failure',
          clientKeyLabel,
          detailsSummary: `projects_schema: ${projectsSchemaRes.summary.slice(0, 150)}`,
        });
        checkedDatabases.push({
          role: 'projects',
          envVar: 'NOX_PROJECTS_DB_ID',
          ok: false,
          status: 'upstream_error',
          summary: projectsSchemaRes.summary.slice(0, 200),
        });
        issues.push({
          code: 'projects_schema_unreadable',
          message: `Projects DB schema konnte nicht gelesen werden: ${projectsSchemaRes.summary.slice(0, 200)}`,
        });
      } else {
        // Projects-DB row lookup by `Project ID` rich_text — identical
        // to /context's read.
        const lookup = await queryProjectsByProjectId(notion.token, projectsDbId, projectId);
        if (!lookup.ok) {
          appendAuditEvent({
            eventType: 'PLAN_VALIDATE_UPSTREAM_FAILED',
            route,
            method,
            statusCode: 502,
            outcome: 'failure',
            clientKeyLabel,
            detailsSummary: `projects_lookup: ${lookup.summary.slice(0, 150)}`,
          });
          checkedDatabases.push({
            role: 'projects',
            envVar: 'NOX_PROJECTS_DB_ID',
            ok: false,
            status: 'upstream_error',
            summary: lookup.summary.slice(0, 200),
          });
          issues.push({
            code: 'projects_schema_unreadable',
            message: `Projects DB Lookup fehlgeschlagen: ${lookup.summary.slice(0, 200)}`,
          });
        } else if (lookup.results.length === 0) {
          checkedDatabases.push({
            role: 'projects',
            envVar: 'NOX_PROJECTS_DB_ID',
            ok: false,
            status: 'project_not_found',
            summary: `No row with Project ID='${projectId}'`,
          });
          issues.push({
            code: 'project_not_found',
            message: `Kein Projekt mit Project ID '${projectId}' in der Projects DB gefunden.`,
          });
        } else {
          checkedDatabases.push({
            role: 'projects',
            envVar: 'NOX_PROJECTS_DB_ID',
            ok: true,
            status: 'ok',
            summary: `Project row found.`,
          });
        }
      }
    }
  } else {
    checkedDatabases.push({
      role: 'projects',
      envVar: 'NOX_PROJECTS_DB_ID',
      ok: false,
      status: 'skipped',
      summary: `Mapping-Mode='${mode}' — Projekt-Relation wird nicht validiert.`,
    });
    warnings.push({
      code: 'project_relation_skipped',
      message: `Projekt-Relation wird nicht geprüft (NOX_PROJECT_MAPPING_MODE='${mode}'). Setze 'notion-relation' für eine vollständige Validierung.`,
    });
  }

  // 9. Build planned mutations (shared with Phase 2A) and check each
  // proposed property. We dedupe by property name so the operator gets a
  // single row per Notion property — the same property appears on every
  // step but only needs one schema check.
  const echoedDigest = computePlanDraftDigest(draft);
  const plannedMutations = buildPlannedMutations(draft, echoedDigest);

  const propertyChecks: PlanProposedPropertyCheck[] = [];
  const seenProps = new Set<string>();
  for (const mut of plannedMutations) {
    for (const prop of mut.proposedProperties) {
      if (seenProps.has(prop.notionPropertyName)) continue;
      seenProps.add(prop.notionPropertyName);
      const check = checkProperty(
        prop.notionPropertyName,
        prop.notionPropertyType,
        masterSchema,
      );
      propertyChecks.push(check);

      if (check.status === 'missing') {
        issues.push({
          code: 'property_missing',
          notionPropertyName: prop.notionPropertyName,
          expected: prop.notionPropertyType,
          message: `Notion-Property '${prop.notionPropertyName}' (${prop.notionPropertyType}) fehlt in Master Tasks. Schema-Add ist Operator-Hand-Migration.`,
        });
      } else if (check.status === 'type_mismatch') {
        issues.push({
          code: 'property_type_mismatch',
          notionPropertyName: prop.notionPropertyName,
          expected: prop.notionPropertyType,
          ...(check.actualType ? { actual: check.actualType } : {}),
          message: `Notion-Property '${prop.notionPropertyName}' hat Typ '${check.actualType}', erwartet '${prop.notionPropertyType}'.`,
        });
      } else if (check.status === 'unsafe') {
        issues.push({
          code: 'unsafe_property',
          notionPropertyName: prop.notionPropertyName,
          message: `Property '${prop.notionPropertyName}' ist nicht in der Phase-2C-Write-Allowlist. Diese Spalte wird beim späteren Commit nicht beschrieben.`,
        });
      }
    }
  }

  const missingProperties = propertyChecks
    .filter((c) => c.status === 'missing')
    .map((c) => c.notionPropertyName);
  const typeMismatches = propertyChecks
    .filter((c) => c.status === 'type_mismatch')
    .map((c) => ({
      notionPropertyName: c.notionPropertyName,
      expectedType: c.expectedType,
      actualType: c.actualType ?? 'unknown',
    }));
  const unsafeProperties = propertyChecks
    .filter((c) => c.status === 'unsafe')
    .map((c) => c.notionPropertyName);

  // `schemaOk` is true only if:
  //   - Master-Tasks schema is readable
  //   - No allowlisted property is missing
  //   - No allowlisted property has the wrong type
  //   - No critical issue (project_not_found / unreadable schema) raised
  // Unsafe properties do NOT flip schemaOk to false — they are advisory.
  const blockerCodes: PlanValidationIssueCode[] = [
    'master_tasks_schema_unreadable',
    'projects_schema_unreadable',
    'project_not_found',
    'projects_db_missing',
    'property_missing',
    'property_type_mismatch',
  ];
  const hasBlocker = issues.some((i) => blockerCodes.includes(i.code));
  const schemaOk = masterSchema !== null && !hasBlocker;

  const report: PlanValidationReport = {
    ok: true,
    projectId: draft.projectId,
    normalisedPlan: draft.planSteps,
    plannedMutations,
    echoedDigest,
    idempotencyKey: draft.idempotencyKey,
    schemaOk,
    wouldCreateNTasks: draft.planSteps.length,
    wouldUpdateNTasks: 0,
    checkedDatabases,
    propertyChecks,
    missingProperties,
    typeMismatches,
    unsafeProperties,
    issues,
    warnings,
    meta: {
      skeleton: false,
      phase: '2b',
      readOnly: true,
      notionWritesEnabled: false,
      liveExecution: 'locked',
      authMode,
    },
  };

  appendAuditEvent({
    eventType: schemaOk ? 'PLAN_VALIDATE_SCHEMA_OK' : 'PLAN_VALIDATE_SCHEMA_MISMATCH',
    route,
    method,
    statusCode: 200,
    outcome: 'success',
    clientKeyLabel,
    detailsSummary: `projectId=${projectId} schemaOk=${schemaOk} issues=${issues.length} steps=${draft.planSteps.length} authMode=${authMode}`,
  });

  res.status(200).json(report);
};

export default handler;
