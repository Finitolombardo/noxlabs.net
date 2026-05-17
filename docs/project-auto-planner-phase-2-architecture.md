# Project Auto Planner Phase 2 Architecture Report

> Architekturentwurf für die nächste Stufe: aus lokalem `PlanStep[]`-Entwurf
> echte Notion-Master-Tasks erzeugen, mit Operator-Freigabe und Audit-Log.
>
> **Kein Code geändert.** Diese Datei ist reines Architekturpapier.

## Kurzfazit

Phase 2 bereit planbar: **JA**.

Die Backend-Skeletons (Auth, Rate-Limit, Audit, Notion-Read-Adapter,
Command-Store) sind bereits gebaut und tragen das Modell mit. Die Phase-2-Quest
zerfällt sauber in fünf inkrementelle Sub-Phasen (2A → 2E) mit klaren
Lock-Punkten. Der gefährlichste Sprung ist 2C (erster Notion-Write); davor
liegen drei Stufen reiner Vorbereitung, die parallel zu Phase 1 in Production
deployt werden können, ohne dass etwas Live-Effekt hat.

## Bestehende Struktur

### Frontend (`src/pages/OperatorCockpit.tsx`)

- **Lokaler Project-Auto-Planner-State** (`ProjectsDeepDive`):
  - `projektZiel: string`
  - `planSteps: PlanStep[]` (siehe Typ unten)
  - `plannerSelectedStepId: string | null`
  - `restoredAt: string | null` (Restore-Banner)
  - `emptyGoalHint: boolean`
  - `noxTalkInput`, `noxTalkAnswer` (lokaler NOX-Gesprächsentwurf)
- **Persistenz**: `localStorage` Key `nox.projectPlanner.localDraft.v2`.
  Defensive `isPlanStep`-Validierung, kein Crash bei Schema-Drift.
  Auto-Save in `useEffect`, Hydration per `useRef`-Guard.
- **PlanStep-Typ** (Quelle der Wahrheit für jede Phase-2-Payload):
  ```ts
  type AgentOption = 'NOX Agent' | 'Claude' | 'Codex' | 'Manuell';
  type PlanStepRating = 'gut' | 'unklar' | 'aendern';
  type PlanStep = {
    id: string;
    step: number;
    title: string;
    ziel: string;
    agent: AgentOption;
    output: string;
    risk: 'Niedrig' | 'Mittel' | 'Hoch';
    gate: string;
    reason: string;
    feedback: string;
    rating: PlanStepRating | null;
  };
  ```
- **Output-Drafts** (`OutputArtifact`-Typ): lokaler State, `vormerkenAlsPlanOutput()`
  schreibt einen `outputType: 'Plan'`-Eintrag mit dem gesamten Plan im
  `description`-Feld. Speicherort: `'Lokal / Demo-State'`.
- **Approvals/Blocker** (`Approval`-Typ, `Project.blockers[]`): lokal,
  `DecisionBlockers`-Card zeigt drei `(Phase 2)`-disabled Buttons
  (`Freigeben`, `Rückfrage stellen`, `Ablehnen`).
- **Quest-Generator-State** (`generateLocalPlan`): rein regelbasiert,
  keine KI. Verwendet 4 Stichwort-Cluster (`lead`, `agent/n8n`,
  `content/youtube`, `dropshipping/test`) für leichte Variation.

### API (`api/`)

- **`api/_lib/handler.ts`** — Vercel-kompatibler Handler-Typ, Error-Helpers
  (`badRequest`, `notFound`, `locked`, `tooManyRequests`), `setNoStore`.
- **`api/_lib/auth.ts`** — Operator-Auth (`x-nox-operator-key` oder
  `Authorization: Bearer`). Constant-time-compare. `NOX_OPERATOR_API_KEY`
  Env-Variable. Drei Zustände: `not_configured` (503), `unauthorized` (401),
  `ok` (200).
- **`api/_lib/rateLimit.ts`** — 60 req/60s pro Client-Key (FNV-1a-Hash über
  `x-forwarded-for`/`x-real-ip`). Process-local Map. Kein KV/Redis.
- **`api/_lib/audit.ts`** — In-Memory Ring-Buffer (max 200 Events).
  `AuditEventType` enum mit 20+ Werten. Bereit für KV/Postgres-Backend.
- **`api/_lib/notion.ts`** — **Read-only** Notion-Adapter.
  Nur `POST /v1/databases/{id}/query` (Notion-API ist POST, aber Semantik =
  Read). Helpers: `propTitle`, `propRichText`, `propSelect`,
  `propMultiSelectNames`, `propCheckbox`, `propRelationIds`, `propUrl`.
  Keine Write-Funktion existiert. `extractProjectFields` mappt
  `🧭 Projects / System Map` auf `ExtractedProject`.
- **`api/_lib/store.ts`** — In-Memory `Map<id, OperatorCommand>`. Kein
  Persistenz-Layer. Resets bei jedem Cold-Start.
- **`api/_lib/validation.ts`** — `requireString`, `optionalString`,
  `optionalBoolean`, `optionalIdempotencyKey`, plus
  `isAllowedCommandType`/`isAllowedRiskLevel`/`isAllowedAction`.
