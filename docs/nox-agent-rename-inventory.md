# NOX Agent Rename Inventory

> Read-only Inventar aller `Andromeda` / `ANDROMEDA` Vorkommen im Repo.
> Stand: 2026-05-17. Quelle: `rg -i "andromeda" docs/ api/ src/ public/`.
>
> **Stufe 1 (visible-text) wurde ausgefuehrt.** Sichtbare UI-Texte, Doku-Prosa
> und Kommentare ohne Contract-Funktion sind in dieser Quest auf `NOX Agent`
> umgestellt. Risiken-Cluster 1–6 (Env-Variablen, Notion-Property-Name,
> API-Contract-Feld `andromedaContext`, Projekt-ID-Literal `'ANDROMEDA'`,
> TS-Typnamen, Dateinamen) bleiben **bewusst unveraendert** und werden ueber
> separate Migrationsquests adressiert. Andromeda ist Altname, NOX Agent ist
> der kanonische Produktname.

## Klassifikations-Schluessel

- **visible-text** = sichtbarer UI-Text, Doku-Prosa, Kommentar, String in API-Response-Body, Label.
- **internal-identifier** = TypeScript-Typname, State-Variable, Funktionsname, env-Variable, JSON-Property-Key, Notion-Property-Name, Projekt-ID-Literal.
- **filename** = Dateiname oder Pfad-String, der auf eine Datei zeigt.

## Empfohlene Aktionen

- **rename to NOX Agent** = kann mit der naechsten naechstbesten Quest mit. Reines String-Replace im sichtbaren Layer.
- **leave + migration-risk** = nicht in dieser Quest anfassen. Bricht entweder TS-Compile, Vercel-Env, API-Vertrag oder Notion-Sync.
- **discuss** = Entscheidung gehoert in Operator-Hand, weil sie Schema-Aenderung in Notion oder externer Vertrag impliziert.

---

## docs/

### docs/project-x-workflow-factory-spec.md

| Datei | Zeile | Typ | Aktion |
|---|---|---|---|
| docs/project-x-workflow-factory-spec.md | 6 | visible-text | rename to NOX Agent |
| docs/project-x-workflow-factory-spec.md | 17 | visible-text | rename to NOX Agent |
| docs/project-x-workflow-factory-spec.md | 162 | visible-text | rename to NOX Agent |
| docs/project-x-workflow-factory-spec.md | 226 | visible-text | rename to NOX Agent |
| docs/project-x-workflow-factory-spec.md | 304 | visible-text | rename to NOX Agent |
| docs/project-x-workflow-factory-spec.md | 709 | visible-text | rename to NOX Agent |
| docs/project-x-workflow-factory-spec.md | 794 | visible-text | rename to NOX Agent |

### docs/operator-cockpit-andromeda-bridge-spec.md

> **Dateiname enthaelt "andromeda".** Umbenennen waere Doku-Move + Link-Update an allen Stellen, die auf `docs/operator-cockpit-andromeda-bridge-spec.md` zeigen (mindestens `src/pages/OperatorCockpit.tsx:2438` und Self-Reference `docs/operator-cockpit-andromeda-bridge-spec.md:1132`). Eigene Migrations-Quest.

| Datei | Zeile | Typ | Aktion |
|---|---|---|---|
| docs/operator-cockpit-andromeda-bridge-spec.md | (filename) | filename | leave + migration-risk |
| docs/operator-cockpit-andromeda-bridge-spec.md | 1 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 5 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 7 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 18 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 28 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 47 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 435 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 445 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 448 | internal-identifier (`ANDROMEDA_DISPATCH_URL`, `ANDROMEDA_HMAC_SECRET`) | leave + migration-risk |
| docs/operator-cockpit-andromeda-bridge-spec.md | 516 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 517 | internal-identifier (`ANDROMEDA_DISPATCH_URL`) | leave + migration-risk |
| docs/operator-cockpit-andromeda-bridge-spec.md | 603 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 614 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 623 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 712 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 721 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 740 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 838 | internal-identifier (`andromedaContext` field name) | leave + migration-risk |
| docs/operator-cockpit-andromeda-bridge-spec.md | 893 | internal-identifier (`andromedaContext` field name) | leave + migration-risk |
| docs/operator-cockpit-andromeda-bridge-spec.md | 928 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 995 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 1100 | visible-text | rename to NOX Agent |
| docs/operator-cockpit-andromeda-bridge-spec.md | 1132 | filename (Selbstreferenz) | leave + migration-risk |
| docs/operator-cockpit-andromeda-bridge-spec.md | 1139 | visible-text | rename to NOX Agent |

