# Project Auto Planner — Phase 2D-Plus · Audit-Persistenz

Status: implementiert auf `docs/phase-2e-runbook`, noch nicht aktiviert (Operator-Go ausstehend).
Letztes Update: 2026-05-21.

## Worum es geht

Phase-2E hat den Notion-Write-Pfad scharfgeschaltet. Phase-2D-Plus macht die
Audit-Spur dieses Pfads **produktionstauglich**: jedes Ereignis (Preview,
Validate, Commit, Duplicate-Risk, Page-Created, Page-Failed, Internal-Error,
…) wandert in einen persistenten Store, sobald die entsprechende Env gesetzt
ist.

Vorher: `api/_lib/audit.ts` führte ausschließlich einen **process-lokalen
Ringbuffer**. Bei jedem Vercel-Cold-Start, Deploy, Function-Restart oder
parallelen Instance gingen die Events verloren — d. h. genau dann, wenn der
Operator nach einem Smoke nachgucken wollte, war die Spur möglicherweise
weg.

## Architektur

```
┌──────────────────────────┐       sync       ┌──────────────────────────┐
│ appendAuditEvent(input)  │ ──────────────▶  │ legacyMirror             │
│ in api/_lib/audit.ts     │                  │ (200 events, in-memory)  │
│                          │      fire-and-   │                          │
│                          │      forget      │  konsumiert von:         │
│                          │ ──────────────┐  │  GET /api/operator/audit │
└──────────────────────────┘               │  └──────────────────────────┘
                                           ▼
                                ┌──────────────────────────┐
                                │ auditStore.ts            │
                                │   memoryRing (200)       │
                                │   + persistentAppend()   │
                                └──────────────────────────┘
                                           │
                              configured?  │  yes
                                           ▼
                                ┌──────────────────────────┐
                                │ Upstash-Redis-REST       │
                                │ LPUSH/LTRIM/LRANGE/LLEN  │
                                │ List key: NOX_AUDIT_KV_  │
                                │           LIST_KEY       │
                                └──────────────────────────┘
                                           │
                                           ▼
                                ┌──────────────────────────┐
                                │ GET /api/operator/audit/ │
                                │     recent               │
                                │   (Phase 2D-Plus)        │
                                └──────────────────────────┘
                                           │
                                           ▼
                                ┌──────────────────────────┐
                                │ OperatorCockpit · Modal  │
                                │  „Audit anzeigen“        │
                                └──────────────────────────┘
```

- `appendAuditEvent` bleibt synchron. Jeder bestehende Aufrufer (preview,
  validate, commit, context, …) bleibt unverändert lauffähig.
- Der persistente Write läuft als **fire-and-forget Promise** im
  `auditStore`. Schlägt er fehl, wird ein sanitised `console.warn`
  ausgegeben und der Hauptrequest läuft normal weiter. Audit darf
  niemals einen Notion-Write blockieren.
- `legacyMirror` bleibt für den alten `/api/operator/audit`-Endpoint
  erhalten — Backwards-Compat ist kostengünstig (≈ 80 kB).

## Event-Schema

`AuditEventInput` (alle Felder außer den ersten fünf sind optional):

| Feld              | Typ           | Quelle                                  |
|-------------------|---------------|-----------------------------------------|
| `eventType`       | enum          | siehe `AuditEventType`-Union            |
| `route`           | string        | Endpoint-Label                          |
| `method`          | string        | HTTP-Method                             |
| `outcome`         | success/attempt/blocked/failure | Auswertung im Handler  |
| `clientKeyLabel`  | string        | aus `rateLimit.ts` (non-reversible)     |
| `statusCode`      | number?       | HTTP-Status                              |
| `commandId`       | string?       | Operator-Commands                        |
| `action`          | string?       | Operator-Commands                        |
| `detailsSummary`  | string? (≤240)| sanitised Free-Text                      |
| `projectId`       | string?       | Master-Tasks-Projektkennung              |
| `planDigest`      | string?       | FNV-1a Digest aus Phase 2A               |
| `idempotencyKey`  | string?       | Operator-Client-Key                      |
| `clientPlanId`    | string?       | Plan-Draft-Id                            |
| `planStepsCount`  | number?       | Anzahl Schritte                          |
| `notionPageId`    | string?       | nach erfolgreichem `pages.create`        |
| `errorCode`       | string?       | siehe `PlanCommitResultCode`             |
| `requestId`       | string?       | aus `newRequestId()` in `commit.ts`      |
| `source`          | enum?         | `operator-api`/`operator-cockpit`/`project-auto-planner`/`plan-commit` |