- **`api/_lib/types.ts`** — `OperatorCommand`, `CommandType`,
  `CommandStatus`, `RiskLevel`, `CommandAction`, `DryRunResult`,
  `HistoryEntry`, `ProjectContextResponse` plus alle Sub-Typen,
  `ReferenceArtifact` (definiert, **nicht implementiert**),
  `NotionUpstreamDiagnostic`.
- **`api/operator/commands.ts`** — `GET /api/operator/commands` (list),
  `POST` (create). Voll-Pipeline (rate-limit → auth → method →
  validate → audit → in-memory save). Status-Maschine:
  `Draft | Dry-Run bereit | Freigabe noetig | Freigegeben | Gesperrt | Erledigt`.
- **`api/operator/commands/[id]/[action].ts`** — fünf Actions:
  - `dry-run` (Status → `Dry-Run bereit`, Stub-DryRunResult)
  - `request-approval` (Status → `Freigabe noetig`)
  - `approve` (Status → `Freigegeben`)
  - `reject` (Status → `Gesperrt`)
  - `execute` (**permanent locked**, 423)
- **`api/operator/audit.ts`** — `GET /api/operator/audit` (list)
- **`api/operator/projects/[projectId]/context.ts`** —
  `GET /api/operator/projects/:projectId/context`. Drei
  Mapping-Modi: `none`, `title-prefix`, `notion-relation` (canonical).
  Read-only Master-Tasks-Projektion mit `🤖 Bearbeitungsstatus`,
  `🤖 Was fehlt noch`, `🤖 Ergebnis`, `Freigegeben`, `Freigabe nötig`,
  `Quest starten`, `Quest abgeschlossen`.

### Notion

- **Tokens (server-only)**:
  - `NOX_NOTION_READONLY_TOKEN` — read-only Integration-Token
  - `NOX_OPERATOR_API_KEY` — Operator-API-Gate
  - `NOX_PROJECT_MAPPING_MODE` = `none | title-prefix | notion-relation`
  - `NOX_MASTER_TASKS_DB_ID` — DB-ID `Master Tasks`
  - `NOX_PROJECTS_DB_ID` — DB-ID `🧭 Projects / System Map`
  - `NOX_NOTION_FETCH_TIMEOUT_MS` — optional (1000–15000ms, Default 8000)
- **Aktuell ungesetzt** (Bridge-Skeleton, Phase 2 separat):
  - `ANDROMEDA_DISPATCH_URL`, `ANDROMEDA_HMAC_SECRET` (Cluster 1 im
    Rename-Inventar)
- **Master-Tasks-DB (`NOX_MASTER_TASKS_DB_ID`)** — heute read-only verwendet:
  - Title-Property: `Titel` / `Title` / `Name`
  - `🤖 Bearbeitungsstatus` (select): `Blockiert`, `Review nötig`, …
  - `🤖 Was fehlt noch` (rich_text) — Blocker-Text
  - `🤖 Ergebnis` (rich_text)
  - `🤖 Nächster Agent` (select)
  - `Agent` (select)
  - `Freigegeben` (checkbox)
  - `Freigabe nötig` (checkbox)
  - `Quest starten` (checkbox)
  - `Quest abgeschlossen` (checkbox)
  - `Project` (relation → Projects DB) — Filter-Property bei
    `mode=notion-relation`
- **Projects-DB (`NOX_PROJECTS_DB_ID`, `🧭 Projects / System Map`)** —
  read-only:
  - Title: `Projekt` / `Project` / `Name` / `Titel`
  - `Project ID` (rich_text) — kanonischer Lookup-Schlüssel
  - `Status`, `Typ`, `Priorität` (select)
  - `Vision`, `Aktueller Stand`, `Nächste Aktion`, `Erlaubte Aktionen`,
    `Verbotene Aktionen`, `Artifact Links` (rich_text)
  - `Andromeda Kontext` (rich_text) — **bleibt Notion-Property-Name**
    (Rename-Cluster 2)
  - `Primary URL` (url)

### Types (Browser ↔ Server)

- `src/types/operatorContext.ts` mirrort `api/_lib/types.ts:ProjectContextResponse`
  (BRIDGE-05a). Bewusst dupliziert, damit der Vite-Bundle keinen
  Server-Code zieht. Migrationsdisziplin: bei jedem Wire-Format-Change
  beide synchron umbenennen.
- `andromedaContext` ist **vier-Stellen-Vertrag** (Cluster 3 im Inventar):
  `api/_lib/notion.ts` → `api/_lib/types.ts` →
  `api/operator/projects/[projectId]/context.ts` →
  `src/types/operatorContext.ts` → `src/pages/OperatorCockpit.tsx`.

## Empfohlener Datenfluss

