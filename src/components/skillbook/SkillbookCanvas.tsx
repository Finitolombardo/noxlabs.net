import { useEffect, useMemo, useRef } from 'react';
import { Excalidraw, convertToExcalidrawElements } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import type { AppState, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { ExcalidrawElementSkeleton } from '@excalidraw/excalidraw/data/transform';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { SkillbookPerk } from '../../types/skillbook';

export type SketchElement = ExcalidrawElement;

type SkillbookCanvasProps = {
  perks: SkillbookPerk[];
  sketchElements: SketchElement[];
  selectedPerkId: string;
  onSelectPerk: (perkId: string) => void;
  onSelectSkizze: (elementId: string | null) => void;
  onSketchElementsChange: (elements: SketchElement[]) => void;
};

const CARD_WIDTH = 230;
const CARD_HEIGHT = 96;

function statusFarben(status: SkillbookPerk['status']) {
  if (status === 'integriert') return { stroke: '#2dd4bf', fill: '#0a2626', text: '#d1fae5' };
  if (status === 'bereit') return { stroke: '#fbbf24', fill: '#2b1d07', text: '#fde68a' };
  if (status === 'wird-geprueft') return { stroke: '#a78bfa', fill: '#23153d', text: '#ddd6fe' };
  if (status === 'geplant') return { stroke: '#60a5fa', fill: '#0a1b36', text: '#bfdbfe' };
  return { stroke: '#64748b', fill: '#1e293b', text: '#cbd5e1' };
}

function createPerkElements(perks: SkillbookPerk[]) {
  const byId = new Map(perks.map((perk) => [perk.id, perk]));
  const perkElementMap = new Map<string, string>();
  const skeleton: ExcalidrawElementSkeleton[] = [];

  for (const perk of perks) {
    const farben = statusFarben(perk.status);
    const boxId = `perk-box-${perk.id}`;
    const textId = `perk-text-${perk.id}`;

    perkElementMap.set(boxId, perk.id);
    perkElementMap.set(textId, perk.id);

    skeleton.push({
      type: 'rectangle',
      id: boxId,
      x: perk.position.x,
      y: perk.position.y,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      strokeColor: farben.stroke,
      backgroundColor: farben.fill,
      strokeWidth: 2,
      roughness: 1,
      roundness: { type: 3 },
      customData: { perkId: perk.id, elementType: 'perk-node', noxManaged: true },
    } as ExcalidrawElementSkeleton);

    skeleton.push({
      type: 'text',
      id: textId,
      x: perk.position.x + 12,
      y: perk.position.y + 10,
      text: `${perk.kapitel}\n${perk.name}\n${perk.status.toUpperCase()} • STUFE ${perk.stufe}`,
      fontSize: 16,
      strokeColor: farben.text,
      textAlign: 'left',
      verticalAlign: 'top',
      width: CARD_WIDTH - 24,
      customData: { perkId: perk.id, elementType: 'perk-label', noxManaged: true },
    } as ExcalidrawElementSkeleton);
  }

  for (const perk of perks) {
    for (const voraussetzungId of perk.voraussetzungen) {
      const source = byId.get(voraussetzungId);
      if (!source) continue;
      const startX = source.position.x + CARD_WIDTH;
      const startY = source.position.y + CARD_HEIGHT / 2;
      const endX = perk.position.x;
      const endY = perk.position.y + CARD_HEIGHT / 2;

      skeleton.push({
        type: 'arrow',
        id: `perk-edge-${voraussetzungId}-${perk.id}`,
        x: startX,
        y: startY,
        points: [[0, 0], [endX - startX, endY - startY]],
        strokeColor: '#22d3ee',
        backgroundColor: 'transparent',
        strokeWidth: 2,
        endArrowhead: 'arrow',
        customData: { perkId: perk.id, elementType: 'perk-arrow', noxManaged: true },
      } as ExcalidrawElementSkeleton);
    }
  }

  return { elements: convertToExcalidrawElements(skeleton, { regenerateIds: false }), perkElementMap };
}

export default function SkillbookCanvas({ perks, sketchElements, onSketchElementsChange, onSelectPerk, onSelectSkizze }: SkillbookCanvasProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const lastSketchHashRef = useRef('');
  const { elements: perkElements, perkElementMap } = useMemo(() => createPerkElements(perks), [perks]);
  const sceneElements = useMemo(() => [...perkElements, ...sketchElements], [perkElements, sketchElements]);

  useEffect(() => {
    if (!apiRef.current) return;
    apiRef.current.updateScene({ elements: sceneElements, appState: { viewBackgroundColor: '#05030a' } });
  }, [sceneElements]);

  return (
    <div className="h-[620px] overflow-hidden rounded-3xl border border-[#2f2336] bg-[#05030a]">
      <Excalidraw
        excalidrawAPI={(api) => {
          apiRef.current = api;
        }}
        initialData={{ elements: sceneElements, appState: { viewBackgroundColor: '#05030a' } }}
        theme="dark"
        viewModeEnabled={false}
        gridModeEnabled={false}
        detectScroll
        handleKeyboardGlobally={false}
        onChange={(elements: readonly ExcalidrawElement[], appState: AppState) => {
          const sketches = elements.filter((element) => !element.customData?.noxManaged);
          const hash = JSON.stringify(sketches.map((element) => `${element.id}:${element.version}`));
          if (hash !== lastSketchHashRef.current) {
            lastSketchHashRef.current = hash;
            onSketchElementsChange([...sketches]);
          }

          const selectedId = Object.keys(appState.selectedElementIds || {}).find((id) => appState.selectedElementIds[id]);
          if (!selectedId) {
            onSelectSkizze(null);
            return;
          }

          const perkId = perkElementMap.get(selectedId);
          if (perkId) {
            onSelectPerk(perkId);
            onSelectSkizze(null);
          } else {
            onSelectSkizze(selectedId);
          }
        }}
      />
    </div>
  );
}
