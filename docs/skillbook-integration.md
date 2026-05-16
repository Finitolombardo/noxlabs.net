# Skillbook-Integration im Operator-Cockpit

## Ziel des Moduls
Das NOX Skillbook wurde als interne Sektion in `/operator-cockpit` integriert. Es dient als Forschungsbuch für Systemfähigkeiten, Agenten und Automatisierungen und visualisiert Perks mit Voraussetzungen, Status und Auswirkungen.

## Warum Playground falsch war
Die erste Integration im lokalen Playground lag in einer alten Mission-Control-Struktur und nicht in der aktiven internen NOX-Arbeitsoberfläche. Die operative Zieloberfläche im Vercel-Repo ist die Operator-Cockpit-Route.

## Warum die Root-Seite nicht direkt verändert wurde
Die öffentliche Marketing-Navigation wurde bewusst nicht erweitert. Das Skillbook ist ein internes Kontrollzentrum-Modul und wurde nur in der internen Cockpit-Sidebar eingebunden.

## Wechsel der Canvas-Engine
Die erste Skillbook-Variante nutzte React Flow. Dabei wurden Knoten sichtbar, die Kanten wurden im laufenden UI-Test jedoch nicht zuverlässig gerendert. Deshalb wurde der Forschungsbaum auf Excalidraw als freie Open-Source-Canvas umgestellt.

## Warum Excalidraw als Kernengine
Excalidraw liefert das gewünschte Whiteboard-/Forschungsbuch-Gefühl, unterstützt Zoom und Pan nativ und ermöglicht eine klare Visualisierung von Perk-Karten plus Pfeilen aus den Voraussetzungen. Die Szene wird lokal aus `skillbookData` erzeugt, ohne API oder Persistenz.

## Neu / geändert
- `src/pages/OperatorCockpit.tsx`
- `src/components/skillbook/SkillbookPanel.tsx`
- `src/components/skillbook/SkillbookCanvas.tsx`
- `src/components/skillbook/SkillbookDetailPanel.tsx`
- `src/components/skillbook/SkillbookCardView.tsx`
- `src/data/skillbookData.ts`
- `src/types/skillbook.ts`
- `package.json`
- `package-lock.json`

## Bewusst nicht gemacht
- Keine API-Anbindung
- Keine Notion-Schreibaktionen
- Keine Speicherung der Excalidraw-Szene
- Kein Deploy
- Kein Push
- Keine Änderung an öffentlicher Marketing-Navigation

## Nächste Schritte
1. Perk-Daten aus interner Quelle read-only laden (statt statischer Demo-Daten).
2. Detailpanel-Aktionen optional an interne Aufgabenpipeline anbinden.
3. Mobile-Feinschliff für sehr kleine Breiten und Detailpanel-Darstellung.

