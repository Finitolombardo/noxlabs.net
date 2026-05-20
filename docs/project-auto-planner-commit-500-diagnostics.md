# Project Auto Planner — Commit 500 Diagnostics

> Stand: 2026-05-20 · Branch: `docs/phase-2e-runbook`
> Bearbeiter: Claude (operative zweite rechte Hand)
> Scope: **Server-Härtung für `/plan/commit` Fehlerpfad + Frontend-UI-Klarheit.** Keine echten Notion-Writes, kein Vercel, kein n8n, kein Dispatcher, kein Stash pop, keine Chatpanel-Arbeit, kein Commit/Push ohne Operator-Go.

Abschlussmarker: `PROJECT_AUTO_PLANNER_COMMIT_500_DIAGNOSTICS_READY`

---

## Fehlerbild

Phase-2E-Smoke war bis zum Commit-Klick sauber:

- Project Auto Planner: „1 Quest bereit", Digest vorhanden, Button „1 Quest erzeugen".
- Tech-Check grün: Preview OK, Schema OK, Missing 0, Unsafe 0, Projekt-ID `APP-X`, 1 Schritt.

Beim Klick auf „1 Quest erzeugen" zeigte das Frontend **„Fehler (HTTP 500)"** — ohne `error`-Code, ohne `message`, ohne Diagnostik. Kein Notion-Page erzeugt, kein Audit-Eintrag im Frontend sichtbar.

## Mögliche Root Causes

Der Commit-Handler `api/operator/projects/[projectId]/plan/commit.ts` hatte **kein top-level try/catch**. Jede unbehandelte Exception innerhalb der 13 Gates leakt als generischer Vercel-500 ohne JSON-Body durch. Der Frontend-Client (`fetchPlanCommit`) parst dann ein leeres Body, fällt auf den `{ ok: false, status: 500 }`-Fallback zurück, und die UI zeigt nur den Statuscode.

Wahrscheinliche Auslöser für einen Throw zwischen Validate (OK) und der per-Step-Schleife:

1. **`NOX_NOTION_WRITE_TOKEN` fehlt oder hat keinen Insert-Scope auf Master Tasks.** Der Adapter `createMasterTaskPage` würde sauber `{ ok: false, statusCode: 4xx }` zurückgeben — kein Throw. Aber der **Token-Scope-Check passiert erst zum Zeitpunkt des Page-Creates**, nicht beim Schema-Read. Token mit nur Read-Scope ist mit Validate kompatibel, aber inkompatibel mit Commit.
2. **Notion-Integration ist nicht auf die Master-Tasks-DB freigegeben.** Notion antwortet mit `object_not_found` (404). Adapter gibt `ok: false` zurück — kein Throw.
3. **Property-Mapping schlägt fehl**, weil alle proposed properties durch den Allowlist-/Relation-Filter gedroppt werden. Dann ist das Notion-Payload `{}`, Notion erzeugt eine leere „Untitled" Page oder 400-rejects. Adapter gibt ok:false zurück — kein Throw.
4. **`buildPlannedMutations` oder `mapPlanMutationToNotionProperties` werfen** durch einen Edge-Case in den Step-Daten. Die Helper sind als Pure dokumentiert, haben aber keine try/catch — ein Tippfehler in einem Property-Wert oder eine unerwartete PlanStep-Shape könnte synchron werfen.
5. **JSON.stringify wirft** wegen circular ref (sehr unwahrscheinlich, audit-events sind flat).
6. **Vercel-Cold-Start-Issue / Out-of-Memory / Function-Timeout**: möglich, wäre aber nicht reproduzierbar.

Ohne die nun gesetzten Strukturierten Logs (mit `requestId`) konnten wir bisher nicht eindeutig sagen, **welcher** der Pfade es war. Der jetzt gesetzte top-level try/catch + die strukturierten `console.error`-Aufrufe machen es für den nächsten Smoke-Versuch eindeutig diagnostizierbar.

## Geänderte Dateien

