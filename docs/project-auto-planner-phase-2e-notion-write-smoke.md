# Project Auto Planner — Phase 2E Notion-Write-Smoke Runbook

> Stand: 2026-05-20 · Branch im Audit: `origin/main` @ `1464c86`
> Erstellt von: Claude (operative zweite rechte Hand)
> Zweck: kontrollierter, einmaliger Notion-Write-Smoke auf Vercel Production.
>
> **Kein Code geändert.** Dieses Dokument ist reines Runbook + Go/No-Go.

---

## TL;DR

- **Code-Stand**: Phase-2-Pipeline ist auf `origin/main` vollständig. Preview, Validate, Commit liegen jeweils als eigene Vercel-Function vor. Commit ist hard-locked hinter sechs unabhängigen Server-Gates und wird in der Default-Vercel-Env permanent `423 writes_locked` antworten.
- **Was fehlt für echten Smoke**: Vercel-Env-Variablen (3 Stück) müssen *gemeinsam* gesetzt werden. Notion-Schema-Properties müssen alle vorhanden sein. **Operator-Hand**, nicht Claude.
- **Empfehlung**: **GO für genau 1 Test-Quest** gegen ein dediziertes `TEST_PLAN_COMMIT`-Projekt — **nur nachdem** Operator alle Env-Vars + Schema-Properties verifiziert hat. Danach Idempotenz-Re-Run, danach Rückbau aller Flags.

`PROJECT_AUTO_PLANNER_PHASE_2E_NOTION_WRITE_SMOKE_READY`

---

## Verifikation 2026-05-20 (Operator-bestätigt)

- ✅ **Production Deployment für Vercel-Project `nox` ist READY.**
- ✅ **Production läuft auf GitHub-Commit `1464c86e5589b74907c0ad3f55a301a0a7654350`** (kurz: `1464c86`).
- ✅ **`origin/main` HEAD = `1464c86e5589b74907c0ad3f55a301a0a7654350`** — Production-Build = Repo-Stand.
- ✅ **Private-Write-Mode (`NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE`)** ist im Commit `1464c86` implementiert und umgeht *ausschließlich* Operator-Key + Commit-Token/Phrase im Browser.
- ✅ **NICHT umgangen** von Private-Write-Mode (verifiziert in `api/operator/projects/[projectId]/plan/commit.ts`):
  - `NOX_NOTION_WRITE_ENABLED` (Gate 8 im Handler)
  - `NOX_NOTION_WRITE_TOKEN` Pflicht + Read-Token-Trennung (Gate 10)
  - Digest-Recompute (Gate 7, `409 plan_digest_mismatch`)
  - Schema-Recheck (Gate 11, `409 schema_not_ready`)
  - Idempotenz-Precheck (Gate 12, `200 duplicate_risk`, null Writes)

Notion-Quest-Referenz: <https://www.notion.so/36309df6e88e8174b393c8180c3dd61d>

---

## A) Aktueller technischer Stand

### Code (origin/main, Audit ohne Code-Änderung)

| Bereich | Datei | Status |
|---|---|---|
| Preview-Endpoint | `api/operator/projects/[projectId]/plan/preview.ts` | Live, Phase 2A, read-only Echo + Digest |
| Validate-Endpoint | `api/operator/projects/[projectId]/plan/validate.ts` | Live, Phase 2B, Notion-Schema-Read (kein Write) |
| Commit-Endpoint | `api/operator/projects/[projectId]/plan/commit.ts` | Live als Phase 2C-Pre, hart `423` solange Flag aus |
| Shared Validator + Mutationen | `api/_lib/planDraft.ts` | Pure logic, kein I/O |
| Auth-Gates | `api/_lib/auth.ts` | `checkOperatorAuth`, `checkReadOnlyPlannerAuth`, `checkPrivateWritePlannerAuth` |
| Notion-Adapter | `api/_lib/notion.ts` | Read-only Queries + `getDatabaseSchema` + neue `createMasterTaskPage` Write-Funktion |
| Wire-Format | `api/_lib/types.ts` (server) + `src/types/projectPlanner.ts` (browser-mirror) | Vier-Stellen-Vertrag konsistent |
| Audit-Layer | `api/_lib/audit.ts` | In-Memory Ringbuffer, 200 Events, Cold-Start löscht — **Achtung**: keine persistente Audit-DB |
| Frontend Commit-Button | `src/pages/OperatorCockpit.tsx` (Zeilen ~3696–3781) | „Quests erzeugen" — UI komplett, schickt kein Secret und kein commitToken (private_write_mode-Pfad) |
| Frontend-Client | `src/lib/projectPlannerClient.ts:fetchPlanCommit` | Sauber, keine Secret-Pfade, keine localStorage-Writes |

