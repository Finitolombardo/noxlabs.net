# Project Auto Planner — Shared Notion Token Opt-In

> Stand: 2026-05-20 · Branch: `docs/phase-2e-runbook`
> Bearbeiter: Claude (operative zweite rechte Hand)
> Scope: **Server-seitiger Env-Opt-In für gemeinsamen Notion-Read/Write-Token.** Keine Notion-Writes, kein Vercel, kein n8n, kein Dispatcher, kein Stash pop, keine Chatpanel-Arbeit, kein Commit/Push ohne Operator-Go.

Abschlussmarker: `PROJECT_AUTO_PLANNER_SHARED_NOTION_TOKEN_READY`

---

## Fehlerbild

Im Phase-2E-Smoke war alles bis zum echten Notion-Write grün:

- UI: „1 Quest bereit"
- Combined-CTA: „1 Quest erzeugen"
- Commit-Klick → strukturierter Fehler:
  ```
  write_token_collision (HTTP 500)
  NOX_NOTION_WRITE_TOKEN is identical to NOX_NOTION_READONLY_TOKEN.
  Use a dedicated write-scope integration token.
  ```

Ursache: Der Commit-Endpoint blockte bisher hart, wenn `NOX_NOTION_WRITE_TOKEN === NOX_NOTION_READONLY_TOKEN`. Die Annahme war: zwei getrennte Integrationen reduzieren die Blast-Radius bei einem Write-Token-Leak und machen Token-Rotation sauberer. Im aktuellen Setup soll aber bewusst eine einzige bestehende Notion-Integration sowohl Read als auch Write können — der Operator hat genau einen Integration-Token und will nicht erst einen zweiten erzeugen müssen.

## Warum der Collision-Guard ursprünglich existiert

