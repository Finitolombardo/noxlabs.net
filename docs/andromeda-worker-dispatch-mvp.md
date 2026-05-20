# Andromeda Worker Dispatch — MVP

Status: read-only dry-run implementiert auf Branch `andromeda-dispatch-preview`
(abgezweigt von `origin/main`, noch nicht gemerged).
Letztes Update: 2026-05-21.

## Warum dieses Dokument zuerst (und kein Auto-Runner)

Phase 2E hat den Notion-Write-Pfad scharfgeschaltet. Operator will jetzt
den Loop schließen:

```
Projektziel → Quest erzeugen → Agent/Worker bearbeitet → Ergebnis zurück
```

Vor Auto-Runner muss eine ehrliche Realitäts-Inventur stehen:

- **Ein Claude/Anthropic Browser-Abo ist KEIN Server-Worker.** Ein
  abonnierter Browser-Tab kann keine HTTP-Endpunkte aus dem Repo
  bedienen. Er ist eine UI für einen menschlichen Operator.
- **Für echten Hintergrundbetrieb braucht es einen separaten Pfad**:
  entweder
  - einen Anthropic-API-Runner (eigener Anthropic API-Key, eigene
    Server-Function, eigenes Audit-/Approval-Setup), oder
  - einen Codex-CLI-Runner / NOX-Agent-Runner mit Inbound-Trigger,
    oder
  - einen rein manuellen Operator-Flow, der erst später durch einen
    Runner ersetzt wird.

Diese MVP-Quest baut **bewusst keinen** dieser Runner. Sie baut nur:

1. einen klaren Dispatch-Contract,
2. ein Statusmodell als Vorschlag,
3. einen read-only Dry-Run-Endpoint,
4. einen UI-Knopf "Dispatch prüfen" im Operator Cockpit.

Damit kann der Operator JETZT pro Plan-Schritt sehen, ob die Quest
plausibel an einen Agent gehen könnte, welche Felder fehlen, welche
Risk-Flags greifen — ohne dass irgendein externer Worker existiert.

## Was aktuell existiert (Bestand-Inventur)

| Bereich                                | Vorhanden?                  | Datei / Quelle                                           |
|----------------------------------------|------------------------------|-----------------------------------------------------------|
| Plan/Preview/Validate/Commit-Pipeline  | ja, scharfgeschaltet (Phase 2E) | `api/operator/projects/[projectId]/plan/*.ts`            |
| Master-Tasks-Write-Allowlist           | 10 Properties (s. u.)        | `api/_lib/types.ts:420`                                  |
| Audit-Log (Mirror + best-effort persistent) | ja                       | `api/_lib/audit.ts`, `api/_lib/auditStore.ts`            |
| `commands`-API (`dry-run`/`approve`/`reject`/`execute`) | Skeleton, `execute` permanent 423 | `api/operator/commands/[id]/[action].ts`     |
| Dispatcher / Worker / Queue / Webhook  | **nicht vorhanden**          | weder `api/` noch `src/` enthalten Implementierungen      |
| Anthropic / Claude / Codex Runner      | **nicht vorhanden**          | nur Konzeptnamen in `docs/` + UI-Dropdowns                |
| Andromeda Bridge Spec                  | Spec-Dokument, kein Code     | `docs/operator-cockpit-andromeda-bridge-spec.md`          |
| `andromedaContext` Notion-Property     | nur als READ-Feld extrahiert | `api/_lib/notion.ts:579`                                  |

**Aktueller Master-Tasks-Write-Allowlist** (10 Properties):

```ts
['Titel', 'Agent', 'Project', 'Plan Draft ID', 'Plan Draft Digest',
 'Schritt-Reihenfolge', 'Reason', 'Operator-Check', 'Prompt',
 'Ergebnis / Definition of Done']
```

**Was im Allowlist FEHLT, was wir für echten Dispatch bräuchten:**

- `Bearbeitungsstatus` (oder ein vergleichbarer Select) — der Status-Wert
  aus dem Modell unten.
- `Quest starten` (Checkbox) — falls der Master-Tasks-Dispatcher aus
  CLAUDE.md jemals ans System angebunden wird.
- `🤖 Folgeprompt` (rich_text) — vom Worker zurückgeschrieben.
- `🤖 Ergebnis` (rich_text) — vom Worker zurückgeschrieben.
- `🤖 Nächster Agent` (Select) — vom Worker für Hand-off vorgeschlagen.