---

## api/

### api/_lib/notion.ts

| Datei | Zeile | Typ | Aktion |
|---|---|---|---|
| api/_lib/notion.ts | 376 | internal-identifier (`andromedaContext: string;`) | leave + migration-risk |
| api/_lib/notion.ts | 393 | internal-identifier (`andromedaContext: ...`) + Notion-Property-Name `'Andromeda Kontext'` | discuss |

> Zeile 393 hat zwei Risiken in einer Zeile:
> 1. Lokaler Property-Key `andromedaContext` (TypeScript-Vertrag, geteilt mit `src/types/operatorContext.ts:37` und `api/_lib/types.ts:198`).
> 2. Notion-Property-Lookup-String `'Andromeda Kontext'` — wenn das Property in der Notion `Projects / System Map`-DB umbenannt wird, muss der Lookup hier synchron mit. Operator-Entscheid noetig.

### api/_lib/types.ts

| Datei | Zeile | Typ | Aktion |
|---|---|---|---|
| api/_lib/types.ts | 1 | visible-text (Header-Kommentar) | rename to NOX Agent |
| api/_lib/types.ts | 117 | visible-text (Kommentar) | rename to NOX Agent |
| api/_lib/types.ts | 183 | visible-text (Kommentar) | rename to NOX Agent |
| api/_lib/types.ts | 198 | internal-identifier (`andromedaContext?: string;` im `ProjectContextProject`) | leave + migration-risk |

### api/operator/commands/[id]/[action].ts

| Datei | Zeile | Typ | Aktion |
|---|---|---|---|
| api/operator/commands/[id]/[action].ts | 251 | visible-text (`'Andromeda-Upstream-URL'` in `missingArtifacts`-Array, Teil der API-Response) | rename to NOX Agent |
| api/operator/commands/[id]/[action].ts | 252 | visible-text (`recommendedNextAction`-String) | rename to NOX Agent |

> Diese Strings sind operativer Hinweis-Text im DryRun-Stub. Aenderung ist API-sichtbar (Client koennte darauf parsen), aber dokumentiert kein Vertrag, kein Schema-Bruch. Trotzdem als visible-text behandelt — Operator soll wissen, dass die DryRun-Response sich anders liest.

### api/operator/projects/[projectId]/context.ts

| Datei | Zeile | Typ | Aktion |
|---|---|---|---|
| api/operator/projects/[projectId]/context.ts | 3 | visible-text (Kommentar) | rename to NOX Agent |
| api/operator/projects/[projectId]/context.ts | 29 | visible-text (Kommentar) | rename to NOX Agent |
| api/operator/projects/[projectId]/context.ts | 380 | internal-identifier (`andromedaContext`-Key im Response-Body) | leave + migration-risk |

> Zeile 380 schreibt `andromedaContext` in das Response-JSON. Jede Frontend-Komponente, die das liest (z.B. `src/pages/OperatorCockpit.tsx:1997`), muss synchron umbenannt werden. API-Contract.

---

## src/

### src/types/operatorContext.ts

| Datei | Zeile | Typ | Aktion |
|---|---|---|---|
| src/types/operatorContext.ts | 37 | internal-identifier (`andromedaContext?: string;`, Frontend-Mirror des API-Vertrags) | leave + migration-risk |

### src/pages/OperatorCockpit.tsx

> Mit Abstand die dichteste Datei. Trennt sich grob in vier Schichten:
> 1. TS-Typnamen + State-Variablen (`AndromedaCommandType`, `andromedaCommands`, ...) -> internal-identifier.
> 2. Display-Namen / Owner / Agent-Strings (`'Andromeda'` als String-Wert) -> visible-text.
> 3. Projekt-ID-Literal (`'ANDROMEDA'` als id/code/project-FK) -> discuss (haengt am Notion `Project ID`).
> 4. Doku-/Filename-Referenzen -> filename.

