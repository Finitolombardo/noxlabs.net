# Project Auto Planner — One-Button Operator Flow

> Stand: 2026-05-20 · Branch: `docs/phase-2e-runbook`
> Bearbeiter: Claude (operative zweite rechte Hand)
> Scope: **Operator-UX-Vereinfachung im Project Auto Planner.** Keine Backend-/API-Contract-Änderung, keine Notion-Writes, kein Vercel, kein n8n, kein Dispatcher, kein Stash pop, keine Chatpanel-Arbeit, kein Commit/Push ohne Operator-Go.

Abschlussmarker: `PROJECT_AUTO_PLANNER_ONE_BUTTON_OPERATOR_FLOW_READY`

---

## Problem mit dem Modal-/Mehrbutton-Flow

Der Phase-2E-Smoke hat gezeigt, dass das Backend inzwischen sauber arbeitet — aber die Operator-UX im Frontend zu viele Schritte verlangt:

1. **„Technisch prüfen"-Modal**: Klick öffnete ein großes Modal mit Preview-Mutationen, Schema-Checks, Diff-Listen. Diagnostic-Inhalt, aber als primärer Flow-Punkt verwirrend. Nach dem Schließen war für den Operator nicht sofort klar, ob die Prüfung erfolgreich war.
2. **Mehrere überlappende Buttons**: „Technisch prüfen" (öffnet Modal), „Technische Details" (öffnet *dasselbe* Modal), „Quests erzeugen", „Erneut technisch prüfen" — funktional doppelt, mental anstrengend.
3. **Zwei-Klick-Smoke**: Operator musste erst „Technisch prüfen" → Modal schließen → schauen, dass „Bereit" steht → „1 Quest erzeugen" klicken. Zwei Klicks für eine konzeptuell einzelne Aktion.
4. **„Zurückfallen auf 'Noch nicht geprüft'"**: Wenn die Modal-Tabs unklar waren oder kurzfristig State-Zwischenstände sichtbar waren, hatte der Operator den Eindruck, die Prüfung sei verloren.

## Neuer Operator-Flow

### Primäre Aktionsleiste (sichtbar, oben in der Planner-Card)

| Button | Aktion | Status |
|---|---|---|
| **Quest-Reihe entwerfen** (gold) | Regeneriert den Default-Plan und öffnet das Planner-Modal zum Editieren. | Unverändert. |
| **Nur prüfen** (ghost) | Führt Preview + Validate **inline** aus. Kein Modal. Status erscheint im Banner. | **Neu.** |
| **Technische Details** (ghost) | Öffnet das Diagnose-Modal mit Mutations-Tabelle, Schema-Checks, etc. Pure Read-Only-Sicht. | Unverändert (Modal). |
| **Zurücksetzen** (ghost) | Setzt Projektziel und Quest-Reihe zurück. | Unverändert. |

### Sekundäre Affordances (kleiner, opacity-reduziert)

- „Mit NOX besprechen (Demo)" — bleibt verfügbar, aber visuell deprioritisiert.
- „Outputs ansehen" — bleibt verfügbar, sekundär.
- Bestehende Diagnose-Buttons (Projektkontext-Audit, Output anlegen, Lokalen Entwurf löschen) sind unverändert in der secondary-Reihe.

### Tech-Check-Banner mit einer kombinierten CTA

Der Banner zeigt weiterhin den aktuellen Status (idle / running / ready / not-ready / stale / auth-blocked / error). **Neu**: rechts daneben sitzt **eine** Primär-CTA, die ihren Text adaptiv ändert:

| Zustand | CTA-Label | Verhalten beim Klick |
|---|---|---|
| Validate noch nicht gelaufen oder stale | **„Prüfen & 1 Quest erzeugen"** / **„Prüfen & 7 Quests erzeugen"** | Sequenziell Preview → Validate → Commit. Commit nur wenn Validate erfolgreich und Plan nicht stale. |
| Validate frisch grün | **„1 Quest erzeugen"** / **„7 Quests erzeugen"** | Direkt Commit. |
| Chain läuft (Preview/Validate/Commit-Loading oder Sentinel armed) | **„Läuft …"** (disabled) | – |
| Smoke-Marker im Plan + > 1 Step | Button disabled mit Tooltip + sichtbarer roter Hinweisbox | Commit blockiert (Smoke-Safety, siehe unten). |