### Letzte Commits (origin/main, Audit-Zeitpunkt)

```
1464c86 Simplify phase 2d commit UI behind private write flag
32877a4 Add phase 2d commit confirm UI behind locked endpoint
dfafc84 Add locked phase 2c-pre commit pipeline
1dd341a Map plan props to Prompt and DoD and productise planner modal
74cd94f Auto-chain plan preview into schema validate
5f3b1f9 Add private-cockpit read-only mode for plan preview validate
505f478 Implement project auto planner phase 2B schema validation
7d25073 Implement project auto planner phase 2A preview
```

### Bewertung

**Code ist korrekt für Phase 2E. Keine Änderung nötig.** Idempotenz, Digest-Match, Schema-Recheck, Token-Trennung und Allowlist sind alle vorhanden und werden in der Reihenfolge ausgewertet, die das Architekturpapier vorgibt.

---

## B) Welche Gates existieren

Reihenfolge im Commit-Handler (siehe `api/operator/projects/[projectId]/plan/commit.ts`):

1. `setNoStore` — keine HTTP-Caches.
2. **Rate-Limit** — 60 req/60s pro Client-Hash (`api/_lib/rateLimit.ts`).
3. **Auth-Gate** — `checkPrivateWritePlannerAuth`:
   - Bei `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE=true` → `authMode='private_write_mode'`, weiter ohne Operator-Key-Header.
   - Sonst Fallback auf `checkOperatorAuth` (Header `x-nox-operator-key` ODER `Authorization: Bearer …`).
   - Wenn `NOX_OPERATOR_API_KEY` nicht gesetzt → `503 not_configured`.
4. **Methode** — nur `POST`.
5. **projectId-Regex** — `^[A-Za-z0-9._-]{1,64}$`.
6. **Body-Strukturvalidierung**:
   - `clientPlanId` matcht `^[A-Za-z0-9_-]{4,80}$`.
   - `idempotencyKey` matcht `^[A-Za-z0-9_:.-]{4,128}$`.
   - `planDigest` = 8-stelliger Hex-Digest (FNV-1a).
   - **Wenn `authMode='operator_key'`**: zusätzlich `commitToken` (regex `^commit-[A-Za-z0-9_-]{8,128}$`) ODER `explicitConfirmPhrase` (exakter String `Yes, write this plan draft to Notion now`) verpflichtend. Im `private_write_mode` darf beides fehlen — die Flag selbst ist die bewusste Bestätigung.
   - Plus volle Plan-Schema-Validierung (Titel ≤200, Ziel ≤1000, Output ≤500, max 30 Steps, AllowList für Agent/Risk/Rating, keine doppelten Step-IDs).
7. **Digest-Recompute** — Server rechnet FNV-1a über kanonisches JSON nach. Mismatch → `409 plan_digest_mismatch`. **Wird NICHT umgangen** wenn `private_write_mode` aktiv ist.
8. **Feature-Flag** — `NOX_NOTION_WRITE_ENABLED` muss exakt `"true"` (lowercase, getrimmt) sein. Alles andere (inkl. `"True"`, `"1"`, `"yes"`, leer) → `423 writes_locked`.
9. **Notion-Read-Config** — `NOX_NOTION_READONLY_TOKEN` + `NOX_MASTER_TASKS_DB_ID` müssen gesetzt sein (für Schema-Recheck + Idempotenz-Query). Sonst → `503 write_not_configured`.
10. **Write-Token** — `NOX_NOTION_WRITE_TOKEN`:
    - Wenn leer → `503 write_not_configured` (kein Fallback auf Read-Token).
    - Wenn identisch zum Read-Token → `500 write_token_collision`.