```
+---------------------------- Phase 1 (live) ----------------------------+
|                                                                       |
|  Operator gibt Projektziel ein                                        |
|         |                                                             |
|         v                                                             |
|  generateLocalPlan(goalRaw) [pure, rule-based, no KI/API]             |
|         |                                                             |
|         v                                                             |
|  setPlanSteps(...)  ->  localStorage `nox.projectPlanner.localDraft`  |
|         |                                                             |
|         v                                                             |
|  Operator editiert (Titel, Ziel, Reason, Output, Agent, Risk,         |
|  Operator-Check, Feedback, Rating)                                    |
|         |                                                             |
|         v                                                             |
|  „Als Plan-Output vormerken" -> lokaler OutputArtifact Draft          |
|                                                                       |
+----------------------------- BARRIER (Operator-Klick) ----------------+
|                                                                       |
|  Phase 2A: Operator klickt „Plan-Preview anfordern"                   |
|         |                                                             |
|         v                                                             |
|  POST /api/operator/projects/<projectId>/plan/preview                 |
|         { projectGoal, planSteps[], idempotencyKey }                  |
|         |                                                             |
|         v   (kein Notion-Write, nur Validation + Echo)                |
|  Response: PlanPreviewResponse                                        |
|         { normalisedPlan, plannedNotionMutations[], blockedReasons[]} |
|                                                                       |
+----------------------------- BARRIER (Operator-Klick) ----------------+
|                                                                       |
|  Phase 2B: Backend prueft Notion-Schema gegen geplante Mutationen     |
|         |                                                             |
|         v                                                             |
|  Backend prueft per Notion-READ (kein Write):                         |
|   - Projekt existiert in Projects DB                                  |
|   - Master Tasks DB hat alle benoetigten Properties                   |
|   - Properties haben erwarteten Typ                                   |
|         |                                                             |
|         v                                                             |
|  PlanValidationReport                                                 |
|         { schemaOk, missingProperties[], typeMismatches[],            |
|           wouldCreateNTasks, wouldUpdateNTasks, duplicates[] }        |
|                                                                       |
+----------------------------- BARRIER (Operator-Go) -------------------+
|                                                                       |
|  Phase 2C: Operator klickt „Quests in Notion erzeugen"                |
|         |                                                             |
|         v                                                             |
|  POST /api/operator/projects/<projectId>/plan/commit                  |
|         { planDraftId, idempotencyKey, planDigest }                   |
|         |                                                             |
|         v   (erster Notion-Write, atomar pro Step)                    |
|  Backend ruft Notion `POST /v1/pages` pro Step auf                    |
|  Idempotenz: planDigest + step.id im Audit-Log                        |
|         |                                                             |
|         v                                                             |
|  PlanCommitResponse                                                   |
|         { createdQuests[], failedQuests[], auditEventIds[] }          |
|                                                                       |
+----------------------------------------------------------------------+
|                                                                       |
|  Phase 2D: Audit-Eintrag + Output-Verknüpfung                         |
|         |                                                             |
|         v                                                             |
|  Audit-Log persistiert `PLAN_COMMIT_*` Events                         |
|  Frontend ersetzt lokale `PlanStep[]` durch echte                     |
|    `ProjectContextQuest[]` aus /context-Refresh                       |
|  Output-Draft (`outputType: 'Plan'`) wird verknuepft mit createdQuests|
|                                                                       |
+----------------------------------------------------------------------+
|                                                                       |
|  Phase 2E (optional): Agent-Dispatch                                  |
|         |                                                             |
|         v                                                             |
|  Operator klickt „NOX Agent starten" auf einer Quest                  |
|  POST /api/operator/commands (commandType: AGENT_DISPATCH_QUEST,      |
|                                payload: questId, planStepId, agent)  |
|  Backend setzt Notion-Property `Quest starten` = true                 |
|  Dispatcher (separate Quest!) liest `Quest starten` und triggert      |
|  Telegram/n8n/echten Agent-Run                                        |
|                                                                       |
+----------------------------------------------------------------------+
```

## Phasenplan

### Phase 2A — Draft Preview (read-only, kein Write)

**Ziel**: Operator klickt im Planner-Modal „Plan-Preview anfordern". Backend
validiert die Payload, mappt jeden `PlanStep` auf eine geplante
`PlanMutation` (`create_task` oder `update_task`) und gibt eine
deterministische Vorschau zurück. **Kein Notion-Write.**

**Neue Routen**:
- `POST /api/operator/projects/:projectId/plan/preview`

**Neue Types**:
- `PlanPreviewRequest`, `PlanPreviewResponse`, `PlanMutation`,
  `PlanValidationIssue`.

**Pipeline** (folgt dem `commands.ts`-Muster):
1. `setNoStore`
2. `checkRateLimit`
3. `checkOperatorAuth`
4. `methodAllowed(['POST'])`
5. `projectId`-Regex-Validierung (PROJECT_ID_RE)
6. Payload-Validation (Plan-Schema, `idempotencyKey`, agent allowlist,
   risk allowlist, max-step-count, max-text-length)
7. `appendAuditEvent('PLAN_PREVIEW_*', …)`
8. Response `PlanPreviewResponse`

**Risiko**: keines.
- Kein Notion-Write
- Kein Vercel-Env-Change
- Kein Build-Risk (neue Route, separater File)
- Bricht keine bestehenden Endpoints

**Done-Gates**: Lint/Typecheck/Build grün. Audit-Event-Type erweitert.

### Phase 2B — Backend Validation gegen Notion-Schema

**Ziel**: Backend ruft **read-only** Notion ab und prüft, ob die geplanten
Mutationen schema-konform sind (Property existiert? Typ korrekt? Projekt
existiert? Duplikat-Title?).