- `api/operator/projects/[projectId]/plan/commit.ts` — top-level try/catch, neue Codes, strukturiertes Logging, Property-Mapping-Guard, All-Failed→502
- `api/_lib/types.ts` — additive PlanCommitResultCode-Werte
- `api/_lib/audit.ts` — drei neue AuditEventType-Werte für feinere Audit-Granularität
- `src/lib/projectPlannerClient.ts` — bessere Default-Fehlermeldung bei non-JSON 5xx, lese `x-nox-request-id`-Header
- `src/pages/OperatorCockpit.tsx` — `commitMessage` mit code-spezifischen, übersetzten Texten

**Nicht geändert**: Notion-Schema, Notion-Property-Mapping (Allowlist), Wire-Format der bestehenden Felder (additiv), Preview-/Validate-Endpoints, Phase-2-Commit-Pipeline-Reihenfolge. Bestehende Frontend-UI-Fixes (`4b1387d`, `63e9d28`, `4faa716`) sind unverändert.

## Geänderte / neue Fehlercodes

| Code | HTTP | Bedeutung | Vorher |
|---|---|---|---|
| `writes_locked` | 423 | `NOX_NOTION_WRITE_ENABLED !== "true"` | unverändert |
| `notion_write_token_missing` | 503 | `NOX_NOTION_WRITE_TOKEN` env unset | war `write_not_configured` |
| `notion_database_missing` | 503 | `NOX_MASTER_TASKS_DB_ID` env unset | war `write_not_configured` |
| `write_not_configured` | 503 | Mehrfach-missing (Token + DB beide fehlen) | weiterhin als Fallback |
| `write_token_collision` | 500 | Write-Token identisch zum Read-Token | unverändert |
| `plan_digest_mismatch` | 409 | Server-recomputeter Digest != gesendeter | unverändert |
| `schema_not_ready` | 409 | Schema-Recheck oder Idempotenz-Query fehlgeschlagen | unverändert |
| `duplicate_risk` | 200 | Master-Tasks enthält bereits Page mit gleichem `Plan Draft Digest` | unverändert |
| `notion_property_mapping_failed` | 424 | Alle proposed Properties für einen Step wurden gefiltert → `{}`-Payload, kein Create-Call | **neu** |
| `committed` | 200 | Alle Pages erzeugt | unverändert |
| `partial_failure` | 200 | Mindestens 1 OK, mindestens 1 Fehler | unverändert |
| `notion_create_failed` | 502 | **Alle** per-Step Creates fehlgeschlagen (0 successes) | **neu** (war fälschlich 200 `partial_failure` auch bei 100% Fehler) |
| `internal_commit_error` | 500 | Unerwarteter Throw, vom top-level try/catch gefangen | **neu** |

Frontend-Migration: alle neuen Codes haben einen passenden `commitMessage`-Branch in `OperatorCockpit.tsx`. Legacy-Codes bleiben funktional, kein Wire-Break.

## Wichtige Server-Härtung im Detail

### Top-Level try/catch

```ts
const handler: ApiHandler = async (req, res) => {
  const requestId = newRequestId();
  res.setHeader('x-nox-request-id', requestId);
  try {
    // ... alle 13 Gates wie bisher ...
  } catch (err) {
    const safeName = err instanceof Error ? err.name : 'UnknownError';
    logCommitEvent('error', requestId, { code: 'internal_commit_error', ... });
    appendAuditEvent({ eventType: 'PLAN_COMMIT_INTERNAL_ERROR', ... });
    res.status(500).json({
      error: 'internal_commit_error',
      code: 'internal_commit_error',
      message: 'Interner Fehler im Commit-Endpunkt. …',
      requestId,
    });
  }
};
```

Damit kann **kein** ungefangener Throw mehr als generische Vercel-HTML-500 zurückkommen. Das Frontend bekommt immer ein konsumierbares JSON.

### `x-nox-request-id`-Response-Header

Server vergibt eine kurze, zufällige `cmt_<base36>`-ID pro Request und schreibt sie in einen Response-Header. Frontend liest sie und hängt sie an die Fehlermeldung wenn der Body nicht parsebar ist. Operator kann damit in Vercel-Logs deterministisch grep'en.

