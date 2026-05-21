# NOX Hermes Delegation Layer

Status: Architektur + Packet-Format + Audit-Modell. Adapter selbst
ist noch nicht implementiert.
Branch: `feature/operator-cockpit-claude-code-bridge`.
Letztes Update: 2026-05-21.

Operator: **Großinquisitor Azariel**.

---

## Ziel

> Lead-Claude kann Aufgaben an Hermes delegieren. Hermes arbeitet
> eigenständig weiter und gibt ein strukturiertes Ergebnis zurück.
> Lead-Claude bewertet das Ergebnis und entscheidet die Folgeaktion.

Hermes bleibt dabei **unverändert**:

- Hermes' Konfiguration wird nicht angefasst.
- Hermes' normaler Chat mit Azariel bleibt nutzbar wie heute.
- Hermes' eigene Agents bleiben unter Hermes' Kontrolle.
- NOX baut nur einen Adapter *um* Hermes.

---

## Transportarten — in Reihenfolge der Empfehlung

| # | Transport | Wann | Status |
|---|-----------|------|--------|
| 1 | **Hermes CLI** | wenn Hermes lokal als CLI/Daemon greifbar ist (analog zur Claude-Code-Bridge) | Wunsch-Default, nicht verifiziert |
| 2 | **HTTP/API-Bridge** | wenn Hermes über eine stabile HTTP-API anspricht | nur, wenn dokumentiert |
| 3 | **Notion-Task-Bridge** | über eine dedizierte „Hermes-Inbox"-DB in Notion | sinnvoll für asynchrone Aufgaben |
| 4 | **Telegram-Transport** | wenn Hermes' Telegram-Frontend gerade der stabile Pfad ist | **Übergangslösung**, nicht Langzeit-Default |
| 5 | **Manuelles Paste** | Adapter erzeugt nur das Packet als Markdown/JSON; Azariel pastet es selbst in Hermes | immer verfügbar als Fallback |

**Regel**: erst die jeweils stabile Schnittstelle nutzen. Kein
Umbau von Hermes, um eine andere Schnittstelle zu erzwingen.

Telegram-Transport ist erlaubt, aber **nicht** als chaotischer Bot-
Massenversand. Pro Delegation eine Nachricht, mit klarer `task_id`,
ohne Spam.

---

## Delegation Packet

Format, das `nox-hermes-delegation` produziert und Hermes liest.
Sowohl Markdown- als auch JSON-Form sind okay; Felder identisch.

```
DELEGATION_PACKET
task_id:                    nox-hermes-2026-05-21-001
from:                       lead_claude
to:                          hermes
operator:                   Großinquisitor Azariel
project:                    <Projektname oder projectId>
goal:                       <1 Satz, was am Ende stehen soll>
context:                    |
  - kurzer Kontextblock
  - Pfade, Konten, Workflow-IDs (nur Namen, keine Secrets)
allowed_actions:
  - Notion read in DB <id>
  - Slack post in #updates
  - …
forbidden_actions:
  - Live-Trading
  - Broker-Order
  - n8n live patch ohne Snapshot
  - Production-8788
  - Secrets exfiltrieren
expected_output:            HERMES_RESULT mit status + summary + actions_taken
risk_level:                 low | medium | high
needs_operator_confirmation: true | false
deadline:                   ISO-8601 oder „none"
```

Wichtige Punkte:

- **task_id** ist deterministisch (z. B. `nox-hermes-YYYY-MM-DD-NNN`).
- **forbidden_actions** sind redundante Absicherung — Hermes hat eigene
  Sicherheitslogik, aber wir wiederholen die NOX-Forbidden-Liste hier
  explizit.
- **needs_operator_confirmation=true** bedeutet: Hermes soll nicht
  ausführen, sondern nur „needs_operator" zurückmelden.

---

## Hermes Response Format

Hermes antwortet idealerweise mit:

