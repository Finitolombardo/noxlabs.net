# Operator Cockpit · Lokaler NOX Command Layer (MVP)

Status: Draft-PR #26 auf `feature/operator-cockpit-nox-command-layer`.
Commit: `c56868c`.
Basis: `main`.
Scope: Deterministischer lokaler NOX Command Layer im Operator Cockpit.
Keine LLM-/Hermes-/n8n-/Worker-Calls. Kein neuer Write-Pfad.
Letztes Update: 2026-05-21.

## Warum dieser Schritt

Bisherige Iteration: Project Auto Planner ist der Haupt-Touchpoint im
Cockpit. Der Operator füllt ein Ziel-Feld, drückt „Quest-Reihe
entwerfen", validiert technisch, drückt „Prüfen & erzeugen". Das
funktioniert — Phase 2E ist scharf, Duplicate-Risk greift,
One-Button-Flow läuft.

Aber das Zielbild ist ein anderes: der Operator soll mit einem
permanenten **NOX/Andromeda-Hauptagenten** chatten — nicht ein
Formular ausfüllen. Der Project Planner wird langfristig ein **internes
Tool des Chats**, nicht die primäre UI.

Damit dieser Übergang aber NICHT zu einem riskanten Big-Bang wird,
baut diese Quest den **kleinsten ehrlichen MVP**, der den Pfad öffnet:

- **Ein permanentes Chat-Panel** im Projektbereich.
- **Ein lokaler Command-Parser** statt LLM-Magie.
- **Tool-Cards**, die bestehende Project-Planner-Handler aufrufen.
- **Ein Confirmation-Gate** in der UI, das KEIN bestehendes Server-Gate
  ersetzt.

Der Header trägt ein **ehrliches Label** damit der Operator nie denkt,
hier laufe ein Live-LLM:

> Lokaler Command Layer · kein API-Call · Writes nur nach Bestätigung

## Zielbild Hauptagent (mehrere Phasen voraus)

```
Operator schreibt frei mit dem Agenten
         │
         ▼
Hauptagent kennt:
  - aktuellen Projektkontext (Notion read)
  - lokalen Plan-Entwurf
  - letzten Validate-Digest
  - Audit-Spur
         │
         ▼
Hauptagent schlägt vor:
  - Quests erzeugen
  - Projekt aktualisieren
  - Outputs formulieren
  - Blocker erkennen
  - Claude-Code-Arbeitspakete vorbereiten
         │
         ▼
Operator bestätigt → bestehender Server-Gate-Pfad läuft
```

Heute geht der MVP **nur den linken Pfad** — Eingabe + Vorschlag —
und löst dann **bestehende** Project-Planner-Handler aus. Kein neues
Write-Surface.

## Bestand-Inventur

| Komponente                          | Quelle                                                          |
|-------------------------------------|------------------------------------------------------------------|
| Project Auto Planner (Phase 2E)     | `src/pages/OperatorCockpit.tsx`, `UnifiedAutoPlanner`            |
| Lokaler Plan-Generator              | `generateLocalPlan` + `planSteps` state                          |
| Tech-Check (Preview + Validate)     | `handleApiPreview` (auto-chain Validate)                         |
| One-Button-Commit                   | `handleApiCheckAndCommit`                                        |
| Notion-Write-Gates                  | `/api/operator/projects/[projectId]/plan/commit.ts`              |
| Legacy „Mit NOX besprechen"-Modal   | `modal === 'talk'`, lokale Demo-Antworten                        |
| Audit-Viewer (legacy + recent)      | bereits gemerged                                                 |
| Andromeda Dispatch Preview          | bereits gemerged (separater Pfad, hier nicht angefasst)          |

## MVP ohne LLM / API

Pure, deterministische Regeln. Datei: `src/lib/noxCommandParser.ts`.

```ts
parseNoxCommand(input, ctx) → {
  intent: NoxCommandIntent,
  confidence: number,
  proposedAction: string,
  requiresConfirmation: boolean,
  toolDraft?: NoxToolCard,
  extractedPayload?: string,
}
```

Unterstützte Intents:

| Intent                   | Beispieleingabe                                  |
|--------------------------|--------------------------------------------------|
| `draft_quests`           | „mach mir die nächsten quests"                   |
| `reduce_to_one`          | „reduzier auf 1"                                 |
| `tech_check`             | „nur prüfen"                                     |
| `open_technical_details` | „technische details"                             |
| `request_commit`         | „leg das in notion an", „erzeuge 1 quest"        |
| `confirm_commit`         | `JA, 1 QUEST ERZEUGEN` / `JA, 7 QUESTS ERZEUGEN` |
| `summarize_project`      | „status", „zusammenfassen"                       |
| `detect_blockers`        | „blocker", „was fehlt"                           |
| `prepare_claude_prompt`  | „claude prompt"                                  |
| `set_project_goal`       | „setze ziel: …"                                  |
| `cancel`                 | „abbrechen", „stop"                              |
| `help`                   | „hilfe", „was kannst du"                         |

