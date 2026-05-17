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

**Freigaben sind kein eigener Hauptmenüpunkt mehr.** Die `GlobalApprovals`-View bleibt technisch erreichbar (Route `Freigaben`, z.B. ueber die Start-KPI-Kachel), wird aber im Sidebar-Highlight auf `Quest-Zentrale` aliassiert. Freigaben gehoeren konzeptionell in den Projekt-/Quest-Kontext und werden dort als Kontextaktion ausgeloest.

`Projekte` ist der **naechste Hauptpfad** und wird als Hauptanker fuer `NOX Agent / Project Auto Planner` ausgebaut. Project-X selbst bleibt eine Projektzeile innerhalb von `Projekte`, kein separater Top-Level-Eintrag.

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

## Projekte als naechster Hauptpfad

Im Modul `Projekte` werden die Operator-CTAs als Phase-1-Anker für NOX Agent / Project Auto Planner gefuehrt:

- `Mit NOX besprechen` (oeffnet bestehendes Talk-Modal)
- `Projekt in Quests zerlegen` (Phase 1: lokaler Talk-Flow, kein Dispatcher, kein Quest-Start)
- `Freigaben pruefen` (Phase 1: Projekt-Audit, Freigaben bleiben projekt-/quest-bezogene Kontextaktion)
- `Outputs ansehen` (oeffnet bestehendes Output-Modal)

Der Header der Projekt-Aktionen erklaert explizit, dass Projekte der Hauptpfad fuer NOX Agent / Project Auto Planner sind. Phase 1 bleibt rein lokal.

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