Außerdem: **„Technische Details"** als kleiner Ghost-Button rechts der CTA, damit der Operator bei Bedarf das Diagnose-Modal öffnen kann — aber nicht muss.

## Welche Safety-Gates erhalten bleiben

**Keiner der Server-seitigen Gates wird angefasst.** Der neue Flow ist eine reine Frontend-Sequenz-Helper auf den existierenden Endpoints:

- **Preview-Gate** (Phase 2A): unverändert, weiterhin `/api/operator/projects/:projectId/plan/preview` mit Echo + Digest.
- **Validate-Gate** (Phase 2B): unverändert, weiterhin Notion-Schema-Read + Allowlist-Check.
- **Digest-Gate** (Phase 2C-Pre, Gate 7): server-seitig recomputed. Mismatch → 409 — unverändert.
- **Schema-Recheck-Gate** (Gate 11): unverändert.
- **Duplicate-Risk-Gate** (Gate 12): unverändert. Bei `duplicate_risk` → 200 ohne Write.
- **Write-Flag-Gate** (`NOX_NOTION_WRITE_ENABLED`): unverändert. `!= "true"` → 423.
- **Private-Write-Mode-Gate** (`NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE`): unverändert.
- **Idempotenz** (`Plan Draft Digest` Filter): unverändert.
- **Stateflow-Digest-Fix** (Commit `4b1387d`): unverändert. Plan-Mutation während Chain invalidiert die Caches; combined-CTA-Watcher prüft `isPlanStaleAgainstValidate` vor dem Commit.
- **Techcheck-Pending-Fix** (Commit `63e9d28`): unverändert. Keine `.abort()`-Aufrufe vom kombinierten Handler — der Watcher wartet auf Settlement statt zu interrumpieren.
- **Commit-500-Diagnostics** (Commit `7d65996`): unverändert. Server-Errors werden weiterhin als sanitised JSON mit `code` + `message` zurückgegeben.

## Wie Preview/Validate/Commit intern sequenziert werden

Neuer Code in `src/pages/OperatorCockpit.tsx`:

### Sentinel-State

```ts
const [pendingCheckAndCommit, setPendingCheckAndCommit] = useState<boolean>(false);
```

### Combined Handler

```ts
async function handleApiCheckAndCommit() {
  setCommitError(null);
  if (planSteps.length === 0) { /* error: client_empty_plan */ return; }
  if (hasSmokeMarker && planSteps.length > 1) { /* error: smoke_safety_block */ return; }
  if (!projektZiel.trim()) { /* error: client_empty_goal */ return; }

  // Fast path: already validated freshly
  if (!isPlanStaleAgainstValidate && apiValidateData?.schemaOk && apiPreviewData) {
    void handleApiCommit();
    return;
  }

  // Slow path: arm sentinel, fire preview (which auto-chains validate)
  setPendingCheckAndCommit(true);
  void handleApiPreview();
}
```

### Watcher useEffect

```ts
useEffect(() => {
  if (!pendingCheckAndCommit) return;
  if (apiPreviewLoading || apiValidateLoading) return; // wait for settlement
  setPendingCheckAndCommit(false); // always disarm once settled
  if (apiPreviewError || apiValidateError) return; // surface error, no commit
  if (apiValidateData?.schemaOk && apiPreviewData && !isPlanStaleAgainstValidate) {
    void handleApiCommit();
  }
}, [pendingCheckAndCommit, apiPreviewLoading, apiValidateLoading, ...]);
```

### Race-Safety

- **Plan-Mutation während Chain**: Stateflow-Digest-Fix-Invalidation feuert, `apiValidateData` wird gecleart, `isPlanStaleAgainstValidate` ist true → Watcher committed nicht. Operator sieht stale-Banner und klickt den Combined-CTA erneut, der dann frisch validiert.
- **Sentinel-Stuck-Verhinderung**: Watcher disarmt das Sentinel IMMER nach Settlement (auch bei Error). Kein „bleibt für immer pending"-Pfad.
- **Doppel-Klick auf Combined-CTA**: zweites `handleApiCheckAndCommit()` bricht den vorherigen Preview-Request ab (existing AbortController-Logik in `handleApiPreview`), startet neuen Chain. Sentinel bleibt armed. Watcher feuert beim finalen Settlement.