### Strukturiertes Logging

Hilfsfunktion `logCommitEvent(level, requestId, fields)` schreibt ein einzeiliges JSON nach stdout/stderr. Erlaubte Felder:

- `src` (immer `"plan/commit"`)
- `requestId`
- `projectId`
- `planSteps` (Anzahl)
- `code` (sanitised result code)
- `statusCode`
- `notionStatus` (4xx/5xx von Notion)
- `notionCode` (z.B. `object_not_found`, `unauthorized`)
- `propertyName` (bei Mapping-Drops)
- `summary` (gekappt auf 240 chars)

**Niemals** geloggt:
- Tokens (read oder write)
- Notion-Page-Body-Content
- Full Request-Body
- Env-Werte
- Stack-Traces (im Response-Body; landen aber stdout/stderr für Vercel)

### Property-Mapping-Guard

Vor jedem `createMasterTaskPage`-Call wird `Object.keys(built.properties).length === 0` geprüft. Falls leer → kein Notion-Call, sondern direkt Result-Eintrag `notion_property_mapping_failed` mit handhabender Operator-Message:

> Alle für diesen Schritt geplanten Notion-Properties wurden gefiltert (Allowlist / unresolved relation). Prüfe Notion-Schema und Mapping.

### `notion_create_failed` (502)

Wenn alle per-Step Creates fehlschlagen, war die Response bisher `200 partial_failure` mit `pageResults` voller Fehler. Jetzt: **HTTP 502 `notion_create_failed`** mit aggregiertem ersten Fehler im `commitMessage`. Operator sieht sofort, dass **kein** Schreibvorgang erfolgreich war.

`partial_failure` (200) bleibt erhalten für gemischte Fälle (>=1 OK, >=1 Fehler).

## Operator-Debug-Anleitung für Vercel Logs

Wenn der Smoke wieder einen Fehler wirft:

1. **Frontend liest** `x-nox-request-id`-Header und zeigt ihn in der Fehlermeldung an. Beispiel:
   > `notion_create_failed: Notion konnte 1 Page nicht erstellen (object_not_found: Could not find database with ID …). Write-Token, Datenbank-Zugriff und Property-Mapping prüfen.`
2. **Vercel-Dashboard** → Project `nox` → Deployments → aktueller Production-Deploy → Logs
3. **Filter im Vercel-Log-Viewer**: `plan/commit` (matcht das `src`-Feld jeder Log-Zeile) und/oder die RequestId aus der Fehlermeldung
4. **Erwartete Log-Zeilen** (sanitisiert, alle als JSON):
   ```
   {"src":"plan/commit","requestId":"cmt_...","code":"notion_write_token_missing","statusCode":503,"summary":"NOX_NOTION_WRITE_TOKEN unset"}
   {"src":"plan/commit","requestId":"cmt_...","code":"page_create_failed","statusCode":502,"notionStatus":401,"notionCode":"unauthorized","summary":"step=<id> notion pages.create returned HTTP 401 unauthorized"}
   {"src":"plan/commit","requestId":"cmt_...","code":"notion_create_failed","statusCode":502,"summary":"ok=0 failed=1"}
   ```
5. **Bei `internal_commit_error`** (unerwarteter Throw): der Log zeigt zusätzlich `err=<ErrorName>` und gekappte `err.message` (max 200 chars). Falls das nicht reicht für Diagnose: Vercel-Function-Logs enthalten auch den vollen Stack — der landet implizit durch Node's unhandled-rejection-Behavior auf stderr.

### Häufige Notion-Codes und was sie bedeuten