Diese Properties existieren möglicherweise in der echten Notion-DB
`82e74706fe8143218938da0da91433d2` (Master Tasks), werden aber
**heute vom Cockpit-Write-Pfad nicht gesetzt und nicht gelesen**.
Schema-Erweiterung passiert NICHT automatisch in dieser Quest — sie
muss bewusst durch den Operator + ein separates Quest-Update erfolgen.

## Zielarchitektur (Phase 2F+, später)

```
┌────────────────────────────────────────────────────────────────┐
│ Operator Cockpit                                               │
│   - Project Auto Planner → Quest committed → Notion Page Id    │
│   - Quest-Detail → Button "Dispatch prüfen" (dieser MVP)       │
│   - Quest-Detail → Button "Agent starten" (Phase 2F)           │
└────────────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────┐
│ /api/operator/andromeda/dispatch/preview  (DIESER MVP)         │
│   - read-only Dry-Run                                          │
│   - liefert DispatchPayload + ReadinessReport                  │
│   - kein Worker, kein Notion-Write, kein externer Call         │
└────────────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────┐
│ /api/operator/andromeda/dispatch/run      (NOCH NICHT GEBAUT)  │
│   - Approval-Gate (operatorApprovalRequired)                   │
│   - Idempotenz-Key                                             │
│   - Runner-Adapter: anthropic-api | codex | nox-agent | n8n    │
│   - Audit-Event PLAN_DISPATCH_REQUESTED                        │
└────────────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────┐
│ Worker (NOCH NICHT GEBAUT)                                     │
│   - bearbeitet Quest gemäß Payload                             │
│   - schreibt Ergebnis zurück via /dispatch/callback            │
└────────────────────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────┐
│ /api/operator/andromeda/dispatch/callback (NOCH NICHT GEBAUT)  │
│   - HMAC-validiert                                             │
│   - patcht Notion-Master-Task (Status, 🤖 Ergebnis, …)         │
│   - Audit-Event PLAN_DISPATCH_RESULT                           │
└────────────────────────────────────────────────────────────────┘
```

## Dispatch Contract (implementiert)

Aus `api/_lib/dispatch.ts`:

```ts
interface DispatchPayload {
  taskId: string;                  // Notion page id, sonst Plan-Step-Id
  notionPageId: string;            // leer pre-commit
  projectId: string;
  title: string;
  objective: string;               // step.ziel
  context: string;                 // projectGoal + reason concat
  expectedOutput: string;          // step.output
  assignedAgent: 'NOX Agent' | 'Claude' | 'Codex' | 'Manuell';
  risk: 'Niedrig' | 'Mittel' | 'Hoch';
  status: DispatchStatus;
  createdAt: string;               // ISO-8601, server-stamped
  dispatchMode: 'dry_run' | 'manual' | 'runner';
  operatorApprovalRequired: boolean;
  outputTarget: 'operator_inbox' | 'notion_master_task' | 'noop';
}
```

Wichtig:
- `dispatchMode` ist heute IMMER `'dry_run'` oder `'manual'`. Der
  Endpoint promotet **nie** zu `'runner'`, weil kein Runner existiert.
- `outputTarget` ist heute IMMER `'noop'`. `'notion_master_task'` wäre
  Phase 2F+ (Schema-Erweiterung + Writeback-Adapter).
- `operatorApprovalRequired = true` für Risk `Mittel` und `Hoch` —
  unabhängig vom Auth-Mode.

## Statusmodell (Vorschlag)

`DispatchStatus` (siehe `DISPATCH_STATUS_LABELS`):

| Wert (Enum)              | Label                  |
|--------------------------|------------------------|
| `draft`                  | Draft                  |
| `ready_for_agent`        | Ready for Agent        |
| `dispatch_queued`        | Dispatch Queued        |
| `in_progress`            | In Progress            |
| `blocked`                | Blocked                |
| `needs_operator_review`  | Needs Operator Review  |
| `done`                   | Done                   |
| `failed`                 | Failed                 |

Heute wird der Status **nicht in Notion persistiert**. Das Modell ist
Vorschlag für eine spätere `Bearbeitungsstatus`-Property. Damit der
Status persistiert werden kann, müsste:

1. Notion-Master-Tasks eine Select-Property bekommen (z. B.
   `Bearbeitungsstatus`).
2. `ALLOWED_MASTER_TASKS_WRITE_PROPERTIES` um den Namen erweitert
   werden.
