import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { SkillbookPerk } from '../../types/skillbook';
import { statusLabel } from '../../data/skillbookData';

type SkillbookNodeData = {
  perk: SkillbookPerk;
  isSelected: boolean;
};

const statusStyle: Record<SkillbookPerk['status'], string> = {
  integriert: 'border-emerald-300/60 bg-emerald-500/10 text-emerald-100',
  bereit: 'border-amber-300/70 bg-amber-300/10 text-amber-100',
  'wird-geprueft': 'border-violet-300/70 bg-violet-400/10 text-violet-100',
  geplant: 'border-sky-300/60 bg-sky-400/10 text-sky-100',
  gesperrt: 'border-slate-500/60 bg-slate-700/30 text-slate-200',
};

function SkillbookNode({ data }: NodeProps) {
  const { perk, isSelected } = data as SkillbookNodeData;
  const riskHigh = perk.auswirkungen.risiko > 55;

  return (
    <div
      className={[
        'w-[250px] rounded-2xl border bg-[#130b16]/95 p-3 text-[#f8eef6] shadow-[0_0_28px_rgba(56,189,248,0.08)] transition',
        isSelected ? 'border-cyan-300/70 ring-2 ring-cyan-300/30' : 'border-[#3d2b42]/90',
        riskHigh ? 'ring-2 ring-red-500/50' : '',
      ].join(' ')}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b29fb7]">{perk.kapitel}</div>
          <div className="text-[11px] text-[#9d8ca7]">{perk.kategorie}</div>
        </div>
        <div className="text-lg">{perk.status === 'gesperrt' ? '[S]' : '[O]'}</div>
      </div>

      <div className="line-clamp-2 text-sm font-extrabold leading-tight">{perk.name}</div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-bold">
        <span className={`rounded-full border px-2 py-1 ${statusStyle[perk.status]}`}>{statusLabel[perk.status]}</span>
        <span className="rounded-full border border-[#3d2b42]/80 bg-[#1c1220] px-2 py-1 text-[#cab7d1]">Priorität: {perk.prioritaet}</span>
        <span className="rounded-full border border-[#3d2b42]/80 bg-[#1c1220] px-2 py-1 text-[#cab7d1]">Stufe {perk.stufe}</span>
      </div>
    </div>
  );
}

export default memo(SkillbookNode);
