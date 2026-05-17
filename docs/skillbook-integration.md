# Skillbook → Fähigkeitskarte + Whiteboard Integration im Operator-Cockpit

## Aktuelle Modul-Trennung (Stand: Operator Cockpit Module Separation)

Das ehemalige sichtbare Modul „NOX Canvas" wurde fachlich in **zwei eigenständige Module** aufgeteilt, weil ein freies Zeichenwerkzeug und ein strukturierter Capability-Katalog zwei unterschiedliche Aufgaben sind:

- **NOX Whiteboard** = freies Excalidraw. Skizzen, Systemdenken, Planung. Keine Kopplung an Karten, keine Quest-Erzeugung, kein Detailpanel-Zwang.
- **Fähigkeitskarte** = strukturierter Capability-/Upgrade-Katalog. Zeigt bestehende Fähigkeiten, geplante Verbesserungen, potenzielle Upgrades und ihre Auswirkungen. Aus einer Karte kann ein lokaler **Aufgabenentwurf** abgeleitet werden (Phase 1: keine Quest, keine API, kein Notion-Write).

Der Begriff „NOX Canvas" wird in der UI nicht weiter ausgebaut. Sichtbare Texte zeigen jetzt **„NOX Whiteboard"** bzw. **„Fähigkeitskarte"**. Interne Identifier (Dateinamen `SkillbookCanvas`, `SkillbookPanel`, `customData.perkId`) bleiben unverändert, um Diff-Fläche klein zu halten.

## Sidebar-Struktur

Die Hauptnavigation des Operator-Cockpits folgt:

```
ZENTRALE  → Start | Projekte | Quests
CASHFLOW  → Leads | Pitch-Zentrale
AGENTEN   → Agenten-Chat | Faehigkeiten | Whiteboard | Workflow-Zonen | Intelligence
SYSTEM    → Status | Einstellungen
```

**Freigaben sind kein eigener Hauptmenüpunkt mehr.** Die `GlobalApprovals`-View bleibt technisch erreichbar (Route `Freigaben`, z.B. über die Start-KPI-Kachel), wird aber im Sidebar-Highlight auf `Quest-Zentrale` aliassiert. Freigaben gehören konzeptionell in den Projekt-/Quest-Kontext und werden dort in „Offene Entscheidungen & Blocker" als Kontextaktion ausgelöst.

`Projekte` ist der **Hauptpfad für NOX Agent / Project Auto Planner**. Project-X selbst bleibt eine Projektzeile innerhalb von `Projekte`, kein separater Top-Level-Eintrag.

## Historie

Das Modul ist als „NOX Skillbook" gestartet. Zwischenzeitlich wurde die Excalidraw-Integration zum sichtbaren Anker und das Gesamtmodul als „NOX Canvas" gefuehrt. Die jetzige Trennung in Whiteboard und Faehigkeitskarte loest das Begriffsproblem sauber: das freie Zeichenwerkzeug heisst Whiteboard, der strukturierte Katalog heisst Faehigkeitskarte. „Canvas" tritt nur noch als sichtbar gleicher Eintrag (`Canvas`/`Skillbook`) als Legacy-Alias auf `Faehigkeiten` in `routeAliasForSidebar` auf.

## Whiteboard-Modul

- Titel: **„NOX Whiteboard"**
- Untertitel: „Freies Whiteboard für Skizzen, Systemdenken und Planung."
- Buttons: `Lokal speichern`, `Lokale Änderungen zurücksetzen`, `Vollbild`.
- Excalidraw-Toolbar bleibt sichtbar und unveraendert.
- `Vollbild` blendet das Modul als Overlay ueber das Cockpit (Esc verlaesst).
- **Keine** Buttons fuer `+ Neue Karte`, `+ Verbundene Karte` oder `Aufgabenentwurf erzeugen`.
- **Kein** Detailpanel, **keine** Quest-Erzeugung, **keine** automatische Datenquelle.
- localStorage-Slot: `nox.skillbook.v1.sketchElements` (geteiltes Blob mit der Fähigkeitskarte, kein Migrations-Bruch).

## Fähigkeitskarte-Modul