**Neue Routen**:
- `POST /api/operator/projects/:projectId/plan/validate`
  - Akzeptiert die gleiche Payload wie `/preview`
  - Antwortet mit `PlanValidationReport`

**Erweiterte Notion-Adapter-Funktionen**:
- `getDatabaseSchema(token, dbId)` — neuer Helper, ruft
  `GET /v1/databases/{id}` auf (read-only). Pinned `Notion-Version`,
  TimeoutGuard wie heute.
- `checkPropertyExists(schema, name, expectedType)` — pure.

**Neue Master-Tasks-Properties, die das Schema haben sollte**:
- `Plan Draft ID` (rich_text) — Operator-seitige `id` aus PlanStep, zur
  Idempotenz. **Schema-Add via Operator-Hand in Notion** (siehe Risiken).
- `Plan Draft Digest` (rich_text) — SHA-256 über den Plan, zur
  Vermeidung von Doppel-Commits. Optional, kann auch in der Audit-DB
  leben.
- `Schritt-Reihenfolge` (number) — optional, sonst über Title-Prefix.
- `Reason` (rich_text) — `PlanStep.reason`.
- `Operator-Check` (rich_text) — `PlanStep.gate`.

**Allowlist** (keine neuen Property-Namen ohne Operator-Decision):
- Backend hat eine `ALLOWED_MASTER_TASKS_WRITE_PROPERTIES`-Konstante.
- Validate-Endpoint vergleicht die geplanten Property-Writes gegen diese
  Allowlist + das tatsächliche Notion-Schema.

**Risiko**: minimal.
- Erste Live-Schema-Reads gegen Notion (aber bereits per
  `queryProjectsByProjectId` etabliert)
- Kein Write
- Neue Audit-Event-Types: `PLAN_VALIDATE_SCHEMA_OK`,
  `PLAN_VALIDATE_SCHEMA_MISMATCH`

**Done-Gates**:
- Lint/Typecheck/Build grün
- Operator-Smoke-Test gegen Live-Notion mit Read-Only-Token (existiert)
- Schema-Properties dokumentiert in dieser Datei + Bridge-Spec
  aktualisiert

### Phase 2C — Operator-Go → erster Notion-Write

**Ziel**: Operator klickt „Quests in Notion erzeugen". Backend wird
**zum ersten Mal in der Repo-History** Pages in Notion anlegen.

**Vorbedingungen** (alle müssen erfüllt sein):
1. Read-Only-Token-Pfad funktioniert (Phase 1)
2. Validate-Endpoint sagt `schemaOk: true` (Phase 2B)
3. Operator hat **separates** `NOX_NOTION_WRITE_TOKEN` server-seitig
   konfiguriert — eigener Integration mit minimalem Scope auf die zwei
   Datenbanken (Master Tasks + Projects)
4. Notion-Schema enthält die in 2B geplanten Write-Properties
5. `NOX_NOTION_WRITE_ENABLED=true` als zusätzliches Feature-Flag (Default
   `false`)

**Neue Env-Variablen**:
- `NOX_NOTION_WRITE_TOKEN`
- `NOX_NOTION_WRITE_ENABLED` (Boolean-Flag, Default false)

**Neue Routen**:
- `POST /api/operator/projects/:projectId/plan/commit`
  - Requires `idempotencyKey`
  - Requires `planDigest` (SHA-256 hex über den Plan)
  - Status 423 wenn `NOX_NOTION_WRITE_ENABLED` nicht gesetzt

**Neue Notion-Adapter-Funktion**:
- `createMasterTaskPage(token, dbId, properties)` — ruft
  `POST /v1/pages` mit `parent.database_id`. Schreibt ausschließlich
  Properties aus der server-seitigen Allowlist.

**Idempotenz-Strategie**:
- Pre-Check: Vor jedem `createMasterTaskPage` filtert das Backend
  Master Tasks per `Plan Draft Digest` = digest UND `Plan Draft ID` =
  `step.id`. Wenn Treffer: kein erneuter Write, Eintrag wird als
  `'already_committed'` in `PlanCommitResponse.createdQuests[]` mit
  bestehendem `questId` zurückgegeben.
- Audit-Event `PLAN_COMMIT_IDEMPOTENT_HIT` bei jedem Skip.

**Atomarität**:
- Notion hat keine echte Multi-Page-Transaction. Backend macht den Write
  pro Step sequenziell und protokolliert jeden erfolgreichen Write
  separat. Bei Partial-Failure (z.B. Step 4 von 7 schlägt fehl) gibt es
  einen `partial_commit` Audit-Event und Response `failedQuests[]`
  enthält die Stelle. **Kein Rollback** — Operator entscheidet manuell,
  ob bereits erstellte Quests gelöscht werden sollen.

**Risiko**: **hoch**. Dies ist der erste schreibende Code-Pfad.
- Falsches DB-ID → schreibt in falsche Datenbank
- Falscher Property-Typ → Notion-API-400, harmlos
- Race-Conditions zwischen Plan-Edits und Commit → Operator muss
  zwischen `/validate` und `/commit` neu validieren wenn Plan editiert
  wurde (digest-Mismatch)
- Token-Leak in Audit-Log → strikt gleiches Pattern wie
  `notion.ts`: Token aus `process.env` lesen, nie im Response-Body
  echoen
