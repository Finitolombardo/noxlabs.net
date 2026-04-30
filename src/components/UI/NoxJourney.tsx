import { useCallback, useEffect, useRef, useState } from 'react';
import { noxJourney } from '../../data/noxJourney';
import NoxJourneySection from './NoxJourneySection';
import NoxJourneyProgress from './NoxJourneyProgress';

export default function NoxJourney() {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const registerRef = useCallback((index: number, el: HTMLElement | null) => {
    sectionRefs.current[index] = el;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let best: { idx: number; ratio: number } | null = null;
        entries.forEach((entry) => {
          const idxAttr = (entry.target as HTMLElement).dataset.journeyIndex;
          if (idxAttr === undefined) return;
          const idx = Number(idxAttr);
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { idx, ratio: entry.intersectionRatio };
          }
        });
        if (best && best.ratio > 0.25) {
          setActiveIndex(best.idx);
        }
      },
      { threshold: [0.25, 0.5, 0.75] }
    );

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleSelect = (i: number) => {
    const el = sectionRefs.current[i];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative bg-black">
      {/* Subtle vertical red energy axis through sections */}
      <div
        className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px pointer-events-none z-[1]"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(201,48,48,0.18) 20%, rgba(201,48,48,0.28) 50%, rgba(201,48,48,0.18) 80%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      <NoxJourneyProgress activeIndex={activeIndex} onSelect={handleSelect} />

      {noxJourney.map((section, i) => (
        <NoxJourneySection key={section.id} section={section} index={i} registerRef={registerRef} />
      ))}
    </div>
  );
}
