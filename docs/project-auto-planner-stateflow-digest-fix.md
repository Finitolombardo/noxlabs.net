# Project Auto Planner — Stateflow / Digest Fix

> Stand: 2026-05-20 · Branch: `docs/phase-2e-runbook`
> Bearbeiter: Claude (operative zweite rechte Hand)
> Scope: **Frontend-Stateflow + UI-Konsistenz.** Keine Backend-/API-/Notion-/Vercel-/n8n-Änderungen, kein Commit/Push ohne Operator-Go.

Abschlussmarker: `PROJECT_AUTO_PLANNER_STATEFLOW_DIGEST_FIX_READY`

---

## Fehlerbild (Operator-Beobachtung)

- Projekt: NOX Labs Cockpit / `APP-X`.
- Ziel: `PHASE-2E-SMOKE-TEST: Erzeuge genau eine isolierte Test-Quest …`.
- Operator hat den lokalen Quest-Reihen-Entwurf im Modal von 7 Schritten auf 1 Schritt reduziert (`PHASE-2E-SMOKE-1: Notion Quest-Write prüfen`).
- Milestone-Eintrag zeigt korrekt **1** Smoke-Quest.
- Aber die technische Prüfung / Commit-Zone zeigt weiterhin **„7 Quests bereit"**.
- Commit-Klick → Server-Response: `Provided planDigest does not match server-computed digest. Re-run preview/validate, then resubmit.`

Effekt: UI-State, lokaler Entwurf, Preview/Validate-Payload und Commit-Payload waren auseinandergelaufen. **Kein erfolgreicher Smoke** — Operator hat den Versuch korrekt abgebrochen.

## Root Cause

Im Commit-Handler war:

- `wireSteps` wurde **frisch** aus dem aktuellen `planSteps`-State (1 Step) gebaut.
- `planDigest` kam aus `apiPreviewData.echoedDigest` — der **stale** Digest des vorherigen 7-Step-Preview-Calls.

Server-seitig (siehe `api/operator/projects/[projectId]/plan/commit.ts` Gate 7) wird der Digest deterministisch aus dem im Request gelieferten Plan **neu** gerechnet (FNV-1a über kanonisches JSON). 1-Step-Plan + 7-Step-Digest → mismatch → `409 plan_digest_mismatch`. So designed, bewusst hart.

**Frontend-Bug**:

1. `apiPreviewData` und `apiValidateData` wurden **nicht** invalidiert, wenn der Operator den Plan lokal mutierte. Es gab keinen Listener auf `planSteps`-Änderungen, der die gecachten Tech-Check-Resultate entwertete.
2. Die UI-Anzeige las weiter aus `apiValidateData.wouldCreateNTasks` (= 7), während `planSteps.length` schon 1 war.
3. Der Auto-Tech-Check-Effekt (Sentinel `autoTechCheckPending`) feuerte nur nach `regeneratePlan(...)`, also nach komplett-neuem Plan, **nicht** nach Step-Mutationen oder dem „Auf 1 Smoke-Quest reduzieren"-Klick.

→ Single Source of Truth war zerrissen: `planSteps` (echt) ≠ `apiValidateData`/`apiPreviewData` (stale Cache).

## Geänderte Dateien

- `src/pages/OperatorCockpit.tsx` (einzige Datei; +127 / -19 Zeilen netto)
- `docs/project-auto-planner-stateflow-digest-fix.md` (dieser Report)

**Nicht geändert**: `api/_lib/*`, `api/operator/projects/[projectId]/plan/*.ts`, `src/lib/projectPlannerClient.ts`, `src/types/projectPlanner.ts`, `vercel.json`, `.env*`. **Backend, Wire-Format und Notion-Mapping bleiben byte-identisch zu Commit `1464c86`.**

## Neuer Stateflow

### Konzept: Single-Source-Of-Truth über Plan-Fingerprint

1. **Pure Helper** `computePlanFingerprint(projectId, projectGoal, planSteps)` (neu, oben im File).
   - Trim aller Strings (gleicher Trim wie `planDraft.ts:validatePlanDraftPayload` server-seitig).
   - Renumber `step` auf `1..N` (matcht das server-seitige `renumbered`).
   - `JSON.stringify` über kanonische Form.
   - **Wird nie über die Wire geschickt.** Reiner Client-Side-Change-Detector.