- Vercel-Function-Timeout (10s Hobby) → 7 Steps × ~600ms Notion-Latency
  ist machbar, aber bei >10 Steps Splitting in mehrere Commit-Requests
  nötig

**Done-Gates**:
- Lint/Typecheck/Build grün
- Operator hat in Notion eine **Test-Projects-Zeile** angelegt (eigene
  Projekt-ID, z.B. `TEST_PLAN_COMMIT`)
- Erster Commit gegen die Test-Projekt-Zeile macht 1 echte Quest, dann
  manuell verifiziert
- Idempotenz-Test: zweiter Commit-Call macht nichts (alles
  `already_committed`)
- Audit-Log enthält alle Schritte

### Phase 2D — Audit / Outputs

**Ziel**: Operator sieht echte Master-Tasks-Quests im Cockpit, Output-Draft
ist mit den erstellten Quests verknüpft, Audit-Log persistiert die
Plan-Commit-Events.

**Erweiterungen am Frontend**:
- `ProjectsDeepDive` hört auf `PLAN_COMMITTED`-Event vom Backend
  (Long-Polling oder einfach Operator-Trigger `Kontext laden`).
- `LinkedQuests`-Card zeigt die echten Quests aus
  `/api/operator/projects/:projectId/context`.
- Output-Card zeigt verknüpfte `createdQuests`-IDs.
- `planSteps` werden nach erfolgreichem Commit aus `localStorage`
  entfernt (oder als `committedAt`-flagged eingefroren — Operator-Decision).

**Erweiterungen am Audit-Layer**:
- Audit-Log wandert von In-Memory-Ring auf Persistenz (Vercel KV oder
  Postgres). Eigene Quest, aber Vorbedingung für vernünftige
  Phase-2D-Reports.
- Neuer Event-Type: `PLAN_PREVIEW_REQUESTED`, `PLAN_VALIDATED`,
  `PLAN_COMMIT_ATTEMPT`, `PLAN_COMMIT_SUCCESS`, `PLAN_COMMIT_PARTIAL`,
  `PLAN_COMMIT_FAILED`, `PLAN_COMMIT_IDEMPOTENT_HIT`.

**Risiko**: niedrig.
- Read-Only-Refresh-Pfad
- Output-Verknüpfung lebt zunächst nur lokal — kann später nach Notion
  ausgerollt werden, ist aber nicht Phase-2-blocker

**Done-Gates**:
- Operator klickt „Plan committen", Plan-Steps verschwinden, neue
  Quests erscheinen in `LinkedQuests`
- Audit-Endpoint zeigt alle Phase-2-Events

### Phase 2E — Agent Dispatch (optional, eigene Migrationsquest)

**Ziel**: Eine erstellte Master-Tasks-Quest kann tatsächlich an einen
Agent dispatched werden.

**Vorbedingungen** (Cluster 1 + 6 aus Rename-Inventar):
- HMAC-gesicherter Backend-Proxy
- `ANDROMEDA_DISPATCH_URL` / `ANDROMEDA_HMAC_SECRET` (oder umbenannt
  `NOX_AGENT_*`) gesetzt in Vercel-Env
- `execute`-Action des Command-Store geht von `423 locked` zu `200 ok`

**Neue Pipeline**:
- Operator klickt auf erstellter Quest „An NOX Agent übergeben"
- Frontend macht `POST /api/operator/commands` mit
  `commandType: 'AGENT_DISPATCH_QUEST'`
- Backend setzt Master-Tasks-Property `Quest starten = true` (**Notion-Write**)
- Separate Dispatcher-Quest (außerhalb von Phase 2) liest
  `Quest starten`-Polling/Webhook und triggert echten Agent-Run

**Risiko**: hoch — eigene Migrationsquest. Nicht in Phase 2 enthalten.

## Payload-Vorschlag