```
HERMES_RESULT
task_id:                    <gleiche task_id>
status:                     done | blocked | needs_operator | running
summary:                    <1–3 Sätze>
actions_taken:
  - <was hermes wirklich getan hat>
agents_used:
  - <z. B. hermes-research, hermes-watcher>
artifacts:
  - <Pfade, URLs, Notion-Page-IDs, ohne Secrets>
risks:
  - <Risikohinweise>
next_steps:
  - <empfohlene Folgeaktion>
needs_operator_decision:    true | false
followup_prompt:            <vorgeschlagener Prompt für Lead-Claude/Operator>
```

Wenn Hermes nicht das Format trifft, **toleriert** der Adapter
freitext, parst aber best-effort und markiert die Antwort als
`hermes_freeform=true`. Lead-Claude entscheidet dann, ob nachgefragt
oder direkt weitergearbeitet wird.

---

## Adapter-Verhalten (geplant, nicht in dieser PR live)

1. `nox-hermes-delegation` (Agent) bekommt vom Lead-Claude:
   - Aufgabe + Risiko + Kontext.
2. Agent erzeugt `DELEGATION_PACKET`.
3. Adapter wählt Transport (in Reihenfolge der Verfügbarkeit).
4. Adapter sendet das Packet **nur** mit Operator-GO, wenn der
   Transport echte Nachrichten erzeugt (Telegram, n8n, Notion-Write).
5. Adapter empfängt `HERMES_RESULT` (oder Freitext) und reicht es
   geparst an Lead-Claude weiter.
6. Lead-Claude generiert die Folge-Quest oder fragt Operator.

In dieser PR baut der Adapter noch **nicht** physisch — wir liefern
nur das Format + die Doku.

---

## Audit

Jede Delegation muss später nachvollziehbar sein. Eintrag pro
Delegation enthält:

- `task_id`
- ISO-Timestamp (`sent_at`, `result_at`)
- Auftrag (Hash des Packets, Klartext-Snippet auf 200 Zeichen)
- Transport (`cli` / `http` / `telegram` / `notion` / `manual`)
- Hermes-Antwort (`status`, ggf. `hermes_freeform=true`)
- Lead-Claude-Entscheidung (`approved`, `rejected`, `escalated`)
- Folgeaktion (Quest-ID o. ä.)

Audit-Speicher: in der ersten Phase nur lokales Bridge-Log (siehe
`docs/nox-claude-code-bridge-plan.md`). Phase 2: in den
NOX-Audit-Ring-Puffer (`api/_lib/audit.ts`) und damit über
`/api/operator/audit/recent` lesbar.

---

## Hard Rules

- **Hermes wird nicht mutiert.** Kein Re-Konfig, kein Workflow-Patch,
  kein Bot-Token-Update.
- **Kein Telegram ohne GO.** Adapter sendet keine private Telegram-
  Nachricht, ohne dass Azariel sie explizit freigibt.
- **Kein n8n-Live-Dispatch.** Auch nicht „nur zum Testen".
- **Keine Hermes-eigenen Secrets durch NOX speichern.**
- **Kein chaotischer Bot-Müll.** Telegram-Transport ist nur erlaubt,
  wenn das Packet als **eine** strukturierte Nachricht pro Task
  ankommt.

---

## Was diese PR konkret liefert

- Diese Doku.
- `.claude/agents/nox-hermes-delegation.md` mit System-Prompt, der
  obiges Format ausgibt.
- **Kein** ausführender Adapter-Code. Kein Telegram-Send. Kein
  n8n-Call. Kein Notion-Write.

---

## Folgequests

| Quest | Inhalt |
|---|---|
| `NOX-HERMES-ADAPTER-01` | Reale Hermes-Schnittstelle anbinden (vermutlich CLI/Notion-Inbox) |
| `NOX-HERMES-AUDIT-01` | Delegation-Audit in `api/_lib/audit.ts` + UI-Tail im Cockpit |
| `NOX-HERMES-DRYRUN-01` | Adapter-Skeleton mit Default-Dry-Run wie bei der Claude-Bridge |
| `NOX-HERMES-FORMAT-VERIFY-01` | Smoke-Test, ob Hermes das `HERMES_RESULT`-Format konsistent liefert |
