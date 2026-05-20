# Project Auto Planner — Modal Draft Apply Fix

> Stand: 2026-05-20 · Branch: `docs/phase-2e-runbook`
> Bearbeiter: Claude (operative zweite rechte Hand)
> Scope: **Frontend-State-Fix für Modal „Lokaler Quest-Reihen-Entwurf".** Keine Backend-/API-/Notion-/Vercel-/n8n-/Dispatcher-Änderung. Kein Commit/Push ohne Operator-Go.

Abschlussmarker: `PROJECT_AUTO_PLANNER_MODAL_DRAFT_APPLY_FIX_READY`

---

## Fehlerbild

Operator-Beobachtung im Phase-2E-Smoke-Versuch:

1. „Quest-Reihe entwerfen" geklickt → Default-Plan mit 7 Schritten erscheint.
2. Modal „Lokaler Quest-Reihen-Entwurf" öffnet sich.
3. Operator klickt mehrfach „Schritt entfernen", bis nur noch 1 Schritt übrig ist.
4. Operator klickt unten rechts auf **„Als Plan-Output vormerken"**.

**Symptome**:

- Nach jeder Löschung musste Operator manuell den nächsten Schritt anklicken — die Selection sprang auf `null` und das Detail-Panel zeigte den „Klick auf einen Schritt links …"-Hinweis. Workflow zum schnellen Reduzieren war kaputt.
- Nach „Als Plan-Output vormerken" passierte sichtbar wenig. Der Hauptscreen wirkte, als sei der reduzierte 1-Schritt-Plan nicht zuverlässig übernommen worden — die Tech-Check-Anzeige zeigte unter Umständen weiterhin alten Status, und der Operator-Workflow für den Smoke ließ sich nicht sauber auf 1 Quest reduzieren.
- Pluralisierung war „1 Schritte im Entwurf" — grammatisch falsch, optisch verwirrend.
- Falls der Operator den letzten Schritt löschte, blieb das Modal mit einer leeren Tabelle und ohne Erklärung stehen.

## Root Cause

Drei Ursachen, die zusammen den Eindruck „der Plan kommt nicht durch" erzeugen:

### 1. `removeStep`-Selection-Logik (UX-Bug)

Alte Implementierung:

```ts
function removeStep(id: string) {
  setPlanSteps((curr) => curr.filter((s) => s.id !== id).map((s, idx) => ({ ...s, step: idx + 1 })));
  setPlannerSelectedStepId((sel) => (sel === id ? null : sel));
}
```

Sobald der **selektierte** Schritt gelöscht wurde, fiel die Selection auf `null` zurück. Der Operator musste danach erneut in die Tabelle klicken, bevor er den nächsten Schritt löschen konnte. Bei 6 Löschungen → 6× extra Klicks.

### 2. `vormerkenAlsPlanOutput` machte keine defensive Normalisierung (Sub-Bug)

Alte Implementierung schrieb `planSteps` 1:1 in den Output-Draft-Text und schloss das Modal. **Nicht** explizit invalidiert wurde:

- Preview-/Validate-/Commit-Caches (wurden nur über den fingerprint-basierten Stateflow-Digest-Effect indirekt invalidiert)
- `autoTechCheckPending`-Sentinel
- Selection-Konsistenz

In Edge-Cases (sehr schnelle Klicks, leere Schritte, Same-Render-Race) konnte das dazu führen, dass der Operator nach `setModal(null)` noch reststale Tech-Check-Daten oder Inkonsistenzen sah. Auch das Milestone-Log sagte nur „Quest-Reihen-Entwurf vorgemerkt" — ohne die übernommene Anzahl Steps. Operator hatte keine Quittung über den tatsächlichen Stand.

### 3. Modal hatte keinen Empty-State

Wenn `planSteps.length === 0`:

- Die Tabelle war leer.
- Der Detail-Panel sagte „Klick auf einen Schritt links …" — irreführend, es gibt ja keine Schritte.
- „Als Plan-Output vormerken" war weiterhin klickbar und hätte einen leeren Plan-Output erzeugt.

