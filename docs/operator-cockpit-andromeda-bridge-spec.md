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