11. **Schema-Recheck** — `getDatabaseSchema` gegen Master-Tasks-DB.
    - Alle Properties aus `ALLOWED_MASTER_TASKS_WRITE_PROPERTIES` müssen vorhanden sein, sonst `409 schema_not_ready`.
    - Bei `NOX_PROJECT_MAPPING_MODE=notion-relation` zusätzlich: Projekt-Zeile in `NOX_PROJECTS_DB_ID` per `Project ID` = `<projectId>` muss existieren.
12. **Idempotenz-Precheck** — `queryMasterTasksByPlanDraftDigest(token, dbId, recomputedDigest)`. Treffer ≥1 → `200 duplicate_risk`, **Null Writes**, Audit-Event `PLAN_COMMIT_DUPLICATE_RISK`.
13. **Erst dann**: Schleife über alle Steps mit `createMasterTaskPage(writeToken, masterDbId, properties)` — sequenziell, jeder Step protokolliert sich separat im Audit-Ring.

**Keines dieser Gates ist im Code umgehbar** ohne Quellcode-Änderung. Insbesondere `private_write_mode` umgeht **nur** Operator-Key + CommitToken/Phrase. Digest, Schema, Idempotenz und die Write-Token-Trennung laufen voll.

---

## C) Welche Env-Variablen gebraucht werden (Production Vercel)

> **Keine Secrets werden hier gedruckt.** Nur Variablennamen + erwartetes Verhalten.

### Phase 1 + 2A/2B (read-only, schon live)

| Variable | Pflicht? | Erwartet | Verhalten wenn fehlt |
|---|---|---|---|
| `NOX_OPERATOR_API_KEY` | Ja | Shared static key | Alle Operator-Routen `503 not_configured` |
| `NOX_NOTION_READONLY_TOKEN` | Ja | Notion Integration-Token, **read-only** scope auf Master Tasks + Projects | `/context`, `/validate`, `/commit` brechen mit `503 not_configured` |
| `NOX_MASTER_TASKS_DB_ID` | Ja | DB-ID Master Tasks (UUID, mit oder ohne Dashes) | wie oben |
| `NOX_PROJECTS_DB_ID` | Pflicht **nur** wenn Mapping-Mode `notion-relation` | DB-ID `🧭 Projects / System Map` | Validate/Commit-Schema-Recheck: `projects_db_missing` → `409` |
| `NOX_PROJECT_MAPPING_MODE` | Optional | `none` \| `title-prefix` \| `notion-relation` | Default `none` |
| `NOX_NOTION_FETCH_TIMEOUT_MS` | Optional | 1000–15000 (Default 8000) | clamp auf Default |
| `NOX_OPERATOR_COCKPIT_PRIVATE_MODE` | Optional | truthy (`true`/`1`/`yes`/`on`) | öffnet **nur** Preview + Validate ohne Header (read-only) |

### Phase 2E zusätzlich (für ECHTEN Notion-Write nötig)

**Alle drei Variablen MÜSSEN gleichzeitig gesetzt werden — sonst antwortet der Endpoint je nach fehlender Variable mit 423 oder 503.**

| Variable | Pflicht? | Erwartet | Verhalten |
|---|---|---|---|
| `NOX_NOTION_WRITE_ENABLED` | **Ja, exakt `true`** | Wortwörtlich der String `true` (lowercased + getrimmt). Jeder andere Wert ist gesperrt. | Wenn ≠ `"true"` → `423 writes_locked` |
| `NOX_NOTION_WRITE_TOKEN` | **Ja** | Notion Integration-Token mit **Schreibrechten** auf Master Tasks (und ggf. Projects). **MUSS** sich vom Readonly-Token unterscheiden. | Leer → `503 write_not_configured`. Gleich zu Read-Token → `500 write_token_collision`. |
| `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE` | Empfohlen für aktuelles Cockpit-UI | truthy (`true`/`1`/`yes`/`on`) | Wenn aus → UI schickt keinen Operator-Key → `401 unauthorized`. Wenn an → bypassed nur Operator-Key + CommitToken/Phrase, **kein** Bypass anderer Gates. |

