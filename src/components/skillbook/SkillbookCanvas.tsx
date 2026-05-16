import { useMemo } from 'react';
import {
  Excalidraw,
  convertToExcalidrawElements,
} from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import type { SkillbookPerk } from '../../types/skillbook';
import type { ExcalidrawElementSkeleton } from '@excalidraw/excalidraw/data/transform';

declare global {
  interface Window {
    __skillbookSzene?: { elemente: number; pfeile: number; erwartetePfeile: number };
  }
}

type SkillbookCanvasProps = {
  perks: SkillbookPerk[];
  selectedPerkId: string;
  onSelectPerk: (perkId: string) => void;
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

function pfeilFarbe(von: SkillbookPerk, nach: SkillbookPerk) {
  if (nach.status === 'gesperrt') return '#64748b';
  if (nach.status === 'geplant') return '#60a5fa';
  if (von.status === 'integriert' || von.status === 'bereit') return '#22d3ee';
  return '#a78bfa';
}

function createSzene(perks: SkillbookPerk[]) {
  const byId = new Map(perks.map((perk) => [perk.id, perk]));
  const elementZuPerk = new Map<string, string>();
  const skeleton: ExcalidrawElementSkeleton[] = [];
  let verbindungen = 0;

  for (const perk of perks) {
    const farben = statusFarben(perk.status);
    const boxId = `perk-box-${perk.id}`;
    const textId = `perk-text-${perk.id}`;

    elementZuPerk.set(boxId, perk.id);
    elementZuPerk.set(textId, perk.id);

    skeleton.push({
      type: 'rectangle',
      id: boxId,
      x: perk.position.x,
      y: perk.position.y,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      strokeColor: farben.stroke,
      backgroundColor: farben.fill,
      strokeWidth: perk.auswirkungen.risiko > 55 ? 3 : 2,
      roughness: 1,
      roundness: { type: 3 },
      opacity: perk.status === 'gesperrt' ? 75 : 100,
    });

    skeleton.push({
      type: 'text',
      id: textId,
      x: perk.position.x + 12,
      y: perk.position.y + 10,
      text: `${perk.kapitel}\n${perk.name}\n${perk.status.toUpperCase()}  •  STUFE ${perk.stufe}  •  ${perk.prioritaet}`,
      fontSize: 16,
      strokeColor: farben.text,
      backgroundColor: 'transparent',
      textAlign: 'left',
      verticalAlign: 'top',
      width: CARD_WIDTH - 24,
    });
  }

  for (const perk of perks) {
    for (const voraussetzungId of perk.voraussetzungen) {
      const von = byId.get(voraussetzungId);
      if (!von) continue;
      verbindungen += 1;

      const startX = von.position.x + CARD_WIDTH;
      const startY = von.position.y + CARD_HEIGHT / 2;
      const endX = perk.position.x;
      const endY = perk.position.y + CARD_HEIGHT / 2;

      skeleton.push({
        type: 'arrow',
        id: `perk-edge-${voraussetzungId}-${perk.id}`,
        x: startX,
        y: startY,
        points: [
          [0, 0],
          [endX - startX, endY - startY],
        ],
        strokeColor: pfeilFarbe(von, perk),
        backgroundColor: 'transparent',
        strokeWidth: 2,
        startArrowhead: null,
        endArrowhead: 'arrow',
        opacity: perk.status === 'gesperrt' ? 40 : 100,
        roughness: 1,
      });
    }
  }

  return {
    elementZuPerk,
    verbindungen,
    elements: convertToExcalidrawElements(skeleton, { regenerateIds: false }),
  };
}

export default function SkillbookCanvas({ perks, selectedPerkId, onSelectPerk }: SkillbookCanvasProps) {
  const szene = useMemo(() => createSzene(perks), [perks]);

  const initialData = useMemo(
    () => ({
      elements: szene.elements,
      appState: {
        viewBackgroundColor: '#0b0710',
        gridSize: 20,
      },
    }),
    [szene.elements],
  );

  return (
    <div className="h-[620px] overflow-hidden rounded-3xl border border-[#2f2336] bg-[#0c0610]">
      <Excalidraw
        initialData={initialData}
        theme="dark"
        viewModeEnabled={false}
        gridModeEnabled
        detectScroll
        handleKeyboardGlobally={false}
        UIOptions={{
          canvasActions: {
            clearCanvas: false,
            export: false,
            loadScene: false,
            saveToActiveFile: false,
            saveAsImage: false,
            toggleTheme: false,
            changeViewBackgroundColor: false,
          },
          tools: {
            image: false,
          },
        }}
        onChange={(_elements, appState) => {
          if (typeof window !== 'undefined') {
            const pfeile = _elements.filter((element) => element.type === 'arrow').length;
            window.__skillbookSzene = { elemente: _elements.length, pfeile, erwartetePfeile: szene.verbindungen };
          }
          const ausgewaehlt = Object.keys(appState.selectedElementIds || {}).find((id) => appState.selectedElementIds[id]);
          if (!ausgewaehlt) return;
          const perkId = szene.elementZuPerk.get(ausgewaehlt);
          if (perkId && perkId !== selectedPerkId) onSelectPerk(perkId);
        }}
      />
    </div>
  );
}