### Smoke-Safety

```ts
const hasSmokeMarker = useMemo(() => {
  const re = /phase\W*2e\W*smoke/i;
  return re.test(projektZiel) || planSteps.some((s) => re.test(s.title));
}, [projektZiel, planSteps]);
```

Plus im Combined-Handler:
```ts
if (hasSmokeMarker && planSteps.length > 1) {
  setCommitError({
    status: 0,
    errorCode: 'smoke_safety_block',
    errorMessage: `Smoke-Test darf nur 1 Quest erzeugen. Plan hat ${planSteps.length} Schritte — zuerst auf 1 Quest reduzieren.`,
  });
  return;
}
```

UI rendert zusätzlich eine sichtbare rote Hinweisbox unter dem Tech-Check-Banner solange diese Bedingung gilt, mit Inline-Link „auf 1 Smoke-Quest reduzieren" (existing `onReduceToOne`).

## Status-Persistenz (kein Rückfall auf „Noch nicht geprüft")

Die existing `apiValidateData`-State + `lastValidatedFingerprint`-Snapshot bleiben unverändert. Nach erfolgreicher Validate-Antwort persistiert der State so lange, bis:

- Operator den Plan mutiert (Step löschen, editieren, reduzieren) → Stateflow-Digest-Fix-Invalidation cleart und setzt Banner auf „Plan wurde geändert — bitte erneut technisch prüfen".
- Operator „Quest-Reihe entwerfen" oder „Zurücksetzen" klickt → Plan-Regenerate → neue Fingerprint → Invalidation.
- Project-Wechsel.

**Kein Modal-Schließen** triggert mehr eine State-Invalidation. Der Banner zeigt korrekt „Bereit für Notion-Erzeugung · 1 Quest bereit · Digest XYZ" bis der Operator etwas Dramatisches macht.

## Geänderte Dateien

- `src/pages/OperatorCockpit.tsx` — Combined-Handler, Watcher-Effect, Smoke-Memo, neue Props an `UnifiedAutoPlanner`, Tech-Check-Banner-CTA umgebaut, Bottom-Action-Row reorganisiert, `commitMessage` um smoke-/client-error-Codes erweitert.

