# NOX Operator Cockpit · Andromeda / Project X Bridge Spec

## 1. Zweck

Diese Bridge beschreibt, wie das interne NOX Operator Cockpit spaeter sicher mit Andromeda und Project X verbunden werden soll.

Das NOX Operator Cockpit ist die interne UI fuer Projekte, Quests, Freigaben, Outputs und Operator-Arbeit. NOX bleibt dabei das sichtbare Gehirn und die fuehrende Bedienoberflaeche. Andromeda ist der Orchestrator fuer Projekt- und Quest-Uebergaben. Project X ist die Workflowfabrik, die aus freigegebenen Uebergaben verwertbare Spezifikationen, Runner-Aufgaben oder Workflow-Schritte vorbereitet.

Das Frontend darf niemals Secrets, HMAC-Schluessel, private Worker-URLs oder direkte Runner-Endpunkte enthalten. Jede echte Ausfuehrung muss ueber einen serverseitigen Backend-Proxy laufen.

## 2. Architektur

Zielarchitektur:

```text
Operator Cockpit Frontend
  -> Backend Proxy
  -> Andromeda Orchestrator
  -> Project X / Runner / Workflowfabrik
  -> Rueckmeldung an Backend
  -> UI State / Audit Log
```

Rollen:

- Operator Cockpit Frontend: zeigt Commands, Dry-Runs, Freigaben, Outputs und Audit-Status.
- Backend Proxy: validiert Requests, schuetzt Secrets, signiert/verifiziert Commands und schreibt Audit-Logs.
- Andromeda Orchestrator: uebersetzt freigegebene Operator-Intents in strukturierte Uebergaben.
- Project X / Runner / Workflowfabrik: bereitet Workflows, Specs oder spaetere Ausfuehrungen vor.
- Audit Log: speichert jede Command-Erstellung, Dry-Run-Aktion, Freigabe, Ablehnung und Ausfuehrung.

## 3. Sicherheitsregeln

- Keine Secrets im Frontend.
- Keine direkten Browser-Calls an Orchestrator, Runner, n8n oder private Worker-Endpunkte.
- Jede potenziell ausfuehrende Aktion braucht ein Approval-Gate.
- Live-Ausfuehrung darf erst nach einem Dry-Run moeglich sein.
- Jede Command-Erstellung, Freigabe, Ablehnung und Ausfuehrung muss ins Audit-Log.
- Jedes Command braucht einen Idempotency-Key, damit Wiederholungen nicht doppelt ausgefuehrt werden.
- Backend-Proxy muss Rate Limits erzwingen.
- Backend-Proxy muss Command Validation durchfuehren.
- `commandType` muss gegen eine serverseitige Allowlist validiert werden.
- Optional: Replay-Schutz ueber Timestamp, Nonce und HMAC-Signatur.

## 4. Command Contract

Der aktuelle lokale Andromeda Command Contract im Cockpit dient als Frontend-Demo-Modell und spaetere API-Vorlage.

Felder:

- `id`: eindeutige Command-ID.
- `commandType`: erlaubter Command-Typ.
- `projectId`: Projektbezug.
- `questId`: optionaler Quest-Bezug.
- `title`: kurze Command-Bezeichnung.
- `intent`: Operator-Absicht in Klartext.
- `payloadSummary`: kurze Zusammenfassung des Kontextes.
- `requestedBy`: ausloesende Rolle oder Person.
- `status`: aktueller Zustand.
- `riskLevel`: Risikoklasse.
- `requiresApproval`: ob ein Freigabe-Gate erforderlich ist.
- `createdAt`: Erstellzeitpunkt.
- `dryRunResult`: optionales Dry-Run-Ergebnis.
- `history`: lokaler oder serverseitiger Verlauf.

Command Types:

- `PREPARE_PROJECT_X_HANDOFF`
- `RUN_PROJECT_X_DRY_RUN`
- `REQUEST_APPROVAL`
- `MARK_READY_FOR_EXECUTION`
- `GENERATE_HANDOFF_SPEC`
- `GENERATE_OUTPUT_MAP`

Status:

- `Draft`
- `Dry-Run bereit`
- `Freigabe noetig`
- `Freigegeben`
- `Gesperrt`
- `Erledigt`

RiskLevel:

- `Niedrig`
- `Mittel`
- `Hoch`

## 5. Backend API Entwurf

Nur Entwurf. Diese Endpoints werden in dieser Quest nicht implementiert.

### POST `/api/operator/commands`

Zweck: Erstellt ein neues Command aus dem Operator Cockpit.

Request Body Beispiel:

```json
{
  "idempotencyKey": "cmd_2026_05_13_appx_01",
  "commandType": "PREPARE_PROJECT_X_HANDOFF",
  "projectId": "APP-X",
  "questId": "APP-X-02",
  "title": "Project-X-Handoff: APP-X-02",
  "intent": "Project X soll die naechste Umsetzung trocken vorbereiten.",
  "payloadSummary": "Quest-Ziel, Kontext und offene Freigaben.",
  "requestedBy": "NOX Operator",
  "requiresApproval": true
}
```

Response Beispiel:

```json
{
  "command": {
    "id": "CMD-001",
    "status": "Freigabe noetig",
    "riskLevel": "Mittel",
    "createdAt": "2026-05-13T12:00:00.000Z"
  },
  "auditEventId": "AUD-001"
}
```

Sicherheitsanforderungen:

- Server validiert `commandType` gegen Allowlist.
- Server erzeugt oder validiert Idempotency-Key.
- Server schreibt Audit-Event.
- Keine Secret-Weitergabe an den Browser.

### GET `/api/operator/commands`

Zweck: Listet Commands fuer die Cockpit-Ansicht.

Request Body Beispiel: keiner.

Response Beispiel:

```json
{
  "commands": [
    {
      "id": "CMD-001",
      "commandType": "PREPARE_PROJECT_X_HANDOFF",
      "projectId": "APP-X",
      "questId": "APP-X-02",
      "title": "Project-X-Handoff: APP-X-02",
      "status": "Freigabe noetig",
      "riskLevel": "Mittel",
      "requiresApproval": true
    }
  ]
}
```

Sicherheitsanforderungen:

- Nur interne Operator-Kontexte ausliefern.
- Keine privaten Runner-URLs oder Secrets ausliefern.
- Pagination und Rate Limits vorsehen.

### GET `/api/operator/commands/:id`

Zweck: Liefert ein einzelnes Command inklusive Dry-Run-Ergebnis und History.

Request Body Beispiel: keiner.

Response Beispiel:

```json
{
  "command": {
    "id": "CMD-001",
    "status": "Freigabe noetig",
    "dryRunResult": null,
    "history": ["Command erstellt."]
  }
}
```