Plus ein kleiner Polish-Punkt: „1 Schritte im Entwurf" statt „1 Schritt im Entwurf" im Hauptscreen-Badge und im Modal-Footer.

## Fix

### Fix A — `removeStep` mit Auto-Selection

```ts
function removeStep(id: string) {
  const removedIdx = planSteps.findIndex((s) => s.id === id);
  if (removedIdx === -1) return;
  const nextSteps = planSteps
    .filter((s) => s.id !== id)
    .map((s, i) => ({ ...s, step: i + 1 }));
  const fallbackId =
    nextSteps.length === 0
      ? null
      : nextSteps[Math.min(removedIdx, nextSteps.length - 1)]?.id ?? null;
  setPlanSteps(nextSteps);
  setPlannerSelectedStepId((sel) => {
    if (nextSteps.length === 0) return null;
    if (sel === id) return fallbackId;
    if (sel === null) return fallbackId;
    return nextSteps.some((s) => s.id === sel) ? sel : fallbackId;
  });
}
```

Logik:
- **Mittlerer Step gelöscht** → Step, der in den Slot nachrutscht, wird selektiert.
- **Letzter Step gelöscht** → neuer letzter Step wird selektiert (Math.min mit `length - 1`).
- **Nicht-selektierter Step gelöscht** → Selection bleibt, sofern noch existent. Sonst Fallback auf den Slot.
- **Letzter Step der Liste gelöscht (Liste leer)** → `null`, Modal-Empty-State kümmert sich um die Anzeige.

Damit kann der Operator „Schritt entfernen" 6× hintereinander klicken ohne dazwischen neu zu selektieren.

### Fix B — `vormerkenAlsPlanOutput` defensiv + explizit

Vier neue Schritte vor dem Output-Eintrag und Modal-Close:

1. **Normalisierung**: Leere/inhaltlich kaputte Schritte werden rausgefiltert (`title.trim().length === 0 && ziel.trim().length === 0`), Order wird auf 1..N renumeriert. Idempotent — bei sauberen Drafts ein No-Op.
2. **Selection-Konsistenz**: `setPlannerSelectedStepId` wird so gesetzt, dass die Selection entweder auf einem existierenden Step bleibt oder auf den ersten verfügbaren fällt.
3. **Explizite Cache-Invalidierung**: `apiPreviewData`, `apiValidateData`, `commitData`, `apiPreviewError`, `apiValidateError`, `commitError`, `lastValidatedFingerprint`, `lastValidatedStepCount` alle auf `null`. Damit triggert der Tech-Check-Banner sofort den „Plan wurde geändert — bitte erneut technisch prüfen"-State.
4. **`autoTechCheckPending = false`**: alter Sentinel wird gelöscht, kein Auto-Fire nach dem Übernehmen.

Außerdem:
- **Visible Feedback**: Milestone-Log-Titel ist jetzt `Entwurf übernommen: 1 Schritt` (singular!) oder `Entwurf übernommen: N Schritte`. Operator sieht die genaue Anzahl im Milestone-Log direkt nach dem Übernehmen.
- **Wir nutzen den normalisierten Plan-Array für den Output-Draft-Text**, nicht das pre-normalisation-State. Garantie, dass Output-Draft und Hauptscreen-Plan synchron sind.
- **Kein `.abort()` auf in-flight Requests**: bewusst weggelassen, weil der Techcheck-Pending-Fix gezeigt hat, dass externer Abort den Stuck-Loading-Bug triggern kann. Stattdessen lässt vormerken laufende Requests durchlaufen — der Stale-Effect oder das Cache-Clearing in handleApiPreview räumt das Resultat sicher auf.

### Fix C — Modal-Empty-State

In der Tabelle:

```tsx
{planSteps.length === 0 ? (
  <tr>
    <td colSpan={4} className="…">
      Keine Quest im Entwurf. Füge mindestens eine Quest hinzu oder generiere den Plan neu.
    </td>
  </tr>
) : null}
```

Beim Footer-Button:

```tsx
<Button
  onClick={vormerkenAlsPlanOutput}
  disabled={planSteps.length === 0}
  title={
    planSteps.length === 0
      ? 'Leerer Entwurf — füge zuerst mindestens eine Quest hinzu oder generiere den Plan neu.'
      : 'Übernimmt den lokalen Quest-Reihen-Entwurf …'
  }
>
  {planSteps.length === 0
    ? 'Als Plan-Output vormerken'
    : `Als Plan-Output vormerken (${planSteps.length} ${planSteps.length === 1 ? 'Schritt' : 'Schritte'})`}
</Button>
```

Damit:
- Operator sieht im Modal sofort, dass der Entwurf leer ist und was zu tun ist.
- Der Apply-Button trägt die exakte Anzahl im Label (z.B. „Als Plan-Output vormerken (1 Schritt)").
- Bei leerem Plan ist der Button disabled und der Tooltip erklärt warum.

### Fix D — Pluralisierung

- Hauptscreen-Badge: `{stepCount} {stepCount === 1 ? 'Schritt' : 'Schritte'} im Entwurf` → korrekt „1 Schritt im Entwurf" / „7 Schritte im Entwurf".
- Modal-Footer-Zeile: gleiche Behandlung.
- Button-Label: gleiche Behandlung.

## Selection-Logik nach Delete (Tabelle)

| Ausgangslage | Aktion | Neue Selection |
|---|---|---|
| 7 Steps, Step 1 selektiert | Step 1 löschen | Neuer Step 1 (was zuvor Step 2 war) |
| 7 Steps, Step 4 selektiert | Step 4 löschen | Neuer Step 4 (was zuvor Step 5 war) |
| 7 Steps, Step 7 selektiert (last) | Step 7 löschen | Neuer Step 6 (jetzt last) |
| 7 Steps, Step 4 selektiert | Step 2 (nicht selektiert) löschen | Step 4 bleibt (Selection identisch, da Step 4 noch existiert) |
| 1 Step, Step 1 selektiert | Step 1 löschen | `null` — Empty-State greift |
| 0 Steps | (n/a — kein Button) | `null` |

## Validierung

### Statische Checks

- `npm run lint` → **0 errors, 0 warnings** ✅
- `npm run typecheck` → **0 OperatorCockpit-Errors** ✅. Es bleiben **6 pre-existing** TS-Errors in `src/components/skillbook/Skillbook{Canvas,Node}.tsx` (fehlende `@excalidraw/excalidraw` und `@xyflow/react` npm-deps). Identisch zu vor diesem Fix.

### Manuelle Verifikations-Checkliste (Operator, `npm run dev`)

| # | Schritt | Erwartete UI |
|---|---|---|
| A | Cockpit öffnen, Projekt wählen, Goal eintragen, „Quest-Reihe entwerfen" klicken | Default-Plan mit 7 Steps erscheint, Auto-Tech-Check landet grün „7 Quests bereit". Badge: „7 Schritte im Entwurf". |
| B | Modal öffnen (über Planner-Card) | Tabelle mit 7 Steps sichtbar, Step 1 (oder der zuletzt selektierte) ist im Detail-Panel. |
| C | Step 1 löschen | Liste hat 6 Steps, der neue Step 1 ist **automatisch** selektiert und im Detail-Panel sichtbar. **Kein extra Klick** nötig. |
| D | „Schritt entfernen" weitere 5× klicken | Jeweils der neue Step 1 ist auto-selektiert. Nach 6 Klicks: **1 Step übrig**, dieser ist selektiert. |
| E | „Als Plan-Output vormerken (1 Schritt)" klicken | Modal schließt sich. Milestone-Log zeigt „Entwurf übernommen: 1 Schritt". Output-Liste hat einen neuen Plan-Eintrag. |
| F | Hauptscreen | Badge: **„1 Schritt im Entwurf"** (singular). |
| G | Techcheck-Banner | Rose: **„Plan wurde geändert — bitte erneut technisch prüfen"**, validiert: 7, lokal jetzt: 1. |
| H | „Erneut technisch prüfen" / „Technisch prüfen" klicken | Banner kurzzeitig cyan „Prüfung läuft …", dann grün. |
| I | Banner-Text grün | **„Bereit für Notion-Erzeugung · 1 Quest bereit · Digest XYZ"**. |
| J | Commit-Button | Label: **„1 Quest erzeugen"** (singular). |
| K | Keine Hängesituation | Banner bleibt **NICHT** auf „Prüfung läuft …" stehen — Techcheck-Pending-Fix aus Commit `63e9d28` greift weiterhin. |

Zusatz-Checks:

- L) Bei leerem Plan: Modal-Tabelle zeigt „Keine Quest im Entwurf. Füge mindestens eine Quest hinzu …". Button „Als Plan-Output vormerken" ist **disabled**.
- M) `addStep` aus dem leeren Plan heraus funktioniert weiterhin.
- N) `regeneratePlan(projektZiel)` aus dem leeren Plan heraus generiert wieder 7 Steps (Default-Verhalten).

