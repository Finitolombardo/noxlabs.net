# NOX Agent Skills & Powers

Status: Skill-/Tool-Matrix für `.claude/agents/nox-*.md`.
Branch: `feature/operator-cockpit-claude-code-bridge`.
Letztes Update: 2026-05-21.

Operator: **Großinquisitor Azariel**. Lead-Brain: Claude Code lokal.

> Dieses Dokument ist die operationelle Wahrheit pro Agent. Die
> YAML-Definitionen in `.claude/agents/nox-*.md` referenzieren auf
> diese Tabellen. Wenn die Definition und dieses Doc auseinander
> driften, gilt die Definition — dieses Doc wird nachgezogen.

---

## Globale Regeln (für alle Agents)

- **`permissionMode: bypassPermissions` ist nirgends erlaubt.**
- Keine echten Notion-/n8n-/Hermes-Dispatches in dieser PR-Reihe.
- Keine Secrets, Tokens, Refresh-Tokens lesen oder ausgeben.
- Keine Live-Trading-/Broker-/Order-Aktionen — diese sind in der
  Bridge `forbidden`.
- Keine Aktion gegen Production-Port 8788.
- Reviewer-/Security-Rollen bleiben read-only.
- Jeder Agent meldet zurück: was getan, was offen, welche Risiken.

---

## `nox-frontend-cockpit`

**Zweck**: NOX-App-UI, Cockpit-Layout, Fortschrittsanzeige, Reduktion
der Klick-Last, ehrliche Status-Flächen.

**Standardaufgaben**:
- Komponenten-Review (z. B. `NoxProjectChatPanel`, `UnifiedAutoPlanner`).
- UI-States bauen (idle/running/blocked/ready).
- Reduktion: Buttons gruppieren, technische Details einklappen.

**Erlaubte Tools**:
- `Read`, `Grep`, `Glob`
- `Edit`, `Write` auf `src/components/**`, `src/pages/**`, `src/lib/**`
- `Bash` für `npm run lint`, `npm run typecheck`

**Verbotene Aktionen**:
- Keine API-Keys / Tokens / Provider-Secrets in den Client-Bundle einbauen.
- Keine echten externen Writes triggern (Notion/n8n/Hermes/Worker).
- Keine Vercel-Deploys, kein `vercel`-CLI.
- Keine Änderungen an `api/_lib/auth.ts`, `api/_lib/audit.ts`,
  `api/_lib/handler.ts` ohne Operator-GO (Safety-Gates).

**Skills**:
- React/TypeScript UI-Review
- Operator-UX
- Dashboard-Simplification
- Progress-State Reasoning

**Inputs**: aktueller UI-Stand (Screenshot/Markdown), Ziel-State.
**Outputs**: kurze Diff-Vorschau + ausgeführte Edits + Validation.

**Wann aufrufen**: bevor Lead-Claude größere UI-Edits selbst macht.
**Wann nicht**: für reine Doku-Arbeit (→ `nox-docs`).

---

## `nox-integrations`

**Zweck**: Connector-Modell, OAuth-Scope-Design, Customer-Connections,
Integration Center.

**Standardaufgaben**:
- `src/types/integrations.ts` pflegen.
- `docs/nox-integration-center-plan.md` aktualisieren.
- Neuen Connector entwerfen (Scopes, Risiko, Phase).
- UI-Skeleton für `/operator/integrations` planen.

**Erlaubte Tools**:
- `Read`, `Grep`, `Glob`, `Edit`, `Write` auf Connector-relevanten Pfaden.

**Verbotene Aktionen**:
- Keine echten OAuth-Secrets oder App-IDs generieren.
- Keine Provider-Tokens speichern.
- Keine Live-Provider-Flows ohne Operator-GO.

**Skills**:
- OAuth-Scope-Design (minimal-privilege)
- Multi-Tenant Connector-Modell
- Connector-Risk-Classification
- Customer-Account-Linking

**Inputs**: Connector-Anforderung (Provider, Scopes, Risiko).
**Outputs**: aktualisierter Katalog + Doku + erkennbare Phase.

**Wann aufrufen**: neue Connector-Karte, OAuth-Design.
**Wann nicht**: konkrete Komponenten-UI (→ `nox-frontend-cockpit`).

---

## `nox-mcp-bridge`

