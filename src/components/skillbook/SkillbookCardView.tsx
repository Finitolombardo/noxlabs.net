import type { SkillbookPerk } from '../../types/skillbook';
import { statusLabel } from '../../data/skillbookData';

type SkillbookCardViewProps = {
  perks: SkillbookPerk[];
  selectedPerkId: string;
  onSelectPerk: (perkId: string) => void;
};

export default function SkillbookCardView({ perks, selectedPerkId, onSelectPerk }: SkillbookCardViewProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {perks.map((perk) => {
        const active = perk.id === selectedPerkId;
        return (
          <button
            type="button"
            key={perk.id}
            onClick={() => onSelectPerk(perk.id)}
            className={[
              'rounded-2xl border bg-[#110815]/95 p-4 text-left transition',
              active ? 'border-cyan-300/70 shadow-[0_0_24px_rgba(34,211,238,0.18)]' : 'border-[#32243a] hover:border-[#6d4a7b]',
            ].join(' ')}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b29fb7]">{perk.kapitel}</div>
            <div className="mt-1 text-sm font-extrabold text-[#f7edf5]">{perk.name}</div>
            <div className="mt-2 text-xs text-[#cbb9d1]">{perk.kategorie}</div>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold">
              <span className="rounded-full border border-[#3d2b42]/80 bg-[#1c1220] px-2 py-1 text-[#cab7d1]">{statusLabel[perk.status]}</span>
              <span className="rounded-full border border-[#3d2b42]/80 bg-[#1c1220] px-2 py-1 text-[#cab7d1]">Stufe {perk.stufe}</span>
              <span className="rounded-full border border-[#3d2b42]/80 bg-[#1c1220] px-2 py-1 text-[#cab7d1]">{perk.prioritaet}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