Sicherheitsanforderungen:

- Zugriff auf interne Operator-Rolle begrenzen.
- Audit-Log darf keine Secrets enthalten.

### POST `/api/operator/commands/:id/dry-run`

Zweck: Startet einen serverseitigen Dry-Run ohne Live-Ausfuehrung.

Request Body Beispiel:

```json
{
  "idempotencyKey": "dryrun_cmd_001_01",
  "requestedBy": "NOX Operator"
}
```

Response Beispiel:

```json
{
  "commandId": "CMD-001",
  "status": "Freigabe noetig",
  "dryRunResult": {
    "summary": "Project X kann die Uebergabe-Spec vorbereiten.",
    "estimatedImpact": "Ein Output-Draft und eine Freigabe werden vorbereitet.",
    "requiredInputs": ["finale UI-Freigabe", "Ziel-Repo"],
    "missingArtifacts": ["technischer Zielpfad"],
    "recommendedNextAction": "Freigabe anfordern und Uebergabe-Spec erzeugen."
  }
}
```

Sicherheitsanforderungen:

- Dry-Run darf keine Live-Mutation ausloesen.
- Resultat muss ins Audit-Log.
- Backend validiert Command-Status vor Ausfuehrung.

### POST `/api/operator/commands/:id/request-approval`

Zweck: Erstellt eine Freigabe-Anforderung fuer ein Command.

Request Body Beispiel:

```json
{
  "requestedBy": "NOX Operator",
  "reason": "Project-X-Handoff braucht Operator-Freigabe."
}
```

Response Beispiel:

```json
{
  "approval": {
    "id": "APR-001",
    "commandId": "CMD-001",
    "status": "Wartet"
  }
}
```

Sicherheitsanforderungen:

- Freigabe-Request muss Audit-Event erzeugen.
- Keine Telegram- oder externe Mutation direkt aus dem Browser.

### POST `/api/operator/commands/:id/approve`

Zweck: Gibt ein Command fuer den naechsten Schritt frei.

Request Body Beispiel:

```json
{
  "approvedBy": "NOX Operator",
  "approvalId": "APR-001"
}
```

Response Beispiel:

```json
{
  "commandId": "CMD-001",
  "status": "Freigegeben",
  "auditEventId": "AUD-APPROVE-001"
}
```

Sicherheitsanforderungen:

- Nur autorisierte Operator-Rolle.
- Approval muss eindeutig zum Command passen.
- Audit-Log ist verpflichtend.

### POST `/api/operator/commands/:id/reject`

Zweck: Lehnt ein Command ab und sperrt es.

Request Body Beispiel:

```json
{
  "rejectedBy": "NOX Operator",
  "reason": "Zielpfad fehlt."
}
```

Response Beispiel:

```json
{
  "commandId": "CMD-001",
  "status": "Gesperrt",
  "auditEventId": "AUD-REJECT-001"
}
```

Sicherheitsanforderungen:

- Ablehnung muss Audit-Event erzeugen.
- Gesperrte Commands duerfen nicht live ausgefuehrt werden.

### POST `/api/operator/commands/:id/execute`

Zweck: Fuehrt ein freigegebenes Command serverseitig aus.

Request Body Beispiel:

```json
{
  "idempotencyKey": "execute_cmd_001_01",
  "approvedBy": "NOX Operator",
  "approvalId": "APR-001"
}
```

Response Beispiel:

```json
{
  "commandId": "CMD-001",
  "status": "Erledigt",
  "execution": {
    "mode": "server-side",
    "resultSummary": "Uebergabe-Spec wurde erzeugt."
  },
  "auditEventId": "AUD-EXEC-001"
}
```

Sicherheitsanforderungen:

- Nur serverseitig.
- Nur nach Dry-Run und Freigabe.
- HMAC/Secret-Schutz zwischen Backend Proxy und Orchestrator.
- Idempotency-Key ist Pflicht.
- Rate Limits und Command Validation sind Pflicht.

## 6. Approval Flow

1. Operator erstellt ein Command im Cockpit.
2. Backend Proxy validiert Command und schreibt ein Audit-Event.
3. Dry-Run erzeugt Risiko, Impact, fehlende Inputs und empfohlene naechste Aktion.
4. Operator fordert Freigabe an.
5. Operator prueft Kontext, Dry-Run und Risiken.
6. Operator gibt frei oder lehnt ab.
7. Live-Ausfuehrung ist nur nach Freigabe, gueltigem Status und serverseitiger Validierung moeglich.
8. Ergebnis, Fehler oder Ablehnung werden ins Audit-Log geschrieben.

## 7. Frontend Migration Plan

- Phase 1: Demo-State bleibt, diese Spec steht.
- Phase 2: Backend Proxy read-only anschliessen, Commands nur lesen.
- Phase 3: Command Creation ueber Backend.
- Phase 4: Dry-Run ueber Backend.
- Phase 5: Approval ueber Backend.
- Phase 6: Live-Ausfuehrung erst nach expliziter Freigabe, serverseitigem Secret-Schutz und Audit-Log.

## 8. Nicht-Ziele

- Kein Broker, Trading oder Live-Finanzsystem.
- Kein direkter Browser-Zugriff auf Secrets.
- Kein automatisches Ausfuehren ohne Operator.
- Keine n8n-Mutation aus dem Frontend.
- Kein Deploy in dieser Quest.
- Kein Backend in dieser Quest.

## 9. Akzeptanzkriterien

- Spec-Datei existiert.
- Frontend-Code bleibt demo-safe.
- Keine API-Calls sind eingebaut.
- Keine Secrets liegen im Frontend.
- Build bleibt gruen.
- Project-X-Live-Ausfuehrung bleibt im Cockpit gesperrt, bis Backend Proxy, Secret-Schutz und Freigabe-Gate vorhanden sind.

## 10. APP-X-BRIDGE-01 — Skeleton-Implementierung

Status: Skeleton-Endpunkte angelegt, keine Live-Ausfuehrung, keine externen Calls.
Frontend bleibt unveraendert auf lokalem Demo-State (Phase 1 des Migration Plans).

### Implementiert

```text
api/
  _lib/
    types.ts        // CommandType, CommandStatus, RiskLevel, Action, Allowlists
    validation.ts   // requireString, optionalString, optionalIdempotencyKey, type guards
    store.ts        // In-Memory-Map, resettet bei jedem Cold Start (kein echter Persistenzlayer)
    handler.ts      // ApiRequest/ApiResponse, methodAllowed, badRequest, notFound, locked
  operator/
    commands.ts                  // GET (list) + POST (create)
    commands/[id].ts             // GET (single)
    commands/[id]/[action].ts    // POST (dry-run, request-approval, approve, reject, execute)
```

