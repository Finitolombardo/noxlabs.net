# NOX Claude Worker Modell

Status: Architekturplan auf `feature/operator-cockpit-claude-code-bridge`
(stacked auf PR #26). Letztes Update: 2026-05-21.

Dieses Dokument klärt, wie NOX Claude als **Gehirn** nutzt, ohne die
Anthropic-API anzubinden, und wie Claude Arbeit an Subagents, separate
Sessions, Agent-Teams oder Codex verteilen kann.

> Zielsatz:
> „Claude denkt. NOX zeigt. Codex baut. Hermes/n8n trägt die Pakete."

---

## Rollenverteilung

| Rolle | Wer | Was tut er | Wer steuert ihn |
|---|---|---|---|
| **Gehirn** | Claude Code (lokal, Abo/Login) bzw. Claude Desktop | denkt, plant, schreibt Code, ruft Tools auf | Operator + NOX-Cockpit-Inputs |
| **Cockpit** | NOX-App (`noxlabs.net`) | zeigt Status, Connectors, Audit, Fortschritt, Tool-Auswahl | Operator |
| **Code-Worker** | Codex | konkrete, isolierte Code-Änderungen, Tests, Refactors | Lead-Claude oder Operator |
| **Automation/Voice** | n8n + Hermes | Scheduler, Voice-/Telegram-Orchestrierung, Webhooks | Lead-Claude oder Operator-GO |
| **Bridge** | `scripts/nox-claude-code-bridge.mjs` | Loopback-Vermittler zwischen NOX-App und Claude-CLI | Operator (Dry-Run-default) |

NOX-App ist explizit **kein zweites Claude-UI**. Sie ist
Steuer- und Anzeige-Tafel.

---

## Welche Worker-Art wofür — ehrliche Bewertung

### A) Subagent (innerhalb einer Claude-Code-Session)

- **Was**: Claude Code öffnet einen Sub-Kontext mit eigenem
  System Prompt + Tool-Set, innerhalb derselben Session/Conversation.
- **Stärken**:
  - Schnell. Kein neuer Prozess.
  - Lead-Claude bekommt die zusammengefasste Antwort direkt.
  - Perfekt für **Recherche**, **Code-Review**, **kleine, abgegrenzte
    Tasks** mit klarem Rückgabewert.
- **Schwächen**:
  - Kein langfristiger eigener Kontext nach Sessionende.
  - Nicht ideal für **parallele dauerhafte Arbeit** über Stunden.
  - Wenig Sichtbarkeit „von außen" — die NOX-App sieht nur das,
    was der Lead zurückmeldet.
- **NOX-Sicht**: Subagent-Runs werden als ein Audit-Eintrag des
  Lead-Claude geloggt („subagent_run summary=…").
  Kein eigener Worker-Status im Cockpit.

### B) Separate Claude Code Session (eigener Prozess)

- **Was**: Eine zweite/dritte Claude-Code-Instanz, eigener
  Prozess, eigener Workspace, eigene Session-ID.
- **Stärken**:
  - **Echter paralleler Worker.** Mehrere Tasks gleichzeitig.
  - Eigene `git worktree`/Branch, eigene Datei-Hoheit.
  - Survives Lead-Crashes.
  - **In der NOX-App als eigener Worker sichtbar**: eigener
    Status-Chip, eigene Audit-Spur, eigene Connector-Karte.
- **Schwächen**:
  - Mehr Setup. Resume/Crash-Recovery braucht Daemon-Logik
    (= Phase-2-Bridge mit Session-Management).
  - Verbrauch des Claude-Abos pro Session berücksichtigen.
- **NOX-Sicht**: Erstklassiger Worker. Im Integration Center wird er
  als „Claude Worker #2 — Recherche" o. ä. dargestellt.

### C) Agent Team / Background Agents

- **Was**: Mehrere Claude-Code-Instanzen mit Lead/Coordinator-Rolle.
  Lead delegiert an Specialists (Researcher, Reviewer, Builder).
- **Stärken**:
  - Skaliert nach oben. Lead kann parallel mehrere Module bauen.
  - Klare Spezialisierung („Sicherheits-Reviewer", „Doc-Writer",
    „Schema-Migrator").
- **Schwächen**:
  - Stand: in der Claude-Code-Version, mit der wir arbeiten, ist
    Agent-Team-Orchestrierung **experimentell**. Stabilität +
    Synchronisations-Semantik müssen wir empirisch verifizieren,
    bevor wir Operator-Workflows darauf legen.
  - Coordination-Cost (Lead muss Aufgaben slicen, Antworten mergen).
- **NOX-Sicht**: vorerst optional. Erst nach explizitem Smoke-Test
  einer einfachen 2-Worker-Konstellation aufnehmen.

### D) Codex (über separaten Worker-Trigger)

- **Was**: Codex als reiner Code-Executor. Bekommt einen
  vorbereiteten Prompt + Kontext-Bundle und produziert Code-Diffs /
  PRs.
- **Stärken**:
  - **Sehr gut für isolierte Code-Tasks**: Tests, Refactors,
    Migrationen, kleine Features.
  - Kann via SSH-Worker-Trigger (`worker_trigger_codex`) angesprochen
    werden, sobald n8n-Pfad live ist.
  - Output ist deterministisch konsumierbar (Diff, Branch, PR).
- **Schwächen**:
  - Kein eigenes Reasoning über das Gesamtsystem — Lead-Claude muss
    den Task gut framen.
  - Kein Tool-Use im selben Sinne wie Claude Code.
- **NOX-Sicht**: separate Connector-Karte „Codex-Worker". Im Cockpit
  als Builder-Worker dargestellt, mit „Task vorbereiten" (Lead/Claude)
  + „Dispatch" (Operator-GO).

---

## Empfehlung

Phasen, bewusst klein:

### Phase 1 — Lead-Claude + lokale Bridge (heute)
- **Lead** = Claude Code lokal (Abo).
- NOX-App spricht via Bridge mit Lead-Claude.
- Lead nutzt **Subagents** für kleine Nebenarbeit (Recherche, Review).
- Codex/Worker-Dispatch sind nur **vorbereitend** — Drafts, kein Live-Run.

### Phase 2 — Mehrere parallele Claude-Sessions
- Bridge bekommt Session-Management (`claude --resume`).
- NOX-App zeigt mehrere Worker-Kacheln (Lead + bis zu N).
- Eigener Status pro Session, eigener Audit-Tail.

### Phase 3 — Codex als echter Builder
- Codex-Worker-Trigger live (n8n-Pfad oder direkter SSH).
- Lead-Claude bereitet Task vor, Operator bestätigt, Bridge schickt.
- Cockpit zeigt Codex-Run-Status (queued / running / done / failed).

### Phase 4 — Agent Team (experimentell)
- Lead orchestriert Researcher/Reviewer/Builder als parallele Sessions.
- Erst nach Smoke-Test, eigenes Doku-Update.

### Phase 5 — Voice/Mobile via Hermes
- Hermes nimmt Voice/Telegram entgegen, leitet an Lead weiter,
  zeigt Antwort als Push.
- NOX-App bleibt visuelles Cockpit.

---

## Was NOX-App pro Worker zeigt

Für jeden aktiven Worker (Lead, Sub-Sessions, Codex) gilt:

- **Identität**: Name + Modell + Worker-Typ (Lead/Sub/Codex)
- **Aktuelle Aufgabe**: ein-Satz-Zusammenfassung
- **Status**: idle / running / waiting_for_operator / blocked / done / error
- **Letzte Aktion**: ISO-Timestamp + 1-Zeilen-Summary
- **Audit-Link**: zu der vollen Tail im Bridge-Log bzw. NOX-Audit
- **Risk-Flags**: was der Worker zuletzt blockiert hat
- **Manuelle Aktionen**: „Stoppen", „Status erneut prüfen",
  „Task vorbereiten"

Welche dieser Felder bereits existieren:
- Lead-Status (online/dry_run/degraded/offline) → siehe
  `claudeCodeBridgeClient.ts` (`BridgeHealth`).
- Codex-Status → noch nicht implementiert (Phase 3).
- Sub-Sessions → noch nicht implementiert (Phase 2).

---

## Was Claude Code in dieser Architektur **darf**

Diese Liste ist breit, weil der Operator viel Kontrolle abgeben will.
Claude darf:

- alle erlaubten Workspaces lesen/schreiben (Allowlist in der Bridge)
- `git status/diff/log/commit/push` ausführen, sofern es auf dem
  Branch lebt, den der Operator vorgibt
- Notion-Operationen vorschlagen **und** über den Phase-2C-Pre
  Write-Pfad ausführen, sobald Gates offen sind (Write-Flag, Token,
  Digest, Schema, Duplicate, Idempotency)
- Quests via Lead-Claude vorbereiten und Codex zum Bau übergeben
- MCP-Tools (sobald NOX einen MCP-Server hat) für Cockpit-Reads
  benutzen

Und **darf nicht**:

- Anthropic-API direkt aufrufen
- Claude-Subscription-Tokens lesen oder weitergeben
- Live-Trading / Broker-Orders
- Production-Port-8788 anfassen
- n8n Workflows live ohne Snapshot patchen
- Globalen Cron ohne Operator-GO anlegen
- Secrets ausgeben

---

## Verhältnis zu PR #26 + Claude-Code-Bridge-PR

PR #26 (lokaler NOX Command Layer) → bleibt **Fallback-UI**, falls
Bridge offline. Header + Mode-Pill zeigen das ehrlich.

Claude-Code-Bridge-PR (`feature/operator-cockpit-claude-code-bridge`)
→ liefert den lokalen Loopback-Bridge-Prototyp + Browser-Client +
Statusanzeige. Default-Dry-Run.

Dieses Dokument → **konzeptioneller Überbau** für beides plus die
nächsten Phasen.

---

## Folgequests, die hieraus fallen

| Quest | Phase | Inhalt |
|---|---|---|
| `NOX-BRIDGE-EXEC-01` | 1 | Echten `claude -p` Aufruf in der Bridge mit Allowlist freischalten |
| `NOX-WORKER-SESSION-01` | 2 | Bridge mit `claude --resume` + Session-Map ausstatten |
| `NOX-CODEX-DISPATCH-01` | 3 | Codex-Worker-Trigger anbinden (vorbereitend + Operator-GO) |
| `NOX-MCP-SERVER-01` | parallel | NOX-Tools als MCP-Server, parallel zur Bridge |
| `NOX-AGENT-TEAM-SMOKE-01` | 4 | 2-Worker-Konstellation testen, dann ggf. dokumentieren |
| `NOX-VOICE-PHASE-01` | 5 | Hermes/Telegram/Voice-Schicht oberhalb der Bridge |