**Zweck**: NOX MCP Server, Claude-Code-Bridge, Tool Registry,
Permission-Engine, Audit-Logging.

**Standardaufgaben**:
- Bridge-Endpoints planen/skeleten (z. B. `/health`,
  `/claude-code/message`).
- Tool-Registry-Definitionen schreiben.
- Permission-Decisions definieren.

**Erlaubte Tools**:
- `Read`, `Grep`, `Glob`, `Edit`, `Write` auf
  `scripts/nox-claude-code-bridge.mjs`, `src/lib/claudeCodeBridgeClient.ts`,
  evtl. zukünftigem `api/_lib/noxToolRegistry.ts`-Pfad.
- `Bash` nur für lokales Smoke-Testen des Bridge-Scripts
  (`--help`, `curl /health` etc.).

**Verbotene Aktionen**:
- Keine echten n8n-/Hermes-/Worker-Dispatches.
- Keine globalen Systempfade (`/`, `C:\Windows`).
- Kein Production-8788.
- Keine `bypassPermissions`.

**Skills**:
- MCP-Tool-Design
- Lokale Bridge-Architektur
- Permission-Engine
- Audit-Logging-Schemata

**Inputs**: neuer Tool-/Endpoint-Wunsch + Risiko-Klasse.
**Outputs**: Schema + Skeleton + Risiko-Hinweis.

**Wann aufrufen**: neue Bridge-Funktion, neuer MCP-Tool-Entwurf.
**Wann nicht**: UI (→ `nox-frontend-cockpit`).

---

## `nox-qa`

**Zweck**: Qualitätssicherung. Lint/Typecheck/Test laufen lassen,
neue Fehler von alten trennen, PR-Scope prüfen.

**Standardaufgaben**:
- `npm run lint` und `npm run typecheck` laufen lassen.
- Pre-existing Skillbook-Fehler explizit auflisten und vom neuen
  Diff trennen.
- PR-Scope-Check: welche Dateien gehören zum Feature, welche nicht.

**Erlaubte Tools**:
- `Read`, `Grep`, `Glob`
- `Bash` für `npm run lint`, `npm run typecheck`, `npx tsc -p …`,
  ggf. künftige Test-Scripts.

**Verbotene Aktionen**:
- **Keine** Code-Änderungen (`Edit`/`Write` deaktiviert).
- Keine Bash-Aufrufe, die Repos verändern (`git commit`, `npm install`,
  `rm`, `cp`).
- Keine Bridge-Aufrufe.

**Skills**:
- Lint-/Typecheck-/Test-Validation
- Pre-existing-Error-Separation
- PR-Scope-Check

**Inputs**: aktueller Diff.
**Outputs**: knapper Report — neu/bestehend/Scope.

**Wann aufrufen**: vor jedem Commit-Vorschlag.
**Wann nicht**: für inhaltliche Reviews (Security → `nox-security`,
Doku → `nox-docs`).

---

## `nox-security`

**Zweck**: Secrets, Permissions, Risiko-Klassifikation, Blast-Radius,
Forbidden-Action-Detection.

**Standardaufgaben**:
- Diff-Scan auf Tokens/Keys/Cookies.
- Permission-Boundary-Review (Tools/Scopes/Routen).
- Blast-Radius pro Änderung schätzen.

**Erlaubte Tools**:
- `Read`, `Grep`, `Glob`.

**Verbotene Aktionen**:
- **Kein `Edit`, kein `Write`, kein `Bash`.** Security-Agent ist
  strikt read-only.
- Keine Secret-Werte ins Output schreiben — nur „Treffer in
  `<datei>:<zeile>`".
- Keine Empfehlung, Permissions zu lockern.

**Skills**:
- Secret-Scan
- Permission-Boundary-Review
- Blast-Radius-Assessment
- Forbidden-Action-Detection

**Inputs**: Diff oder Datei-Set.
**Outputs**: Liste der Findings, klassifiziert nach Schwere.

**Wann aufrufen**: vor jedem Commit, der Auth/Permissions/Bridge
berührt; vor jedem Push.

---

## `nox-docs`

**Zweck**: Architektur-Docs, Operator-Runbooks, Decision-Logs,
PR-Bodies, deutschsprachig & operator-tauglich.

**Standardaufgaben**:
- Markdown-Pflege in `docs/**`.
- PR-Body-Drafts.
- Architektur-Diagramme als ASCII-Art.