2. **Zwei neue State-Variablen** in `ProjectsDeepDive`:
   - `lastValidatedFingerprint: string | null` — Snapshot der genau validierten Payload.
   - `lastValidatedStepCount: number | null` — Schrittzahl der validierten Payload (für genaues Banner).

3. **`currentPlanFingerprint`** als `useMemo` — recomputed nur bei Änderung von `projectId`/`projektZiel`/`planSteps`.

4. **`isPlanStaleAgainstValidate`** als derived bool — `true` gdw. ein validierter Snapshot existiert und der aktuelle Fingerprint ungleich ist.

5. **Invalidation-Effekt** (neu): Wenn `isPlanStaleAgainstValidate` `true` wird:
   - laufende `handleApiPreview` / `handleApiValidate` werden via AbortController abgebrochen
   - `apiPreviewData`, `apiPreviewError`, `apiValidateData`, `apiValidateError`, `commitData`, `commitError` werden `null` gesetzt
   - `lastValidatedFingerprint` und `lastValidatedStepCount` werden zurückgesetzt
   → `techCheckStatus` fällt zurück auf `'idle'`, UI zeigt nicht mehr „7 Quests bereit".

6. **`handleApiValidate` Success-Pfad** (modifiziert):
   - **Vor** dem `await fetchPlanValidate(...)` wird `sentFingerprint = computePlanFingerprint(...)` aus dem genauen abgesendeten Payload gesnappt.
   - Auch `sentStepCount = wireSteps.length` wird festgehalten.
   - Nach erfolgreichem Response: `setLastValidatedFingerprint(sentFingerprint)` und `setLastValidatedStepCount(sentStepCount)`.
   - Race-sicher: Wenn der Operator während des Round-Trips den Plan ändert, liefert der Snapshot weiterhin die geschickte Version. Die invalidation-useEffect entfernt dann unmittelbar nach `setApiValidateData` wieder die Daten, weil der Fingerprint nicht mehr passt.

7. **`handleApiCommit`** (modifiziert): **Synchroner Stale-Guard vor dem Network-Call**:
   - Recomputed den Fingerprint aus dem aktuellen `(projectId, projektZiel, planSteps)`.
   - Wenn `lastValidatedFingerprint` existiert und ungleich → `setCommitError({ errorCode: 'client_plan_stale', errorMessage: 'Plan wurde lokal geändert. Bitte erneut „Technisch prüfen" laufen lassen, bevor du committest.' })` und Return.
   - Zusätzlicher Step-Count-Cross-Check (`lastValidatedStepCount !== planSteps.length`) als zweite Schicht.
   - Damit kommt nie mehr ein server-side `409 plan_digest_mismatch` zum Operator durch — die Frontend-Message ist menschenlesbar.

### UI-Konsequenzen

- **Tech-Check-Banner** wird rose-farbig und sagt „Plan wurde geändert — erneute Prüfung nötig", sobald `isPlanStale` true ist. Vorher war es noch grün und behauptete „Bereit für Notion-Erzeugung".
- **Tech-Check-Summary** zeigt im Stale-Fall: „Letzte Prüfung: X Quests · lokal jetzt: Y" anstatt „X Quests bereit · Digest …".
- **Commit-Button**:
  - Render-Gate: `techCheckStatus === 'ready' && !isPlanStale`. Bei Stale verschwindet der Commit-Button komplett.
  - An seiner Stelle erscheint ein **„Erneut technisch prüfen"**-Button, der `handleApiPreview()` (mit Auto-Chain auf Validate) feuert.
