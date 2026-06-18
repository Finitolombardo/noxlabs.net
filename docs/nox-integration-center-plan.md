# NOX Integration Center — Plan

Status: Architekturplan + Datenmodell. UI noch nicht implementiert.
Branch: `feature/operator-cockpit-claude-code-bridge` (stacked auf PR #26).
Letztes Update: 2026-05-21.

> Zielsatz: „Großinquisitor Azariel, Kollegen und später Kunden verbinden
> ihre eigenen Accounts in NOX. Wir nutzen offizielle OAuth-/API-Flows.
> NOX hält nie Claude-Tokens — Claude bleibt im eigenen Login."

---

## Routenplan

| Phase | Route | Zielgruppe |
|---|---|---|
| 1 (heute) | `/operator/integrations` | Azariel / Operator-Team |
| 2 | `/team/integrations` | interne Kollegen mit eigenem Account |
| 3 (customer-ready) | `/app/integrations` | Endkunden mit eigener NOX-Org |

In Phase 1 reicht eine **einzige** Operator-Seite. Sie zeigt alle
Connectors, ihren Status, Risiko und wer sie nutzt.

---

## Connector-Modell — eine Karte pro Integration

Jede Connector-Karte ist ein Eintrag aus `INTEGRATION_CONNECTORS_DEFAULT`
in `src/types/integrations.ts`. Die Felder folgen `IntegrationConnector`:

- `id` (kanonischer slug, z. B. `notion`)
- `label` (UI-Beschriftung)
- `description` (was macht der Connector?)
- `authType` (`oauth` / `api_key` / `bot_token` / `local_bridge` /
  `mcp` / `manual`)
- `status` (`not_configured` / `connected` / `read_only` /
  `write_enabled` / `error` / `disabled`)
- `risk` (`low` / `medium` / `high` / `forbidden`)
- `usedBy` — welche Komponenten zugreifen
- `supportsRead`, `supportsWrite`
- `customerConnectable` — darf ein Endkunde diesen Connector selbst
  verbinden?
- `requiresOAuth`
- `requiresLocalProcess` (z. B. die Claude-Code-Bridge)
- `recommendedPhase` (1..4)
- `minimalScopes`
- `lastCheckedAt`, `lastError`

Die UI rendert pro Karte:

```
┌─────────────────────────────────────────────────────────────┐
│ Notion · Workspace „Nox/Operations"                          │
│ Status: read_only · Auth: api_key · Risiko: medium           │
│ Genutzt von: Claude, NOX-App, n8n                            │
│ Letzter Check: vor 12 min                                    │
│ Letzter Fehler: (none)                                       │
│                                                              │
│ [ Verbinden ] [ Verbindung prüfen ] [ Details ] [ Trennen ]  │
└─────────────────────────────────────────────────────────────┘
```

---

## Connector-Liste (Initial-Set)

Diese Liste ist der Default-Katalog. Sie ist absichtlich konservativ
und enthält **keine** Trading-/Broker-Integrationen (deren Live-Pfade
sind in der Bridge auf `forbidden` gesetzt).

| Connector | Auth | Risiko | Phase | Wer nutzt es |
|---|---|---|---|---|
| Claude Code (lokale Bridge) | local_bridge | low | 1 | NOX-App |
| NOX MCP Server | mcp | low | 1 | Claude, NOX-App |
| Notion | api_key (heute) → oauth (Phase 2) | medium | 1 | Claude, NOX-App, n8n |
| GitHub | oauth | medium | 2 | Claude, Codex, n8n |
| Google Drive | oauth | medium | 2 | Claude, Kunde |
| OneDrive / Microsoft | oauth | medium | 2 | Kunde |
| Slack | oauth (Bot) | medium | 2 | Claude, Hermes |
| Gmail | oauth | high | 3 | Kunde |
| Google Calendar | oauth | medium | 3 | Hermes, Kunde |
| n8n | api_key | medium | 1 | NOX-App, Hermes |
| Telegram | bot_token | medium | 2 | Hermes |
| Sentry | api_key | low | 2 | Claude, n8n |
| Stripe | api_key | high | 3 | Kunde |
| YouTube | oauth | medium | 3 | Noxreel-Pipeline |
| Meta / WhatsApp | oauth | high | 4 | Kunde |

`recommendedPhase` im Datenmodell hält die Spalte „Phase".

---

## Auth-Typen — was bedeuten sie operativ

| `authType` | Wer hält das Secret | Wo läuft es |
|---|---|---|
| `oauth` | NOX-Server (verschlüsselt, RLS-getrennt pro User/Org) | Vercel Serverless via Provider-Refresh-Flow |
| `api_key` | NOX-Server-Env oder User-Connection-Row | Vercel Serverless |
| `bot_token` | NOX-Server-Env | Bot-Adapter (Telegram/Slack-Bot) |
| `local_bridge` | nichts auf NOX-Servern — Bridge ist lokal | `127.0.0.1` beim Operator |
| `mcp` | nichts auf NOX-Servern — MCP-Server ist lokal/getrennt | beim Operator oder Edge |
| `manual` | Operator gibt einmalig ein, wir speichern abgeleiteten Hash | NOX-Server |

Regel: **Customer-Connectoren laufen immer pro User-Connection-Row.**
Niemals ein gemeinsames Org-Key-Pool für Endkunden.

---

## Risiko-Modell

Wie bei der Permission-Engine im Bridge-Plan:

- `low` — reine Reads, lokale UI-Status-Updates → auto-run okay.
- `medium` — Single-Write, Single-Page → normale Bestätigung
  („Verbinden bestätigen", „Webhook prüfen").
- `high` — Multi-Write, Massenversand, finanziell relevant → harte
  Confirmation-Phrase im Dialog.
- `forbidden` — Live-Trading, Broker-Orders, Production-8788 →
  Connector existiert gar nicht oder ist explizit `disabled`.

Status `error` bedeutet: letzter Health-Check fehlgeschlagen.
`lastError` trägt den Klartext (gekürzt, keine Tokens).

---

## Sicherheitsmodell

- **Keine Secrets im Client-Bundle.** Connector-Keys leben in
  Server-Env oder verschlüsselten Connection-Rows. Browser bekommt
  immer nur abgeleiteten Status.
- **Niemand außer dem Owner sieht die rohen Tokens.** Die NOX-App
  zeigt redacted Werte (z. B. `notion_secret_…abcd`).
- **OAuth-Callbacks gehen über NOX-eigene Serverless-Routes.** Die
  Provider sehen nie die Konto-Daten anderer NOX-Nutzer.
- **`requiresLocalProcess: true`** (Claude-Bridge, evtl. MCP) markiert
  Connectoren, die nur funktionieren, wenn beim Operator/Kunde lokal
  etwas läuft. UI muss das ehrlich anzeigen.
- **Customer-Connectable nur, wenn**:
  1. Auth-Flow OAuth-fähig (kein Bot-Token-Klau-Risiko)
  2. Scopes minimal
  3. Read-/Write-Trennung möglich
  4. Owner kann jederzeit revoken

---

## Phasenplan

### Phase 1 — Datenmodell + statische UI + Architektur (dieser PR-Strang)
- `src/types/integrations.ts` (in dieser PR)
- Operator-Seite `/operator/integrations` mit statischem Katalog
  (Folge-PR)
- Keine OAuth-Flows live. Keine Secret-Eingabefelder.
- Status für `claude_code` + `notion` + `n8n` wird aus existierenden
  Health-Checks abgeleitet, alles andere = `not_configured`.

### Phase 2 — Erste echte Connectoren
- Notion OAuth (statt API-Key)
- GitHub OAuth für Codex-Worker
- Slack OAuth (Bot + read/write)
- `lastCheckedAt` + `lastError` werden aus den Server-Health-Checks
  gespeist.

### Phase 3 — Customer-Ready
- Pro User-Org eigene Connection-Rows (Supabase RLS oder vergleichbar).
- Connect-Flow inkl. Scope-Auswahl + Revoke-Knopf.
- Audit pro Connection.

### Phase 4 — Erweiterungen
- Meta/WhatsApp, YouTube-Upload, Stripe-Subscriptions.
- Voice-Stack (Hermes + Mobile Push).
- Optional: Trading-Read-only (z. B. nur Read-Account-State,
  niemals Order-Placement).

---

## Was in diesem PR liefer wird

- `src/types/integrations.ts` — Datentypen + Default-Katalog
- `docs/nox-claude-worker-model.md` — Worker-Architektur
- `docs/nox-integration-center-plan.md` — diese Datei

**Nicht** in diesem PR:
- Keine `/operator/integrations` Route (UI in Folge-PR)
- Keine OAuth-Endpoints
- Keine Token-Storage-Migration
- Keine echten Live-Calls gegen Provider-APIs

---

## Folgequests

| Quest | Phase | Inhalt |
|---|---|---|
| `NOX-INTEGRATIONS-UI-01` | 1 | Statische `/operator/integrations` Seite mit Karten + Status |
| `NOX-INTEGRATIONS-NOTION-OAUTH-01` | 2 | Notion-OAuth-Flow + Token-Speicherung |
| `NOX-INTEGRATIONS-GITHUB-01` | 2 | GitHub-OAuth für Codex-Worker |
| `NOX-INTEGRATIONS-CUSTOMER-01` | 3 | Pro-User-Connection-Rows + RLS |
| `NOX-INTEGRATIONS-SLACK-01` | 2 | Slack-Bot + Read/Write |
| `NOX-MCP-SERVER-01` | 1 | NOX-Tools als MCP-Server (eigener Adapter im Katalog) |