Server stempelt zusätzlich:

| Feld         | Quelle                              |
|--------------|-------------------------------------|
| `id`         | `AUD-<base36-ts>-<base36-counter>`  |
| `timestamp`  | `new Date().toISOString()`          |

**Was wird NICHT gespeichert:**
- keine Tokens (weder Notion-Read, noch Notion-Write, noch Operator-Key)
- keine vollständigen Request-Bodies
- keine Env-Werte (außer dem **booleschen** Status `persistent: bool`)
- keine rohen Client-IPs (nur `clientKeyLabel` aus `rateLimit.ts`)

## Storage-Entscheidung

Repo-Bestand vor dieser Phase:
- `@supabase/supabase-js` ist installiert, aber **nirgends importiert**.
- Keine Postgres-/KV-/Datei-Persistenz im API-Pfad.
- `api/_lib/store.ts` und der Original-Ringbuffer sind beide
  prozesslokal.

Wir wollten keine neue Infrastruktur hart voraussetzen. Gewählter Ansatz:

- **Default**: weiterhin In-Memory-Ringbuffer (200 Events,
  per-Function-Instance).
- **Optional**: Upstash-kompatibler **Redis-REST-Adapter**. Aktiviert sich,
  sobald `NOX_AUDIT_KV_REST_URL` **und** `NOX_AUDIT_KV_REST_TOKEN` gesetzt
  sind. Keine SDK-Dependency — nur `fetch`. Befehle: `LPUSH` / `LTRIM` /
  `LRANGE` / `LLEN`.

Wenn der Operator später Vercel-KV, Supabase oder Postgres bevorzugt, wird
genau ein neuer Adapter-Branch in `auditStore.ts` ergänzt — die
Aufruf-Sites müssen nicht angefasst werden.

## Env-Anforderungen

| Variable                       | Wirkung                                                                                         |
|--------------------------------|-------------------------------------------------------------------------------------------------|
| `NOX_AUDIT_KV_REST_URL`        | Upstash REST URL, z. B. `https://<region>-<id>.upstash.io`. Aktiviert die Persistenz erst zusammen mit dem Token. |
| `NOX_AUDIT_KV_REST_TOKEN`      | Upstash REST Token (write-scope). Niemals geloggt, niemals echoed.                              |
| `NOX_AUDIT_KV_LIST_KEY`        | Optional. Default: `nox:audit:operator`. Erlaubt mehrere Cockpit-Instanzen auf einer Redis-DB.  |

Beide URL **und** Token müssen vorhanden sein, sonst greift der
In-Memory-Fallback. Setup hat **keinen Einfluss** auf die bestehenden
Notion-Write-Gates — Phase 2D-Plus ist orthogonal zum Commit-Pfad.

## Read Endpoint

`GET /api/operator/audit/recent`

| Element       | Verhalten                                                                  |
|---------------|----------------------------------------------------------------------------|
| Rate-Limit    | gleicher Pfad wie alle Operator-Endpunkte (`checkRateLimit`)               |
| Auth          | `checkReadOnlyPlannerAuth` (Operator-Key ODER `NOX_OPERATOR_COCKPIT_PRIVATE_MODE=true`) |
| Cache         | `Cache-Control: no-store`                                                  |
| Method        | nur `GET`                                                                  |
| Query-Params  | `limit` (1..500, default 50), `projectId`, `eventType`, `planDigest`       |
| Body          | `{ events: AuditEvent[], meta: { source, limit, count, totalAvailable, authMode } }` |
| Mutation      | keine                                                                      |
| Notion-Call   | keiner                                                                     |