- **Smoke-Warnbanner** (vorhandene amber-Box „n Quests erzeugen"): zeigt jetzt nur, wenn `!isPlanStale`; sonst dominiert die Stale-Box.
- **Dedizierte Stale-Box** über dem Button: „Plan wurde lokal geändert (validiert: 7, lokal jetzt: 1). Vor dem Commit bitte erneut „Technisch prüfen" laufen lassen." mit Inline-„Jetzt erneut prüfen"-Link.
- **Step-Badge oben** (`stepCount={planSteps.length}`) zeigt immer den aktuellen lokalen Stand — war schon richtig, fällt aber jetzt nicht mehr neben einer widersprüchlichen Tech-Check-Anzeige auf.

### Stateflow-Diagramm (vereinfacht)

```
[planSteps mutiert]
       │
       ▼
[currentPlanFingerprint] ≠ [lastValidatedFingerprint]?
       │ ja
       ▼
[invalidation-Effekt feuert]
       │
       ▼
apiPreviewData = null
apiValidateData = null
commitData = null
lastValidatedFingerprint = null
       │
       ▼
techCheckStatus = 'idle' · isPlanStale = false (Snapshot weg)
UI zeigt: „Noch nicht geprüft" + Operator klickt „Erneut technisch prüfen"
       │
       ▼
[handleApiPreview → handleApiValidate]
sentFingerprint gesnappt = current
       │ on success
       ▼
setApiValidateData(...)
setLastValidatedFingerprint(sentFingerprint)
setLastValidatedStepCount(wireSteps.length)
       │
       ▼
techCheckStatus = 'ready' · isPlanStale = false
UI: „Bereit für Notion-Erzeugung", Commit-Button erscheint mit dynamischem Label
```

## Validierung

### Statische Checks

- `npm run lint` → **0 errors, 0 warnings**.
- `npm run typecheck` → 0 Errors in `src/pages/OperatorCockpit.tsx`. Es bleiben die 6 **pre-existing** Excalidraw-Errors in `src/components/skillbook/*` (gleicher Stand wie `origin/main`, nicht durch diesen Fix verursacht — per Stash-Vergleich bestätigt).

### Manuelle Verifikations-Checkliste (Operator)

Nach `npm run dev`, im Cockpit `APP-X` öffnen:

- A) **Default erzeugt 7 Schritte**: Goal eingeben → „Quest-Reihe entwerfen" oder Auto-Chain → Step-Badge zeigt `7 Schritte im Entwurf`, Tech-Check läuft, am Ende grün „Bereit für Notion-Erzeugung", Button-Label „7 Quests erzeugen". ✓ Regressions-frei.
- B) **Auf 1 reduzieren**: im Planner-Modal oder via Smoke-Warnbanner-Link „auf 1 Smoke-Quest reduzieren" klicken.
- C) **Hauptscreen 1 Schritt im Entwurf**: Step-Badge wechselt auf `1 Schritt im Entwurf`, Tech-Check-Banner wechselt sofort auf rose: „Plan wurde geändert — erneute Prüfung nötig".
- D) **Erneut prüfen**: „Jetzt erneut prüfen"-Link oder „Erneut technisch prüfen"-Button klicken → Preview+Validate laufen mit 1-Step-Payload → grün, „1 Quest bereit · Digest XXXX".
- E) **Commit-Payload enthält 1 Step**: Klick auf „1 Quest erzeugen" → Network-Tab zeigt POST `/plan/commit` mit `planSteps: [1 Eintrag]` und `planDigest` = der eben validierte Digest.
- F) **Kein digest mismatch bei unverändertem Plan**: Schritte B–E ohne weitere Edits → Commit-Response sollte `committed` oder `writes_locked`/`duplicate_risk` sein, **kein** `plan_digest_mismatch`.
- G) **Nach Änderung wird Commit deaktiviert**: nach E plus Schritt-Edit (z.B. Title ändern) → Stale-Banner erscheint, Commit-Button verschwindet, „Erneut technisch prüfen" steht stattdessen.

### Automatischer Belt-And-Suspenders im Code

- Synchroner `handleApiCommit`-Guard: `client_plan_stale` + `client_plan_step_count_mismatch` Error-Codes verhindern Network-Calls mit inkonsistenten Payloads.
- `useEffect` auf Staleness-Flag canceled in-flight Aborts und löscht Caches.
- Snapshot **vor** await im Validate-Handler eliminiert Mid-Request-Mutation-Races.

## Rest-Risiken