Regeln sind regex-basiert, klein gehalten. Conflicts werden über
`blockedBy`-Listen aufgelöst (z. B. „prüfen" matcht NICHT als
`tech_check` wenn gleichzeitig „erzeugen" / „commit" im Satz steht —
dann ist es `request_commit`).

## Tool Cards

Der Parser liefert optional eine `NoxToolCard` zurück, die das
Chat-Panel als Vorschlag rendert. Beispiel:

```text
NOX:
  Tool-Vorschlag · Quest-Reihe entwerfen?
  „Ich würde den Project Planner für „APP-X" auslösen. Lokaler Plan,
   kein Notion-Write."
  [Quest-Reihe entwerfen]  [Auf 1 Quest reduzieren]
  [Nur prüfen]             [Prüfen & erzeugen]
```

Jeder Button trägt eine `NoxToolAction`-Discriminator (`plan_regenerate`,
`plan_reduce_to_one`, `plan_tech_check`, `plan_open_technical_details`,
`plan_check_and_commit`, `plan_set_goal`, `plan_cancel`). Das Cockpit
ordnet sie 1:1 den bestehenden Handlern zu — KEINE neuen Write-Pfade.

## Chat → Project Planner Integration

Wired-up Handler im `OperatorCockpit.tsx`:

| Tool-Action                    | Cockpit-Handler                                                |
|--------------------------------|-----------------------------------------------------------------|
| `plan_regenerate`              | `regeneratePlan(projektZiel)` + Modal `planner`                |
| `plan_reduce_to_one`           | lokale `setPlanSteps`-Slice (wie im UI-Button)                  |
| `plan_tech_check`              | `handleApiPreview()` (auto-chain Validate)                      |
| `plan_open_technical_details`  | `setModal('apiPreview')`                                         |
| `plan_check_and_commit`        | `handleApiCheckAndCommit()` (bestehender Server-Gate-Pfad)      |
| `plan_set_goal`                | `setProjektZiel(value)`                                          |
| `plan_cancel`                  | nur lokal — keine Notion-Aktion                                  |

Wichtig: **keine neue Server-Route**, **kein neuer Notion-Write**.

## Confirmation Gate

Wenn der Operator schreibt:

> „leg das in notion an"

→ Parser liefert `intent: 'request_commit', requiresConfirmation: true`.
→ Chat antwortet mit Tool-Card + Klartext:

```
Ich brauche deine explizite Bestätigung.
Tippe genau: JA, 1 QUEST ERZEUGEN
```

→ Chat-Panel setzt `awaitingConfirmation = true`.

Erst wenn der Operator die exakte Phrase tippt
(`/^\s*ja[,!.]?\s+(\d+)\s+quest(s|en)?\s+erzeugen\s*\.?\s*$/i`) UND
die Zahl der lokalen `planSteps`-Länge entspricht, wird
`handleApiCheckAndCommit()` aufgerufen. Server-Gates laufen UNVERÄNDERT
dahinter.

### Was der Confirmation-Gate IST und NICHT ist

- **IST**: zusätzlicher UI-Stoppknopf zwischen freiem Tippen und
  bestehendem Server-Aufruf.
- **IST NICHT**: ein Ersatz für `NOX_NOTION_WRITE_ENABLED`, Schema-
  Recheck, Digest-Recompute, Duplicate-Risk-Lookup, Idempotenz-
  Precheck oder Shared-Token-Opt-In. Diese Gates bleiben
  ausschließlich im Server.

## Legacy „Mit NOX besprechen"-Modal

- Wird **nicht gelöscht**, weil:
  - es eingespielte Operator-Workflows nicht plötzlich abreißen darf,
  - der Demo-Modus außerhalb der Quest-Erzeugung evtl. noch als
    Sandbox dient.