Der Hard-Block stammt aus dem Phase-2C-Pre-Design (`docs/project-auto-planner-phase-2-architecture.md`, Risiken-Abschnitt „Read-Token vs Write-Token Trennung"):

1. **Schaden bei Token-Leak begrenzen**: Wenn der Write-Token leakt, soll der Read-Pfad weiter funktionieren bis die Integration rotiert wird.
2. **Saubere Rotation**: Eine schreibende Integration kann unabhängig von der lesenden rotiert werden, ohne andere Operator-Routen zu unterbrechen.
3. **Verhindert Konfig-Verwechslung**: Wenn Read- und Write-Var auf denselben Wert zeigen, ist oft der Operator versehentlich auf den Read-Token gefallen.

Diese Argumente bleiben gültig — aber sie sind eine **Operator-Entscheidung**, kein technischer Hard-Block. Wenn der Operator bewusst weiß, dass die single-integration-Strategie für seinen Workspace richtig ist, soll er das per Env-Schalter freischalten können.

## Warum unser Setup einen gemeinsamen Token erlaubt

- Eine einzige Notion-Integration ist im aktuellen Workspace bereits mit allen relevanten Datenbanken (Master Tasks, Projects) verbunden.
- Eine zweite Integration anlegen würde einen zusätzlichen manuellen Schritt in der Notion-UI erfordern, ohne Sicherheitsgewinn im aktuellen Threat-Model.
- Rotation läuft im Single-Token-Modell ohnehin als ein Klick in Notion → einmal `NOX_NOTION_WRITE_TOKEN` (und nun auch der `NOX_NOTION_READONLY_TOKEN`) in Vercel-Env aktualisieren. Akzeptabel.

## Neuer Env-Schalter

```
NOX_NOTION_ALLOW_SHARED_READ_WRITE_TOKEN=true
```

**Verhalten** (Reihenfolge entspricht dem Code-Pfad in `api/operator/projects/[projectId]/plan/commit.ts:resolveWriteToken`):

| `NOX_NOTION_WRITE_TOKEN` | === Read-Token? | Opt-in-Flag exakt `"true"`? | Result |
|---|---|---|---|
| unset / leer | — | — | **`notion_write_token_missing`** (HTTP 503) — unverändert |
| gesetzt | nein | — | Pfad läuft wie bisher (kein Diagnostic) |
| gesetzt | ja | nein | **`write_token_collision`** (HTTP 500) — unverändert, Diagnostic erweitert mit „or set NOX_NOTION_ALLOW_SHARED_READ_WRITE_TOKEN=true" |
| gesetzt | ja | ja | **Commit darf weiterlaufen.** Diagnostic-Entry in `response.diagnostics[]`: `shared_read_write_token_allowed: write token equals read token; opt-in via NOX_NOTION_ALLOW_SHARED_READ_WRITE_TOKEN=true is active.` Plus ein strukturierter Log-Eintrag (`code: shared_read_write_token_allowed`, kein Tokenwert). |

**Strikt** vergleichen wir mit `.trim().toLowerCase() === 'true'` — alles andere (`"True"`, `"1"`, `"yes"`, `""`) lässt den Block stehen. Identische Konvention wie `NOX_NOTION_WRITE_ENABLED` und `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE`.

## Sicherheitsbedingungen

Auch mit aktivem Shared-Token-Opt-In gelten **alle** anderen Phase-2-Gates unverändert:

- **`NOX_NOTION_WRITE_ENABLED=true`** muss separat gesetzt sein. Der Shared-Token-Schalter ist nur eine **zusätzliche** Erlaubnis, kein Write-Master-Switch.
- **Notion-Integration muss Insert-Rechte** auf die Master-Tasks-DB haben. Notion's UI: Master-Tasks-DB → „Connect to integration" → Integration mit Schreibrechten hinzufügen.
- **Auth-Gate** (Operator-Key oder `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE`) bleibt.
- **Digest-Recompute** (Gate 7) bleibt — kein Bypass möglich.
- **Schema-Recheck** (Gate 11) bleibt.
- **Idempotenz-Precheck** (Gate 12) bleibt — kein Duplikat-Risk.
- **Property-Allowlist** + **Property-Mapping-Guard** bleiben.
- **Keine Tokenwerte in Logs oder Response.** Der Diagnostic-String trägt nur den Booleschen Marker.
- **Keine Fallback-Logik auf Read-Token.** Der Code liest weiterhin `NOX_NOTION_WRITE_TOKEN` explizit; nur die Gleichheits-Prüfung wird optional erlaubt.
- **Nach Smoke Lockdown nicht vergessen.** Empfehlung: `NOX_NOTION_WRITE_ENABLED=false` (oder env-var entfernen), und im selben Schritt entweder `NOX_NOTION_ALLOW_SHARED_READ_WRITE_TOKEN` zurück auf `false` oder einfach den Notion-Token rotieren. Audit-Log behalten.

## Geänderte Dateien

- `api/operator/projects/[projectId]/plan/commit.ts`:
  - Neuer Helper `isSharedReadWriteTokenAllowed()`
  - `WriteTokenStatus` um `sharedReadWrite?: boolean` erweitert
  - `resolveWriteToken` verzweigt: Opt-in → `{ token, sharedReadWrite: true }`, sonst `collision_with_readonly` wie gehabt
  - Handler hängt bei aktivem Opt-In einen sanitisierten Diagnostic-Eintrag in `response.diagnostics[]` und ruft `logCommitEvent('warn', requestId, { code: 'shared_read_write_token_allowed', ... })`
  - Collision-Error-Message erweitert um Hinweis auf den neuen Opt-In-Schalter
- `docs/project-auto-planner-shared-notion-token.md` — dieser Report

**Nicht geändert**: `api/_lib/types.ts` (kein neuer Wire-Code nötig, der Diagnostic-Marker reist über das existing `diagnostics: string[]`-Feld), `api/_lib/audit.ts` (kein neuer Audit-Event-Type — der reguläre Commit-Pfad mit Diagnostic ist genug), `src/lib/projectPlannerClient.ts`, `src/pages/OperatorCockpit.tsx`. Wire-Format byte-identisch.

## Validierung

- `npm run lint` → 0 errors, 0 warnings ✅
- `npm run typecheck` → 0 Errors in `commit.ts` ✅
- 6 verbleibende TS-Errors weiterhin **alle pre-existing** in `src/components/skillbook/Skillbook{Canvas,Node}.tsx` (fehlende npm-deps `@excalidraw/excalidraw` und `@xyflow/react`).

### Manuelle Verifikations-Checkliste

| # | Operator-Env | Erwartete Response |
|---|---|---|
| 1 | `NOX_NOTION_WRITE_TOKEN` unset | HTTP 503, `code: notion_write_token_missing` |
| 2 | `NOX_NOTION_WRITE_TOKEN` ≠ Read-Token, `_ALLOW_SHARED_` unset | Pfad läuft normal, keine Diagnostic |
| 3 | `NOX_NOTION_WRITE_TOKEN` === Read-Token, `_ALLOW_SHARED_` unset | HTTP 500, `code: write_token_collision`, Diagnostic mit Opt-In-Hinweis |
| 4 | `NOX_NOTION_WRITE_TOKEN` === Read-Token, `_ALLOW_SHARED_=true` | Pfad läuft normal. Response enthält `diagnostics[0] = "shared_read_write_token_allowed: …"`. Vercel-Log enthält JSON-Zeile mit `code: shared_read_write_token_allowed`. **Kein Tokenwert geloggt oder echo'd.** |
| 5 | `NOX_NOTION_WRITE_TOKEN` === Read-Token, `_ALLOW_SHARED_=True` (Groß-T) | wie 3 — Strikt-Prüfung, nur exakt `"true"` öffnet |
| 6 | Shared-Token aktiv, aber Integration hat keine Insert-Rechte | Per-Step-Pfad meldet Notion `unauthorized` → `code: notion_create_failed` (HTTP 502). Gate-Reihenfolge unbeeinflusst. |
| 7 | Shared-Token aktiv, `NOX_NOTION_WRITE_ENABLED` unset | HTTP 423, `code: writes_locked`. Shared-Token-Opt-In kommt nicht zum Tragen, weil der Flag-Gate vorgeschaltet ist. |

## Operator-Retry-Anleitung für Phase-2E-Smoke

1. Vercel-Env (Production) zusätzlich setzen:
   ```
   NOX_NOTION_ALLOW_SHARED_READ_WRITE_TOKEN=true
   ```
2. **Wichtig**: Die bestehende Notion-Integration muss explizit auf die Master-Tasks-DB connected sein und Schreibrechte haben. Notion UI → Master-Tasks-DB → „Connect to integration" → bestehende Integration prüfen.
3. Re-Deploy auf Production.
4. Cockpit öffnen, Projekt `TEST_PLAN_COMMIT`, Goal mit `PHASE-2E-SMOKE`-Prefix.
5. Plan auf 1 Step reduzieren (Smoke-Safety in der UI).
6. **„Prüfen & 1 Quest erzeugen"** klicken.
7. Erwartet: HTTP 200, `code: committed`, `notionWritesExecuted: true`, `pageResults[0].notionPageId = "…"`. Response-Body enthält in `diagnostics[]` als ersten Eintrag: `"shared_read_write_token_allowed: write token equals read token; opt-in via NOX_NOTION_ALLOW_SHARED_READ_WRITE_TOKEN=true is active."`. UI-Banner: „Quests erzeugt: 1".
8. Idempotenz-Re-Run: zweiter Klick → `code: duplicate_risk` (HTTP 200).
9. **Lockdown** sofort danach:
   - `NOX_NOTION_WRITE_ENABLED` raus (oder `false`)
   - `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE` raus (oder `false`)
   - `NOX_NOTION_ALLOW_SHARED_READ_WRITE_TOKEN` raus (oder `false`)
   - Re-Deploy
   - Verifizieren: erneutes „1 Quest erzeugen" → HTTP 423 `writes_locked` oder HTTP 401
10. Notion: Test-Page in Master Tasks manuell löschen (oder als Smoke-Beleg stehen lassen).
11. Empfehlung: Notion-Integration-Token rotieren, da er nun temporär für Writes aktiv war. Bei Single-Integration-Setup einmal Rotation, dann `NOX_NOTION_WRITE_TOKEN` + `NOX_NOTION_READONLY_TOKEN` mit dem neuen Wert in Vercel-Env nachziehen.

## Rest-Risiken

- **Single-Token-Leak betrifft Read und Write gleichzeitig.** Bewusst akzeptiert im aktuellen Setup. Bei Threat-Model-Änderung (z.B. Multi-Tenant, externe Operatoren) → separate Integrationen reaktivieren und Opt-In wieder ausschalten.
- **Falsche Operator-Annahme**: Operator setzt Opt-In aktiv, vergisst aber die Insert-Rechte in Notion → Smoke meldet `notion_create_failed` (502) statt `committed`. Kein Daten-Schaden, nur fehlgeschlagener Write — der bestehende Commit-500-Diagnostics-Pfad (`7d65996`) zeigt das klar mit Notion-Code im UI.
- **Audit-Persistenz weiterhin in-memory** — siehe Phase-2E-Runbook. Keine Änderung durch diese Quest.
- **Project-Chat-Panel-Quest bleibt geparkt** (`stash@{0}`, `_parked/`), unangetastet von diesem Fix.

Abschlussmarker: `PROJECT_AUTO_PLANNER_SHARED_NOTION_TOKEN_READY`