```ts
// =============================================================================
// Wire-Format für Phase 2A/2B/2C. Bewusst flach, defensiv, JSON-only.
// Lebt in api/_lib/types.ts mit Browser-Mirror in src/types/projectPlanner.ts.
// =============================================================================

// --- Plan-Step (Mirror von Frontend PlanStep, server-seitig validiert) ---

export type PlanStepAgent = 'NOX Agent' | 'Claude' | 'Codex' | 'Manuell';
export type PlanStepRisk = 'Niedrig' | 'Mittel' | 'Hoch';
export type PlanStepRating = 'gut' | 'unklar' | 'aendern';

export interface PlanStepWire {
  id: string;          // /^[A-Za-z0-9_-]{4,80}$/, vom Frontend gestellt
  step: number;        // 1..50
  title: string;       // <= 200
  ziel: string;        // <= 1000
  agent: PlanStepAgent;
  output: string;      // <= 500
  risk: PlanStepRisk;
  gate: string;        // <= 200, optional ("Operator-Check ...")
  reason: string;      // <= 1000
  feedback: string;    // <= 1000
  rating: PlanStepRating | null;
}

// --- ProjectPlanDraft (Top-Level-Payload Operator → Backend) ---

export interface ProjectPlanDraft {
  projectId: string;          // Path-Param, hier echoed zur Konsistenz
  projectGoal: string;        // <= 2000
  planSteps: PlanStepWire[];  // 1..30
  // SHA-256 hex über (projectId | projectGoal | planSteps[]). Backend
  // berechnet selbst und vergleicht mit `planDigest` aus dem Commit-Call.
  planDigest: string;
  // Idempotenz pro Operator-Klick (NICHT pro Step)
  idempotencyKey: string;     // 4..128 chars, /^[A-Za-z0-9_:.-]+$/
}

// --- Phase 2A: /plan/preview ---

export interface PlanMutation {
  kind: 'create_task' | 'update_task' | 'noop';
  planStepId: string;
  // Geplanter Title in Master Tasks
  proposedTitle: string;
  // Properties, die das Backend setzen würde, gemappt auf Notion-Property-
  // Namen + Wert + Typ. Operator sieht diese Tabelle vor dem Commit.
  proposedProperties: PlanProposedProperty[];
  // Falls duplicate detection im Preview greift
  existingQuestId?: string;
  warnings: string[];
}

export interface PlanProposedProperty {
  notionPropertyName: string;     // z.B. "Titel", "Agent", "🤖 Was fehlt noch"
  notionPropertyType: 'title' | 'rich_text' | 'select' | 'checkbox' | 'number' | 'relation' | 'url';
  value: string | number | boolean | string[];
  sourcePlanField: keyof PlanStepWire | 'projectRelation' | 'planDraftId' | 'planDraftDigest' | 'reihenfolge';
}

export interface PlanPreviewResponse {
  ok: true;
  projectId: string;
  normalisedPlan: PlanStepWire[];   // nach trim + sort + step-Renumber
  plannedMutations: PlanMutation[];
  echoedDigest: string;
  meta: {
    skeleton: false;
    readOnly: true;
    liveExecution: 'locked';
  };
}

// --- Phase 2B: /plan/validate ---

export type PlanValidationIssueCode =
  | 'project_not_found'
  | 'project_id_mismatch'
  | 'master_tasks_db_missing'
  | 'property_missing'
  | 'property_type_mismatch'
  | 'select_option_missing'
  | 'duplicate_title'
  | 'plan_digest_already_committed'
  | 'plan_too_large'
  | 'agent_not_allowed';

export interface PlanValidationIssue {
  code: PlanValidationIssueCode;
  planStepId?: string;
  notionPropertyName?: string;
  expected?: string;
  actual?: string;
  message: string;
}

export interface PlanValidationReport {
  ok: true;
  projectId: string;
  schemaOk: boolean;                // false wenn irgendein issue.code property_*
  wouldCreateNTasks: number;
  wouldUpdateNTasks: number;
  duplicates: Array<{ planStepId: string; existingQuestId: string }>;
  issues: PlanValidationIssue[];
  // Nur wenn schemaOk && issues alle 'duplicate_title' (operator-decidable)
  commitToken?: string;             // Server-signiert (HMAC, 5-Min-TTL).
                                    // Phase 2C verlangt diesen Token im Body.
  meta: {
    skeleton: false;
    readOnly: true;
    liveExecution: 'locked';
  };
}

// --- Phase 2C: /plan/commit ---

export interface PlanCommitRequest {
  projectId: string;
  planDigest: string;            // muss dem aktuellen Plan entsprechen
  idempotencyKey: string;
  commitToken: string;           // aus PlanValidationReport (server-signiert)
  approverLabel: string;         // freier Operator-Label, <= 80 chars
}

export interface PlanCommitItemResult {
  planStepId: string;
  status: 'created' | 'updated' | 'already_committed' | 'failed';
  questId?: string;              // Notion page_id
  questUrl?: string;             // Notion url
  error?: { code: string; message: string }; // safely truncated
}

export interface PlanCommitResponse {
  ok: true;
  projectId: string;
  createdQuests: PlanCommitItemResult[];
  failedQuests: PlanCommitItemResult[];
  auditEventIds: string[];
  outputDraftLinkId?: string;     // Verknüpfung zum bestehenden Plan-Output
  meta: {
    skeleton: false;
    writeMode: 'notion_master_tasks';
    liveExecution: 'locked';      // Agent-Dispatch bleibt 2E
  };
}

// --- Audit (Erweiterung des existierenden Audit-Layers) ---

export type PlanAuditEventType =
  | 'PLAN_PREVIEW_REQUESTED'
  | 'PLAN_PREVIEW_RESPONDED'
  | 'PLAN_VALIDATE_ATTEMPT'
  | 'PLAN_VALIDATE_SCHEMA_OK'
  | 'PLAN_VALIDATE_SCHEMA_MISMATCH'
  | 'PLAN_COMMIT_ATTEMPT'
  | 'PLAN_COMMIT_SUCCESS'
  | 'PLAN_COMMIT_PARTIAL'
  | 'PLAN_COMMIT_FAILED'
  | 'PLAN_COMMIT_IDEMPOTENT_HIT';

// --- Output-Verknüpfung (Phase 2D) ---

export interface PlanCommitOutputLink {
  outputDraftId: string;          // existierender lokaler OutputArtifact.id
  questIds: string[];             // verknüpfte Master-Tasks-Page-IDs
  commitDigest: string;
  committedAt: string;            // ISO
  approverLabel: string;
}
```

