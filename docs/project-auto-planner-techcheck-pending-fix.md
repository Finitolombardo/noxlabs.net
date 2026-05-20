# Project Auto Planner — Techcheck Pending Fix

> Stand: 2026-05-20 · Branch: `docs/phase-2e-runbook`
> Bearbeiter: Claude (operative zweite rechte Hand)
> Scope: **Frontend-State-Fix.** Keine Backend-/API-/Notion-/Vercel-/n8n-/Dispatcher-Änderung. Kein Commit/Push ohne Operator-Go.

Abschlussmarker: `PROJECT_AUTO_PLANNER_TECHCHECK_PENDING_FIX_READY`

---

## Fehlerbild

Nach einer lokalen Plan-Mutation (Quest-Schritt löschen / „Auf 1 Smoke-Quest reduzieren" / Plan-Edit) blieb die Tech-Check-Anzeige im Hauptscreen dauerhaft auf **„Prüfung läuft …"** stehen. Der Operator konnte nicht mehr „Technisch prüfen" auslösen oder committen, weil der Status nie zurück auf „idle" oder „stale" fiel.

Effekt: Der Phase-2E-Smoke war nicht mehr durchführbar, obwohl alle Backend-Gates und Phase-2-Pipeline korrekt arbeiteten.

## Root Cause — Race zwischen zwei useEffects

Die Quelle des Bugs lag im Zusammenspiel **zweier** useEffects in `ProjectsDeepDive`:

1. **`autoTechCheckPending`-Effect** (definiert zuerst, Zeile 3760)
   ```ts
   useEffect(() => {
     if (!autoTechCheckPending) return;
     ...
     setAutoTechCheckPending(false);
     void handleApiPreview();
   }, [autoTechCheckPending, planSteps, projektZiel]);
   ```
2. **`isPlanStaleAgainstValidate`-Invalidation-Effect** (definiert danach, Zeile 3791) — alte Version:
   ```ts
   useEffect(() => {
     if (!isPlanStaleAgainstValidate) return;
     if (apiPreviewAbortRef.current) {
       apiPreviewAbortRef.current.abort();
       apiPreviewAbortRef.current = null;
     }
     ...
   }, [isPlanStaleAgainstValidate]);
   ```

React-Effects laufen in Definitions-Reihenfolge. Wenn der Operator **„Quest-Reihe entwerfen"** klickt **nachdem** ein Validate-Snapshot existierte, passierte folgendes auf demselben Render:

| # | State / Aktion |
|---|---|
| 1 | `regeneratePlan(...)` setzt neue `planSteps`, `setAutoTechCheckPending(true)`. |
| 2 | Re-render: `currentPlanFingerprint` = NEU, `lastValidatedFingerprint` = ALT → `isPlanStaleAgainstValidate = true`, `autoTechCheckPending = true`. |
| 3 | Effect-Reihenfolge: |
| 3a | autoTechCheckPending-Effect feuert zuerst → `setAutoTechCheckPending(false)` (queued) → **synchron** `void handleApiPreview()` → `apiPreviewAbortRef.current = controller` (gesetzt!), `setApiPreviewLoading(true)`, fetch startet. |
| 3b | Invalidation-Effect feuert danach → sieht `apiPreviewAbortRef.current !== null` (gerade von 3a gesetzt) → **bricht den frisch gestarteten Preview ab** → `apiPreviewAbortRef.current = null`. |
| 4 | Aborted `fetchPlanPreview` kehrt zurück mit `errorCode: 'aborted'`. |
| 5 | `handleApiPreview` macht `if (apiPreviewAbortRef.current !== controller) return;` — `null !== controller` → **early return**. |
| 6 | **`setApiPreviewLoading(false)` läuft nie.** Der Loading-Flag bleibt `true` für immer. |
| 7 | Renderer sieht `apiPreviewLoading === true` → `techCheckStatus = 'running'` → UI zeigt „Prüfung läuft …" — permanent. |

Selbst wenn der Operator danach manuell „Technisch prüfen" klickt, würde ein zweiter Preview-Call zwar gestartet werden, aber der Bug-Pfad kann unter ungünstigen Bedingungen erneut auftreten. Stuck-Loading ist nicht selbst-heilend.

## Geänderte Dateien

- `src/pages/OperatorCockpit.tsx` (nur Frontend-State, keine API-Schicht)
- `docs/project-auto-planner-techcheck-pending-fix.md` (dieser Report)

**Nicht geändert**: `api/_lib/*`, `api/operator/projects/[projectId]/plan/*.ts`, `src/lib/projectPlannerClient.ts`, `src/types/projectPlanner.ts`, `vercel.json`, `.env*`. Wire-Format, Notion-Mapping, Phase-2-Commit-Pipeline bleiben byte-identisch zu Commit `4b1387d`.

## Fix in zwei Schichten

### Schicht 1 — Invalidation-Effect bricht in-flight NICHT mehr ab

Der Abort war die direkte Race-Ursache. Neue Logik:

```ts
useEffect(() => {
  if (!isPlanStaleAgainstValidate) return;
  setApiPreviewData(null);
  setApiPreviewError(null);
  setApiValidateData(null);
  setApiValidateError(null);
  setCommitData(null);
  setCommitError(null);
  setLastValidatedFingerprint(null);
  setLastValidatedStepCount(null);
}, [isPlanStaleAgainstValidate]);
```

Begründung im Code-Kommentar dokumentiert: Ein in-flight Tech-Check arbeitet **per Definition** an einer aktuellen Plan-Snapshot. Lässt man ihn durchlaufen, gibt es zwei Fälle:

- **Sein Fingerprint passt zur aktuellen Planung** → Result landet sauber, Snapshot wird gespeichert, Status wird „ready".
- **Sein Fingerprint passt nicht** → der bestehende Stale-Mechanismus räumt nach dem Result-Set wieder auf (eventual consistency).

Beides ist sicher und vermeidet die Stuck-Loading-Falle.

### Schicht 2 — Belt-and-suspenders im Early-Return

Falls in Zukunft jemand wieder einen `.abort()` von außen einbaut, soll der Loading-Flag trotzdem aufgeräumt werden. Daher in `handleApiPreview` und `handleApiValidate`:

```ts
if (apiPreviewAbortRef.current !== controller) {
  // Disambiguate:
  //   - ref === null  → externer Abort. Loading-Flag müssen wir clearen.
  //   - ref === otherController → neue Anfrage läuft schon. NICHT clearen.
  if (apiPreviewAbortRef.current === null) {
    setApiPreviewLoading(false);
  }
  return;
}
```

Damit ist die UI selbst gegen zukünftige Abort-Aufrufe robust und kann nicht mehr auf „Prüfung läuft …" hängenbleiben.

### Schicht 3 — Empty-Plan-Effect

Wenn der Operator alle Quest-Schritte löscht (`planSteps.length === 0`):

```ts
useEffect(() => {
  if (planSteps.length > 0) return;
  setApiPreviewLoading(false);
  setApiValidateLoading(false);
  setApiPreviewData(null);
  setApiPreviewError(null);
  setApiValidateData(null);
  setApiValidateError(null);
  setLastValidatedFingerprint(null);
  setLastValidatedStepCount(null);
}, [planSteps.length]);
```

Spec-Wording erfüllt: Tech-Check-Card zeigt jetzt explizit:

> **Keine Quest im Entwurf**
> Füge mindestens eine Quest hinzu oder generiere den Plan neu. Commit ist gesperrt, solange der Entwurf leer ist.

Vorher: Card war komplett unsichtbar bei `stepCount === 0`, Operator hatte keinen Hinweis warum „Quests erzeugen" nicht erscheint.

## UI-Wording angepasst an Spec

- **Stale**: „Plan wurde geändert — bitte erneut technisch prüfen" (vorher: „Plan wurde geändert — erneute Prüfung nötig"). Wortlaut matcht jetzt die User-Spezifikation 1:1.
- **Empty**: „Keine Quest im Entwurf. Füge mindestens eine Quest hinzu oder generiere den Plan neu."
- **1 Schritt im Entwurf + nicht validiert**: bleibt „Plan wurde geändert — bitte erneut technisch prüfen" (über Stale-Pfad).
- **1 Quest validiert**: „Bereit für Notion-Erzeugung" + Button-Label **„1 Quest erzeugen"** (existierende dynamische Logik aus Commit `4b1387d`).
- **n Quests validiert (n>1)**: Button-Label „n Quests erzeugen" + amber-Smoke-Warnbanner mit „auf 1 Smoke-Quest reduzieren"-Link.