3. `mapPlanMutationToNotionProperties` bzw. ein zukünftiger
   `mapDispatchToNotionProperties` Builder verdrahten.
4. Schema-Recheck-Logik in `recheckSchemaForCommit` greift dann
   automatisch.

Schema-Erweiterungen passieren explizit per Operator-Quest, **nicht
automatisch** durch diesen MVP.

## Dry-Run Endpoint

`POST /api/operator/andromeda/dispatch/preview`

| Element       | Verhalten                                                                  |
|---------------|----------------------------------------------------------------------------|
| Rate-Limit    | gleicher Pfad wie alle Operator-Endpunkte                                 |
| Auth          | `checkReadOnlyPlannerAuth` (Operator-Key oder Private-Cockpit-Mode)        |
| Cache         | `Cache-Control: no-store`                                                  |
| Method        | nur `POST`                                                                 |
| Body          | `{ projectId, projectGoal, notionPageId?, step: { id, title, ziel, output, reason, agent, risk, gate? } }` |
| Response      | `{ ok, dispatchReady, missingFields[], riskFlags[], dispatchPayloadPreview, recommendedNextAction, meta }` |
| Mutation      | keine                                                                      |
| Notion-Call   | keiner                                                                     |
| Worker-Call   | keiner                                                                     |
| Audit         | ein Event `AUDIT_LIST` mit `source='project-auto-planner'`                |

Strikt validierte Felder:
- `projectId` ∈ `^[A-Za-z0-9._-]{1,64}$`
- `notionPageId` ∈ `^[0-9a-fA-F-]{16,80}$` (oder leer)
- `step.id` ∈ `^[A-Za-z0-9_-]{4,80}$`
- `step.agent` ∈ Plan-Step-Agents-Allowlist
- `step.risk` ∈ Plan-Step-Risks-Allowlist

Verstöße → `400 bad_request` + ein `VALIDATION_FAILED`-Audit-Event.

## UI MVP

Im Operator Cockpit, Project Auto Planner-Modal:

- Im Schritt-Detail-Panel rechts oben neuer Sekundär-Button
  **„Dispatch prüfen"** neben „Schritt entfernen".
- Klick öffnet das Modal „Dispatch-Vorschau (Dry-Run)".
- Anzeige:
  - Bereitschaft („Quest könnte an Agent gehen" / „Noch nicht dispatch-bereit")
  - Dispatch-Mode
  - Empfehlung (recommendedNextAction)
  - Fehlende Felder (rot)
  - Risk-Flags (mit `info` / `warn` / `block`-Severity)
  - Dispatch-Payload als JSON (read-only Pre-Block)
  - Status-Modell als Chip-Liste
  - Server-Hinweise
- Footer:
  - Disabled-Button **„Agent starten (coming soon)"** — bewusst
    inaktiv, weil kein Runner existiert.
  - „Erneut prüfen" + „Schließen".

## Safety-Regeln

- Pure Funktion in `api/_lib/dispatch.ts`. Kein I/O, kein env-Lesen,
  kein Werfen.
- Endpoint validiert strict + clippt freitext.
- Kein Worker-Call, kein Anthropic-Call, kein Codex-Call, kein n8n,
  kein Hermes, kein Dispatcher.
- Kein Notion-Read, kein Notion-Write.
- Keine Secrets in Logs / Response / Headers.
- Audit-Event referenziert nur `projectId` + `clientPlanId` — keine
  Quest-Inhalte, kein Token.
- Bestehende Phase-2C-Pre-Gates unverändert: Write-Flag, Private Write
  Mode, Digest, Schema-Recheck, Duplicate-Risk, Idempotenz, Shared-
  Token-Opt-In, strukturierte Commit-Errors.

## Manuelle Testcheckliste

> Voraussetzung: lokaler Dev-Run oder Vercel-Preview.

1. **Auth-Gate**: `curl -X POST .../dispatch/preview` ohne Header und
   ohne `NOX_OPERATOR_COCKPIT_PRIVATE_MODE` → `503` oder `401`.
2. **Bad shape**: ohne Body → `400 bad_request`. Mit ungültigem
   `step.agent` → `400` + audit `step_agent_not_allowed`.
3. **Happy path Pre-Commit**: Plan-Schritt ohne notionPageId →
   `dispatchReady: true` oder `false` je nach Feldern; `riskFlags`
   enthält `no_notion_page_id` und `agent_has_no_runner_yet`.