- Wird **depriorisiert** durch:
  - kleineren Button-Text („Mit NOX besprechen (Legacy-Demo)")
  - reduzierte Opazität (`opacity-50 italic`)
  - Tooltip, der auf das neue Panel verweist.
- Wird in einem späteren Cleanup-PR entfernt, sobald das neue Panel
  voll integriert ist.

## Safety-Regeln

- **Kein LLM-Call.** Kein `fetch` zu Anthropic, Claude API, OpenAI,
  Hermes, n8n, Webhooks. Pure JavaScript-Regeln.
- **Kein Worker-Spawn.** Kein Shell-Exec, kein Background-Job.
- **Keine Secrets.** Kein API-Key-Feld im Panel.
- **Kein neuer Write-Pfad.** Notion-Write geht weiter ausschließlich
  durch `/api/operator/projects/[projectId]/plan/commit.ts`.
- **Confirmation-UI-Gate** addiert sich auf den bestehenden Server-
  Gate, ersetzt ihn nicht.
- **Keine Persistenz** des Chat-Verlaufs in localStorage/Cookies/
  Server-Storage in dieser MVP-Phase. State lebt nur im
  React-Component.
- **Keine Telemetrie** außerhalb der bestehenden Audit-Events der
  bereits gerouteten Handler.

## Nächste Stufe

Konkrete Folgequests, jede einzeln Operator-go-pflichtig:

1. **Claude-Code-Prompt-Output**: aus aktuellem
   `projectGoal + planSteps + lastValidatedDigest` einen
   copy-paste-fähigen Prompt-Block bauen, damit der Operator ihn in
   seinen Claude-Code-Tab kippen kann. Reines Read-Pfad-Feature.
2. **Result-Import**: einfaches Paste-Feld, das Claude-Code-Outputs
   strukturiert ins Operator-Check-Feld eines Master-Tasks-Eintrags
   importiert. **Schema-Erweiterung** für `🤖 Ergebnis` /
   `🤖 Folgeprompt` ist Voraussetzung (siehe Andromeda-Dispatch-Doc).
3. **Echter LLM/Voice-Layer**: Ablösung des `parseNoxCommand`-Regex-
   Layers durch einen serverseitigen Adapter (Anthropic-API ODER
   on-prem Modell). Wenn das passiert, behält das UI-Panel seine
   Form, nur die Parser-Funktion wird gegen einen API-Call getauscht.
   Wichtig: Confirmation-Gate bleibt UI-seitig erhalten.
4. **Domain-Tools**: YouTube/Pitch/Lead-Gen-Vorschläge — jede in einer
   eigenen `NoxToolCard`-Variante, jede mit eigenem Konfirmations-
   Pfad. KEIN Auto-Run.
5. **Mehrere Agenten-Surfaces**: das Cockpit könnte später ein
   Workspace-Chat (über alle Projekte) plus den per-Projekt-Chat
   bekommen. MVP bleibt projektgebunden.

## Was wir bewusst NICHT bauen

- Kein LLM-Aufruf.
- Kein Anthropic-API-Key irgendwo.
- Keine Hermes-Integration.
- Keine n8n-Triggerung.
- Kein automatischer Worker / Dispatcher-Lauf.
- Kein „Agent starten"-Button (Andromeda-Dispatch-Preview hat den
  bereits als `disabled` markiert; hier wird er nicht doppelt
  exponiert).
- Keine neue Server-Route.
- Keine Persistenz des Chatverlaufs.
- Kein Theming-Refactor des Cockpits.

## Manuelle Testcheckliste

1. **Header-Label** sichtbar: „Lokaler Command Layer · kein API-Call ·
   Writes nur nach Bestätigung".
2. **Hilfe**: „Hilfe" → Tool-Card mit Befehlsliste rendert.
3. **draft_quests**: „mach mir die nächsten quests" →
   Tool-Card „Quest-Reihe entwerfen?". Buttons triggern bestehende
   Handler.
4. **reduce_to_one**: „reduzier auf 1" → Plan reduziert lokal,
   System-Message bestätigt.
5. **tech_check**: „nur prüfen" → `handleApiPreview` fährt,
   Statuschip im Panel wechselt zu „Prüfung: läuft" und danach
   „Prüfung: bereit" / „Prüfung: nicht bereit".
6. **request_commit ohne Confirm**: „leg das in notion an" →
   NOX antwortet mit Tool-Card + Klartext-Confirm-Hinweis. KEIN
   Commit läuft.
7. **request_commit mit falscher Zahl**: „JA, 99 QUESTS ERZEUGEN"
   bei lokal 1 Schritt → Chat lehnt mit Zahl-Mismatch-Meldung ab.
   KEIN Commit.
8. **request_commit mit korrekter Phrase**: „JA, 1 QUEST ERZEUGEN"
   bei lokal 1 Schritt → `handleApiCheckAndCommit()` läuft,
   Statuschip „Write: läuft" → „Write: committed" /
   „Write: duplicate-risk" / „Write: locked".
9. **set_project_goal**: „Setze Ziel: Mein Testziel" →
   Tool-Card mit Button „Projektziel setzen", klick übernimmt.
10. **cancel**: „abbrechen" → Confirmation-Wartezustand wird
    aufgehoben, System-Message bestätigt.
11. **Legacy-Button**: „Mit NOX besprechen (Legacy-Demo)" ist sichtbar,
    aber durch Opazität + Italic deutlich depriorisiert. Modal
    funktioniert weiterhin (keine Regression).
12. **Keine Notion-Aktion ohne Confirm**: über alle obigen Schritte
    sollte kein `appendAuditEvent` mit `PLAN_COMMIT_*` ohne explizite
    UI-Confirmation oder Button-Klick laufen.

## Dateien dieser Phase

- `src/lib/noxCommandParser.ts` (neu) — Pure Parser + Types
- `src/components/cockpit/NoxProjectChatPanel.tsx` (neu) — Panel
- `src/pages/OperatorCockpit.tsx` — Panel-Mount + Handler-Wiring +
  Legacy-Button-Markierung + shared `commitStatusKind`-Var
- `docs/operator-cockpit-nox-command-layer.md` (dieses Dokument)
