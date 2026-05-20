# Operator Cockpit — Local NOX-Demo Chat UX Improvements

> Stand: 2026-05-20 · Branch: `docs/phase-2e-runbook`
> Bearbeiter: Claude (operative zweite rechte Hand)
> Scope: **Nur Frontend-UX.** Keine API, keine Notion-Writes, keine Env-Änderung,
> keine Backend-Logik berührt, keine Phase-2-Commit-Pipeline angerührt.

Abschlussmarker: `OPERATOR_COCKPIT_LOCAL_NOX_CHAT_UX_READY`

---

## Was geändert wurde

Alle Änderungen in einer einzigen Datei: `src/pages/OperatorCockpit.tsx`.

### 1) „Mit NOX besprechen" — ehrlicher gelabelt

- Modal-Titel bleibt „Mit NOX besprechen".
- Subtitle ist jetzt: **„Lokale NOX-Demo · kein echter Agent · kein API-Call · keine Notion-Speicherung"**.
- Eyebrow zeigt **„NOX Agent · LOKALE DEMO"** statt nur „NOX Agent".
- Direkt unter dem Titel rendert eine auffällige **rote Hinweisbox** mit Klartext:
  > Hinweis: Dies ist ein lokaler Demo-Dialog. Antworten sind regelbasiert und entstehen ausschließlich im Browser. Es findet **kein API-Call** statt, es spricht **kein echter Claude-/NOX-Agent** mit, und es wird **nichts in Notion gespeichert**. Drafts „vormerken" legt nur einen lokalen Eintrag in deinem Browser an.
- Sticky-Footer-Banner trägt zusätzlich den Mini-Marker „Lokale Demo · keine Notion-Speicherung".
- Auch die zwei Header-CTAs `Mit NOX besprechen` (in `UnifiedAutoPlanner` und in `QuestDetail`) lauten jetzt **„Mit NOX besprechen (Demo)"** mit Tooltip „Öffnet einen lokalen Demo-Dialog. Kein echter Agent, kein API-Call, keine Notion-Speicherung."

### 2) „Lokale NOX-Antwort generieren" → „Demo-Antwort erzeugen"

- Buttonlabel geändert auf das kürzere ehrliche **„Demo-Antwort erzeugen"**.
- Button ist **disabled**, wenn das Eingabefeld leer ist.
- Tooltip: „Erzeugt regelbasiert eine Demo-Antwort. Kein API-Call, kein echter Agent."
- Antwort-Generator-Logik wurde in eine pure Helper-Funktion `generateDemoAnswer(input)` extrahiert, damit sowohl der Submit-Button als auch Enter-zum-Senden dieselbe Pipeline benutzen. Inhaltlich identisch zu vorher, aber statt „Lokaler Vorschlag …" jetzt **„Demo-Vorschlag …"** in jedem Branch.
- Der frühere „Antwort verwerfen"-Knopf wurde zu **„Verlauf leeren"** umfunktioniert; löscht den lokalen Demo-Verlauf und die letzte Antwort.

### 3) Chat-Verhalten

- **Enter sendet** (kein Modifier).
- **Shift+Enter** macht Zeilenumbruch.
- Alt/Ctrl/Meta+Enter werden ignoriert (sende-Pfad nicht gestört, falls Browser-Shortcuts).
- **Leere Eingabe** wird ignoriert (kein Demo-Push, Button ist disabled).
- Nach Senden wird das Eingabefeld geleert.
- Demo-Antworten landen direkt in einer **scrollbaren Chat-History** unterhalb des Verlaufs-Headers.
- History ist Differenz-bewusst: User-Bubbles rechts (amber), Demo-Bubbles links (cyan), mit Rolle-Label und `whitespace-pre-wrap` damit Demo-Antworten mehrzeilig lesbar bleiben.
- Empty-State zeigt einen kurzen Hinweis mit `<kbd>Enter</kbd>` / `<kbd>Shift+Enter</kbd>`-Icons.

### 4) Modal / Layout

- Neue Modal-Größe `size="chat"` mit `max-w-[min(1320px, …)]` — breiter als der bisherige `wide`-Modus, damit Plan-Kontext links und Chat rechts gleichzeitig Luft haben.
- Right-Column ist jetzt ein **flex-column** mit Verlauf (`max-h-[42vh]`, scrollbar) + Eingabe.
- Textarea: `rows={6}`, `min-h-[140px]`, **`resize-y`** (vertikal resizebar — die alte `resize-none` ist raus).
- Es gibt **eine** äußere Scroll-Schicht (Modal selbst) und **eine** innere für die Chat-History — keine doppelte Scroll-Falle, weil die Eingabe + Footer-Aktionen außerhalb des Inner-Scrolls liegen.
- **ESC- und Backdrop-Close-Guard**:
  - Modal akzeptiert jetzt `closeGuard?: () => boolean`.
  - Der lokale Demo-Modal setzt `closeGuard={() => !hasUnsavedTalk}` — d. h. solange Eingabe vorhanden ist **oder** History existiert, dismissed Escape/Backdrop-Click nicht.
  - Die expliziten „Schließen"-Buttons im Footer schließen weiterhin direkt — Operator behält die Kontrolle.
  - Backdrop-`onMouseDown` ehrt den Guard ebenfalls.

