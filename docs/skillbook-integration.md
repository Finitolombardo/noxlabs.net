# Skillbook-Integration im Operator-Cockpit

## Ziel des Moduls
Das NOX Skillbook wurde als interne Sektion in `/operator-cockpit` integriert. Es dient als Forschungsbuch für Systemfähigkeiten, Agenten und Automatisierungen und visualisiert Perks mit Voraussetzungen, Status und Auswirkungen.

## Warum Playground falsch war
Die erste Integration im lokalen Playground lag in einer alten Mission-Control-Struktur und nicht in der aktiven internen NOX-Arbeitsoberfläche. Die operative Zieloberfläche im Vercel-Repo ist die Operator-Cockpit-Route.

## Warum die Root-Seite nicht direkt verändert wurde
Die öffentliche Marketing-Navigation wurde bewusst nicht erweitert. Das Skillbook ist ein internes Kontrollzentrum-Modul und wurde nur in der internen Cockpit-Sidebar eingebunden.

## Wechsel der Canvas-Engine
Die erste Skillbook-Variante nutzte React Flow. Dabei wurden Knoten sichtbar, die Kanten wurden im laufenden UI-Test jedoch nicht zuverlässig gerendert. Deshalb wurde der Forschungsbaum auf Excalidraw als freie Open-Source-Canvas umgestellt.

## Excalidraw als Zeichenmotor
Excalidraw ist der Zeichenmotor der Forschungsbaum-Canvas. Die Toolbar bleibt bewusst aktiv. Der Canvas läuft im dunklen NOX-Look ohne Raster (`gridModeEnabled: false`) mit dunklem Hintergrund.

## NOX-Datenbindung
Die NOX-Datenbindung läuft über `customData.perkId` plus `customData.elementType` (`perk-node`, `perk-label`, `perk-arrow`).

## Perk-Editor-Funktionen
- Neue Perks werden über NOX-Buttons erzeugt, nicht nur durch freie Zeichnung.
- `+ Neuen Perk` erzeugt lokal Perk + Knoten + Label.
- `+ Verbundenen Perk` erzeugt automatisch Knoten + Pfeil + Voraussetzung.
- Skizzen ohne `perkId` können über `Als Perk übernehmen` in echte Perks überführt werden.
- Detailpanel ist editierbar und aktualisiert den Canvas-Text über den lokalen Perk-State.

## Persistenz
- Aktuelle Persistenz läuft über `localStorage` mit Schlüssel `nox.skillbook.v1`.
- Aktionen: `Lokal speichern`, `Lokale Änderungen zurücksetzen`.
- Keine API-Anbindung, keine Notion-Writes, keine Backend-Speicherung.

## Vollbild-Modus
Ein interner Vollbildmodus ist vorhanden (Overlay im App-Layout, kein Browser-Zwang). Er bietet große Arbeitsfläche mit aktiver Toolbar und einklappbarem Rückweg über Button oder `Esc`.

## Neu / geändert
- `src/components/skillbook/SkillbookPanel.tsx`
- `src/components/skillbook/SkillbookCanvas.tsx`
- `src/components/skillbook/SkillbookDetailPanel.tsx`
- `src/components/skillbook/SkillbookCardView.tsx`
- `src/data/skillbookData.ts`
- `src/types/skillbook.ts`

## Bewusst nicht gemacht
- Keine API-Anbindung
- Keine Notion-Schreibaktionen
- Kein Deploy
- Kein Push
- Keine Änderung an öffentlicher Marketing-Navigation

## Nächste Schritte
1. Voraussetzung-Verbinder als eigener Interaktionsmodus (Quelle/Ziel-Klick).
2. Notion/GitHub-Datenvertrag für read-only Import und späteren Freigabefluss.
3. Konfliktarme Mehrbenutzer-Persistenz statt rein lokalem Zustand.