## Risiken

### Falsche Notion-Properties

- **Symptom**: Backend versucht in Property zu schreiben, die nicht
  existiert oder einen anderen Typ hat → Notion-API-400.
- **Mitigation**: Phase 2B `/validate` ruft **vor** dem Commit das
  Notion-Schema ab und prüft jede geplante Property. Plus server-seitige
  Allowlist `ALLOWED_MASTER_TASKS_WRITE_PROPERTIES`.

### Doppelte Quests

- **Symptom**: Operator klickt zweimal „Commit", Backend legt jeden
  Step zweimal an.
- **Mitigation**: 4-Schicht-Idempotenz:
  1. `idempotencyKey` im Request-Body (Frontend-Generated, pro Klick)
  2. `planDigest` (deterministischer Hash über den Plan)
  3. `commitToken` aus `/validate` (HMAC, 5-Min-TTL, single-use)
  4. Pre-Commit-Read in Notion mit Filter
     `(Plan Draft Digest = digest AND Plan Draft ID = step.id)` →
     `already_committed`

### Fehlende Idempotenz

- **Symptom**: Vercel-Function-Retry oder Race zwischen zwei
  Browser-Tabs erzeugt Duplikate.
- **Mitigation**: siehe oben. Zusätzlich Audit-Log mit `idempotencyKey`
  als Index. KV/Postgres-Migration für Audit-Persistenz ist
  Vorbedingung für vernünftige Idempotenz-Protokolle.

### Fehlende Operator-Freigabe

- **Symptom**: Plan-Commit läuft ohne explizite Operator-Zustimmung.
- **Mitigation**:
  1. `/preview` und `/validate` sind **idempotent und Notion-read-only**
  2. `/commit` verlangt `commitToken` aus `/validate` (frisch, HMAC,
     5-Min-TTL)
  3. Feature-Flag `NOX_NOTION_WRITE_ENABLED` muss server-seitig auf
     `true` stehen
  4. UI zeigt vor Commit eine `summary`-View mit der genauen Liste der
     geplanten Mutationen und blockt den Button bis Operator
     `approverLabel` eingibt

### Falscher Agent

- **Symptom**: PlanStep hat `agent: 'Manuell'`, aber Backend dispatched
  trotzdem.
- **Mitigation**:
  - Phase 2C schreibt nur Master-Tasks-Quests, **keinen Dispatch**
  - Phase 2E (eigene Quest) entscheidet pro Quest, ob `Quest starten`
    automatisch gesetzt wird. Aktuell **nicht** Teil von Phase 2.
  - Server-seitige Allowlist: `AGENT_OPTIONS` aus Frontend-Code
    spiegeln (`['NOX Agent', 'Claude', 'Codex', 'Manuell']`).

### Secrets / Env

- **Risiko**: `NOX_NOTION_WRITE_TOKEN` ist der erste schreibende
  Notion-Token in diesem Repo. Leak wäre kritisch.
- **Mitigation**:
  - Separate Integration mit minimalem Scope (nur die zwei DBs)
  - Token nur in Vercel-Env, nicht in `.env.example`
  - Adapter liest `process.env` pro Request, nie modul-global
  - Audit-Log hat keine Token-Echo-Pfade — `notion.ts:readNotionConfig`
    pattern weiterführen
  - Backup-Plan: Token kann Notion-seitig in 1 Klick rotiert werden

### Production-Writes (Schock-Frosch-Szenario)

- **Risiko**: Phase 2C ist in Production deployt aber
  `NOX_NOTION_WRITE_ENABLED` ist versehentlich auf `true` ohne
  Operator-Awareness → ein Frontend-Bug erzeugt 100 Quests.
- **Mitigation**:
  - Rate-Limit greift sowieso (60/min)
  - Feature-Flag **default `false`**
  - Backend antwortet 423 wenn Flag aus
  - Frontend-Button bleibt disabled bis `/validate` `commitToken`
    zurückgibt
  - Audit-Log + `partial_commit`-Behavior ermöglicht manuelles Cleanup

### Migration Andromeda-Identifier

- **Risiko**: Cluster 1–6 aus `docs/nox-agent-rename-inventory.md` sind
  in Phase 2 nicht angefasst. Spätere Rename-Migration könnte mit
  Phase-2-Code kollidieren, wenn z.B. `ANDROMEDA_DISPATCH_URL`
  parallel zu Phase-2E-Code umbenannt werden soll.
- **Mitigation**:
  - Phase 2 **fasst die Andromeda-Identifier explizit nicht an**
  - Cluster-1-Rename (Env-Vars) wird in eigener Quest atomar mit der
    Vercel-Env-Mutation gemacht **nach** Phase 2E (falls 2E überhaupt
    je in Production geht)
  - Cluster-2-Rename (`Andromeda Kontext`-Notion-Property) ist eine
    **Schema-Migration in Notion** — eigener Operator-Klick, eigene
    Quest, eigener PR
  - Cluster-3-Rename (`andromedaContext`-Vertrag) muss alle 4 Stellen
    atomar — eigener PR, kein Backport in Phase 2

### Vercel-Function-Timeout

- **Risiko**: Hobby-Tier hat 10s Timeout. 7 Steps × 600ms Notion-Latency
  + Validation = nahe an der Grenze.