### 5) Draft-„vormerken"-Buttons

- **„Als Quest-Draft vormerken (lokal)"** — Tooltip: „Speichert diese Idee nur lokal als Quest-Entwurf. Kein Notion-Write."
- **„Als Output-Draft vormerken (lokal)"** — Tooltip: „Speichert diese Idee nur lokal als Output-/Artefakt-Entwurf. Kein Notion-Write."
- Beide bekommen zusätzlich das `(lokal)`-Suffix im Label, damit auch bei deaktivierten Tooltips klar bleibt, dass nichts in Notion landet.

### 6) Smoke-Sicherheit am Commit-Button

- `UnifiedAutoPlanner` bekommt zwei neue Props: `wouldCreateNTasks?: number` und `onReduceToOne?: () => void`.
- Parent (`ProjectsDeepDive`) reicht `apiValidateData?.wouldCreateNTasks ?? planSteps.length` durch — also den **server-verifizierten** Count, mit lokalem Fallback.
- **Buttonlabel wird dynamisch**:
  - `1` → „1 Quest erzeugen"
  - `n>1` → „n Quests erzeugen"
  - kein Count bekannt → Legacy-Label „Quests erzeugen"
  - während Commit → „Commit läuft …"
- **Smoke-Warnbanner**: sobald `techCheckStatus === 'ready'` und `wouldCreateNTasks >= 2`, rendert vor dem Button eine amber-300 Box:
  > Achtung: Dieser Commit würde 7 Quests erzeugen. Für den Smoke-Test bitte zuerst [auf 1 Smoke-Quest reduzieren].