## Validierung

### Statische Checks

- `npm run lint` → **0 errors, 0 warnings** ✅
- `npm run typecheck` → **0 OperatorCockpit-Errors** ✅. Es bleiben **6 pre-existing** TS-Errors in `src/components/skillbook/Skillbook{Canvas,Node}.tsx` (fehlende npm-deps `@excalidraw/excalidraw` und `@xyflow/react`). Identisch zu vor-Fix-Stand.

### Manuelle Verifikations-Checkliste (Operator, `npm run dev`)

| # | Schritt | Erwartete UI |
|---|---|---|
| 1 | Projekt `APP-X` öffnen, Goal eintragen, „Quest-Reihe entwerfen" klicken | Tech-Check feuert auto → grün „Bereit für Notion-Erzeugung · 7 Quests bereit · Digest XXXX", Button-Label „7 Quests erzeugen" |
| 2 | „Quest-Reihe entwerfen" erneut klicken (regeneriert Plan + Auto-Tech-Check gegen alten Snapshot) | Banner darf **NICHT** auf „Prüfung läuft …" hängen bleiben. Korrekter Ablauf: kurzzeitig „Prüfung läuft …" → dann grün „Bereit …" mit neuem Digest. |
| 3 | Im Planner-Modal einen Step löschen | Banner sofort rose: „Plan wurde geändert — bitte erneut technisch prüfen" (validiert: 7, lokal jetzt: 6). Commit-Button verschwindet, „Erneut technisch prüfen" erscheint. |
| 4 | „Auf 1 Smoke-Quest reduzieren" klicken | Banner rose: „Plan wurde geändert — bitte erneut technisch prüfen (validiert: 7, lokal jetzt: 1)". |
| 5 | „Erneut technisch prüfen" klicken | Banner kurzzeitig cyan „Prüfung läuft …", dann grün „1 Quest bereit · Digest YYYY", Button-Label „1 Quest erzeugen". |
| 6 | Alle Schritte aus dem Planner löschen | Banner ändert sich auf neutralen Empty-Card-Block: „Keine Quest im Entwurf — Füge mindestens eine Quest hinzu oder generiere den Plan neu." Commit-Button nicht sichtbar. |
| 7 | „Quest-Reihe entwerfen" → erneut 7-Schritte-Default | Auto-Tech-Check feuert, landet bei „7 Quests bereit". |