- **Mitigation**:
  - `/commit` schreibt **sequenziell** mit Per-Step-Audit, kann bei
    Timeout fortgesetzt werden (Audit + Idempotenz machen es safe)
  - Falls Plan >10 Steps: Backend splittet automatisch in mehrere
    `commit`-Aufrufe, oder Frontend zeigt Hinweis „Plan in mehreren
    Schritten committen"
  - Notion-Fetch-Timeout aus `notion.ts` (Default 8000ms) gilt auch
    für Writes

### Read-Token vs Write-Token Trennung

- **Best Practice**: Read-Pfad (Phase 1, BRIDGE-05a, /context) nutzt
  weiterhin `NOX_NOTION_READONLY_TOKEN`. Write-Pfad (Phase 2C) nutzt
  **separates** `NOX_NOTION_WRITE_TOKEN`. So bleibt der Read-Token bei
  einem Write-Token-Leak unangetastet und Operator kann nur den Write
  rotieren.

## Implementation Plan (Reihenfolge)

1. **Quest „Phase 2A"** (kein Notion-Write):
   - `api/operator/projects/[projectId]/plan/preview.ts` + Types
   - Frontend-Button „Plan-Preview anfordern" im Planner-Modal
   - Audit-Events erweitert
   - Lint/Typecheck/Build grün, Commit, Push, Vercel Production

2. **Quest „Phase 2B"** (Schema-Validate, weiterhin kein Write):
   - `api/operator/projects/[projectId]/plan/validate.ts` + Types
   - `getDatabaseSchema`-Adapter
   - Allowlist `ALLOWED_MASTER_TASKS_WRITE_PROPERTIES`
   - Optionaler `commitToken` (HMAC, 5min)
   - Notion-Schema-Add in der Notion-UI (Operator-Hand): `Plan Draft ID`,
     `Plan Draft Digest`, `Reason`, `Operator-Check` als rich_text in
     Master Tasks
   - Frontend zeigt `PlanValidationReport`-Tabelle

3. **Quest „Phase 2C-Pre"** (Env + Test-Projekt):
   - Operator legt in Vercel `NOX_NOTION_WRITE_TOKEN`,
     `NOX_NOTION_WRITE_ENABLED=false` an
   - Operator legt in Notion das Test-Projekt `TEST_PLAN_COMMIT` an

4. **Quest „Phase 2C"** (erster Notion-Write):
   - `api/operator/projects/[projectId]/plan/commit.ts` + Types
   - `createMasterTaskPage`-Adapter
   - End-to-End-Smoke-Test gegen `TEST_PLAN_COMMIT`
   - Audit-Persistenz-Migration (eigene Quest oder parallel)

5. **Quest „Phase 2D"** (Audit + Output-Verknüpfung):
   - Frontend-Refresh nach Commit
   - Output-Draft → CreatedQuests-Verknüpfung
   - Audit-Endpoint zeigt Phase-2-Events

6. **Quest „Phase 2E"** (Agent-Dispatch — separat, eigene Migrationsquest):
   - Vorbedingung: Cluster 1 (Env-Rename Andromeda → NOX Agent)
   - Backend-Proxy mit HMAC
   - `execute`-Action unblocken (kontrolliert)

## Nicht in Phase 2

- Andromeda → NOX-Agent **Identifier-Rename** (Cluster 1–6 aus
  Rename-Inventar)
- `andromedaContext` → `noxAgentContext` (4-Stellen-Vertrag, eigene Quest)
- Notion-Property `Andromeda Kontext` umbenennen (Notion-Schema-Quest)
- TS-Typnamen `AndromedaCommand*` → `NoxAgentCommand*` (TS-Refactor-Quest)
- Echte Agent-Ausführung über Telegram/n8n
- Read-write-Notion-Token mit erweitertem Property-Scope
- Multi-User-Auth (heute: ein shared `NOX_OPERATOR_API_KEY`)

## Hard Rails (Phase 2 invariants)

- **Read-only token bleibt read-only**: `NOX_NOTION_READONLY_TOKEN` wird
  in Phase 2 nie zum Schreiben verwendet. Separater Token.
- **Kein `execute` ohne Cluster-1-Rename + HMAC + Approval-Gate**:
  `api/operator/commands/[id]/[action].ts:execute` bleibt **423 locked**
  bis Phase 2E. Phase 2A–2D triggern execute nicht.
- **Kein Frontend-Notion-Call**: alle Notion-Reads und -Writes laufen
  ausschließlich server-seitig.
- **Kein Token im Bundle**: Frontend kennt weder Read- noch Write-Token.
- **Kein Token in Response/Audit**: alle Token-Reads passieren in
  `process.env`-Lookups innerhalb von Request-Handlern, nie modul-global.
- **Idempotenz vor Schreiben**: kein `POST /v1/pages` ohne vorherigen
  Idempotenz-Check.
- **Kein Schema-Auto-Add**: das Backend legt **nie** neue Properties in
  Notion-Datenbanken an. Schema-Änderungen sind Operator-Hand-Migration.
- **Feature-Flag Default false**: `NOX_NOTION_WRITE_ENABLED=false` ist
  der einzige sichere Default.