- Titel: **„Fähigkeitskarte"**
- Untertitel: „Strukturierte Übersicht über NOX-Fähigkeiten, Upgrades und prüfbare Verbesserungen."
- Buttons: `+ Neue Karte`, `Lokal speichern`, `Lokale Änderungen zurücksetzen`.
- Sucheingabe: „Fähigkeit suchen" (Name, Kategorie, Kapitel).
- **Kategorie-Filter** als Chip-Strip:
  Alle · Systemkern · Agentensteuerung · Sicherheit · Lernen & Verbesserung · Automatisierung / n8n · Notion / Wissen · Recherche / News · YouTube / Content · Leadgen / Sales · Trading · UI / Produkt · Kostenoptimierung
  (Filter matcht intern auf `SkillbookKategorie`. Display-Labels duerfen ohne Datenbruch leicht abweichen.)
- Strukturierte Karten-Ansicht (`SkillbookCardView`). **Kein** Canvas-Toggle in der Faehigkeitskarte mehr — die Faehigkeitskarte ist selbst die strukturierte Ansicht.
- Detailpanel rechts: editierbarer Karteninhalt + Auswirkungen-Strip.
- Status-Counter-Strip oben (Integriert, Bereit, Wird geprüft, Geplant, Gesperrt).

## Aufgabenentwurf (lokal, Phase 1)

Aus jeder Karte im Detailpanel ist `Aufgabenentwurf erzeugen` aufrufbar. Klick:
- baut einen lokalen Entwurf mit den Feldern Titel, Kategorie, Quelle `Faehigkeitskarte`, Ziel, Warum relevant?, Nutzen, Risiko, Aufwand, vorgeschlagener Agent (`NOX Agent` / `Claude` / `Codex`), Status `Entwurf`,
- zeigt den Entwurf unter dem Detail-Grid als amber-getöntes Block,
- bietet `Prompt kopieren` (Clipboard) und `Entwurf schliessen`,
- emittet einen Toast: „Aufgabenentwurf lokal vorbereitet – noch nicht gespeichert."

Phase 1 macht **nichts** ausser lokalem State:
- kein API-Call,
- kein Notion-Write,
- kein Backend,
- kein Quest-Starten,
- kein Dispatcher.

## Projekte als Hauptpfad für NOX Agent / Project Auto Planner

Der Projekte-Bereich im Operator Cockpit ist der erste echte NOX-Agent-Hauptpfad. Nach dem Live-Review wurde der obere Bereich gezielt vereinfacht, damit die Projektzentrale wie eine Arbeitsfläche wirkt und nicht wie ein Technik-Dashboard.

### Vereinfachung nach Live-Review

- Technische Pills wie `Notion read-only` und `execute locked` sind aus der sichtbaren Hauptachse entfernt.
- Die große sechsspaltige Identity-Snapshot-Leiste ist durch eine kompakte Arbeitsübersicht ersetzt.
- Der prominente `Live Projektkontext`-Block mit `Auth einblenden` ist als **Erweiterter Kontext** ans Ende der Seite verschoben und standardmäßig eingeklappt.
- Freigaben sind **kein primärer CTA** mehr im Project Auto Planner. Sie wandern in **Offene Entscheidungen & Blocker**.
- Outputs sind als datenbankartige Tabelle dargestellt, nicht mehr als große Marketing-Karten.

### Card-Architektur

1. **Projekt-Zentrale Card (kompakt)** — Eyebrow `Projekt-Zentrale`, Projektname, kleine Projekt-ID, kurze Vision, typografisch gestalteter Projekt-Picker (`Projekt wählen`). Darunter eine zweispaltige Arbeitsübersicht: links großer `Projektfortschritt`-Block (Wert in Prozent, Status, `Phase 1 · Demo`, Fortschrittsbalken, Roh-Sub-Score `x / y Quests erledigt · Outputs · offene Freigaben`), rechts `Nächste Aktion` und `Letzter Meilenstein` als kompakte Kacheln.
2. **Projektziel-Composer** — Phase-1 lokale Eingabe (`Projektziel · Was soll als nächstes entstehen?`). Textarea mit Placeholder, Buttons `Lokalen Plan entwerfen` und `Zurücksetzen`. Klick auf `Lokalen Plan entwerfen` ruft den regelbasierten Generator (siehe unten) auf und öffnet den Planner mit dem frischen Entwurf. Leeres Feld → Demo-Projektziel. Status-Chip: `Lokaler Entwurf · noch nicht erstellt · keine Notion-Speicherung`.
3. **NOX Agent · Project Auto Planner Action-Card** — Phase-1-CTAs:
   - **Mit NOX besprechen** → Talk-Modal (Quest-Draft / Output-Draft / Freigabe vormerken, alles lokal).
   - **Quest-Reihe entwerfen** → Planner-Modal mit editierbarer Tabelle (siehe unten).
   - **Outputs ansehen** → Read-only Output-Liste mit Status, Version, Speicherort. Footer-Button `Neuen Output anlegen` schaltet zum bestehenden Create-Modal.
   - Sekundärleiste: **Projektkontext-Audit** (Health-Check) und **Output anlegen** (Create-Modal).