`vercel.json` schliesst `/api/*` aus der SPA-Rewrite aus (`/((?!api/).*)`).
`tsconfig.api.json` ergaenzt die Node-tsconfig fuer den `api/`-Ordner.

### Endpunkt-Verhalten (Skeleton)

| Endpoint                                                | Methode | Verhalten                                                             |
|---------------------------------------------------------|---------|-----------------------------------------------------------------------|
| `/api/operator/commands`                                | GET     | Liefert Commands aus In-Memory-Store (Cold-Start-Reset).              |
| `/api/operator/commands`                                | POST    | Validiert Body, schreibt Command in Memory, gibt 201 + auditEventId.  |
| `/api/operator/commands/:id`                            | GET     | Liefert ein Command oder 404.                                         |
| `/api/operator/commands/:id/dry-run`                    | POST    | Stub-DryRunResult, kein externer Call.                                |
| `/api/operator/commands/:id/request-approval`           | POST    | Stub-Approval-Event, kein Telegram-/Notion-Call.                      |
| `/api/operator/commands/:id/approve`                    | POST    | Statuswechsel auf `Freigegeben`, kein Trigger nach upstream.          |
| `/api/operator/commands/:id/reject`                     | POST    | Statuswechsel auf `Gesperrt`.                                         |
| `/api/operator/commands/:id/execute`                    | POST    | **HTTP 423 Locked** — Live-Ausfuehrung ist permanent gesperrt.        |

`execute` antwortet immer mit:

```json
{
  "error": "locked",
  "message": "Live execution is locked. Backend proxy, HMAC secret, approval gate and operator confirmation required."
}
```

### Sicherheitsgrenzen im Code

- Kein `fetch`, kein `http.request`, kein `node-fetch`-Import in `api/`.
- Keine Umgebungsvariablen werden gelesen (`process.env` taucht nicht auf).
- Kein Notion-, Telegram-, n8n- oder Andromeda-Call.
- `commandType` wird serverseitig gegen `ALLOWED_COMMAND_TYPES` validiert.
- `riskLevel` wird serverseitig gegen `ALLOWED_RISK_LEVELS` validiert.
- `action` wird serverseitig gegen `ALLOWED_ACTIONS` validiert.
- `idempotencyKey` wird Regex-validiert (`/^[A-Za-z0-9_:.\-]{4,128}$/`), aber noch nicht persistiert.
- Alle String-Felder haben harte Max-Laengen (64-2000 chars).
- `execute` ist hartcodiert auf 423 — nicht ueber Config abschaltbar.

### Was noch fehlt fuer echte Integration

- **HMAC-Signatur** zwischen Backend-Proxy und Andromeda-Upstream (Replay-Schutz via Timestamp + Nonce).
- **Echte Auth** auf den Endpunkten (z.B. Operator-Session-Cookie / Vercel OIDC / Supabase Row-Level-Security).
- **Persistenz-Layer mit Audit-Log** (Supabase / Postgres / Vercel KV). Aktueller Store ist In-Memory und ueberlebt keinen Cold-Start.
- **Andromeda-Upstream-URL** als serverseitige Env-Variable (`ANDROMEDA_DISPATCH_URL` + `ANDROMEDA_HMAC_SECRET`), nie im Frontend.
- **Notion-Callback-/Read-Write-Safety** mit getrennten Tokens und Field-Allowlist.
- **Telegram-Approval-Integration** als separater eingehender Webhook, niemals direkter Browser-Call.
- **Rate Limits** pro Operator-Identitaet (z.B. Upstash Ratelimit oder Vercel KV).
- **Idempotency-Key-Index** mit TTL, damit Wiederholungen sicher dedupliziert werden.
- **`execute`-Unlock** nur durch explizite Server-Config UND vorhandene Freigabe UND vorhandene HMAC-Verifikation. Niemals via Frontend-Flag.

### Phase 1 Status

- Backend-Proxy-Skeleton: vorhanden.
- Live-Calls aus dem Cockpit: weiterhin deaktiviert.
- OperatorCockpit-Frontend: unveraendert auf lokalem Demo-State (kein `fetch`-Call zu `/api/operator/commands`).
- Naechster Schritt waere Phase 2: read-only `GET /api/operator/commands` aus dem Cockpit lesen, immer noch keine Mutation.

## 11. APP-X-BRIDGE-02 — Auth Gate fuer Operator API

Status: Server-seitiges Auth-Gate vor jedem `/api/operator/*` Endpunkt.
Frontend unveraendert. Kein User-Login, kein Session-Layer, kein OAuth.
Reines Bootstrap-Gate, das die Stub-Endpunkte inert haelt, solange der Operator das Secret serverseitig nicht setzt.

### Verhalten

| Bedingung                                         | Antwort                                                                                                                          |
|---------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `NOX_OPERATOR_API_KEY` nicht gesetzt oder leer    | **503 service_unavailable** mit Message `Operator API is not configured. Set NOX_OPERATOR_API_KEY server-side.`                  |
| Header fehlt oder Wert stimmt nicht               | **401 unauthorized** mit Message `Unauthorized operator API request.`                                                            |
| Header korrekt                                    | Request laeuft weiter (Method-/Body-Validierung wie zuvor)                                                                       |

### Akzeptierte Header

- `x-nox-operator-key: <secret>` (bevorzugt)
- `Authorization: Bearer <secret>` (Fallback)

### Server-Konfiguration

- Env-Variable: `NOX_OPERATOR_API_KEY`
- Kein `VITE_`-Prefix (sonst wuerde Vite den Wert ins Frontend-Bundle inlinen)
- Wird ausschliesslich in `api/_lib/auth.ts` gelesen
- Vergleich in konstanter Zeit (`constantTimeEqual`) gegen den praesentierten Wert
- `.env.example` zeigt nur einen leeren Placeholder

### Sicherheitsgrenzen

- Secret wird nie in Response-Body, Logs oder Error-Details ausgeschrieben
- Kein Lookup auf den Wert ausserhalb von `auth.ts`
- 503 vor 401: ohne konfigurierten Server-State entstehen keine `401`-Probes, die einen Brute-Force-Versuch begruenden koennten
- Konstantzeit-Vergleich verhindert Timing-Leaks der Schluessellaenge
- Auth-Check wird vor Method-Check ausgefuehrt, damit unautorisierte Clients nicht einmal die `Allow`-Liste lernen

### Geschuetzte Endpunkte

- `GET  /api/operator/commands`
- `POST /api/operator/commands`
- `GET  /api/operator/commands/:id`
- `POST /api/operator/commands/:id/:action` (alle 5 Actions, inkl. `execute` -> bleibt zusaetzlich 423)