**Nicht geändert**: `api/`-Pfad, `vercel.json`, `.env*`, alle anderen Frontend-Komponenten (`projectPlannerClient.ts` unverändert), Modal-Inhalte (`apiPreview`-Modal-Struktur bleibt für „Technische Details"-Diagnose unverändert).

## Manuelle Testcheckliste

Operator (`npm run dev` oder Production nach Deploy):

| # | Schritt | Erwartete UI |
|---|---|---|
| A | Goal eintragen, „Quest-Reihe entwerfen" → 1-Step-Plan-Setup via „auf 1 Smoke-Quest reduzieren" | Hauptscreen: „1 Schritt im Entwurf", Stale-Banner „Plan wurde geändert — bitte erneut technisch prüfen". |
| B | Hauptscreen-Status vor Klick | Tech-Check-Banner zeigt „Plan wurde geändert — bitte erneut technisch prüfen" (oder „Noch nicht geprüft" wenn keine vorherige Validation). |
| C | Klick auf **„Prüfen & 1 Quest erzeugen"** | Banner kurzzeitig cyan „Prüfung läuft …" + CTA-Label „Läuft …" (disabled). Es öffnet sich **kein** Modal. |
| D | Während Chain | Status bleibt „Prüfung läuft …" bis Validate fertig + Commit feuert. |
| E | Validate OK → Commit feuert | Commit-Banner erscheint: cyan „Commit läuft …". |
| F | Bei Commit-Fehler (z.B. `notion_create_failed`) | Roter Fehler-Banner mit `code: message` (z.B. „notion_create_failed: Notion konnte 1 Page nicht erstellen (object_not_found: …)"). |
| G | Bei Commit OK | Grüner Banner „Quests erzeugt: 1". Combined-CTA wechselt auf „1 Quest erzeugen" (idempotenter Re-Run möglich → `duplicate_risk`). |
| H | „Technische Details" klicken | Diagnose-Modal öffnet sich mit Preview-Mutationen, Schema-Checks. Read-only. Schließen ändert nichts am State. |
| I | Bei reinem „Nur prüfen"-Klick | Preview + Validate laufen inline, Modal öffnet sich **NICHT**. Banner zeigt Ergebnis. |
| J | Plan mit 7 Steps + Smoke-Goal („PHASE-2E-SMOKE …") | Rote Hinweisbox „Smoke-Test darf nur 1 Quest erzeugen. Plan hat 7 Schritte. [auf 1 Smoke-Quest reduzieren]". Combined-CTA disabled mit gleichem Tooltip. Klick → Fehler `smoke_safety_block`. |
| K | Nach erfolgreicher Prüfung (grün) → Modal öffnen → schließen | Kein Rückfall auf „Noch nicht geprüft". Status bleibt grün. |

## Validierung

- `npm run lint` → 0 errors, 0 warnings ✅
- `npm run typecheck` → 0 Errors in `OperatorCockpit.tsx` ✅
- 6 verbleibende TS-Errors weiterhin **alle pre-existing** in `src/components/skillbook/Skillbook{Canvas,Node}.tsx` (fehlende npm-deps `@excalidraw/excalidraw` und `@xyflow/react`).

## Rest-Risiken

- **Watcher-Effect Race**: wenn der Operator Combined-CTA klickt und im selben Moment den Plan mutiert, fällt der Watcher ins „!isPlanStaleAgainstValidate"-False-Branch und committed nicht. Kein Write — sicher. Operator sieht Stale-Banner und klickt erneut.
- **Smoke-Marker-Regex**: matcht `PHASE-2E-SMOKE`, `phase 2e smoke`, `PHASE2ESMOKE`, etc. False-Positive bei zufälligem ähnlichen Text in projektZiel oder Step-Titel ist möglich, kostet den Operator aber nur einen Extra-Klick (auf 1 reduzieren). Bewusste Wahl: lieber zu sicher als zu offen.
- **Existing-fast-path-Bedingung** muss `lastValidatedFingerprint === currentPlanFingerprint` halten. Das ist via `!isPlanStaleAgainstValidate` abgedeckt — die Derivation ist atomar.
- **Project-Chat-Panel-Quest bleibt geparkt** (`stash@{0}`, `_parked/`). Unangetastet von diesem Fix.
- **Audit-Persistenz**: weiterhin in-memory. Keine Änderung.

## Operator-Retry-Ablauf für Phase-2E-Smoke

1. Projekt `TEST_PLAN_COMMIT` wählen.
2. Goal eintragen mit `PHASE-2E-SMOKE`-Prefix (z.B. `PHASE-2E-SMOKE-TEST: Erzeuge genau eine isolierte Test-Quest …`).
3. „Quest-Reihe entwerfen" → 7-Steps + Auto-Tech-Check.
4. Smoke-Hinweisbox erscheint, weil 7 > 1 mit Smoke-Marker.
5. „auf 1 Smoke-Quest reduzieren" klicken → 1 Step.
6. Tech-Check-Banner zeigt Stale-State.
7. **„Prüfen & 1 Quest erzeugen"** klicken (eine Aktion, nicht zwei).
8. Erwartet:
   - Preview läuft, Validate läuft, Commit läuft (alles in einem CTA-Klick)
   - Bei Erfolg: grün „Quests erzeugt: 1" + Notion-Page-ID im Audit-Log
9. Re-Run: Combined-CTA Label wechselt auf „1 Quest erzeugen" (validiert). Erneut klicken → `duplicate_risk` (HTTP 200, kein Write). Idempotenz bestätigt.
10. Lockdown wie im Phase-2E-Runbook beschrieben.

Abschlussmarker: `PROJECT_AUTO_PLANNER_ONE_BUTTON_OPERATOR_FLOW_READY`