### Empfohlenes Setup für Phase 2E-Smoke

```
NOX_OPERATOR_API_KEY=<existierend, unverändert>
NOX_NOTION_READONLY_TOKEN=<existierend, unverändert>
NOX_NOTION_WRITE_TOKEN=<NEU, dedizierte Integration, Schreibrechte auf Master Tasks (+ Projects falls relation-mode)>
NOX_NOTION_WRITE_ENABLED=true
NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE=true
NOX_MASTER_TASKS_DB_ID=<existierend>
NOX_PROJECTS_DB_ID=<existierend, falls mapping-mode notion-relation>
NOX_PROJECT_MAPPING_MODE=<existierend>
```

Nach erfolgreichem Smoke + Idempotenz-Test **werden `NOX_NOTION_WRITE_ENABLED` und `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE` wieder entfernt** (oder auf `false` gesetzt) — siehe Abschnitt F.

---

## D) Welche Notion-Properties gemappt werden

### Master-Tasks-DB — Server-Allowlist (`ALLOWED_MASTER_TASKS_WRITE_PROPERTIES` in `api/_lib/types.ts`)

Der Backend filtert beim Write **strikt** auf diese Namen. Andere Properties werden lautlos verworfen und in `pageResults[].diagnostics[]` protokolliert.

| Notion-Property-Name | Typ | Quelle aus `PlanStep` | Erforderlich für Smoke? |
|---|---|---|---|
| `Titel` | `title` | `step.title` | Ja |
| `Agent` | `select` | `step.agent` (`NOX Agent`/`Claude`/`Codex`/`Manuell`) | Ja — Option muss in Notion-Select existieren |
| `Project` | `relation` | aufgelöste Page-ID aus Projects-DB | Nur bei `mapping-mode=notion-relation` |
| `Plan Draft ID` | `rich_text` | `step.id` | Ja (Idempotenz) |
| `Plan Draft Digest` | `rich_text` | server-gerechnete 8-Hex-Digest | **Ja (Idempotenz-Filter)** |
| `Schritt-Reihenfolge` | `number` | `step.step` | Ja |
| `Reason` | `rich_text` | `step.reason` (optional) | Empfohlen |
| `Operator-Check` | `rich_text` | `step.gate` (optional) | Empfohlen |
| `Prompt` | `rich_text` | `step.ziel` | Ja — mapping-Entscheidung in 1dd341a |
| `Ergebnis / Definition of Done` | `rich_text` | `step.output` | Ja — mapping-Entscheidung in 1dd341a |

**Vor dem Smoke**: Operator prüft in Notion einmal manuell, dass alle 10 Property-Namen **zeichenidentisch** existieren (Master Tasks DB) **mit dem erwarteten Typ**. Schema-Recheck im Commit-Endpoint wird einen `409 schema_not_ready` werfen, sobald auch nur eine Property fehlt — das ist ein sicherer Stopper, kein Bug.

### Projects-DB — gelesene Lookup-Property

| Notion-Property | Typ | Zweck |
|---|---|---|
| `Project ID` | `rich_text` | wird per `equals`-Filter gegen den `<projectId>` aus dem URL-Path gematcht; muss `TEST_PLAN_COMMIT` exakt enthalten |

---

## E) Exakter Smoke-Test-Ablauf

> **Voraussetzung**: Vercel Production zeigt aktuell `1464c86` auf `noxlabs.net`. Build ready. Domain aktiv. Wenn nicht: STOP, separat klären.
> **Voraussetzung**: Audit-Ring sollte vor dem Test leer / bekannt sein (`GET /api/operator/audit` ist nur informativ, da Cold-Start jedes Mal zurücksetzt).

### Schritt 0 — Vorbereitung (Operator, manuell)

1. Notion: in `🧭 Projects / System Map` eine neue Zeile anlegen
   - `Project ID` = `TEST_PLAN_COMMIT`
   - `Projekt` = `TEST_PLAN_COMMIT` (Title)
   - Status = irgendein gültiges Select
