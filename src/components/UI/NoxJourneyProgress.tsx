import { noxJourney } from '../../data/noxJourney';

interface NoxJourneyProgressProps {
  activeIndex: number;
  onSelect?: (index: number) => void;
}

export default function NoxJourneyProgress({ activeIndex, onSelect }: NoxJourneyProgressProps) {
  return (
    <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-4 pointer-events-none">
      {/* Vertical rail */}
      <div className="absolute right-[14px] top-0 bottom-0 w-px bg-white/10" aria-hidden="true" />
      <div
        className="absolute right-[14px] top-0 w-px bg-gradient-to-b from-nox-red-fire via-nox-red to-transparent transition-all duration-700 ease-out"
        style={{ height: `${((activeIndex + 1) / noxJourney.length) * 100}%` }}
        aria-hidden="true"
      />

      {noxJourney.map((section, i) => {
        const isActive = i === activeIndex;
        const isPassed = i < activeIndex;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect?.(i)}
            className="group relative flex items-center gap-3 pointer-events-auto"
            aria-label={`Jump to ${section.label}`}
          >
            <span
              className={`font-mono text-[10px] font-semibold tracking-[0.28em] uppercase transition-all duration-500 ${
                isActive ? 'text-nox-red-fire opacity-100' : 'text-white/40 opacity-0 group-hover:opacity-100'
              }`}
            >
              {section.label}
            </span>
            <span
              className={`font-mono text-[11px] font-semibold tracking-[0.18em] transition-colors duration-500 ${
                isActive ? 'text-white' : isPassed ? 'text-white/55' : 'text-white/30'
              }`}
            >
              {section.number}
            </span>
            <span className="relative flex items-center justify-center w-[14px] h-[14px]">
              <span
                className={`block rounded-full transition-all duration-500 ${
                  isActive
                    ? 'w-2.5 h-2.5 bg-nox-red-fire shadow-[0_0_12px_rgba(255,90,90,0.9)]'
                    : isPassed
                    ? 'w-1.5 h-1.5 bg-nox-red/70'
                    : 'w-1.5 h-1.5 bg-white/25'
                }`}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