### Was Auth Gate **nicht** ist

- **Kein User-Login**: ein einziger gemeinsamer Schluessel ist keine Operator-Identitaet.
- **Kein Session-Management**: kein Refresh, kein Logout, kein Replay-Schutz.
- **Kein Rate-Limit**: 100 Requests/Sekunde rauschen ungehemmt durch.
- **Kein Audit pro Identitaet**: alle erfolgreichen Requests sehen serverseitig gleich aus.

### Vor echter Integration weiterhin noetig

- User/Session-Auth (Vercel OIDC, Supabase Auth, oder mind. Cloudflare-Access vor der Route)
- Rate Limits pro Identitaet (Upstash, Vercel KV) inkl. Burst-Limit
- Persistenz-Layer fuer Commands + Audit Log
- HMAC-Signatur Backend Proxy <-> Andromeda Upstream
- Andromeda-Upstream-Allowlist + getrennte Env-Variable `ANDROMEDA_DISPATCH_URL`
- Replay-Schutz via Timestamp + Nonce auf jedem Upstream-Call
- `execute`-Unlock nur durch explizite Server-Config UND vorhandene Freigabe UND HMAC-Verifikation

## 12. APP-X-BRIDGE-03 — Abuse Guard + Audit Skeleton

Status: In-Memory-Skeleton fuer Rate-Limit und Audit-Log. Beide Layer liegen
serverseitig vor Auth und Handler-Logik, damit auch 503/401-Spam wenigstens
in-process gedrosselt wird. Buffer und Counter ueberleben keinen Vercel-Cold-Start.

### Pipeline-Reihenfolge je Endpoint

1. **Rate Limit** (`api/_lib/rateLimit.ts`)
2. **Auth Gate** (`api/_lib/auth.ts` — neu: `checkOperatorAuth` + `respondAuthFailure`)
3. **Method Allowlist** (`methodAllowed`)
4. **Body Validation / Handler-Logic** (inkl. Audit-Hooks an Erfolg/Misserfolg)

### Rate Limit

- 60 Requests pro 60 Sekunden Sliding-Window pro Client-Key.
- Client-Key abgeleitet aus `x-forwarded-for[0]` -> `x-real-ip` -> `'unknown'`.
- Raw-IP wird **nicht** gespeichert oder geantwortet. Stattdessen 8-stelliges
  FNV-1a-Hex-Label (nicht-reversibel) als `clientKeyLabel` im Audit.
- Bei Ueberschreitung:
  - HTTP **429**
  - Header `Retry-After: <Sekunden>`
  - JSON `{"error":"rate_limited","message":"Too many operator API requests. Try again later."}`
- Limits sind **process-local** auf einer Vercel-Instance. Andere Instanzen sehen
  ihren eigenen Bucket. Echte Production braucht einen geteilten Store.

### Audit Log

- In-Memory Ring-Buffer, max **200 Events**, FIFO-Eviction.
- Reine Lesefunktion `GET /api/operator/audit` (siehe unten).
- Felder pro Event:
  - `id` (`AUD-<base36 time>-<base36 counter>`)
  - `timestamp` ISO-8601
  - `eventType` (siehe Liste)
  - `route`, `method`, `statusCode?`, `outcome` (`success | attempt | blocked | failure`)
  - `clientKeyLabel` (8-stelliger Hash, nie raw IP)
  - `commandId?`, `action?`, `detailsSummary?` (kurz, kein Body, kein Secret)

EventType-Liste:

```text
COMMAND_CREATE_ATTEMPT  COMMAND_CREATED          COMMAND_LIST
COMMAND_READ            COMMAND_ACTION_ATTEMPT   COMMAND_DRY_RUN
COMMAND_APPROVAL_REQUESTED                       COMMAND_APPROVED
COMMAND_REJECTED        COMMAND_EXECUTE_BLOCKED  AUTH_NOT_CONFIGURED
AUTH_FAILED             RATE_LIMITED             VALIDATION_FAILED
NOT_FOUND               AUDIT_LIST
```

Privacy-Regeln (Code enforced):

- Keine vollstaendigen IPs im Event-Body.
- Keine Request-Bodies komplett — nur Feldname / commandType / action / outcome.
- Keine Secrets (das Operator-Key wird vom Audit-Modul nie gelesen).

### Neue Endpoint

```
GET /api/operator/audit
```

- Gleicher Rate-Limit + Auth-Gate wie alle anderen Operator-Routen.
- Solange `NOX_OPERATOR_API_KEY` unset ist: **503**, kein Event-Leak.
- Bei autorisierter Anfrage: `{ events: [...], meta: { skeleton: true, ringBufferMax: 200, count, liveExecution: 'locked' } }`
- Neueste Events zuerst.

### Bestehendes Verhalten unveraendert

- **503** wenn `NOX_OPERATOR_API_KEY` nicht gesetzt (Auth-Layer, vor Method).
- **401** bei falschem/fehlendem Key wenn Env gesetzt waere.
- **423** `execute` bleibt hart locked, jetzt zusaetzlich mit Audit-Event
  `COMMAND_EXECUTE_BLOCKED` (Sichtbarkeit fuer Spam-Versuche).
- **400** bei unknown action / Validierungsfehler, jetzt mit `VALIDATION_FAILED` Audit.
- **404** bei fehlendem Command, jetzt mit `NOT_FOUND` Audit.

### Nicht-Ziele

- **Kein echtes User-Audit**: clientKeyLabel ist Hash der Vercel-Edge-Client-IP,
  nicht eine Operator-Identitaet.
- **Keine persistente DB**: Ring-Buffer und Bucket-Map sterben beim Cold-Start.
- **Kein WAF**: Vercel-Edge macht nichts Zusaetzliches; das hier ist ein
  In-Process-Drossel, kein DDoS-Schutz.
- **Kein Upstream-Call**: Andromeda/Notion/Telegram werden weiterhin nicht
  beruehrt.
- **Kein `execute`-Unlock**: bleibt hartcodiert auf 423.

### Vor echter Integration weiterhin noetig

- **Persistenter Audit-Store** (Vercel KV / Supabase / Postgres) inkl. Index
  und Retention-Policy.
- **Geteilter Rate-Limit-Store** quer ueber Serverless-Instances (Upstash /
  Vercel KV).
- **Per-User-Auth** statt eines gemeinsamen Schluessels.
- **HMAC-Upstream** zwischen Backend-Proxy und Andromeda inkl. Timestamp +
  Nonce.
- **Replay-Schutz** auf Idempotency-Keys mit TTL.
- **Persistente Idempotency-Liste** statt nur In-Memory-Map.