4. **Risk=Hoch**: Schritt mit `risk: 'Hoch'` →
   `operatorApprovalRequired: true`, Risk-Flag
   `high_risk_requires_operator` mit `severity: 'block'`,
   `dispatchReady: false`.
5. **Leere Pflichtfelder**: Schritt mit leerem `ziel` →
   `missingFields[].code = 'objective_empty'`.
6. **UI**: Button „Dispatch prüfen" in der Planner-Step-Detail-Panel
   öffnet Modal, zeigt Payload + Flags. Disabled-Button
   „Agent starten" bleibt inaktiv.
7. **Audit**: nach Aufruf erscheint im Audit-Modal ein neuer
   `AUDIT_LIST`-Event mit Route `/api/operator/andromeda/dispatch/preview`
   und `source=project-auto-planner`.
8. **Keine Notion-Aktion**: parallele Notion-Logs zeigen NULL Requests
   nach einem Dispatch-Preview-Aufruf.

## Was für echten Hintergrundbetrieb noch fehlt

| Fehlt                              | Beschreibung                                                                                  | Approx. Größe |
|------------------------------------|-----------------------------------------------------------------------------------------------|---------------|
| API-Key / Runner                   | Anthropic-API-Key (eigene Server-Function) ODER Codex-CLI-Runner ODER n8n-Trigger             | mittel        |
| Queue                              | Optional: nur nötig wenn parallele Worker laufen sollen. KV/Redis-Liste reicht.               | klein         |
| Worker Execution                   | Eigener Endpoint `/dispatch/run`, der den Worker tatsächlich startet (eigene Quest).          | mittel        |
| Callback                           | `/dispatch/callback` mit HMAC + Idempotenz-Key + Audit-Event.                                  | mittel        |
| Notion Writeback                   | Schema-Erweiterung um `Bearbeitungsstatus`, `🤖 Ergebnis`, `🤖 Nächster Agent`, neue Builder. | mittel        |
| Approval Gates                     | Bestehende `commands`-API könnte als Approval-Layer ausgebaut werden, statt parallel.         | klein         |
| Rate-Limit / Cost-Cap              | Pro-Worker-Limit gegen versehentliche API-Kosten-Explosion.                                    | klein         |
| Schema-Drift-Erkennung             | Persistente Audit-Events (bereits in Phase 2D-Plus eingebaut) füttern Schema-Drift-Reports.   | klein         |
| Web-UI für laufende Worker         | "Was läuft gerade", "Welche Quest wartet auf Result", Cancel-Button.                          | mittel        |

## Folgequests, die sich daraus ergeben

1. **Schema-Erweiterung Master-Tasks** (`+Bearbeitungsstatus`,
   `+🤖 Ergebnis`, `+🤖 Folgeprompt`, `+🤖 Nächster Agent`,
   Allowlist erweitern). Reine Notion-Quest + kleines Code-Update.
2. **`/dispatch/run`-Endpoint** mit Approval-Gate, Idempotenz und
   einem ERSTEN Runner-Adapter (z. B. Anthropic API Key + ein einziges
   Modell-Call, hard-bounded auf 1 Quest pro Aufruf).
3. **`/dispatch/callback`-Endpoint** für HMAC-Result-Eingang.
4. **UI „Agent starten"** aktivieren — heute disabled.
5. **Operator-Cockpit-Audit-Tab** um Dispatch-Events erweitern (neuer
   `eventType` `PLAN_DISPATCH_REQUESTED` / `_RESULT` / `_FAILED`).

## Dateien dieser Phase

- `api/_lib/dispatch.ts` (neu) — Pure Contract + Readiness-Logik
- `api/operator/andromeda/dispatch/preview.ts` (neu) — POST Dry-Run-Endpoint
- `src/lib/projectPlannerClient.ts` — `fetchDispatchPreview` Helper +
  Wire-Types
- `src/pages/OperatorCockpit.tsx` — „Dispatch prüfen"-Button im
  Schritt-Detail-Panel + Modal `dispatchPreview`
- `docs/andromeda-worker-dispatch-mvp.md` (dieses Dokument)

## Was wir bewusst NICHT bauen

- Keinen echten Worker-Call (Anthropic / Codex / n8n / Hermes).
- Kein Auto-Dispatch beim Commit.
- Keine Notion-Schema-Erweiterung.
- Keine Worker-Queue.
- Keine Live-Execute-CTA. Der „Agent starten"-Button ist disabled.
- Keine HMAC-Pipeline. Die kommt erst mit `/dispatch/run`.