#### Lokaler Plan-Generator

`generateLocalPlan(goal: string): PlanStep[]` lebt im Modul `OperatorCockpit.tsx`. Reine Funktion, keine KI, keine API, kein Netzwerk:

- Zerlegt das Ziel in einfache Stichwort-Cluster (`lead`, `agent/workflow/n8n`, `content/youtube`, `dropshipping/test`) und färbt damit Schritt 2–5 leicht ein.
- Liefert immer **7 Schritte** mit Feldern `id`, `step`, `title`, `ziel`, `agent`, `output`, `risk` (`Niedrig` / `Mittel` / `Hoch`), `gate`.
- Standard-Reihe: `Ziel klären → Kontext sammeln → Risiken & Blocker prüfen → Quest-Reihe definieren → Agenten zuweisen → Output-Artefakte planen → Review & Freigabe vorbereiten`.
- Bei leerem Ziel wird ein Demo-Projektziel eingesetzt, der Plan bleibt bedienbar.

#### Editierbare Quest-Reihe

Im Planner-Modal sind die Felder eines Schrittes editierbar (Titel, Ziel, Agent, Output, Risiko, Freigabe-Gate). Änderungen werden automatisch in `localStorage` unter dem Key `nox.projectPlanner.localDraft.v1` persistiert (siehe „Lokale Persistenz" unten). Kein Notion-Write, kein Backend. Verfügbare Aktionen:

- **+ Schritt hinzufügen** (Footer unter der Tabelle)
- **Schritt entfernen** (im Detailpanel rechts)
- **▲ / ▼ Reihenfolge** (kleiner Button pro Tabellenzeile)
- **Plan neu erzeugen** (Top-Banner — verwirft Änderungen, erzeugt den Plan aus dem aktuellen Projektziel neu)
- **Entwurf kopieren** (Clipboard mit Projektziel + allen Feldern pro Schritt + Status)
- **Als Plan-Output vormerken** (lokaler `Plan`-Output mit dem Projektziel im Beschreibungstext)
- **Später als Quest erzeugen (Phase 2)** — bewusst deaktiviert

#### Lokale Persistenz

- **Key**: `nox.projectPlanner.localDraft.v1` (versioniert; bei späterem Schemawechsel wird ein neuer Key vergeben, keine Migration).
- **Gespeichert**: `projectId`, `projectGoal`, `planSteps`, `selectedStepId`, `updatedAt` (ISO-Zeitstempel).
- **Scope**: nur der Entwurf des **aktuell gewählten Projekts**. Wechsel auf ein anderes Projekt lädt dessen Entwurf bzw. setzt den Generator-Default ein.
- **Auto-Save**: `useEffect` schreibt nach jeder Änderung an `projektZiel`, `planSteps` oder `plannerSelectedStepId`. Erste Auto-Save-Runde wird unterdrückt, bis die Hydrierung für die aktuelle Projekt-ID abgeschlossen ist, damit der gespeicherte Draft nicht vom Generator-Output überschrieben wird.
- **Hydrierung**: Mount und Projektwechsel lesen `localStorage` defensiv (try/catch, Strukturprüfung auf `PlanStep`-Felder, Risiko-Whitelist). Kaputter JSON-Inhalt wird stillschweigend ignoriert, kein Crash.
- **Restore-Hinweis**: Ein cyan-getöntes Banner „Lokaler Entwurf wiederhergestellt" mit `Stand: …`-Zeitstempel wird in der Composer-Card angezeigt, wenn ein Draft tatsächlich aus `localStorage` gelesen wurde. Banner ist mit `OK` schließbar.
- **Buttons**:
  - `Lokalen Entwurf löschen` — entfernt den Key aus `localStorage`, setzt Zustand auf Generator-Default zurück.
  - `Zurücksetzen` — verwirft nur den aktuellen Composer-State (auto-saved direkt wieder als leerer Entwurf).
  - `Lokalen Plan entwerfen` — schließt das Restore-Banner, regeneriert aus dem aktuellen Projektziel und öffnet das Planner-Modal.
- **Keine Migration**: Versionierter Key + Strukturprüfung machen Migrationsskripte überflüssig. Bei Schemawechsel wird `v1` ignoriert und ein `v2`-Key eingeführt.
- **Keine Cross-Browser-Sync**: rein lokal pro Browser-Profil — kein Notion, kein Backend, kein API-Call.
4. **Offene Entscheidungen & Blocker** — übernimmt die Freigaben-Funktion. Zeigt projektbezogene Blocker plus eine Liste offener Freigaben (Titel, Beschreibung, Risiko, Status, NOX-Agent-Empfehlung) mit drei deaktivierten Phase-2-Buttons (`Freigeben`, `Rückfrage stellen`, `Ablehnen`). Wenn weder Blocker noch Freigaben offen sind: Hinweis „Keine kritischen Blocker. Nächste Aktion weiter ausführbar."
5. **Verknüpfte Quests** — projektbezogen, klickbar zum Quest-Detail.
6. **Outputs & Artefakte (Tabelle)** — datenbankartige Tabelle mit Spalten `Typ`, `Titel`, `Version`, `Status`, `Speicherort`, `Projekt`, `Aktionen`. Titel ist klickbar und öffnet ein **Output-Detail-Modal** (Typ, Version, Status, Speicherort, Projekt, Beschreibung). Pro Zeile fünf Aktions-Buttons als lokale Demo-Aktion mit Tooltip „Phase 1: lokale Demo-Aktion. Persistenz folgt später.": `Öffnen`, `Aktualisieren`, `In Google Drive speichern`, `In Notion speichern`, `Herunterladen`. Keine echten Writes, kein Drive, kein Notion, kein realer Download.
7. **Projekt-Meilensteine** — unverändert, projektbezogen.
8. **Erweiterter Kontext (eingeklappt)** — wrappt den bestehenden `LiveProjectContext`-Loader. Aufklappbar; die `Entwickler-Auth`-Eingabe (API Key) ist nur als Entwicklerhinweis sichtbar und nicht mehr Teil der Hauptachse.

### Phase-1-Hinweis (in jedem neuen Modal)

> „Phase 1: lokaler Entwurf. Echte Quest-Erzeugung erfolgt später über NOX Agent nach Operator-Freigabe."

Keine API-Anbindung, keine Notion-Writes, kein Dispatcher, kein Telegram-Trigger, kein echter Agent-Run, kein Backend. Die Arbeitsübersicht-Leiste und die Action-Card sind reines UI auf lokalem React-State (`outputs`, `approvals`, `quests`, `milestones`), das in dieser Sitzung lebt.

### Begriffsdisziplin im Projekte-Bereich

- **NOX Agent**, nicht „Andromeda" als Produktname (interne TS-Identifier wie `AndromedaCommand` bleiben, siehe `docs/nox-agent-rename-inventory.md`).
- **Projekt-Zentrale** als sichtbarer Bereichstitel.
- **Quest-Reihe entwerfen** statt „Projekt in Quests zerlegen".
- **Freigabe-Gate** als Bezeichnung für den Approval-Schritt; Freigaben selbst leben in **Offene Entscheidungen & Blocker**.
- **Output / Artefakt** für fertige Ablieferungen (Plan, Report, Design, Code-Änderung, Review-Ergebnis).
- **Lokaler Entwurf** macht explizit, dass Phase 1 nur Demo-State ist.
- Skillbook- und Perk-Begriffe gehören ausschließlich in die Fähigkeitskarte, nicht in den Projekte-Bereich.

### Nächste Phasen (nicht in dieser Iteration)

- Phase 2: HMAC-gesicherter Backend-Proxy + Operator-Approval-Flow (siehe `docs/operator-cockpit-andromeda-bridge-spec.md`).
- Phase 2: echte Quest-Erzeugung in Notion Master Tasks nach explizitem Operator-Klick mit Audit-Log.
- Phase 2: NOX Agent übernimmt Lese-Auswertung (Projektkontext, Quest-Reihe, Agentenvorschlag) statt der statischen Demo-Tabelle.
- Phase 3: Read-write-Notion-Token mit Field-Allowlist nach Operator-Freigabe.

## Warum Playground falsch war
Die erste Integration im lokalen Playground lag in einer alten Mission-Control-Struktur und nicht in der aktiven internen NOX-Arbeitsoberfläche. Die operative Zieloberfläche im Vercel-Repo ist die Operator-Cockpit-Route.

## Warum die Root-Seite nicht direkt verändert wurde
Die öffentliche Marketing-Navigation wurde bewusst nicht erweitert. Whiteboard und Fähigkeitskarte sind interne Kontrollzentrum-Module und werden nur in der internen Cockpit-Sidebar gefuehrt.

## Wechsel der Canvas-Engine
Die erste Variante nutzte React Flow. Dabei wurden Knoten sichtbar, die Kanten wurden im laufenden UI-Test jedoch nicht zuverlässig gerendert. Deshalb wurde die Canvas-Engine auf Excalidraw als freie Open-Source-Canvas umgestellt. Excalidraw bleibt der Kern.

## Excalidraw als Zeichenmotor
Excalidraw ist der Zeichenmotor des NOX Canvas. Die Toolbar bleibt bewusst aktiv und unverändert. Der Canvas läuft im dunklen NOX-Look ohne Raster (`gridModeEnabled: false`) mit dunklem Hintergrund. Die volle Excalidraw-Funktionalität (Zeichnen, Auswählen, Verschieben, Fullscreen, Library) ist erhalten.

## NOX-Datenbindung
Die NOX-Datenbindung läuft über `customData.perkId` plus `customData.elementType` (`perk-node`, `perk-label`, `perk-arrow`). Diese internen Schlüssel behalten den Perk-Begriff im Code, damit das Excalidraw-Element-Mapping stabil bleibt. Die UI-Labels sprechen ausschließlich von „Karten" und „Verbindungen".

## Karten-Editor-Funktionen
- Neue Karten werden über NOX-Buttons erzeugt, nicht nur durch freie Zeichnung.
- `+ Neue Karte` erzeugt lokal Karte + Knoten + Label.
- `+ Verbundene Karte` erzeugt automatisch Knoten + Pfeil + Verbindung.
- Skizzen ohne `perkId` (Element ohne Karten-Bindung) können über `Als Karte übernehmen` in echte Karten überführt werden.
- Detailpanel ist editierbar und aktualisiert den Canvas-Text über den lokalen Karten-State.

## Quest-Verknüpfung (Phase 2)
Karten haben optionale Felder, die schon im Type definiert und im Detailpanel angezeigt werden, aber **noch keine Navigation oder API-Anbindung** auslösen:
- `questId`, `questTitle` – verknüpfte Quest (Anzeige)
- `questGroupId` – Quest-Reihe
- `questStatus` – Status der Quest
- `source` – Quelle der Verknüpfung
- `nextStep` – nächster Schritt

Im Detailpanel erscheint ein eigener Block „Quest-Verknüpfung" sobald mindestens eines dieser Felder gesetzt ist. Der Button „Quest öffnen – Phase 2" ist absichtlich deaktiviert. Klick auf eine verknüpfte Quest markiert die Karte nur visuell, navigiert nicht.

Phase 2 wird die Routing-/State-Bindung an die echte Quest-Zentrale liefern. Bis dahin: keine echte Verlinkung, kein Notion-Write, kein API-Call.

## Persistenz
- Aktuelle Persistenz läuft über `localStorage` mit Schlüssel **`nox.skillbook.v1`**. Der Schlüssel bleibt unverändert, um eine Migration im laufenden POC zu vermeiden.
- Spätere Migration auf `nox.canvas.v1` ist möglich, aber erst sinnvoll, wenn Cursor/Codex-Schritte die Migration eindeutig abbilden.
- Aktionen: `Lokal speichern`, `Lokale Änderungen zurücksetzen`.
- Keine API-Anbindung, keine Notion-Writes, keine Backend-Speicherung, keine Remote-Persistenz.

## Vollbild-Modus
Ein interner Vollbildmodus ist vorhanden (Overlay im App-Layout, kein Browser-Zwang). Er bietet große Arbeitsfläche mit aktiver Excalidraw-Toolbar und einklappbarem Rückweg über Button oder `Esc`.

## Sichtbare Begriffe – Mapping
| Alt | Neu |
|---|---|
| NOX Skillbook | NOX Canvas |
| Skillbook | Canvas |
| Forschungsbuch | internes Whiteboard für Systemplanung |
| Forschungsbaum | Canvas |
| Perk | Karte / Element |
| + Neuen Perk | + Neue Karte |
| + Verbundenen Perk | + Verbundene Karte |
| Voraussetzung | Verbindung |
| Nächste Forschung | Nächster Schritt |
| Perk lokal erstellt | Karte lokal erstellt |
| Verbundener Perk erstellt | Verbundene Karte erstellt |
| Dieses Element ist noch kein Perk | Dieses Element ist noch nicht mit einer Karte verbunden |
| Als Perk übernehmen | Als Karte übernehmen |
| Perk-Details | Karten-Details |

Dateinamen und interne Identifier (`SkillbookPanel`, `SkillbookCanvas`, `SkillbookPerk`, `perkId`, `customData.perkId`) bleiben bestehen, um Risiko und Diff-Fläche klein zu halten. Eine spätere Umbenennung kann separat erfolgen.

## Open Design als Referenz, nicht als Implementierung
Der lokale Open-Design-POC (`C:\Users\finit\Scratch\open-design-poc\open-design`) liefert visuelle Referenz-Screens für den Skillbook-/Karten-Look. Der dort erzeugte HTML-Prototyp ist **Designreferenz**, nicht Hauptimplementierung. Übernommen werden nur:
- dunkler Operator-Stil
- warme, lesbare Meta-Texte
- klare rechte Detail-/Operator-Leiste
- Karten-/Verbindungs-/Quest-Referenzen
- keine unlesbar gedimmten Texte
- kein Marketing-Header/Footer im Canvas-Modul

Bewusst **nicht** übernommen:
- keine separate `/skillbook/...`-Marketing-Route
- keine Marketing-Navbar im Canvas-Modul
- kein Website-Footer im Canvas-Modul
- keine direkte Notion-Aktion aus Open Design heraus

## Neu / geändert
- `src/types/skillbook.ts` – optionale Quest-Felder (`questId`, `questTitle`, `questStatus`, `questGroupId`, `source`, `nextStep`)
- `src/components/skillbook/SkillbookPanel.tsx` – sichtbare Begriffe (Header, Buttons, Toasts, View-Toggle, Confirm-Dialog) auf Canvas/Karte
- `src/components/skillbook/SkillbookDetailPanel.tsx` – Begriffe + neuer optionaler Block „Quest-Verknüpfung" mit disabled Phase-2-Button
- `src/pages/OperatorCockpit.tsx` – Sidebar-Eintrag „Canvas" (statt „Skillbook"), Render-Branch akzeptiert beide Routes, Legacy-Alias `Skillbook` → `Canvas`
- `docs/skillbook-integration.md` – diese Datei

## Bewusst nicht gemacht
- Keine API-Anbindung
- Keine Notion-Schreibaktionen
- Kein Deploy
- Kein Push
- Kein Commit
- Keine Änderung an öffentlicher Marketing-Navigation (`Navbar.tsx`)
- Keine Umbenennung der Dateien oder Typen
- Keine Migration des localStorage-Keys

## Nächste Schritte
1. Verbindungs-Modus als eigener Interaktionsmodus (Quelle/Ziel-Klick) – ersetzt freie Voraussetzungs-Pflege.
2. Quest-Routing in Phase 2: realer Klick auf „Quest öffnen" navigiert zu `Quest-Detail` mit gesetzter `questId`.
3. Optionaler localStorage-Key-Wechsel `nox.skillbook.v1` → `nox.canvas.v1` mit Migrationsfunktion.
4. Notion/GitHub-Datenvertrag für read-only Import (kein Write).
5. Konfliktarme Mehrbenutzer-Persistenz statt rein lokalem Zustand.