- Der Reducer-Link (`onReduceToOne`) ruft nur **lokales** `setPlanSteps(prev => prev.slice(0, 1).map(s => ({...s, step: 1})))` auf. **Kein** Backend-Call, **kein** Notion-Touch.
- Tooltip am Hauptbutton: konkrete Beschreibung, was passieren würde („Erzeugt n echte Master-Tasks-Quest(s) in Notion. Idempotenz-Check + Schema-Recheck laufen serverseitig.").

### 7) Button-Komponente

- `Button` akzeptiert jetzt optionale `title` und `ariaLabel` Props, die direkt an `<motion.button>` durchgereicht werden. Reine additive Erweiterung — kein bestehender Call-Site bricht.

---

## Was bewusst NICHT geändert wurde

- **Keine Backend-Logik.** `api/operator/projects/[projectId]/plan/commit.ts` und Geschwister blieben unverändert. Idempotenz, Schema-Recheck, Digest-Match laufen wie in 1464c86 implementiert.
- **Keine Anthropic-/Claude-Integration.** Demo-Antwort bleibt regelbasiert.
- **Kein neuer Env-Var.** Nichts in `.env.*`, nichts in `vercel.json`.
- **Keine Notion-Property-Mappings angefasst.**
- **Keine Phase-2E-Commit-Pipeline berührt.** Der Klick auf den Commit-Button geht weiterhin durch die identische `handleApiCommit`-Funktion.
- **Keine Auto-Reduktion.** Das „Auf 1 Smoke-Quest reduzieren" passiert **nur** auf expliziten Klick — es löscht keine Steps automatisch, auch nicht beim Erkennen einer Smoke-Situation.
- **Keine Tracking-Daten.** Demo-Verlauf lebt ausschließlich im React-State; kein `localStorage`, kein `sessionStorage`.

---

## Warum „lokale Demo" jetzt klarer gelabelt ist

Das UI-Versprechen muss zur technischen Realität passen:

- Vor dieser Änderung las sich der Dialog wie ein echter Agent-Chat. Subtitle „Lokaler Gesprächsentwurf · Phase 1" war ehrlich, aber **leise** — leicht zu übersehen, vor allem im ersten Drittel des Bildschirms.
- Die neue rote Hinweisbox ist visuell der **lauteste** Block im Modal. Wer den Dialog öffnet, sieht zuerst diesen Honesty-Banner.
- Sticky-Footer wiederholt den Marker, damit auch nach längerem Scrollen die Demo-Natur sichtbar bleibt.
- Das `(Demo)`-Suffix an den Trigger-Buttons („Mit NOX besprechen (Demo)") wirkt direkt im Hauptscreen — Operator gerät gar nicht erst in falsche Erwartungshaltung.
- Buttonlabel „Demo-Antwort erzeugen" trägt die Wahrheit im Verb.

---

## Welche Risiken beim Quest-Commit sichtbar gemacht wurden

Das große offene Risiko in Phase 2E war: Operator startet aus dem normalen Planungs-Flow heraus einen Commit mit 7 Quests, weil der Button nur „Quests erzeugen" hieß und nicht die Stückzahl anzeigte.

Diese Ebenen verhindern den Unfall jetzt:

1. **Stückzahl im Button-Label** — „7 Quests erzeugen" liest sich anders als „1 Quest erzeugen". Schwerer zu übersehen.
2. **Warnbox vor dem Button**, sobald > 1 Step. Amber-Akzent, signal-Sprache.
3. **Reducer-Affordance** — ein-Klick-Aktion, die das lokale Draft sicher auf 1 Step trimmt. Keine Backend-Aktion. Operator bestätigt den Klick.
4. **Tooltip am Button** beziffert die Stückzahl ein zweites Mal und weist auf Idempotenz-Check + Schema-Recheck hin.
5. **Idempotenz-Gate im Backend** bleibt unverändert — falls trotzdem 7-fach geklickt wird, kommt der zweite Klick als `duplicate_risk` (siehe Phase-2E-Runbook).

Wichtiges Detail: Falls `apiValidateData` (noch) keinen `wouldCreateNTasks` liefert (z.B. weil die Tech-Prüfung noch nicht gelaufen ist), fällt das Frontend auf `planSteps.length` zurück — also wieder die *lokale* Step-Zahl, nicht eine geschätzte Zahl aus der Luft.

---

## Welche späteren echten Agent-Integrationspunkte offen bleiben

Diese Stellen sind bewusst Demo geblieben und sind die natürlichen Andock-Punkte für echten Agent-Code in einer späteren Quest:

- `generateDemoAnswer(input)` — heute eine `if`-Kaskade. Ein-Punkt-Tausch gegen einen echten `POST /api/operator/nox-chat`-Pfad (außerhalb von Phase 2 zu definieren). Solange das nicht steht, bleibt der String-Output mit „Demo-Vorschlag" prefixed.
- `createTalkEntry(kind)` — schreibt heute lokal (Outputs/Approvals state). Naheliegende nächste Quest: optional in Notion-Draft-DB persistieren, hinter eigenem Feature-Flag (`NOX_DRAFT_NOTION_WRITE_ENABLED`).
- „Antwort als Anpassungsnotiz übernehmen" — heute lokales `updateStep`-`setProjektZiel`. Bei echtem Agent wäre der natürliche Schritt, das Feedback in die Quest-Notiz im Master-Tasks `Reason`-Feld zu schreiben — separat von Phase 2C, eigener Trigger.
- Chat-History — derzeit React-State, kein Persistenz-Layer. Falls später „Verlauf wiederherstellen" gewünscht: nicht in `localStorage` blind kippen (Demo-Antworten sehen wie Agent-Antworten aus); wenn Persistenz, dann mit klarem Demo-Marker pro Eintrag.

---

## Validierung

- `npm run lint` → **clean** (kein Output, ESLint passt sauber durch).
- `npm run typecheck` → nur **6 pre-existing** TS-Errors in `src/components/skillbook/Skillbook*.tsx` (fehlende npm-Deps `@excalidraw/excalidraw` + `@xyflow/react`). **Identisch** zu `git stash`-Vergleich auf gleichem Branch ohne meine Änderungen. **Mein Diff verursacht 0 zusätzliche Typecheck-Fehler.**
- Diff-Stat: `+333 / −103` Zeilen in `src/pages/OperatorCockpit.tsx`. Eine Datei berührt.
- Keine Änderung in `api/`, `vercel.json`, `.env*`, oder irgendeinem Schema-File.
- `npm run build` **nicht** ausgeführt — der Vite-Build löst eine 2–3-Minuten-Kette aus und ist hier nicht nötig; Lint+Typecheck decken den Frontend-Code ausreichend ab. Falls gewünscht, vom Operator manuell startbar.

---

## Operator-Schritte ab hier

1. Lokal `npm run dev` starten und das Modal manuell durchklicken:
   - Eingabe → Enter sendet, History-Eintrag erscheint
   - Shift+Enter → Zeilenumbruch
   - Verlauf scrollt, Empty-State korrekt
   - ESC bei leerer Eingabe schließt; bei vorhandener Eingabe nicht
   - Mit Plan > 1 Step: Warnbanner und Reducer-Link sichtbar
   - Reducer-Klick: Plan auf 1 Step reduziert, Button wechselt auf „1 Quest erzeugen"
2. Wenn sauber: Operator entscheidet, ob die Änderung auf `main` cherry-pickt oder als PR (`feat/operator-cockpit-demo-clarity`) gemerged wird. **Kein Commit/Push von Claude.**
3. Phase-2E-Runbook (`docs/project-auto-planner-phase-2e-notion-write-smoke.md`) bleibt unverändert relevant — die UX-Verbesserung hier reduziert das Smoke-Risiko, ersetzt das Runbook aber nicht.

Abschlussmarker: `OPERATOR_COCKPIT_LOCAL_NOX_CHAT_UX_READY`