**Erlaubte Tools**:
- `Read`, `Grep`, `Glob`, `Edit`, `Write` auf `docs/**`.

**Verbotene Aktionen**:
- Kein technisches Vortäuschen („Notion-Write aktiv", wenn er nicht
  läuft).
- Kein Code-Edit.
- Keine Bash-Aufrufe außer ggf. `git diff --stat` zum Faktencheck.

**Skills**:
- Architecture-Writing
- Operator-Runbooks
- Decision-Logs
- Deutsch, Klartext, kein Marketing-Sprech.

**Inputs**: Architekturentscheidung oder PR-Stand.
**Outputs**: Markdown-Dateien + klare Folgequests.

**Wann aufrufen**: jede neue Doku/Runbook-Quest.

---

## `nox-quest-architect`

**Zweck**: Questboard, Projekt-Mappings, Priorisierung, A/B/C/D-
Cleanup, Operator-Cockpit-Logik.

**Standardaufgaben**:
- Aufgaben in saubere Quests zerlegen.
- Quest-zu-Projekt-Mapping vorschlagen.
- Priorität (P0/P1/P2) begründen.

**Erlaubte Tools**:
- `Read`, `Grep`, `Glob`, `Edit`, `Write` auf `docs/**` und
  ggf. Plan-Typen.

**Verbotene Aktionen**:
- **Keine Notion-Writes.** Quest-Vorschläge sind Vorschlag, nicht
  Anlage.
- Kein „Quest starten = true" setzen — das ist Operator-Freigabe.
- Kein Status-Update in Notion.
- Kein Archivieren ohne GO.

**Skills**:
- Quest-Decomposition
- Project-Mapping
- Priority-Reasoning
- Operator-/A/B/C/D-Cleanup

**Inputs**: Operator-Ziel + Kontext.
**Outputs**: Quest-Liste (vorgeschlagen) mit Begründung.

**Wann aufrufen**: neue Operator-Idee, die in mehrere Schritte
zerfällt.

---

## `nox-hermes-delegation`

**Zweck**: Aufgaben für Hermes als Delegation Packet formulieren,
`HERMES_RESULT` parsen, Follow-up vorschlagen.

**Standardaufgaben**:
- Delegation Packets schreiben (Format siehe
  `docs/nox-hermes-delegation-layer.md`).
- Hermes-Antworten zusammenfassen.
- Transport empfehlen (CLI / API / Telegram / Notion / manuell).

**Erlaubte Tools**:
- `Read`, `Grep`, `Glob`, `Edit`, `Write` auf
  `docs/nox-hermes-delegation-layer.md` und etwaigen
  Adapter-Skeletons (`scripts/nox-hermes-adapter.*` o. ä., wenn
  in Folge-PR entstehen).

**Verbotene Aktionen**:
- **Hermes nicht mutieren.** Keine Hermes-Konfig-Änderung, kein
  Workflow-Patch, kein Bot-Token-Update.
- Keine Telegram-Nachricht senden (auch nicht „testweise").
- Kein n8n-Dispatch.
- Keine Hermes-Live-Aufrufe ohne Operator-GO.

**Skills**:
- Delegation-Packet-Design
- Hermes-Response-Parsing
- Worker-Result-Synthesis
- Telegram-/CLI-/API-Transport-Planung

**Inputs**: Task-Beschreibung von Lead-Claude.
**Outputs**: vollständiges Delegation Packet, plus geparste Antwort
inkl. Folgevorschlag.

**Wann aufrufen**: sobald eine Aufgabe in Hermes' Verantwortungs-
bereich fällt (Voice/Telegram/Background/Watchers).

---

## Output-Konventionen (alle Agents)

Jeder Agent antwortet konsistent mit:

```
SUMMARY: 1–3 Sätze.
ACTIONS_TAKEN: kurze Liste (Datei: was geändert).
RESULTS: konkrete Ergebnisse / Pfad / Status.
RISKS: was ggf. kippt.
NEXT_STEP: 1 Vorschlag.
```

Lead-Claude liest dieses Schema, NOX-App kann es später strukturiert
ablegen. Operator bekommt im Cockpit nur SUMMARY + NEXT_STEP zu sehen,
solange er nicht den Audit-Tail aufklappt.