2. Notion: in Master Tasks die 10 Properties aus Abschnitt D existieren prüfen, vor allem die zwei Idempotenz-Felder (`Plan Draft ID`, `Plan Draft Digest`) als `rich_text` und `Schritt-Reihenfolge` als `number`.
3. Notion: eine **neue Integration** anlegen, Scope ausschließlich Master Tasks + Projects, Schreibrechte. Token kopieren → `NOX_NOTION_WRITE_TOKEN`.
4. Vercel → Project `nox` → Environment Variables (Production) setzen:
   - `NOX_NOTION_WRITE_TOKEN` = `<neuer Token>` (Encrypted)
   - `NOX_NOTION_WRITE_ENABLED` = `true`
   - `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE` = `true`
5. Vercel: Re-Deploy aktuellen Production-Commit auslösen (Functions lesen `process.env` pro Request — aber der Re-Deploy stellt sicher, dass die neuen Env-Vars im Build-Output landen). **Wenn Vercel-Setting "Skip Deployments" o.ä. aktiv ist: kurz pausieren.**
6. Nach Deploy: `noxlabs.net/operator-cockpit` öffnen.

### Schritt 1 — Minimal-Plan-Draft (genau 1 Step)

Im Cockpit:

1. Projekt-Picker → `TEST_PLAN_COMMIT` wählen.
2. „Projektziel" Feld: `Smoke-Test Phase 2E — eine Quest schreiben.`
3. Plan auf **genau 1 Step** reduzieren:
   - Titel: `2E Smoke Test — Quest 1`
   - Ziel: `Verifizieren dass createMasterTaskPage einen Eintrag erzeugt.`
   - Agent: `Manuell` (kein Dispatch-Risiko)
   - Output: `Notion-Page-ID + URL in pageResults[].`
   - Risk: `Niedrig`
   - Gate: `Operator-Check: nach Smoke wieder löschen.`
   - Reason: `Phase 2E Notion-Write-Smoke.`
   - Rating: leer
4. „Technisch prüfen" klicken → wartet auf 200 mit `schemaOk: true` und `wouldCreateNTasks: 1`. **Wenn nicht** → STOP, zu Abschnitt F (Lockdown).
5. „Quests erzeugen" klicken.

### Schritt 2 — Erwartete Response

Server-Response soll genau dieses Shape haben (anonymisiert):

```json
{
  "ok": true,
  "code": "committed",
  "projectId": "TEST_PLAN_COMMIT",
  "clientPlanId": "plan-TEST_PLAN_COMMIT-...",
  "planDigest": "<8-hex>",
  "idempotencyKey": "plan-commit_...",
  "wouldCreateNTasks": 1,
  "writeEnabled": true,
  "notionWritesExecuted": true,
  "duplicateRisk": false,
  "pageResults": [
    { "planStepId": "<id>", "ok": true, "notionPageId": "...", "notionUrl": "..." }
  ],
  "diagnostics": [],
  "meta": { "phase": "2c-pre", "readOnly": false, "notionWritesEnabled": true, "liveExecution": "live", "authMode": "private_write_mode" }
}
```

Notion: in Master Tasks muss genau eine neue Page existieren mit den 10 Properties aus Abschnitt D, `Quest starten = leer`, `Freigegeben = leer` (wird vom Backend nicht gesetzt — siehe Phase-2E-Trennlinie zwischen Erzeugen und Dispatchen).

### Schritt 3 — Idempotenz-Re-Run

1. **Ohne** Plan zu ändern: „Quests erzeugen" nochmals klicken.
2. Erwartete Response:
   ```json
   { "code": "duplicate_risk", "ok": false, "notionWritesExecuted": false, "duplicateRisk": true, ... }
   ```
3. Notion: weiterhin nur **1** Page mit diesem `Plan Draft Digest`. Wenn 2+ Pages: STOP, Idempotenz-Gate kaputt → Abschnitt G.

### Schritt 4 — Sanity-Checks

