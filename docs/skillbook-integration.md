# Skillbook-Integration im Operator-Cockpit

## Ziel des Moduls
Das NOX Skillbook wurde als interne Sektion in `/operator-cockpit` integriert. Es dient als Forschungsbuch für Systemfähigkeiten, Agenten und Automatisierungen und visualisiert Perks mit Voraussetzungen, Status und Auswirkungen.

## Warum Playground falsch war
Die erste Integration im lokalen Playground lag in einer alten Mission-Control-Struktur und nicht in der aktiven internen NOX-Arbeitsoberfläche. Die operative Zieloberfläche im Vercel-Repo ist die Operator-Cockpit-Route.

## Warum die Root-Seite nicht direkt verändert wurde
Die öffentliche Marketing-Navigation wurde bewusst nicht erweitert. Das Skillbook ist ein internes Kontrollzentrum-Modul und wurde nur in der internen Cockpit-Sidebar eingebunden.

## Warum React Flow statt Excalidraw als Kernengine
React Flow ist datengetrieben, eignet sich direkt für Knoten/Kanten aus Voraussetzungen und unterstützt Zoom, Pan, FitView und Custom Nodes ohne zusätzlichen Umweg. Excalidraw bleibt visuelle Inspiration für den Look, aber nicht technische Basis.

## Excalidraw als visuelle Inspiration
Der Stil orientiert sich an einer dunklen Forschungsbuch-Optik mit weichen Kanten, gedämpftem Glow und klaren Statusfarben.

## Neu / geändert
- `src/pages/OperatorCockpit.tsx`
- `src/components/skillbook/SkillbookPanel.tsx`
- `src/components/skillbook/SkillbookCanvas.tsx`
- `src/components/skillbook/SkillbookNode.tsx`
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
1. Perk-Daten aus interner Quelle read-only laden (statt statischer Demo-Daten).
2. Detailpanel-Aktionen optional an interne Aufgabenpipeline anbinden.
3. Mobile-Feinschliff für sehr kleine Breiten und Detailpanel-Darstellung.

