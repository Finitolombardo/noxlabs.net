# Operator Cockpit — Claude-Code-Bridge UI-Plan

Status: Spezifikation. Implementierung beginnt in
`feature/operator-cockpit-claude-code-bridge`, stacked auf PR #26.
Letztes Update: 2026-05-21.

Dieses Dokument beschreibt, wie das Operator Cockpit sich verändert,
sobald die Claude-Code-Bridge die Hauptkommunikation übernimmt. Der
existierende lokale Regex-Layer bleibt als **Fallback**, nicht als
Hauptkanal.

---

## Leitprinzip

> Das Cockpit zeigt **Projekt-Fortschritt + Status + nächste Aktion**.
> Es ist **kein zweiter Code-Editor** und **kein zweiter Chat-Client**.

Alles, was den Operator vom Fortschritt ablenkt, wird depriorisiert.
Alles, was den Status ehrlicher macht (Bridge online/offline, Risiko,
Letztes Ergebnis), wird sichtbarer.

---

## Was bleibt (Kernfläche)

Im Projekt-Header bzw. im Project-Card:

- Projektname
- Projektziel (Klartext, knapp)
- Plan-Schritte (Anzahl + Liste, klappbar)
- Fortschritt (committed vs. offen)
- Tech-Check-Status
- Commit-Status
- Letzter Validate-Digest
- Letztes Ergebnis (Code, Message, ggf. Notion-Page-ID)
- Risiken/Blocker (max. 2 Zeilen)
- Audit-Timeline-Einstieg („Audit anzeigen")

Die `UnifiedAutoPlanner`-Card bleibt — sie ist der einzige
geprüfte Notion-Write-Pfad. Aber:

- „Technische Details" wird per Default **eingeklappt**.
- „Plan regenerieren" und „Prüfen & erzeugen" bleiben primär sichtbar.
- Sekundäre Buttons (z. B. „API-Preview öffnen", „Idempotenz-Key
  rotieren") wandern in ein „Mehr" / „Technisch" Drawer.

---

## Was reduziert wird

- **Lokales Regex-Panel als zweiter Hauptchat:** weg vom „permanenten
  großen Chat", hin zu „kompakter Fallback-Streifen".
- **Demo-/Talk-Modal** („Mit NOX besprechen (Legacy-Demo)") bleibt
  nur noch als versteckter Footer-Link erreichbar. Schon in PR #26
  ist es opacity-50 markiert.
- **Doppelte Status-Chips** im Planner-Modal — Single Source of Truth
  ist der Status-Streifen im Projekt-Header.

---

## Was neu hinzukommt

### Bridge-Status-Streifen

Direkt unter dem Projekt-Header, vor jeder Chat-Box:

```
┌─────────────────────────────────────────────────────────────┐
│  Claude Code  ●online    Bridge http://127.0.0.1:8799       │
│  Workspace    /Users/.../noxlabs.net    Exec: dry-run       │
│  Letzte Aktion  vor 4 min · „read_project_context"          │
└─────────────────────────────────────────────────────────────┘
```

States:

- **Online + Exec-Mode aktiv (`EXEC=1`)**: grün, „Claude Code Chat ·
  lokales Abo/Login · über Bridge". Eingabe geht an Bridge.
- **Online + Dry-Run**: gelb, „Bridge im Dry-Run-Modus. Setze
  NOX_CLAUDE_CODE_BRIDGE_EXEC=1, um Claude wirklich aufzurufen."
  Eingabe geht trotzdem an Bridge — sie antwortet mit dem Prompt,
  den sie an Claude schicken WÜRDE.
- **Offline / unreachable**: grau, „Bridge offline. Starte
  `node scripts/nox-claude-code-bridge.mjs` lokal." Eingabe schaltet
  auf den lokalen Regex-Pfad um.
- **Detected but no CLI**: orange, „Bridge läuft, aber Claude Code
  CLI nicht gefunden. `npm i -g @anthropic-ai/claude-code` oder
  PATH prüfen."

### Chat-Bereich

- **Header**: dynamisch nach Bridge-State.
  - online: „Claude Code Chat · lokales Abo/Login · über Bridge"
  - offline: „Lokale Schnellbefehle (Fallback) · kein Claude-Aufruf"
- **Eingabe**: Enter sendet (wie heute). Tooltip zeigt aktuellen
  Modus an.
- **Antworten**: Bridge-Antworten werden klar gekennzeichnet
  (z. B. blass-grünes Chip „Bridge"), Regex-Fallback-Antworten
  bekommen ein gelbes „lokal" Chip.
- **Tool-Karten**: bleiben — auch die Bridge kann Tool-Vorschläge
  zurückgeben (`suggestedActions`).

### Audit-Anknüpfung

Die Bridge schreibt ein lokales Log; die NOX-App kann dessen
letzte N Einträge optional über `GET /audit?limit=10` anzeigen
(später, nicht in dieser PR).

---

## Nicht-Ziele dieser PR

- Kein Live-Bridge-Aufruf mit echten `claude -p`-Calls in der
  Default-Konfiguration.
- Keine Anthropic-API-Calls.
- Keine MCP-Server-Anbindung.
- Keine Voice-/Telegram-Integration.
- Keine neuen Notion-Write-Pfade. Der bestehende Phase-2C-Pre-Pfad
  bleibt unverändert.
- Keine harte Änderung an der bestehenden Cockpit-Layout-Logik
  außer im `NoxProjectChatPanel` und der zugehörigen
  Status-/Header-Zeile.

---

## Konkrete Edits in dieser PR

`src/components/cockpit/NoxProjectChatPanel.tsx`:

- Neuer `useEffect`: ruft `checkBridgeHealth()` einmal beim Mount und
  alle 30s erneut auf. Setzt `bridgeState`-Local-State.
- Header-Copy abhängig vom `bridgeState`.
- Neuer Bridge-Status-Streifen über dem Chat (Bridge URL,
  Exec-Modus, Letzter Health-Stand).
- Wenn `bridgeState === 'online'`: Send-Aktion ruft
  `sendClaudeCodeMessage()`. Antwort wird wie eine `nox`-Message
  gerendert, plus ein Chip „Bridge".
- Wenn `bridgeState !== 'online'`: alter `parseNoxCommand`-Pfad
  bleibt. Header zeigt „Lokale Schnellbefehle (Fallback)".

`src/lib/claudeCodeBridgeClient.ts` (neu):

- `checkBridgeHealth(): Promise<BridgeHealth>`
- `sendClaudeCodeMessage(args): Promise<BridgeMessageResult>`
- Konstante Standardadresse `http://127.0.0.1:8799`, override über
  Vite-Env `VITE_NOX_CLAUDE_CODE_BRIDGE_URL` (Browser-side, keine
  Secrets — nur die URL).
- 2-Sekunden-Timeout für `/health`, 30-Sekunden-Timeout für
  `/claude-code/message`.

`scripts/nox-claude-code-bridge.mjs` (neu, optional):

- Standalone Node-Script, kein npm-Build-Step.
- Startet HTTP-Server auf `127.0.0.1:8799`.
- `GET /health` → wie oben spezifiziert.
- `POST /claude-code/message` → Default Dry-Run. Echte
  Claude-Code-Ausführung nur, wenn
  `NOX_CLAUDE_CODE_BRIDGE_EXEC === '1'` UND der `workspacePath` in
  `NOX_CLAUDE_CODE_BRIDGE_ALLOWED_WORKSPACES` enthalten ist.
- `--help` zeigt Aufruf, Env-Variablen, Sicherheitsregeln.
- CORS: nur `http://localhost:5173`, `http://127.0.0.1:5173`,
  optional weitere via `NOX_CLAUDE_CODE_BRIDGE_ALLOWED_ORIGINS`.

`docs/nox-claude-code-bridge-plan.md`: Architekturplan (siehe dort).

---

## Folgequests, die aus dieser PR fallen

- **NOX-BRIDGE-EXEC-01:** Echten `claude -p`-Aufruf in der Bridge
  aktivieren. Nur nach manuellem Smoke-Test, mit Logging.
- **NOX-MCP-SERVER-01:** NOX-Tools als MCP-Server exposen, der
  parallel zur Bridge verwendbar ist.
- **NOX-MINDMAP-REFRESH-02:** Kanonische Mindmap-Seiten auf
  „Claude-Code-Brain + NOX-Bridge"-Stand bringen.
- **NOX-BRIDGE-SESSION-01:** Multi-Turn / `claude --resume`
  Session-Bridge.
- **NOX-VOICE-PHASE-01:** Hermes/Telegram-/Voice-Schicht oberhalb
  der Bridge.