- **Audit-Persistenz fehlt weiterhin** — In-Memory-Ring beim Backend resetet bei Cold-Start. Nicht im Scope dieses Fixes. Bleibt als Folge-Quest „Phase 2D-Plus Audit-Persistenz" stehen.
- **Server-Digest ist FNV-1a**, nicht kryptographisch — auch nicht im Scope. Mein Client-Fingerprint matcht semantisch (Trim + Renumber), ist aber bewusst ein anderer String als der Server-Digest. Beides ist sicher, weil der echte Server-Digest am Ende immer noch recomputed wird (Gate 7) und der Client-Fingerprint nur als interner Change-Detector dient.
- **Smoke-Spezialregel `PHASE-2E-SMOKE` Prefix → max 1 Quest** wurde NICHT implementiert (per Spec-Hinweis als „optional, sonst TODO"). Wäre invasiv:
  - Müsste sich an mehreren Stellen einklinken (Commit-Guard, Validate-Banner, evtl. Planner-Modal).
  - Würde Operatoren mit absichtlich mehrteiligen Smoke-Plänen (z.B. „PHASE-2E-SMOKE Reihe mit Health-Check und Lockdown") blockieren.
  - **TODO** dokumentiert: Falls gewünscht, in eigener Folge-Quest implementieren. Empfehlung: Soft-Check als Warnbanner statt Hard-Block, oder per `localStorage`-Override deaktivierbar.
- **`vormerkenAlsPlanOutput()`** schreibt den Plan-Text in `outputs[]` und einen Milestone. Macht aber **keinen** Tech-Check und löst auch nicht den Stale-Effekt aus, weil es `planSteps` selbst nicht ändert. Das ist korrekt: „Plan-Output vormerken" ist eine *Snapshot-Aktion*, kein State-Change. Operator-Verhalten bleibt unverändert.
- **Race: zwei Browser-Tabs**: Wenn Operator in Tab A Plan ändert, in Tab B Commit klickt, ist Tab B's Fingerprint trotzdem konsistent zu Tab B's State. Die `localStorage`-Synchronisation feuert auf Tab B's nächstem Lese-Zyklus und löst dann denselben Stale-Effekt aus. Gleiche Sicherheit. Aber: vor dem Localstorage-Re-Read kann Tab B noch eine Sekunde lang einen alten Snapshot zeigen. Notion-Idempotenz-Gate fängt's serverseitig auf jeden Fall ab.

## Anleitung für Operator-Smoke nach Fix

1. `npm run dev` lokal starten und Cockpit öffnen, oder Production-Deploy abwarten (separate Operator-Entscheidung).
2. Projekt `TEST_PLAN_COMMIT` wählen (nicht `APP-X` — separates Smoke-Projekt aus `docs/project-auto-planner-phase-2e-notion-write-smoke.md`).
3. Goal eingeben:
   ```
   PHASE-2E-SMOKE-TEST: Erzeuge genau eine isolierte Test-Quest zur Verifikation der Notion-Write-Pipeline. Nach Test sofort Lockdown.
   ```
4. „Quest-Reihe entwerfen" → Default-Plan landet mit 7 Schritten → Tech-Check feuert auto → grün „7 Quests bereit".
5. Im Smoke-Warnbanner unter dem Tech-Check-Status: Link „auf 1 Smoke-Quest reduzieren" klicken.
6. Tech-Check-Banner wechselt **sofort** auf rose „Plan wurde geändert — erneute Prüfung nötig (validiert: 7, lokal jetzt: 1)".
7. Inline-Link „Jetzt erneut prüfen" klicken (oder Button „Erneut technisch prüfen").
8. Preview+Validate laufen mit 1-Step-Payload → grün „1 Quest bereit · Digest YYYY".
9. Button-Label zeigt jetzt **„1 Quest erzeugen"**. Smoke-Warnbanner ist weg (Count < 2).
10. Voraussetzungen aus dem Phase-2E-Runbook abhaken (Vercel-Env: `NOX_NOTION_WRITE_ENABLED=true`, `NOX_NOTION_WRITE_TOKEN`, `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE=true`; Notion-Properties + `TEST_PLAN_COMMIT`-Projekt-Zeile vorhanden).
11. Auf Operator-Go: „1 Quest erzeugen" klicken.
12. Erwartete Response: `code: "committed", notionWritesExecuted: true, pageResults: [{ ok: true, notionPageId: "…" }]`.
13. Sofort danach denselben Plan erneut „1 Quest erzeugen" → `code: "duplicate_risk", notionWritesExecuted: false`. ✓ Idempotenz verifiziert.
14. **Lockdown** wie im Phase-2E-Runbook beschrieben: Flags weg, Re-Deploy, 423 / 401 verifiziert.
15. Smoke abgeschlossen → Status in der Phase-2E-Notion-Quest <https://www.notion.so/36309df6e88e8174b393c8180c3dd61d> aktualisieren.

Abschlussmarker: `PROJECT_AUTO_PLANNER_STATEFLOW_DIGEST_FIX_READY`