- `GET /api/operator/audit` (mit `x-nox-operator-key: <NOX_OPERATOR_API_KEY>`): mindestens diese Events sichtbar (Reihenfolge):
  - `PLAN_PREVIEW_REQUESTED` + `PLAN_PREVIEW_RESPONDED`
  - `PLAN_VALIDATE_REQUESTED` + `PLAN_VALIDATE_SCHEMA_OK`
  - `PLAN_COMMIT_REQUESTED`
  - `PLAN_COMMIT_PAGE_CREATED`
  - `PLAN_COMMIT_SUCCESS`
  - beim Re-Run: `PLAN_COMMIT_DUPLICATE_RISK`
- Audit ist Process-Local — bei Cold-Start zwischen Schritt 2 und 3 sind ältere Events weg, das ist erwartet, kein Fehler.

### Schritt 5 — Lockdown (immer, auch bei Erfolg!)

Sofort nach Schritt 3, ohne Pause:

1. Vercel-Env: `NOX_NOTION_WRITE_ENABLED` **entfernen** (oder auf `false`).
2. Vercel-Env: `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE` **entfernen** (oder auf `false`).
3. Vercel: Re-Deploy.
4. Nochmals „Quests erzeugen" gegen `TEST_PLAN_COMMIT` (mit unverändertem Plan): muss `423 writes_locked` zurückgeben.
5. Notion: Test-Page in Master Tasks **manuell löschen**, Test-Projekt-Zeile entweder behalten (für Wiederholungen) oder löschen.
6. `NOX_NOTION_WRITE_TOKEN`: behalten ist OK, da das Flag aus ist. Sicherer: Token in Notion rotieren oder Integration löschen, bis die nächste Smoke-Runde geplant ist.

---

## F) Rollback / Lockdown-Ablauf

> Wenn an irgendeiner Stelle etwas nicht erwartet läuft: **sofort** Lockdown ausführen, dann diagnostizieren.

1. **Vercel-Env entfernen**:
   - `NOX_NOTION_WRITE_ENABLED` raus (oder `false`)
   - `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE` raus (oder `false`)
   - Re-Deploy
2. **Sanity-Check Sperre**:
   - „Quests erzeugen" → Response muss `code: writes_locked`, HTTP 423 sein
3. **Bei versehentlichem Duplikat in Notion**:
   - Manuell die überzähligen Master-Tasks-Zeilen löschen
   - `Plan Draft Digest` als Filter in Notion nutzen, um schnell alle Duplikate eines Plans zu finden
4. **Bei Write-Token-Leak-Verdacht**:
   - Notion → Integration → Token rotieren
   - Vercel-Env `NOX_NOTION_WRITE_TOKEN` neu setzen
   - Audit-Ring zeigt KEINE Token-Echo-Pfade — Token landet nie in Response oder Audit
5. **Bei Schema-Drift in Notion**:
   - Properties nicht selbst über das Backend hinzufügen — Backend erzeugt nie Schema, das ist Operator-Hand
   - Schema in Notion-UI ergänzen, dann erneut „Technisch prüfen"