| Datei | Zeile | Typ | Aktion |
|---|---|---|---|
| src/pages/OperatorCockpit.tsx | 89 | internal-identifier (`type AndromedaCommandType`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 97 | internal-identifier (`type AndromedaCommandStatus`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 109 | internal-identifier (`type AndromedaCommand`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 111 | internal-identifier (Typ-Referenz) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 118 | internal-identifier (Typ-Referenz) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 167 | internal-identifier (`id: 'ANDROMEDA'`) | discuss |
| src/pages/OperatorCockpit.tsx | 168 | internal-identifier (`code: 'ANDROMEDA'`) | discuss |
| src/pages/OperatorCockpit.tsx | 169 | visible-text (`name: 'Andromeda'`) | rename to NOX Agent |
| src/pages/OperatorCockpit.tsx | 171 | visible-text (`owner: 'Andromeda'`) | rename to NOX Agent |
| src/pages/OperatorCockpit.tsx | 237 | visible-text (`owner: 'Andromeda'`) | rename to NOX Agent |
| src/pages/OperatorCockpit.tsx | 381 | internal-identifier (`project: 'ANDROMEDA'`, Foreign-Key) | discuss |
| src/pages/OperatorCockpit.tsx | 385 | visible-text (`agent: 'Andromeda'`) | rename to NOX Agent |
| src/pages/OperatorCockpit.tsx | 386 | visible-text (`goal: '...Andromeda strukturiert...'`) | rename to NOX Agent |
| src/pages/OperatorCockpit.tsx | 397 | internal-identifier (`project: 'ANDROMEDA'`) | discuss |
| src/pages/OperatorCockpit.tsx | 401 | visible-text (`agent: 'Andromeda'`) | rename to NOX Agent |
| src/pages/OperatorCockpit.tsx | 483 | internal-identifier (`project: 'ANDROMEDA'`) | discuss |
| src/pages/OperatorCockpit.tsx | 535 | internal-identifier (`initialAndromedaCommands`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 596 | internal-identifier (`project: 'ANDROMEDA'`) | discuss |
| src/pages/OperatorCockpit.tsx | 600 | visible-text (`description: 'Andromeda kann fuer den Backfill...'`) | rename to NOX Agent |
| src/pages/OperatorCockpit.tsx | 685 | visible-text (`agentOptions = ['NOX', 'Andromeda', ...]`) | rename to NOX Agent |
| src/pages/OperatorCockpit.tsx | 795 | internal-identifier (`andromedaCommands`, `setAndromedaCommands`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 887 | internal-identifier (Funktions-Param-Typ) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 888 | internal-identifier (`setAndromedaCommands`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 910 | internal-identifier (Typ-Annotation `AndromedaCommand`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 925 | internal-identifier (`setAndromedaCommands`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 938 | internal-identifier (`andromedaCommands.find`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 958 | internal-identifier (`andromedaCommands.find`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 991 | internal-identifier (`andromedaCommands.find`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 1098 | internal-identifier (Prop `andromedaCommands={...}`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 1174 | internal-identifier (Prop `commands={andromedaCommands}`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 1252 | visible-text (`text="Project-X-Handoffs, Andromeda-Commands..."`) | rename to NOX Agent |
| src/pages/OperatorCockpit.tsx | 1582 | visible-text (`agent: 'Andromeda'`) | rename to NOX Agent |
| src/pages/OperatorCockpit.tsx | 1974 | internal-identifier (`project.andromedaContext` Zugriff) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 1997 | mixed: visible-text label `"Andromeda Kontext"` + internal-identifier `project.andromedaContext` | rename label, leave field access |
| src/pages/OperatorCockpit.tsx | 2131 | internal-identifier (Prop-Typ `AndromedaCommand[]`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 2189 | visible-text (`<SectionTitle eyebrow="Andromeda" ...>`) | rename to NOX Agent |
| src/pages/OperatorCockpit.tsx | 2369 | internal-identifier (Prop-Typ `AndromedaCommand`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 2434 | visible-text (`['Andromeda API', 'Nicht verbunden']`) | rename to NOX Agent |
| src/pages/OperatorCockpit.tsx | 2438 | filename (`'docs/operator-cockpit-andromeda-bridge-spec.md'`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 2445 | visible-text (Hinweis-Prosa "Direkte Browser-Verbindung zu Andromeda...") | rename to NOX Agent |
| src/pages/OperatorCockpit.tsx | 2459 | internal-identifier (Funktions-Param-Typ `AndromedaCommand[]`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 2931 | internal-identifier (Param `andromedaCommands`) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 2943 | internal-identifier (Typ-Annotation) | leave + migration-risk |
| src/pages/OperatorCockpit.tsx | 2959 | internal-identifier (`andromedaCommands.filter`) | leave + migration-risk |

---

## public/

Keine Treffer.

---

## Migrations-Risiko-Cluster

### Cluster 1 — Env-Variablen (Vercel-Production)

- `ANDROMEDA_DISPATCH_URL`
- `ANDROMEDA_HMAC_SECRET`

Heute in `.env.example` nicht aktiv (noch nie gesetzt — Bridge ist Skeleton).
Rename ist trivial _solange noch nichts gesetzt ist_. Sobald Vercel-Env gesetzt
wurde, muss Rename synchron im Vercel-Dashboard erfolgen. Eigene Quest.

### Cluster 2 — Notion-Property-Name `'Andromeda Kontext'`

- `api/_lib/notion.ts:393` liest `propRichText(props, 'Andromeda Kontext')`.
- Property lebt in Notion `Projects / System Map`-DB.
- Rename in Notion alleine bricht den Lookup. Rename im Code alleine ohne
  Notion-Sync bricht den Lookup. Muss atomar koordiniert werden.
- Operator-Entscheid: Notion-Property gleich umbenennen oder beim alten Namen
  belassen? Eigene Quest.

### Cluster 3 — Internes API-Contract-Feld `andromedaContext`

Pfad: Notion-DB-Property -> `api/_lib/notion.ts:393` ->
`api/_lib/types.ts:198` (`ProjectContextProject.andromedaContext`) ->
`api/operator/projects/[projectId]/context.ts:380` (Response-Body-Key) ->
`src/types/operatorContext.ts:37` (Frontend-Mirror) ->
`src/pages/OperatorCockpit.tsx:1974, 1997` (Render).

Vier Stellen, ein Vertrag. Rename muss alle vier synchron in einem Commit
umbenennen, sonst bricht entweder Build oder Frontend-Render. Plus
Cluster-2-Sync mit Notion. Eigene Quest.

### Cluster 4 — Projekt-ID-Literal `'ANDROMEDA'`

`src/pages/OperatorCockpit.tsx:167, 168, 381, 397, 483, 596`.

`'ANDROMEDA'` ist die `projectId` im Demo-State und gleichzeitig die
`code`-Spalte. Wenn das mit der Notion `Project ID`-Spalte (rich_text) in der
Projects-DB uebereinstimmen muss (siehe `BRIDGE-04c`), dann ist Rename
gleichzeitig eine Notion-Daten-Aenderung. Operator-Entscheid: bleibt die
Projekt-ID `ANDROMEDA` oder wird sie `NOX_AGENT` / `NOXAGENT` / `NA`?
Eigene Quest. Hat hoechste Konsequenz im Live-Endpoint
`/api/operator/projects/<projectId>/context`.

### Cluster 5 — TypeScript-Typnamen und State-Variablen

`AndromedaCommand`, `AndromedaCommandType`, `AndromedaCommandStatus`,
`andromedaCommands`, `setAndromedaCommands`, `initialAndromedaCommands`.

Reines TS/React. Rename ist Tool-gestuetzt (IDE oder `tsc`-validierter
Search-Replace). Risiko = Build-Bruch wenn nicht atomar. Kann in eigener
Quest in einem Schritt durch.

### Cluster 6 — Dateinamen

- `docs/operator-cockpit-andromeda-bridge-spec.md` als Datei
- `src/pages/OperatorCockpit.tsx:2438` als String-Link auf diese Datei
- `docs/operator-cockpit-andromeda-bridge-spec.md:1132` Self-Reference

Move + alle Referenzen update. Wenn deploy involviert ist (z.B. relative
Doku-Links in Vercel-Preview), Sichtbarkeit pruefen. Eigene Quest.

---

## Zusammenfassung

- **visible-text:** ueberwiegend Dokumentation, Kommentare, UI-Strings, DryRun-Hinweise. Kann mit der naechsten passenden Quest sicher umbenannt werden.
- **internal-identifier:** TS-Typen, State, env-Vars, API-Property-Keys, Notion-Property-Name. **Nicht** in dieser Quest, weil jede Stelle einen anderen Synchronisations-Partner hat (Notion, Vercel-Env, API-Contract, Frontend-Mirror).
- **filename:** ein Doku-File + zwei Referenzen. Eigene Move-Quest.
- **discuss:** Projekt-ID-Literal `'ANDROMEDA'` und Notion-Property-Name `'Andromeda Kontext'`. Operator-Entscheid, weil Notion-Daten betroffen.
