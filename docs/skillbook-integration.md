# Skillbook → NOX Canvas Integration im Operator-Cockpit

## Ziel des Moduls
Das sichtbare Modul heißt jetzt **NOX Canvas** (alternativ **Operator Canvas**) und ist in `/operator-cockpit` als interne Sektion eingebunden. Es dient als internes Whiteboard für Systemplanung – Karten, Verbindungen, Fortschritt – und visualisiert Elemente mit ihren Verbindungen, Status und Auswirkungen.

Historie: Das Modul ist als „NOX Skillbook" gestartet. Begrifflich wurde der Schwerpunkt auf Canvas/Whiteboard verschoben, weil die Excalidraw-Integration als operative Zeichenfläche tragend ist. Skillbook-/Perk-/Forschungsbuch-Wortlaut ist aus den sichtbaren UI-Texten entfernt.

## Warum Playground falsch war
Die erste Integration im lokalen Playground lag in einer alten Mission-Control-Struktur und nicht in der aktiven internen NOX-Arbeitsoberfläche. Die operative Zieloberfläche im Vercel-Repo ist die Operator-Cockpit-Route.

## Warum die Root-Seite nicht direkt verändert wurde
Die öffentliche Marketing-Navigation wurde bewusst nicht erweitert. NOX Canvas ist ein internes Kontrollzentrum-Modul und wird nur in der internen Cockpit-Sidebar als Eintrag „Canvas" geführt.

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