| `notionCode` | Bedeutung | Operator-Aktion |
|---|---|---|
| `unauthorized` | Write-Token hat keine Schreibrechte | Notion-Integration prüfen, Token im richtigen Workspace? |
| `object_not_found` | DB-ID falsch oder Integration nicht zur DB freigegeben | Master-Tasks-DB in Notion → „Connect to integration" → Write-Integration hinzufügen |
| `validation_error` | Property-Typ/Constraint stimmt nicht | Property-Allowlist im Code vs. Notion-Schema vergleichen |
| `rate_limited` | Notion-API throttled | Retry mit Backoff, hier nicht implementiert (Phase 2 Hard-Rule: Idempotenz statt Retry) |
| `restricted_resource` | Notion-Workspace-Restriction (Free-Tier? Guest?) | Workspace-Plan prüfen |

## Sicherer Retry-Ablauf für Phase-2E-Smoke

1. **Vorbereitung**: Phase-2E-Runbook checklist Schritt 0 (`docs/project-auto-planner-phase-2e-notion-write-smoke.md`) abhaken. Insbesondere: Write-Token-Integration **muss in Notion explizit auf die Master-Tasks-DB connected sein** (nicht nur auf einen Workspace).
2. **Frontend-Smoke**:
   1. Cockpit öffnen → Projekt `TEST_PLAN_COMMIT` wählen
   2. Goal eintragen (Phase-2E-Wortlaut)
   3. „Quest-Reihe entwerfen" → 7-Schritte-Default
   4. Im Smoke-Warnbanner: „auf 1 Smoke-Quest reduzieren" klicken (oder Modal-Pfad)
   5. „Erneut technisch prüfen" → grün „1 Quest bereit"
   6. „1 Quest erzeugen" klicken
3. **Erwartete Antworten**:
   - **Erfolg**: `committed` (HTTP 200) — Notion-Page-ID + URL in `pageResults[0]`. UI zeigt „Quests erzeugt: 1".
   - **Token / Scope-Fehler**: `notion_create_failed` (HTTP 502) — UI zeigt klare Message mit Notion-Code. Operator korrigiert Token/Scope, neuer Smoke.
   - **Env fehlt**: `notion_write_token_missing` oder `notion_database_missing` (HTTP 503) — UI nennt den fehlenden Env-Var-Namen.
   - **Doppelter Klick**: `duplicate_risk` (HTTP 200) — keine Duplikate.
   - **Unerwarteter Bug**: `internal_commit_error` (HTTP 500) — UI nennt RequestId, Operator grep't Vercel-Logs.
4. **Idempotenz-Re-Run**: zweiter Klick auf identischen Plan → `duplicate_risk`. Notion: weiterhin 1 Page.
5. **Lockdown**: Phase-2E-Runbook Schritt 5 (Flags zurücksetzen, Re-Deploy, 423 verifizieren).

## Validierung

- `npm run lint` → **0 errors, 0 warnings** ✅
- `npm run typecheck` → **0 OperatorCockpit-/commit.ts-Errors** ✅. 6 verbleibende TS-Errors weiterhin **alle pre-existing** in `src/components/skillbook/Skillbook{Canvas,Node}.tsx` (fehlende npm-deps).
- Keine API-Tests im Repo vorhanden — die strukturelle Validierung erfolgt über TypeScript-Compile + manuellen Smoke.

## Rest-Risiken

- **Audit-Persistenz weiterhin in-memory**. Bei Vercel-Cold-Start ist der Ring leer. Für Production-Smoke vor dem nächsten Versuch direkt nach dem Commit `GET /api/operator/audit` abgreifen.
- **`x-nox-request-id` ist nicht kryptographisch.** Reiner Correlation-Token. Kein Sicherheitsrisiko, da er weder Auth-Material enthält noch geheim ist.
- **Stack-Traces landen auf Vercel-stderr.** Vercel-Function-Logs sind in der Vercel-UI nur für den Account-Besitzer sichtbar. Falls dort wirklich ein Secret oder Pfad sichtbar wird, ist das ein Vercel-Konfig-Issue (Function-Logs-Sichtbarkeit), kein Issue unseres Codes — wir loggen keine Secrets.
- **Project-Chat-Panel-Quest bleibt geparkt** (`stash@{0}`, `_parked/`), unangetastet von diesem Fix.

Abschlussmarker: `PROJECT_AUTO_PLANNER_COMMIT_500_DIAGNOSTICS_READY`