## 13. APP-X-BRIDGE-04a — Notion Read-Only Projection

Neuer Endpoint, der erstmals eine externe Quelle anbindet: die Notion
Master-Tasks-DB. Strikt **read-only**. Kein Schreiben, kein Anlegen, keine
Schema-Mutation. Kein Andromeda-Upstream. Keine Uploads.

### Implementiert

- `api/_lib/notion.ts` — minimaler Notion-Read-Only-Adapter (nur global
  `fetch`, keine neue Dependency)
- `api/_lib/types.ts` — `ProjectContextResponse` + Unterstuetzungstypen
- `api/operator/projects/[projectId]/context.ts` — neuer Endpoint
- `api/_lib/audit.ts` — neue Event-Typen `PROJECT_CONTEXT_*`

### Endpunkt

```
GET /api/operator/projects/:projectId/context
```

Pipeline je Request:

1. **Rate Limit** (BRIDGE-03)
2. **Auth Gate** (BRIDGE-02, `NOX_OPERATOR_API_KEY`)
3. **Method allowlist** (`GET`)
4. **projectId-Validierung** (Regex `[A-Za-z0-9._-]{1,64}`)
5. **Notion Read-Only** via `NOX_NOTION_READONLY_TOKEN` + `NOX_MASTER_TASKS_DB_ID`

### Server-Konfiguration

| Env Var                       | Pflicht | Beschreibung                                            |
| ----------------------------- | ------- | ------------------------------------------------------- |
| `NOX_OPERATOR_API_KEY`        | ja      | Auth-Gate (BRIDGE-02). Ohne Wert → 503.                 |
| `NOX_NOTION_READONLY_TOKEN`   | ja      | Notion-Integration mit **read-only**-Scope. Server-side only. |
| `NOX_MASTER_TASKS_DB_ID`      | ja      | Database-ID der Master Tasks.                           |
| `NOX_PROJECT_MAPPING_MODE`    | nein    | `none` (Default) oder `title-prefix`. Siehe Section 14. |

Der Notion-Token wird ausschliesslich im `Authorization: Bearer`-Header an
`https://api.notion.com/v1/...` gesendet, niemals an den Client zurueckgegeben
und nie in Audit-Eintraegen geloggt.

### Read-Only-Semantik

Notion verlangt fuer Database-Queries technisch `POST /v1/databases/{id}/query`.
Diese Operation ist **read-only**: sie liefert Zeilen, mutiert nichts. Der
Adapter implementiert ausschliesslich diesen einen Endpunkt — keine `PATCH`,
keine Page-Updates, kein Block-Append, keine Schema-Mutation.

Optionales spaeteres Lesen einzelner Seiten (`GET /v1/pages/{id}`) bleibt im
gleichen Modul gekapselt und gilt ebenfalls read-only.

### Response-Format

`ProjectContextResponse` (siehe `api/_lib/types.ts`):

```json
{
  "project": { "projectId": "...", "title": "...", "summary": "..." },
  "quests":      [],
  "openApprovals": [],
  "blockers":      [],
  "recentEvents":  [],
  "artifacts":     [],
  "contextSummary": "...",
  "nextSuggestedReadOnlyActions": [],
  "meta": { "skeleton": true, "readOnly": true, "projectMappingConfigured": false, "liveExecution": "locked" }
}
```

### Verhalten bei fehlender Konfiguration

| Bedingung                                   | Antwort                                                     |
| ------------------------------------------- | ----------------------------------------------------------- |
| `NOX_OPERATOR_API_KEY` fehlt                | 503 `service_unavailable` (BRIDGE-02 Verhalten)             |
| `NOX_NOTION_READONLY_TOKEN` oder DB-ID fehlt | 503 `notion_not_configured`                                 |
| projectId-Param invalid                     | 400 `bad_request` mit erlaubter Regex                       |
| Notion API-Fehler                           | 502 `notion_upstream_error` (ohne Token/Body-Leak)          |
| Mapping `none`                              | 200 mit leerem `quests`/`blockers`/... + erklaerendem Summary |

### Audit-Events

Neue `AuditEventType`-Werte:

- `PROJECT_CONTEXT_READ_ATTEMPT`
- `PROJECT_CONTEXT_READ`
- `PROJECT_CONTEXT_NOT_CONFIGURED`
- `PROJECT_CONTEXT_VALIDATION_FAILED`
- `PROJECT_CONTEXT_UPSTREAM_FAILED`

### Sicherheitsgrenzen

- Kein Schreibzugriff auf Notion (kein PATCH, kein POST ausser dem
  read-only Query-Endpoint, kein Block-Append).
- Kein Andromeda/n8n-Aufruf.
- Kein Telegram-Send.
- Token wird je Request aus `process.env` gelesen — kein Modul-State.
- Notion-Body-Errors landen nicht im Response-Body — nur ein kurzer Code.
- `projectId` ist Regex-validiert vor jedem Echo in JSON.

### Nicht-Ziele