## Rest-Risiken

- **Closure-Staleness bei sehr schnellen Klicks**: `removeStep` liest `planSteps` aus dem Closure. Falls der Operator unmenschlich schnell hintereinander klickt (oder Tests programmatisch), könnten zwei Klicks dieselbe Closure-Version sehen. React-Event-Loop batchet aber state updates pro Microtask, und jeder neue Render baut die Closure neu — bei normalen User-Klicks unkritisch.
- **localStorage-Restore**: Der vorhandene Hydration-Effect lädt bei Projekt-Wechsel das gespeicherte Draft. Falls Operator nach dem Smoke-Test das Projekt wechselt und zurückkommt, sollte der 1-Step-Plan wiederhergestellt werden — das auto-save schreibt nach jeder planSteps-Mutation. Verifizierbar über Schritt N: „Plan neu erzeugen" macht den 7-Step-Default sichtbar; das ist beabsichtigt.
- **Audit-Persistenz fehlt weiterhin** — siehe Phase-2E-Runbook. Keine Änderung durch diese Quest.
- **Project-Chat-Panel-Quest weiterhin geparkt** — `stash@{0}` + `_parked/operator-cockpit-project-chat-architecture.md.parked` unangetastet. Diese Quest hat keinen Chatpanel-Code verändert.

## Operator-Retry-Anleitung für Phase-2E-Smoke

Nach diesem Fix sollte der Smoke deterministisch auf 1 Quest reduzierbar sein:

1. Cockpit auf Production (oder lokal `npm run dev`).
2. Projekt `TEST_PLAN_COMMIT` wählen.
3. Goal eintragen:
   ```
   PHASE-2E-SMOKE-TEST: Erzeuge genau eine isolierte Test-Quest zur Verifikation der Notion-Write-Pipeline. Nach Test sofort Lockdown.
   ```
4. „Quest-Reihe entwerfen" klicken → Default 7-Steps + Auto-Tech-Check landet grün.
5. **Variante 1 (Hauptscreen-Pfad)**: Direkt im Hauptscreen unter dem grünen Tech-Check-Banner den Inline-Link „auf 1 Smoke-Quest reduzieren" klicken. → 1 Step, Stale-Banner.
6. **Variante 2 (Modal-Pfad, dieser Fix)**: Planner-Modal öffnen → „Schritt entfernen" 6× klicken (Auto-Selection greift) → unten rechts „Als Plan-Output vormerken (1 Schritt)" klicken. → Modal schließt, Hauptscreen zeigt 1 Step im Entwurf, Stale-Banner.
7. „Erneut technisch prüfen" / „Technisch prüfen" klicken → grün „1 Quest bereit".
8. Vercel-Env-Vars setzen wie im Phase-2E-Runbook beschrieben (`NOX_NOTION_WRITE_ENABLED=true`, `NOX_NOTION_WRITE_TOKEN`, `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE=true`).
9. Re-Deploy abwarten.
10. „1 Quest erzeugen" klicken → erwarteter Response `committed`.
11. Idempotenz-Re-Run → `duplicate_risk`.
12. Lockdown wie im Phase-2E-Runbook beschrieben.

Abschlussmarker: `PROJECT_AUTO_PLANNER_MODAL_DRAFT_APPLY_FIX_READY`
