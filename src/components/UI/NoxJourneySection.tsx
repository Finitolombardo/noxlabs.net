import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import type { JourneySection } from '../../data/noxJourney';

interface NoxJourneySectionProps {
  section: JourneySection;
  index: number;
  registerRef: (index: number, el: HTMLElement | null) => void;
}

export default function NoxJourneySection({ section, index, registerRef }: NoxJourneySectionProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const rawScale = useTransform(scrollYProgress, [0, 1], [1.0, 1.07]);
  const rawOverlayOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 0.55, 0.85]);

  const scale = reduceMotion ? 1 : rawScale;
  const overlayOpacity = reduceMotion ? 0.7 : rawOverlayOpacity;

  const setRef = (el: HTMLElement | null) => {
    ref.current = el;
    registerRef(index, el);
  };

  const isCta = !section.background;

  return (
    <section
      ref={setRef}
      id={`journey-${section.id}`}
      data-journey-index={index}
      className="relative min-h-screen w-full flex items-center overflow-hidden"
    >
      {/* Background */}
      {section.background ? (
        <motion.div
          style={{ scale }}
          className="absolute inset-0 will-change-transform"
          aria-hidden="true"
        >
          <img
            src={section.background}
            alt=""
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        </motion.div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 30% 40%, rgba(40,10,12,1) 0%, #0a0606 55%, #050303 100%)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Darkening overlay for readability */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
      </motion.div>

      {/* Red ambient pulse */}
      {!reduceMotion && !isCta && (
        <motion.div
          initial={{ opacity: 0.25 }}
          animate={{ opacity: [0.22, 0.4, 0.22] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[560px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(201,48,48,0.28), transparent 70%)', filter: 'blur(60px)' }}
          aria-hidden="true"
        />
      )}

      {/* Section transitions: top/bottom fade for seamless feel */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 to-transparent pointer-events-none z-[1]" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-[1]" aria-hidden="true" />

      {/* Content — left aligned */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 py-28">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 flex items-center gap-3"
          >
            <span className="w-8 h-px bg-nox-red-fire" />
            <span className="font-mono text-[11px] font-semibold tracking-[0.32em] text-nox-red-fire uppercase">
              {section.number} · {section.label}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="font-bold text-white leading-[0.98] tracking-[-0.028em] mb-7"
            style={{ fontSize: 'clamp(40px, 6.4vw, 84px)' }}
          >
            {section.headline.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20%' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.16 }}
            className="text-white/80 leading-relaxed max-w-xl"
            style={{ fontSize: 'clamp(16px, 1.25vw, 19px)' }}
          >
            {section.copy}
          </motion.p>

          {section.modules && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20%' }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.24 }}
              className="mt-9 grid grid-cols-2 gap-2.5 max-w-lg"
            >
              {section.modules.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-white/10 bg-white/[0.04] backdrop-blur-sm"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-nox-red-fire shadow-[0_0_8px_rgba(255,90,90,0.8)]" />
                  <span className="text-sm font-medium text-white/90 tracking-tight">{m.name}</span>
                </div>
              ))}
            </motion.div>
          )}

          {section.cta && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20%' }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.24 }}
              className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-3.5"
            >
              <Link to={section.cta.primary.href}>
                <button className="group relative px-8 py-4 bg-nox-red text-white font-semibold rounded-lg hover:bg-nox-red-deep transition-all duration-300 inline-flex items-center gap-2.5 shadow-[0_0_0_1px_rgba(232,64,64,0.25),0_16px_48px_-8px_rgba(201,48,48,0.6)] overflow-hidden">
                  <span className="relative z-10">{section.cta.primary.label}</span>
                  <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                </button>
              </Link>
              <Link to={section.cta.secondary.href}>
                <button className="px-8 py-4 bg-white/[0.03] backdrop-blur-sm text-white font-semibold rounded-lg border border-white/15 hover:border-white/30 hover:bg-white/[0.06] transition-all duration-300 inline-flex items-center gap-2.5">
                  {section.cta.secondary.label}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </motion.div>
          )}

          {section.smallLabel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="mt-16 flex items-center gap-3"
            >
              <span className="font-mono text-[10px] font-semibold tracking-[0.34em] text-white/50 uppercase">
                {section.smallLabel}
              </span>
              <span className="w-10 h-px bg-white/30" />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