`meta.source` ist `persistent` wenn der KV-Adapter erfolgreich war,
ansonsten `memory`. Die UI nutzt dieses Signal, um eine Warn-Bannerzeile
zu zeigen, wenn die Persistenz nicht greift.

Filter sind strikt validiert:
- `eventType` muss im `AuditEventType`-Allowlist liegen
- `projectId` erfüllt `^[A-Za-z0-9._\-:/]{1,80}$`
- `planDigest` erfüllt `^[0-9a-fA-F]{6,64}$`

Verstöße → `400 bad_request` + ein VALIDATION_FAILED-Audit-Event.

## UI im Operator Cockpit

- Neuer Sekundär-Button **„Audit anzeigen“** im NOX-Agent-Card neben dem
  bestehenden lokalen „Projektkontext-Audit“.
- Modal zeigt:
  - Filter-Toggle „Nur Events für `<projectId>`“ (default aktiv)
  - Aktualisieren-Button (re-fetch)
  - Quelle (`persistent` / `memory`) + Counter
  - Tabelle: Zeit · Event · Outcome · HTTP · Projekt · Digest · NotionPage · Error
- Warn-Banner, wenn `source === 'memory'`: weist den Operator auf die
  fehlende Persistenz hin und nennt die zwei zu setzenden Env-Variablen.
- Keine Mutation, kein Notion-Touch, kein Secret in der Response.

## Safety-Regeln

- Audit ist **best-effort**. Persistent-Write-Fehler crashen niemals den
  Hauptrequest — der Server fängt sie im `auditStore`, protokolliert
  sanitised und liefert das normale HTTP-Ergebnis aus.
- Tokens werden nicht im Body, nicht im Log, nicht in Headers ausgegeben.
- `clientKeyLabel` bleibt der einzige Identitäts-Marker (sanitised durch
  `rateLimit.ts`).
- Schema-Felder werden bei Eintritt geklippt (`clip(..)`), damit ein
  Caller niemals versehentlich 5 MB Free-Text in den Audit-Pfad schiebt.
- KV-Requests laufen mit 2,5-Sekunden-Timeout über `AbortController`.
- Filter im Read-Endpoint sind strict-regex-validiert.
- Bestehende Safety-Gates bleiben unangetastet: Write-Flag, Private
  Write Mode, Digest, Schema-Recheck, Duplicate-Risk, Idempotenz,
  Shared-Token-Opt-In, Strukturierte Commit-Errors.

## Manuelle Testcheckliste

> Voraussetzung: lokaler Dev-Run oder ein Vercel-Preview-Deploy.
> Notion-Writes nicht erforderlich — der Read-Endpoint testet sich gegen
> jede bestehende Event-Quelle.

1. **Auth-Gate (`A`)**
   - Ohne Header und ohne `NOX_OPERATOR_COCKPIT_PRIVATE_MODE`:
     `curl /api/operator/audit/recent` → `503 service_unavailable`
     bzw. `401 unauthorized`. Im Cockpit-Browser mit aktivem Private-Mode
     → 200 ohne Header.
2. **Preview-Event (`B`)**
   - Cockpit → „Nur prüfen“ → Modal Audit anzeigen → es erscheint
     `PLAN_PREVIEW_REQUESTED` + `PLAN_PREVIEW_RESPONDED`.
3. **Validate-Event (`C`)**
   - Im Anschluss wird `PLAN_VALIDATE_REQUESTED` plus
     `PLAN_VALIDATE_SCHEMA_OK` (oder `_SCHEMA_MISMATCH` /
     `_UPSTREAM_FAILED`) sichtbar.
4. **Commit-Success (`D`)**
   - Smoke-Run (1 Quest) → `PLAN_COMMIT_REQUESTED`,
     `PLAN_COMMIT_PAGE_CREATED` (mit `notionPageId`) und
     `PLAN_COMMIT_SUCCESS` (mit `planStepsCount`) in der Liste.