6. **Wenn alles eskaliert**:
   - Vercel-Project-Setting → Production Deployment auf vorherigen ready-Commit zurücksetzen (Vercel UI: „Promote to Production" auf einen früheren Build). Kein Push, kein Code-Change.

---

## G) Risiken

| Risiko | Mitigation im Code | Restrisiko |
|---|---|---|
| Versehentlicher Write ohne Operator-Klick | Sechs Gates (Auth, Method, Body, Digest, Flag, Token), `private_write_mode` umgeht **nicht** Digest/Schema/Idempotenz | Erfordert *gleichzeitig* aktives Flag + Frontend-Bug; pro Plan max 1 Write durch Idempotenz-Gate |
| Doppelte Quests durch Doppel-Klick | Idempotenz-Gate via `queryMasterTasksByPlanDraftDigest` vor jedem Write | Wenn Operator den Plan zwischen 2 Klicks ändert → neuer Digest → neue Quest. Genau so beabsichtigt. |
| Falsche DB-ID in Env | `getDatabaseSchema` würde 404'en → `409 schema_not_ready` | Falls zufällig zweite DB die gleichen Property-Namen hat: könnte erfolgreich schreiben. Mitigation: Operator setzt DB-IDs einmal sauber, prüft Notion-Result-URL im Smoke |
| Read-Token wird zum Write-Token gemacht | `write_token_collision` → 500 | Keine — Gate ist hart |
| Property-Name-Typo im Notion-Schema (z.B. `Title` statt `Titel`) | `schema_not_ready` → 409 | Operator muss vor Smoke einmal manuell prüfen |
| Vercel 10s Function-Timeout | Nur 1 Step im Smoke → unter 2s | Bei 10+ Steps in echtem Betrieb relevant — nicht Teil von 2E |
| Audit-Persistenz fehlt | In-Memory-Ring → Cold-Start löscht | Für 2E akzeptabel. Vor echter Operatorenutzung sollte KV/Postgres-Backend folgen (Phase 2D-Plus, eigene Quest). |
| Andromeda-Identifier-Migration vermischt mit 2E | Explizit nicht angefasst (Code-Kommentar in commit.ts und Architekturpapier) | Kein |

---

## H) Entscheidung: Go / No-Go

### Empfehlung: **GO — für genau 1 Test-Quest gegen `TEST_PLAN_COMMIT`**

Voraussetzungen, alle vom Operator vor dem Klick zu erfüllen:

- [ ] Vercel zeigt `1464c86` (oder neuer) als ready Production Deployment auf `noxlabs.net`
- [ ] Notion Master-Tasks-DB hat die 10 Properties aus Abschnitt D, Typen stimmen
- [ ] Notion Projects-DB hat die `TEST_PLAN_COMMIT`-Zeile mit `Project ID = TEST_PLAN_COMMIT`
- [ ] `NOX_NOTION_WRITE_TOKEN` ist **separater** Integration-Token, nicht identisch zum Read-Token
- [ ] `NOX_NOTION_WRITE_ENABLED=true` ist gesetzt
- [ ] `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE=true` ist gesetzt
- [ ] Operator hat 5 Minuten Zeit für den vollen Ablauf (Smoke + Idempotenz + Lockdown)

**No-Go-Bedingungen** (auch nur eine reicht):

- Vercel ist nicht ready oder zeigt einen anderen Commit
- Vercel-Env-Vars sind nicht vollständig gesetzt
- Notion-Schema ist unverifiziert
- Operator ist nicht verfügbar für sofortigen Lockdown

### Phase 1 als Quest erzeugen (echter Operatorenbetrieb)

**No-Go bis nach erfolgreichem Smoke + Idempotenz + Lockdown**. Die Audit-Persistenz fehlt noch (In-Memory-Ring) und der Smoke validiert die Property-Mappings live. Erst danach realistisch, eine echte Phase-1-Quest (mehrere Steps gegen ein produktives Projekt) zu schreiben.

---

## Nächste Operator-Schritte (konkret, in Reihenfolge)

1. Notion-Vorbereitung (Abschnitt E Schritt 0, Punkt 1–3)
2. Vercel-Env setzen (Abschnitt E Schritt 0, Punkt 4–5)
3. Smoke-Klick (Abschnitt E Schritt 1–2)
4. Idempotenz-Re-Run (Abschnitt E Schritt 3)
5. Audit-Check (Abschnitt E Schritt 4)
6. **Lockdown sofort** (Abschnitt E Schritt 5)
7. Bei Erfolg: separate Master-Tasks-Quest „Phase-2D-Plus Audit-Persistenz" anlegen (Vorbereitung für echten Phase-1-Quest-Betrieb)

Marker: `PROJECT_AUTO_PLANNER_PHASE_2E_NOTION_WRITE_SMOKE_READY`

---

## Erwartete Responses (Referenz für den Operator)

### a) Erfolg — erste Quest geschrieben

```json
{
  "ok": true,
  "code": "committed",
  "writeEnabled": true,
  "notionWritesExecuted": true,
  "duplicateRisk": false,
  "pageResults": [{ "planStepId": "<id>", "ok": true, "notionPageId": "…", "notionUrl": "…" }],
  "meta": { "phase": "2c-pre", "liveExecution": "live", "authMode": "private_write_mode" }
}
```

### b) Idempotenz — Re-Run desselben Plans

```json
{
  "ok": false,
  "code": "duplicate_risk",
  "writeEnabled": true,
  "notionWritesExecuted": false,
  "duplicateRisk": true,
  "pageResults": [],
  "diagnostics": ["Found 1 existing Master-Tasks page(s) with Plan Draft Digest='…'. Commit aborted to avoid duplicates."]
}
```

### c) Lockdown bestätigt — Flags wieder aus

HTTP `423 Locked` mit Body:

```json
{
  "ok": false,
  "code": "writes_locked",
  "writeEnabled": false,
  "notionWritesExecuted": false,
  "diagnostics": ["NOX_NOTION_WRITE_ENABLED is not set to exactly \"true\". …"],
  "meta": { "liveExecution": "locked", "authMode": "operator_key" }
}
```

Wenn `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE` ebenfalls aus ist und das Cockpit keinen Operator-Key auf der Wire schickt, kommt vorher schon `401 unauthorized` — beides ist eine gültige Lockdown-Bestätigung.

---

## Lockdown-Checkliste (zum Abhaken nach dem Smoke)

- [ ] Vercel-Env `NOX_NOTION_WRITE_ENABLED` entfernt oder auf `false`
- [ ] Vercel-Env `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE` entfernt oder auf `false`
- [ ] Production-Re-Deploy ausgelöst und ready
- [ ] „Quests erzeugen" im Cockpit klick'd → Response `code: writes_locked` (HTTP 423) **oder** `401 unauthorized` erhalten
- [ ] Notion: Test-Page in Master Tasks manuell gelöscht (oder bewusst stehen gelassen mit Notiz)
- [ ] `NOX_NOTION_WRITE_TOKEN` rotiert oder Integration in Notion deaktiviert (empfohlen)
- [ ] Notion-Quest <https://www.notion.so/36309df6e88e8174b393c8180c3dd61d> mit Smoke-Ergebnis aktualisiert
- [ ] Audit-Endpoint `GET /api/operator/audit` einmal abgegriffen (Cold-Start löscht den Ring, also gleich nach Smoke ziehen)

---

## Smoke-Execution-Log

> Wird vom Operator (oder von Claude unter explizitem Operator-Go) nach jedem Lauf gefüllt. Keine Secrets, nur Codes/IDs/Zeitstempel.

| Datum / UTC | Schritt | Response-`code` | HTTP | `notionPageId` (falls vorhanden) | Notiz |
|---|---|---|---|---|---|
| _2026-05-20 — geplant_ | _Schritt 2 Smoke_ | _expected `committed`_ | _expected 200_ | — | Status: vorbereitet, Env- und Schema-Verifikation steht noch beim Operator. |
| _2026-05-20 — geplant_ | _Schritt 3 Idempotenz_ | _expected `duplicate_risk`_ | _expected 200_ | — | dieselbe Page-ID wie Smoke wird in der Notion-UI erwartet. |
| _2026-05-20 — geplant_ | _Schritt 5 Lockdown_ | _expected `writes_locked`_ | _expected 423_ | — | oder `401 unauthorized`, beides ok. |

---

## Was Claude in dieser Iteration **nicht** ausgeführt hat (und warum)

- **Keine Vercel-Env-Änderung** — Operator-Hand: ich habe kein Vercel-CLI/-Token in dieser Session, und Phase-2E-Setup ist explizite Operator-Freigabe.
- **Kein Notion-Write** — Phase 2C-Pre verlangt sechs Gates, davon drei Operator-seitig (Env-Flag, Schema-Properties, Write-Token). Bis alle drei stehen, wäre jeder Klick ein `423`.
- **Kein Production-Re-Deploy** — wird ausgelöst, sobald Env-Vars sitzen; ist Operator-Hand im Vercel-Dashboard.
- **Keine Code-Änderung an `api/` oder `src/`** — Pipeline ist korrekt für Phase 2E, kein Patch nötig.
- **Kein Commit/Push** — die einzige Dateiänderung in dieser Iteration ist diese Report-Datei selbst. Branch ist `feat/homepage-visual-transfer`; der Report passt thematisch nicht dorthin. Empfehlung: Operator entscheidet, ob die Datei auf einen `docs/`-Branch oder direkt auf `main` gehoben wird.
