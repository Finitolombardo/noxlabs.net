# NOX Claude Code Bridge — Architekturplan

Status: Plan + minimaler MVP-Scaffold auf `feature/operator-cockpit-claude-code-bridge`
(gestackt auf PR #26 / `feature/operator-cockpit-nox-command-layer`).
Letztes Update: 2026-05-21.

Diese Notiz definiert, wie das NOX Operator Cockpit Claude als Brain
benutzt, OHNE die Anthropic-API direkt anzubinden — und welche Pfade
explizit ausgeschlossen sind.

---

## Zielbild in einem Satz

> „Ich rede mit Claude über mein Abo. Claude Code steuert NOX lokal.
> Die NOX-App zeigt Fortschritt, Status und Ergebnisse."

NOX-App = **Cockpit** (Status, Tool-Auswahl, Audit-UI).
Claude Code = **Brain** (denkt, plant, schreibt Code, ruft Tools auf).
Bridge = **Klebstoff** (lokaler Prozess, der die App-Eingaben an
Claude Code weiterreicht und die Ausgabe strukturiert zurückgibt).

---

## Realitätscheck — was offiziell/sauber ist

Diese Pfade sind okay, weil sie Claudes Abo-Lizenz NICHT umgehen und
keine geheimen Tokens auslesen:

1. **Claude Code CLI lokal installiert.** Der Operator loggt sich
   einmalig via `claude login` ein. Anthropic hält die Session,
   nicht NOX. Wir lesen keinen Token aus, wir starten nur den
   Prozess.
2. **`claude -p "<prompt>"`** als One-Shot-Aufruf in einem freigegebenen
   Workspace. Stabil dokumentierter Pfad.
3. **Claude Code Sessions** mit `claude --resume`, sobald wir das
   in der CLI-Version verlässlich verfügbar haben.
4. **MCP-Server** — NOX kann eigene Tools als MCP-Server exposen,
   die Claude Code / Claude Desktop importiert. Claude bleibt
   in seinem UI, wir liefern nur die Werkzeuge.
5. **Claude Desktop**, soweit dessen Channels offiziell und stabil
   sind, später für Voice/Remote.

---

## Was NICHT gebaut wird

Explizit ausgeschlossen — auch wenn es technisch ginge:

- **Keine Anthropic-API-Calls aus NOX.** Keine `x-api-key`-Anfrage,
  kein `ANTHROPIC_API_KEY` im Repo, keine serverseitige Messages-API
  von Vercel aus.
- **Kein eigener OAuth-Flow gegen claude.ai.** Wir bauen kein
  paralleles Login.
- **Kein Auslesen** von Claude-Subscription-Tokens, Session-Cookies,
  Keychain-Inhalten, Browser-Storage.
- **Kein Web-Scraping** der Claude-Oberfläche.
- **Kein Fake-Chat**, der per Regex antwortet und dabei „Claude"
  in den Header schreibt. Der lokale Regex-Parser bleibt, aber er
  wird klar als „Lokale Schnellbefehle (Fallback)" beschriftet.
- **Kein unsichtbares Ausführen.** Jeder Bridge-Aufruf wird im UI
  und im lokalen Bridge-Log sichtbar gemacht.

---

## Bridge-Varianten — ehrliche Bewertung

### Variante A — CLI-Bridge (One-Shot)

Bridge führt `claude -p "<prompt>" --output-format json --max-turns 1`
im erlaubten Workspace aus, liest stdout, schickt strukturiertes JSON
an die NOX-App.

- **Vorteil:** Heute baubar. Stabile CLI-API. Trivial zu auditen.
- **Nachteil:** Kein echter Chat — jeder Aufruf ist eine eigene
  Session. Speicher zwischen Turns nur über Bridge-State.
- **Verdict:** **Bester MVP-Pfad.** Liefert in Tagen einen ersten
  echten Claude-Aufruf aus der NOX-App, ohne Anthropic-API.

### Variante B — Session-Bridge

Bridge startet `claude` interaktiv (oder via `--resume <sessionId>`),
hält das Prozess-Handle, leitet Nachrichten hin/her.

- **Vorteil:** Näher an „normalem Claude-Chat".
- **Nachteil:** Prozess-Lifecycle, Resume-Reliability, stdout-Parsing
  und Crash-Recovery sind aufwändiger. Erfordert robusten lokalen
  Daemon.
- **Verdict:** **Phase 2.** Wenn Variante A produktiv ist und der
  Operator regelmäßig Multi-Turn arbeitet.

### Variante C — MCP-first

NOX exposed seine Operationen (z. B. „read project context",
„create quest draft") als MCP-Server. Claude Desktop / Claude Code
importiert den Server und der Operator chattet in Claudes UI, nicht
in der NOX-App.

- **Vorteil:** Offiziell sauberster Pfad. Anthropic-konform.
  Kein Bridge-Daemon nötig.
- **Nachteil:** Der Chat lebt in Claudes UI, nicht im NOX-Cockpit.
  Das Cockpit wird zum Dashboard.
- **Verdict:** **Sollte parallel passieren.** Ein NOX-MCP-Server ist
  unabhängig von der Bridge wertvoll — er gibt Claude direkten
  Zugriff auf NOX-Tools, egal ob die Bridge online ist.

### Variante D — Hybrid (A + C)

NOX-Cockpit hat ein Chat-Feld → schickt Nachrichten an die lokale
Bridge → Bridge ruft Claude Code → Antwort zurück ins Cockpit.
Parallel exposed NOX einen MCP-Server, den Claude Code/Desktop
unabhängig nutzen kann.

- **Vorteil:** Beide Welten. Im NOX-Cockpit volles Status- + Tool-UI;
  in Claude Desktop direkter Zugriff auf NOX-Tools für Voice/Remote.
- **Nachteil:** Zwei Pfade müssen gepflegt werden.
- **Verdict:** **Langfristiges Zielbild.** Phase 1 = Variante A,
  Phase 2 = MCP-Server (C) ergänzen, Phase 3 = Session-Bridge (B)
  oben drauf.

---

## MVP-Architektur (Variante A)

```
┌──────────────────────────┐         ┌──────────────────────────────┐
│ NOX Operator Cockpit     │         │ NOX Claude Code Bridge        │
│  (Browser, React)        │         │  (lokaler Node-Prozess)        │
│                          │         │                              │
│  NoxProjectChatPanel ────┼──HTTP──▶│  POST /claude-code/message     │
│  checkBridgeHealth() ────┼──HTTP──▶│  GET  /health                  │
│                          │         │                              │
│                          │         │   ┌───────────────────────┐  │
│                          │         │   │ claude -p "<prompt>"  │  │
│                          │         │   │ in erlaubtem Workspace│  │
│                          │         │   └───────────────────────┘  │
│                          │         │   only when                  │
│                          │         │   NOX_CLAUDE_CODE_BRIDGE_EXEC │
│                          │         │   === "1"                    │
└──────────────────────────┘         └──────────────────────────────┘
```

- Bridge läuft auf `http://127.0.0.1:8799`. Nur loopback, kein
  öffentliches Port.
- Default-Modus: **Dry-Run.** Bridge baut den Prompt zusammen, gibt ihn
  zurück, ruft aber Claude Code NICHT auf. Erst mit
  `NOX_CLAUDE_CODE_BRIDGE_EXEC=1` führt sie tatsächlich `claude -p`
  aus.
- Bridge schreibt ein einfaches Append-Only-Log
  (`~/.nox-claude-bridge.log`), in dem jeder Aufruf landet: Zeit,
  Workspace, Modus, Prompt-Hash, Exit-Code, stdout-Tail.

### Endpoints

`GET /health` →
```json
{ "ok": true, "bridgeVersion": "0.1.0", "claudeCli": "detected"|"missing", "exec": false }
```

`POST /claude-code/message` Body:
```json
{
  "projectId": "string",
  "message": "string",
  "workspacePath": "absolute path inside allowed list",
  "mode": "ask" | "code_task" | "plan",
  "context": {
    "projectName": "string",
    "projectGoal": "string",
    "planSteps": [],
    "recentActivity": []
  }
}
```

Response:
```json
{
  "status": "ok" | "error" | "blocked" | "dry_run",
  "reply": "string — Claude-Antwort oder Dry-Run-Hinweis",
  "rawTail": "string — letzte ~2KB stdout/stderr",
  "sessionId": null,
  "riskFlags": ["string"],
  "suggestedActions": [{ "label": "...", "kind": "..." }]
}
```

### Sicherheitsmodell

**Allow** (Bridge führt aus, wenn `EXEC=1`):
- Workspaces aus `NOX_CLAUDE_CODE_BRIDGE_ALLOWED_WORKSPACES`
  (semikolongetrennte Absolute-Pfade). Default: leer = nichts erlaubt.
- Klassiker: `noxlabs.net`, `nox-ops`, `trading-agent-league`,
  `Noxxrammus`. Erst nach explizitem Eintragen aktiv.

**Block** (Bridge weigert sich):
- Workspace außerhalb der Allowlist.
- Workspace im globalen Systempfad (`/`, `C:\Windows`, `C:\Program Files`,
  `/usr`, `/etc`, `/System`).
- Modi, die Live-Trading oder Broker-Orders ansprechen — strings
  `place_trade`, `submit_broker_order`, `live_patch_n8n` werden
  abgewiesen, bevor Claude überhaupt aufgerufen wird.
- Produktions-Port-8788-Pfade.
- Globale Cron-/n8n-Live-Patch-Anweisungen ohne explizites
  `confirm: "JA, OPERATOR_GO_<intent>"`.

**Niemals**:
- Bridge liest Secrets aus `.env`, Keychain, Subscription-Daten.
- Bridge schreibt API-Keys in Logs.
- Bridge führt Shell-Kommandos außerhalb des `claude -p`-Aufrufs aus
  (Claude Code selbst macht das, aber innerhalb seines eigenen
  Permission-Modells — dort darf der Operator viel freigeben).

### Audit-Felder (Bridge-seitig)

Pro Aufruf:
- `ts` (ISO-8601)
- `projectId`
- `workspacePath` (nur wenn allowlisted; sonst „blocked")
- `mode`
- `promptHash` (FNV-1a über den finalen Prompt)
- `exec` (false = dry_run, true = echter `claude -p`)
- `exitCode` (0 / non-0)
- `stdoutTailHash` (kein Roh-stdout im Log; nur Hash für Korrelation)
- `riskFlagsRaised`

---

## NOX-App-Seite (Browser-Client)

Der Browser-Client (`src/lib/claudeCodeBridgeClient.ts`) macht **nur
same-origin-fremde Fetches gegen `http://127.0.0.1:8799`**. Das ist
ein bewusstes Loopback-Modell:

- Im Dev-Modus (vite dev server, gleicher PC) funktioniert das
  problemlos. CORS wird in der Bridge bewusst freigegeben für
  `http://localhost:5173` / `http://127.0.0.1:5173` (und für die
  produktive Vercel-URL nicht — die Bridge erlaubt nur lokale Origins).
- In der Vercel-Production gibt es keine Bridge. Der Client fragt
  `/health` ab, erhält ein Netzwerk-Error / Timeout und schaltet
  automatisch in „Bridge offline · Fallback aktiv" um.

Heißt: **die Bridge ist ein lokales Tool, kein Hosted-Service.**
Sie ergänzt das Cockpit, ersetzt es nicht.

---

## Verhältnis zu PR #26 (lokaler Regex-Command-Layer)

PR #26 bleibt **als UI-Grundstruktur**:

- `parseNoxCommand` + die Tool-Karten sind ein nützlicher
  **Fallback-Pfad**, wenn die Bridge offline ist. Sie schreibt
  ohnehin nichts ohne Server-Gate.
- Der bestehende `NoxProjectChatPanel` wird so erweitert, dass er
  beide Modi anzeigen kann:
  - **Bridge-Modus** (Claude Code online): echter Chat, Bridge-Antworten.
  - **Lokaler Schnellbefehle-Modus** (Bridge offline): bisheriger
    Regex-Pfad, klar als Fallback beschriftet.
- Der Header „Lokaler Command Layer · kein API-Call" wird durch
  dynamische Copy ersetzt:
  - Bridge online: „Claude Code Chat · lokales Abo/Login · über Bridge"
  - Bridge offline: „Bridge offline. Starte NOX Claude Code Bridge lokal."

Das vermeidet, dass der Operator das Regex-Panel mit Claude verwechselt.

---

## Phasenplan

| Phase | Inhalt | Status |
|---|---|---|
| 0 | PR #26 (lokaler Regex + Tool-Karten) | gemerged-Pending |
| 1a | Doku + Bridge-Client-Stub + UI-Status-Chip (**diese PR**) | in Arbeit |
| 1b | Bridge-Prototyp-Script mit `/health` + Dry-Run `claude -p` | optional in dieser PR |
| 2  | Echter `claude -p` Aufruf in der Bridge, mit Allowlist | nächster PR |
| 3  | MCP-Server (Variante C) parallel zur Bridge | später |
| 4  | Session-Bridge (Variante B) — Multi-Turn-Chat | später |
| 5  | Mobile/Voice (Claude Desktop Channels oder Hermes-Adapter) | später |
| 6  | Lokales Modell (ltx2/llama.cpp) als Fallback-Brain | später |

---

## Was diese PR (`feature/operator-cockpit-claude-code-bridge`) liefert

- `docs/nox-claude-code-bridge-plan.md` — diese Datei
- `docs/operator-cockpit-claude-code-ui-plan.md` — UI-Spezifikation
- `src/lib/claudeCodeBridgeClient.ts` — `checkBridgeHealth()` und
  `sendClaudeCodeMessage()` (Browser-Client, kein Production-Write)
- `src/components/cockpit/NoxProjectChatPanel.tsx` — Bridge-Status-Chip,
  korrigierte Copy, Regex-Pfad als Fallback markiert
- `scripts/nox-claude-code-bridge.mjs` — minimaler Prototyp,
  Dry-Run-Default, `--help`, kein echter `claude -p` ohne
  `NOX_CLAUDE_CODE_BRIDGE_EXEC=1`

Was **nicht** geliefert wird:
- Echter Claude-Aufruf in Production. Default-Dry-Run.
- MCP-Server. Eigener Folge-PR.
- Session-Resume. Folge-PR.
- Bestehende Plan-Commit-Gates werden NICHT angefasst.
- Anthropic-API-Code im Repo (wir hatten ihn kurz gebaut, aber wieder
  entfernt, bevor die PR aufgemacht wurde).