- Keine Notion-Schreibzugriffe (auch nicht „nur Status").
- Kein Andromeda-Trigger.
- Kein Cockpit-Frontend-Connect (eigene Quest BRIDGE-05).
- Kein Caching-Layer (eigene Quest, sobald Lasttests es rechtfertigen).
- Keine Cursor-Pagination (eine Page mit 100 Tasks reicht im MVP).

### Vor echter Integration weiterhin noetig

- **Eigene read-only Notion-Integration** mit minimalem DB-Scope
  (separat vom Bridge-/Worker-Write-Token).
- **Cache-Layer** (ETag, TTL ≥ 30 s) sobald mehrere Operator-Sessions
  gleichzeitig denselben Project-Context abfragen.
- **Pagination** sobald Master Tasks > 100 aktive Eintraege hat.
- **Cockpit-Frontend-Hook**: liest diesen Endpoint serverseitig (Next/Vercel
  serverless oder dedizierter Frontend-Loader), niemals direkt im Browser.

## 14. ReferenceArtifact Contract + Open Project Mapping Decision

### ReferenceArtifact (definiert, **nicht implementiert**)

`ReferenceArtifact` ist die geteilte Struktur, mit der Andromeda und APP-X
spaeter visuelle/dokumentarische Referenzen an Commands, Quests oder
ganze Projekte anhaengen. Aktuell **nur als Type** in `api/_lib/types.ts` —
keine Storage-Logik, keine Upload-Pipeline, keine Ingestion.

Felder (TypeScript):

```ts
interface ReferenceArtifact {
  artifactId: string;
  projectId: string;
  commandId?: string;
  questId?: string;

  sourceType: 'upload' | 'notion' | 'drive' | 'miro'
            | 'excalidraw' | 'url' | 'screenshot' | 'file';

  mimeType: string;
  storageRef: string;       // URL or logical ref: 'notion:<page>/<block>', 'drive:<fileId>'
  checksum?: string;        // sha256 — de-dupe + integrity
  sizeBytes?: number;

  title: string;
  summary: string;
  usageHint: string;        // 'design-reference' | 'ui-screenshot' | 'spec' | 'inspiration'

  createdBy: string;
  createdAt: string;
  expiresAt?: string;       // Drive/Miro/sharing-link TTL

  visibility: 'private' | 'team' | 'project';   // default: 'private'
  ingestionStatus: 'pending' | 'indexed' | 'failed' | 'skipped';

  // Ingestion outputs (filled by downstream worker, never by APP-X):
  extractedText?: string;
  imageSummary?: string;
  safetyNotes?: string;
}
```

Bewusst **nicht** Teil dieser Quest:

- Datei-Upload (kein Storage angefasst — kein S3, R2, Blob, Drive).
- OAuth zu Drive / Miro / Excalidraw.
- OCR / VLM / Transkription — Ingestion ist Downstream.
- Speicherung im Cockpit-Backend — Persistenzschicht fehlt noch.

`artifacts: ReferenceArtifact[]` ist im `ProjectContextResponse` bereits als
leeres Array enthalten, damit Frontends gegen den finalen Vertrag bauen
koennen, ohne dass APP-X heute schon Artefakte liefert.

### Open Project Mapping Decision

Master Tasks ist heute flach — kein `Project`-Feld, keine Projects-DB. Drei
moegliche Strategien fuer die Zuordnung Quest → Projekt:

1. **`title-prefix`** *(default-faehig, kein Notion-Schema-Touch)*
   Quest-Titel beginnt mit `[projectId] …` oder `projectId: …`. Aktuell
   per `NOX_PROJECT_MAPPING_MODE=title-prefix` aktivierbar.
   Vorteil: Null-Migration. Nachteil: brueckig (Tippfehler im Titel
   == verlorene Zuordnung).

2. **Notion `Project`-Multi-Select**
   Neues Feld auf Master Tasks. Sauberer, erlaubt mehrere Projekte je Quest.
   Erfordert Notion-DB-Schema-Aenderung (manuell, **nicht** durch APP-X).

3. **Separate Projects-DB** *(sauberste Loesung, hoechste Investition)*
   Eigene DB mit Relation zu Master Tasks. Erlaubt Projekt-Metadaten,
   Status, Owner, Lifecycle. Operator-Entscheid noetig.

Default in APP-X-BRIDGE-04a: **`none`** — keine Mapping-Annahmen, leere
Quest-Liste, klarer Hinweis im `contextSummary`. So vermeidet der Endpoint
„fantasierte" Projekt-Zuordnungen, bis der Operator eine Strategie wahrgewaehlt
hat.

## 15. APP-X-BRIDGE-04c — Notion Project Relation Mapping

Preflight (siehe `_appx_preflight_*.py` in dem Recon-Worktree) hat ergeben,
dass es bereits eine kanonische Mapping-Schicht in Notion gibt:

- **Projects-DB** `🧭 Projects / System Map`
- Property `Project ID` (rich_text) als human-readable Projekt-Code
  (z. B. `APP-X`)
- Master Tasks Property `Project` (relation, dual_property) als kanonische
  Quest-Zuordnung — bereits aktiv, 4 Quests fuer `APP-X` bestehend

BRIDGE-04c implementiert diese kanonische Schicht als neuen Mapping-Mode.

### Implementiert

- `api/_lib/notion.ts`
  - `queryProjectsByProjectId(token, projectsDbId, projectId)` — filtert
    Projects-DB nach `Project ID rich_text equals <projectId>` (page_size 5).
  - `queryMasterTasksByProjectRelation(token, masterTasksDbId, projectPageId)` —
    filtert Master Tasks nach `Project relation contains <page-uuid>`,
    sortiert nach `last_edited_time desc`, max 100.
  - `extractProjectFields(props)` — defensiver Extraktor fuer alle
    Projects-DB-Felder (`title`, `projectId`, `status`, `typ`, `priority`,
    `vision`, `andromedaContext`, `currentState`, `nextAction`,
    `allowedActions`, `forbiddenActions`, `artifactLinks`, `primaryUrl`).
  - `propRelationIds`, `propUrl` — zusaetzliche Property-Extraktoren.
  - `queryDatabase` akzeptiert jetzt ein optionales `filter`-Argument.
- `api/_lib/types.ts` — `ProjectContextProject` + `ProjectContextQuest`
  bekommen optionale Felder fuer die reichere Projektion. Alle Zusatzfelder
  sind optional, damit `none` und `title-prefix` Modi weiter funktionieren.
- `api/_lib/audit.ts` — neue Event-Typen:
  - `PROJECT_CONTEXT_PROJECT_LOOKUP`
  - `PROJECT_CONTEXT_PROJECT_NOT_FOUND`
  - `PROJECT_CONTEXT_RELATION_READ`
- `api/operator/projects/[projectId]/context.ts` — neuer Mapping-Mode
  `notion-relation`.

### Mapping-Modes (Zusammenfassung)

| Mode             | Verhalten                                              | Coverage |
| ---------------- | ------------------------------------------------------ | -------- |
| `none` (default) | leere Projektion + erklaerender `contextSummary`       | 0%       |
| `title-prefix`   | matcht `[id]…`, `id:…`, `id —…`, `id -…` im Titel       | partial  |
| `notion-relation` | Projects-DB-Lookup + `Project`-Relation-Filter         | 100%     |

### Server-Konfiguration (additiv)

| Env Var                       | Pflicht                                | Beschreibung                                            |
| ----------------------------- | -------------------------------------- | ------------------------------------------------------- |
| `NOX_OPERATOR_API_KEY`        | ja                                     | Auth-Gate (BRIDGE-02).                                  |
| `NOX_NOTION_READONLY_TOKEN`   | ja                                     | Read-only Notion-Integration-Token.                     |
| `NOX_MASTER_TASKS_DB_ID`      | ja                                     | DB-ID der Master Tasks.                                 |
| `NOX_PROJECTS_DB_ID`          | **nur bei mode=notion-relation**       | DB-ID der Projects/System-Map-DB.                       |
| `NOX_PROJECT_MAPPING_MODE`    | nein (`none` default)                  | `none` \| `title-prefix` \| `notion-relation`           |

Die Notion-Integration muss **beide** Datenbanken (Master Tasks + Projects)
explizit in Notion angeschlossen haben, sonst antworten Notion-Endpoints
mit 4xx — der Adapter uebersetzt das zu generischem `502
notion_upstream_error` ohne Token-Leak.

### Flow `notion-relation`

```
GET /api/operator/projects/APP-X/context
  -> rate limit
  -> auth gate
  -> method GET
  -> projectId regex
  -> readNotionConfig
  -> mode == notion-relation
  -> NOX_PROJECTS_DB_ID set?
       no  -> 503 project_mapping_not_configured
       yes -> POST Projects DB /query  filter: Project ID equals 'APP-X'
              0 hits -> 404 project_not_found
              1+ hits -> take first
                -> POST Master Tasks /query  filter: Project contains <page-uuid>
                -> 200 ProjectContextResponse
                   project: { projectId, title, status, typ, priority, vision,
                              andromedaContext, currentState, nextAction,
                              allowedActions, forbiddenActions, artifactLinks,
                              primaryUrl }
                   quests: [...]  with status, agent, result, blocker, approved,
                                  approvalNeeded, questStarten, questAbgeschlossen
                   openApprovals, blockers, recentEvents derived from quests
                   artifacts: []  (kept empty — see Section 14 ReferenceArtifact)
```

### Verhalten je Bedingung

| Bedingung                                                                | Antwort                                                       |
| ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `NOX_OPERATOR_API_KEY` fehlt                                             | 503 `service_unavailable`                                     |
| `NOX_NOTION_READONLY_TOKEN` oder `NOX_MASTER_TASKS_DB_ID` fehlt          | 503 `notion_not_configured`                                   |
| `mode=notion-relation` aber `NOX_PROJECTS_DB_ID` fehlt                   | 503 `project_mapping_not_configured`                          |
| projectId-Param invalid                                                  | 400 `bad_request`                                             |
| Projects-DB-Lookup findet 0 Treffer                                      | 404 `project_not_found`                                       |
| Notion-Upstream-Fehler in irgendeinem Query                              | 502 `notion_upstream_error` (ohne Token/Body-Leak)            |
| Erfolgreich                                                              | 200 `ProjectContextResponse` mit voller Projects-Metadata     |

### Audit-Events (neu in BRIDGE-04c)

- `PROJECT_CONTEXT_PROJECT_LOOKUP` — vor dem Projects-DB-Query
- `PROJECT_CONTEXT_PROJECT_NOT_FOUND` — bei 0 Treffer im Lookup
- `PROJECT_CONTEXT_RELATION_READ` — nach erfolgreichem Relation-Query
- `PROJECT_CONTEXT_READ` — final 200 (bestehend)
- `PROJECT_CONTEXT_UPSTREAM_FAILED` — bei jedem Notion-Fehler in der Kette

Keine Raw-Notion-Payloads, keine Tokens, keine vollstaendigen Bodies im
Audit-Eintrag — nur kurze `detailsSummary`-Strings.

### Sicherheitsgrenzen (unveraendert)

- Kein Notion-Write (kein PATCH, kein Page-Update, kein Block-Append).
- Kein Andromeda/n8n-Aufruf.
- Kein Telegram.
- Kein Upload, kein Drive-/Miro-OAuth.
- `execute` bleibt 423.
- Token nur im `Authorization`-Header, niemals im Response-Body.

### Nicht-Ziele

- Artefakt-Ingestion (OCR/VLM) — bleibt Downstream.
- Cockpit-Frontend-Integration — eigene Quest BRIDGE-05.
- Server-side Cache — eigene Folge-Quest.
- Pagination — nicht benoetigt, solange < 100 Quests pro Projekt.

### Vor produktivem Einsatz weiterhin noetig

- Eigene **read-only** Notion-Integration mit minimalem Scope (Master Tasks
  + Projects DB connected).
- Vercel Production Env-Set:
  - `NOX_OPERATOR_API_KEY=<32-byte secret>`
  - `NOX_NOTION_READONLY_TOKEN=<read-only Notion token>`
  - `NOX_MASTER_TASKS_DB_ID=82e74706fe8143218938da0da91433d2`
  - `NOX_PROJECTS_DB_ID=643a4be0e92c45a3befca0a1118d14b4`
  - `NOX_PROJECT_MAPPING_MODE=notion-relation`
- Cache-Layer (ETag, TTL ≥ 30 s) sobald Cockpit-Frontend regelmaessig pollt.
- Cockpit-Frontend-Loader, der diesen Endpoint serverseitig konsumiert.

## 16. APP-X-BRIDGE-04d — Context Endpoint Hardening

Defensive Erweiterungen ohne neues externes Verhalten. Kein Env wird gesetzt,
keine Secrets im Repo, keine Code-Pfade geaendert, die nicht schon read-only
sind.

### Implementiert

- **Notion-fetch Abort-Timeout**
  `api/_lib/notion.ts` wickelt jeden Notion-Aufruf in einen `AbortController`
  mit Timer. Default 8000 ms, ueberschreibbar via `NOX_NOTION_FETCH_TIMEOUT_MS`
  (clamped `[1000, 15000]`). Bei Timeout: kontrolliertes
  `{ ok: false, reason: 'upstream_error', summary: 'notion_timeout after Xms' }`,
  das im Endpoint als 502 `notion_upstream_error` (ohne Token-Leak) returnt
  wird. Damit kann eine langsame Notion-Antwort die Vercel-Function nicht mehr
  bis zum Vercel-Default-Timeout (10 s Hobby) blockieren.

- **`Cache-Control: no-store` auf allen Operator/API-Responses**
  Neuer Helper `setNoStore(res)` in `api/_lib/handler.ts`. Wird einmal am
  Handler-Eingang aufgerufen, gilt fuer alle Response-Pfade
  (200/4xx/5xx). Angewendet auf:
  - `api/operator/projects/[projectId]/context.ts`
  - `api/operator/commands.ts`
  - `api/operator/commands/[id].ts`
  - `api/operator/commands/[id]/[action].ts`
  - `api/operator/audit.ts`

  Verhindert, dass Vercel-Edge-Cache oder Browser-Cache stale Operator-State
  ausliefern. Idempotent.

- **`.env.example` Placeholder fuer alle Bridge-Env-Vars**
  Erweitert um `NOX_NOTION_READONLY_TOKEN`, `NOX_MASTER_TASKS_DB_ID`,
  `NOX_PROJECTS_DB_ID`, `NOX_PROJECT_MAPPING_MODE`, `NOX_NOTION_FETCH_TIMEOUT_MS`
  — alle leer, mit Erklaerungskommentaren. **Keine echten Werte.**

### Sicherheitsgrenzen (unveraendert)

- Kein Notion-Write.
- Keine neuen Dependencies (`AbortController` ist Web-/Node-Standard).
- `fetch` weiterhin nur in `api/_lib/notion.ts`.
- Einzige externe URL bleibt `https://api.notion.com`.
- Kein Andromeda-/n8n-/Telegram-Aufruf.
- Token wird je Request aus `process.env` gelesen, niemals geloggt, niemals
  in Response oder Audit-Detail eingebettet.
- `execute` bleibt 423.

### Konfigurations-Verhalten

| Env Var                          | Default          | Effekt                                              |
| -------------------------------- | ---------------- | --------------------------------------------------- |
| `NOX_NOTION_FETCH_TIMEOUT_MS`    | `8000`           | clamped `[1000, 15000]`; `notion_timeout` bei Abort |

Bei Abbruch durch Timeout: das Endpoint-Verhalten ist identisch zu jedem
anderen Notion-Upstream-Fehler — **502 `notion_upstream_error`** mit
generischer Message. Audit-Event: `PROJECT_CONTEXT_UPSTREAM_FAILED` mit
`detailsSummary` der `notion_timeout after Xms` enthaelt (read-only, kein
Secret).

### Vor produktivem Einsatz weiterhin noetig

- Echte Env-Aktivierung (`NOX_OPERATOR_API_KEY` + Notion-Env) in Vercel
  Production — separat, nicht Teil dieser Quest.
- Cache-Layer mit ETag/TTL kommt erst mit Cockpit-Frontend-Polling.

## 17. APP-X-BRIDGE-04e — Safe Notion Upstream Diagnostics

### Problem

Vor 04e antwortete `/api/operator/projects/:projectId/context` bei jedem
Notion-Read-Fehler mit einem generischen `502 notion_upstream_error`. Welcher
Read fehlschlug (Projects DB Lookup, Master Tasks Relation Query oder
Master Tasks Flat Query) und welcher Notion-Code/Message dahintersteckte,
war fuer den Operator unsichtbar. Der Audit-Ringpuffer ist in-memory und
verliert die Spur bei Cold-Start oder Function-Instanz-Wechsel — Production
Runtime Logs zeigen nur Statuscode + Pfad. Diagnose erforderte lokale
Reproduktion mit Live-Token. Genau das soll 04e wegnehmen.

### Scope

Nur Diagnose-Sichtbarkeit. Kein Verhaltenswechsel, keine neue Notion-Call,
keine Notion-Writes, keine Schema-Aenderung an der Erfolgs-Response, keine
neue Dependency.

### Mechanik

1. **Adapter-Schicht** (`api/_lib/notion.ts`) liest bei `!resp.ok` den
   Notion-Response-Body sanitised (`UPSTREAM_MESSAGE_MAX=300`,
   `UPSTREAM_CODE_MAX=80`), versucht JSON.parse, und extrahiert nur `code`
   + `message` aus Notions eigenem Error-Envelope (`{object:"error", code,
   message, request_id}`). Schlaegt der Parse fehl, bleiben die Felder
   `undefined`. Der Body wird nie verbatim weitergegeben.
2. **NotionQueryResult.error** erhaelt drei optionale Felder:
   `upstreamStatus`, `upstreamCode`, `upstreamMessage`.
3. **Context-Handler** mappt jeden Failure-Pfad auf einen `step` und ruft
   `notionUpstream502(res, step, failure)`:

| Schritt                          | step-Wert                        |
| -------------------------------- | -------------------------------- |
| `queryProjectsByProjectId`       | `projects_lookup`                |
| `queryMasterTasksByProjectRelation` | `master_tasks_relation_query` |
| Flat-Query (title-prefix mode)   | `master_tasks_query`             |

### Antwort-Format

Authenticated-only (hinter `NOX_OPERATOR_API_KEY` + Rate-Limit + Method-Gate):

```json
{
  "error": "notion_upstream_error",
  "message": "Notion read-only query failed.",
  "diagnostic": {
    "step": "projects_lookup",
    "upstreamStatus": 404,
    "upstreamCode": "object_not_found",
    "upstreamMessage": "Could not find database with ID: ..."
  }
}
```

Felder `upstreamStatus`, `upstreamCode`, `upstreamMessage` sind individuell
optional. Wenn Notion keinen JSON-Body schickt (z.B. Netzwerk-Abort durch
`AbortController`-Timeout aus 04d), erscheint nur `step` plus optional
`upstreamStatus` aus `resp.status`.

### Secret-Leak-Schutz (Invarianten)

- Adapter liest **nur** `resp.text()` und Notions JSON-Envelope. Authorization-
  Header, Bearer-Token, Request-Body, DB-IDs, Env-Werte werden **niemals**
  in den Diagnostic-Block kopiert.
- `upstreamMessage` ist auf 300 Zeichen, `upstreamCode` auf 80 Zeichen
  begrenzt. Notion-Error-Messages sind kurz und enthalten weder Token
  noch Header.
- Der Diagnose-Block erscheint nur in Antworten, die das Auth-Gate
  passiert haben — kein Public-Surface.
- Audit-Log fasst dieselben Felder im `detailsSummary` zusammen
  (`projects_lookup: notion query returned HTTP 404 object_not_found`)
  und bleibt damit konsistent.

### Was 04e nicht macht

- Keine Persistenz fuer das Audit-Log (das bleibt Vercel-Cold-Start-fluechtig).
  Persistenz ist eigenes Quest-Scope (KV/Upstash).
- Kein Behavioural Change in Success-Pfaden — `ProjectContextResponse`
  unveraendert.
- Keine zusaetzliche Notion-API-Verb-Surface. Weiterhin nur
  `POST /v1/databases/{id}/query`.
- Kein Telegram, kein Andromeda, kein Execute-Unlock.

### Erwartete Diagnose-Use-Cases

| Symptom in Production       | Diagnostic-Output                                           | Wahrscheinliche Ursache                                |
| --------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| `step=projects_lookup` 404  | `object_not_found`, "Could not find database..."            | Integration fehlt auf Projects DB Connection-Liste     |
| `step=projects_lookup` 401  | `unauthorized`                                              | `NOX_NOTION_READONLY_TOKEN` ungueltig oder rotiert     |
| `step=projects_lookup` 400  | `validation_error`, "property Project ID is not a rich_text"| Property `Project ID` umbenannt oder Typ geaendert     |
| `step=master_tasks_relation_query` 400 | `validation_error`, "Project is not a relation property" | Property `Project` in Master Tasks geaendert         |
| `step=master_tasks_relation_query` 404 | `object_not_found`                                   | Integration fehlt auf Master Tasks Connection-Liste    |
| upstreamMessage `notion_timeout after Xms` | (kein upstreamStatus)                            | Notion lahm, AbortController hat zugeschlagen          |