5. **Duplicate-Risk (`E`)**
   - Zweiter Commit mit demselben Digest →
     `PLAN_COMMIT_DUPLICATE_RISK`. Kein neuer
     `PLAN_COMMIT_PAGE_CREATED`-Event.
6. **UI-Anzeige (`F`)**
   - Button „Audit anzeigen“ öffnet das Modal, lädt Events, zeigt
     Quelle. Aktualisieren-Button funktioniert ohne Page-Reload.
7. **Response-Sanitization (`G`)**
   - `curl` die Response → kein Header, kein Token, kein Env-Wert
     sichtbar. Nur sanitisierte Felder gemäß Schema oben.
8. **Persistenz-Fehler (`H`)**
   - Optional: ungültiges `NOX_AUDIT_KV_REST_URL` setzen → Smoke wirft
     dann sanitised `console.warn` (Server-Logs), aber 200-Response
     für preview/validate/commit bleibt unverändert. Modal zeigt
     `source: memory`.

## Nächster Schritt Richtung Andromeda / NOX Agent

Phase 2D-Plus schließt die Audit-Lücke. Damit hat der NOX Agent
**eine echte Spur**, auf der spätere Andromeda-Funktionen aufbauen können:

1. **Timeline-Reconstruction**: Andromeda-Operator-Cockpit-Komponente
   kann pro Projekt die Ereignis-Historie chronologisch rendern (welche
   Quest wann geschrieben, welche Duplikat-Bremse griff, welcher
   Error-Code trat auf).
2. **Operator-Insights**: aggregierte Sichten („wie viele Smokes haben
   diese Woche `PLAN_COMMIT_DUPLICATE_RISK` getriggert?“).
3. **Retry-Empfehlungen**: aus `PLAN_COMMIT_PAGE_FAILED` plus
   `errorCode` und `notionStatus` (im Log) kann der Cockpit eine
   gezielte Retry-CTA bauen.
4. **Schema-Drift-Detection**: jede `_SCHEMA_MISMATCH` und
   `_PROPERTY_MAPPING_FAILED` ist jetzt persistiert und kann den
   Operator alarmieren, wenn ein Notion-Schemawechsel still passiert
   ist.
5. **Notion-Audit-DB (optional Phase 2F)**: derselbe Adapter-Slot kann
   später ein `appendAuditEventToNotion`-Branch bekommen, der die
   Events spiegelnd in eine kleine Notion-Audit-DB schreibt — mit allen
   bestehenden Gates (eigenes Token, eigene DB-Id, eigener Write-Flag).
   Heute bewusst noch nicht aktiviert.

## Was wir bewusst NICHT bauen

- Keine Notion-Audit-DB. Die persistente Spur lebt zunächst rein
  außerhalb von Notion, damit Audit selbst keinen Notion-Write benötigt.
- Keine Echtzeit-Subscription (kein WebSocket, kein SSE). Operator
  klickt „Aktualisieren“, fertig.
- Keine PII-Speicherung. Wenn der Operator nachträglich Identitäts-
  Marker einführen will, muss das durch ein eigenes Skill-Update.
- Keine Auto-Quest-Anlage aus Audit-Events. Andromeda darf später daraus
  Vorschläge ableiten, aber das ist eine separate Quest.

## Dateien dieser Phase

- `api/_lib/auditStore.ts` (neu) — Storage-Abstraktion
- `api/_lib/audit.ts` (refactor) — neue optionale Felder, Mirror-Buffer
- `api/operator/audit/recent.ts` (neu) — Read-Endpoint
- `api/operator/projects/[projectId]/plan/commit.ts` — angereicherte
  `appendAuditEvent`-Aufrufe (projectId, planDigest, idempotencyKey,
  clientPlanId, planStepsCount, notionPageId, errorCode, requestId,
  source)
- `src/lib/projectPlannerClient.ts` — `fetchAuditRecent` Helper
- `src/pages/OperatorCockpit.tsx` — Modal „Audit anzeigen“ + Button
