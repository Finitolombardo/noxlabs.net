# NOX Agent Operating Model

Status: Architekturplan + Subagent-Katalog (`.claude/agents/nox-*.md`).
Branch: `feature/operator-cockpit-claude-code-bridge` (stacked auf PR #26).
Letztes Update: 2026-05-21.

Operator: **Großinquisitor Azariel** (kurz: Azariel).
Lead-Brain: Claude Code (lokal, eigenes Abo/Login).

---

## Grundsatz

Das NOX-System läuft nach einem stabilen, billigen, gut auditierbaren
Pfad:

```
Großinquisitor Azariel
  └─ Lead-Claude
       ├─ Claude /agents (interne Spezialrollen)
       ├─ Hermes Delegation Adapter
       │     └─ Hermes
       │          └─ Hermes-eigene Agents
       ├─ Codex (Code-Worker)
       └─ NOX-App (Cockpit, Connectoren, Status, Audit)
```

**Lead-Claude** ist das Gehirn. Es plant, ruft `/agents` lokal auf,
formuliert Delegationspakete für Hermes und bereitet Codex-Tasks vor.

**`/agents`** sind interne, schlanke Spezialisten. Sie laufen
**innerhalb** der Lead-Session und kosten daher kein Doppel-Abo.

**Hermes** ist eigenständig — eigene Konfiguration, eigene Agents,
eigener Chat mit Azariel. Wir bauen einen **Delegations-Adapter**
*um* Hermes herum, der nichts an Hermes selbst verändert.

**Codex** bleibt Code-Worker. Er wird per Lead-Claude vorbereitet und
nach explizitem Operator-GO dispatch'd.

**NOX-App** zeigt Status, Connectoren, Worker-Health, Audit — sie ist
**kein zweites Claude-UI**.

---

## Warum **keine** Agent Teams als Default

Agent Teams (mehrere parallele Claude-Sessions, von einem Lead
koordiniert) sind technisch interessant, aber:

- **Teuer.** Jede zusätzliche Session belastet das Abo separat.
- **Hoher Koordinations-Overhead.** Lead muss slicen, mergen,
  Konflikte lösen.
- **Mehr Drift.** Verschiedene Sessions können widersprüchliche
  Annahmen treffen.
- **Nur sinnvoll für stark parallelisierbare Aufgaben** (z. B. drei
  unabhängige Module gleichzeitig).

Default bleibt deshalb:

> Lead-Claude ruft gezielt einen `/agent` auf, wenn er eine
> Spezialrolle braucht. Erst wenn ein Vorhaben echt parallelisierbar
> ist *und* der Operator das ausdrücklich freigibt, sprechen wir
> über Agent Teams.

Agent-Team-Smoke-Tests sind eine **Phase-4-Quest**, nicht der
Tagesbetrieb.

---

## `/agents` — Standardmodell

Lead-Claude nutzt diese acht Subagents (Definitionen in
`.claude/agents/nox-*.md`):

| Agent | Zweck | Schreibrechte |
|---|---|---|
| `nox-frontend-cockpit` | NOX-App-UI, Cockpit, Fortschrittsanzeige | Edit/Write auf `src/**`, lint/typecheck via Bash |
| `nox-integrations` | Connector-Modell, OAuth, Customer-Accounts | Edit/Write auf `src/types/integrations.ts`, Docs |
| `nox-mcp-bridge` | NOX MCP Server, Claude-Code-Bridge, Tool Registry | Edit/Write auf Bridge-Pfaden + Bridge-Script |
| `nox-qa` | lint/typecheck/test-Runner, pre-existing-error-Separation | **read-only Code**, Bash für Validation |
| `nox-security` | Secret-Scan, Permission-Boundary-Review, Risiko | **read-only**, kein Edit/Write/Bash |
| `nox-docs` | Architektur, Runbooks, PR-Bodies | Edit/Write auf `docs/**` |
| `nox-quest-architect` | Questboard, Projekte, Priorisierung | Edit/Write auf Docs/Plan-Typen, **keine Notion-Writes** |
| `nox-hermes-delegation` | Delegationspakete, Hermes-Antworten parsen | Edit/Write auf Delegation-Doku/Script-Skeletons, **keine Hermes-Mutation** |

Regel: **`permissionMode: bypassPermissions` ist auf keinem Agent
zulässig.** Wer das Setting einfügt, fliegt aus dem Katalog.

---

## Hermes-Modell

Hermes ist **kein normaler Subagent**. Hermes ist ein externer
Delegationshub mit eigener Identität, eigenen Agents und eigenem
Chat-Kontext zu Azariel. Für NOX gilt:

1. Hermes-Konfiguration wird **nicht** durch NOX verändert.
2. Hermes' normaler Chat mit Azariel bleibt unverändert.
3. NOX baut nur einen **Adapter**, der:
   - Aufgaben aus Lead-Claude in ein Delegation Packet packt
     (siehe `docs/nox-hermes-delegation-layer.md`),
   - das Packet über die jeweils verfügbare stabile Schnittstelle an
     Hermes übergibt (CLI / HTTP-API / Telegram / Notion-Bridge),
   - das `HERMES_RESULT` parst und Lead-Claude zur Auswertung gibt.
4. Adapter setzt nie:
   - Telegram-Nachrichten ohne Operator-GO,
   - n8n-Dispatch-Aufrufe,
   - Hermes-Konfig-Änderungen,
   - persönliche Bot-Nachrichten an Dritte.

Wenn keine Hermes-Schnittstelle stabil greifbar ist, **wird der
Adapter zum Vorbereiter**: er erzeugt das Delegationspaket als
Markdown/JSON, das Azariel manuell in Hermes pastet. Kein Mock-Hack.

---

## Rolle der NOX-App in diesem Modell

NOX-App leistet **immer dieselbe Arbeit**, egal welcher Worker
gerade aktiv ist:

- **Status anzeigen**: Bridge-Health, Connector-Status, aktive
  Worker, letzte Aktion, Risiko-Chips.
- **Connectoren verwalten**: Integration Center (`/operator/integrations`)
  mit Karten pro Provider.
- **Audit-Tail**: Append-only Spur dessen, was Lead-Claude und
  Worker getan haben.
- **Operator-Entscheidungen einsammeln**: Confirmation-Phrasen,
  Quest-Freigaben, „Audit anzeigen" Buttons.

Die App selbst schreibt **nicht** an Notion oder GitHub direkt — sie
delegiert an die geprüften Server-Pfade (`/plan/commit` etc.) bzw. an
Lead-Claude.

---

## Lifecycle einer typischen Aufgabe

```
1. Azariel formuliert Ziel ins Cockpit oder via Bridge an Lead-Claude.
2. Lead-Claude analysiert. Wenn Spezialrolle nötig → ruft passenden
   /agent auf (z. B. `nox-integrations` für OAuth-Frage).
3. /agent liefert kurze, strukturierte Antwort an Lead.
4. Falls die Aufgabe **delegierbar** ist (Voice/Telegram/Background)
   → Lead bittet `nox-hermes-delegation`, ein Delegation Packet zu
   bauen. Adapter reicht es an Hermes weiter (oder zur manuellen
   Übergabe an Azariel, wenn keine Schnittstelle aktiv ist).
5. Hermes arbeitet eigenständig. Antwort kommt als `HERMES_RESULT`
   zurück.
6. Lead-Claude interpretiert das Ergebnis, schreibt Follow-up.
7. Falls Code nötig → Lead bereitet einen Codex-Task vor; Operator
   gibt GO; Codex baut den Diff/PR.
8. NOX-App zeigt jeden Schritt im Audit-Tail.
```

Dieser Pfad **vermeidet Magie**: jeder Schritt ist sichtbar,
zurückführbar, abbrechbar.

---

## Verhältnis zu vorherigen Docs

- `docs/nox-claude-worker-model.md` — Subagent vs separate Session
  vs Codex (Konzept; bleibt gültig).
- `docs/nox-claude-code-bridge-plan.md` — Bridge-Architektur und
  Sicherheitsmodell der lokalen Claude-CLI-Anbindung.
- `docs/nox-integration-center-plan.md` — Connector-Modell, das die
  NOX-App im Cockpit rendert.
- `docs/nox-agent-skills-and-powers.md` — pro Agent: Skills,
  Tools, Inputs, Outputs.
- `docs/nox-hermes-delegation-layer.md` — Delegations-Packet und
  Hermes-Antwortformat.
- `docs/nox-claude-goal-experiment.md` — Spielregeln für `/goal`.

---

## Folgequests

| Quest | Inhalt |
|---|---|
| `NOX-AGENTS-SMOKE-01` | Lead-Claude ruft je einmal jeden `/agent` auf, kurzer Smoke-Output dokumentiert |
| `NOX-HERMES-ADAPTER-01` | Erste reale Hermes-Schnittstelle anbinden (vermutlich CLI / Telegram) |
| `NOX-AGENT-TEAM-SMOKE-01` | (später, Phase 4) Mini-Konstellation mit 2 parallelen Sessions testen |
| `NOX-CONNECTOR-UI-01` | Statische `/operator/integrations` Seite, die das Connector-Modell rendert |
