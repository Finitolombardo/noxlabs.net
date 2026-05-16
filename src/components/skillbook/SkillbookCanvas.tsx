import { useMemo } from 'react';
import { Background, Controls, MarkerType, MiniMap, ReactFlow, type Edge, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { SkillbookPerk } from '../../types/skillbook';
import SkillbookNode from './SkillbookNode';

type SkillbookCanvasProps = {
  perks: SkillbookPerk[];
  selectedPerkId: string;
  onSelectPerk: (perkId: string) => void;
};

const nodeTypes = {
  skillbook: SkillbookNode,
} as const;

function createEdges(perks: SkillbookPerk[]): Edge[] {
  const byId = new Map(perks.map((perk) => [perk.id, perk]));

  return perks.flatMap((perk) =>
    perk.voraussetzungen
      .filter((dependencyId) => byId.has(dependencyId))
      .map((dependencyId) => {
        const dependency = byId.get(dependencyId)!;
        const active = dependency.status === 'integriert' || dependency.status === 'bereit';
        const blocked = perk.status === 'gesperrt';

        return {
          id: `${dependencyId}-${perk.id}`,
          source: dependencyId,
          target: perk.id,
          animated: active && !blocked,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          style: {
            strokeWidth: 2,
            stroke: blocked ? '#475569' : active ? '#22d3ee' : '#7c3aed',
            strokeDasharray: perk.status === 'geplant' ? '6 6' : undefined,
            opacity: blocked ? 0.35 : 0.9,
          },
        } satisfies Edge;
      }),
  );
}

export default function SkillbookCanvas({ perks, selectedPerkId, onSelectPerk }: SkillbookCanvasProps) {
  const nodes = useMemo<Node[]>(
    () =>
      perks.map((perk) => ({
        id: perk.id,
        type: 'skillbook',
        position: perk.position,
        data: {
          perk,
          isSelected: perk.id === selectedPerkId,
        },
      })),
    [perks, selectedPerkId],
  );

  const edges = useMemo(() => createEdges(perks), [perks]);

  return (
    <div className="h-[620px] overflow-hidden rounded-3xl border border-[#2f2336] bg-[#0c0610]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.45}
        maxZoom={1.8}
        onNodeClick={(_, node) => onSelectPerk(node.id)}
        nodesDraggable={false}
        elementsSelectable
        panOnDrag
      >
        <Background color="#2f2336" gap={28} size={1} />
        <MiniMap zoomable pannable nodeColor="#7c3aed" className="!bg-[#120917] !border !border-[#3d2b42]" />
        <Controls className="!bg-[#120917] !border !border-[#3d2b42] !rounded-xl" />
      </ReactFlow>
    </div>
  );
}