## Rest-Risiken

- **Race bei sehr schnellem Doppel-Klick auf „Erneut technisch prüfen"**: Die zweite Anfrage setzt `apiPreviewAbortRef.current = newController` und ruft `controller.abort()` auf dem ersten. Der erste Handler sieht im early-return-Pfad `apiPreviewAbortRef.current !== null` (zeigt jetzt auf `newController`) und cleart **nicht** den Loading-Flag — was korrekt ist, weil die zweite Anfrage ihren eigenen Loading-Flag bereits gesetzt hat. Kein Stuck-Loading.
- **Eventual-consistency-Fenster**: Wenn `handleApiValidate` mitten in Flight ist und der Operator den Plan ändert, läuft Validate mit dem alten Plan zu Ende, setzt kurz `apiValidateData` (mit altem Digest) und `lastValidatedFingerprint` (alte Fingerprint). Im selben Render-Pass erkennt `isPlanStaleAgainstValidate` die Divergenz und cleart sofort wieder. Der Operator sieht in der Zwischenzeit max einen Frame lang „ready"-Status. Akzeptabel, weil:
  - Commit-Button hat den synchronen Stale-Guard in `handleApiCommit` (Commit `4b1387d`).
  - Server-Side recomputed den Digest sowieso (Phase-2C Gate 7).
- **Audit-Persistenz fehlt weiterhin** — siehe Phase-2E-Runbook, separates Folge-Thema.
- **Project-Chat-Panel-Quest geparkt**: Die größeren Architektur-Änderungen (permanentes Chatpanel) wurden mit `git stash` weggepackt (`stash@{0}`), Doku liegt unter `_parked/operator-cockpit-project-chat-architecture.md.parked`. Diese Quest hat sie bewusst nicht angefasst — sie löst einen anderen Bug.

## Anleitung für Operator-Smoke nach diesem Fix

Identisch zum Phase-2E-Runbook (`docs/project-auto-planner-phase-2e-notion-write-smoke.md`), aber jetzt mit funktionierender Tech-Check-Anzeige nach Plan-Reduktion. Konkret:

1. Cockpit auf Production (oder lokal `npm run dev`).
2. Projekt `TEST_PLAN_COMMIT` wählen.
3. Goal eintragen: `PHASE-2E-SMOKE-TEST: Erzeuge genau eine isolierte Test-Quest …`
4. „Quest-Reihe entwerfen" → 7-Schritte-Default + Auto-Tech-Check landet grün.
5. „Auf 1 Smoke-Quest reduzieren" klicken → Banner wechselt jetzt **zuverlässig** auf „Plan wurde geändert — bitte erneut technisch prüfen". (Vor diesem Fix wäre er auf „Prüfung läuft …" hängengeblieben.)
6. „Erneut technisch prüfen" klicken → grün „1 Quest bereit".
7. Vercel-Env-Vars setzen wie im Phase-2E-Runbook beschrieben.
8. „1 Quest erzeugen" klicken → erwarteter Response `committed`.
9. Idempotenz-Re-Run → `duplicate_risk`.
10. Lockdown wie im Phase-2E-Runbook beschrieben.

Abschlussmarker: `PROJECT_AUTO_PLANNER_TECHCHECK_PENDING_FIX_READY`
