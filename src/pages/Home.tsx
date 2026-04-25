import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  UserX,
  Timer,
  Network,
  AlertTriangle,
  MailX,
  Gauge,
} from 'lucide-react';
import HeroOrchestration from '../components/UI/HeroOrchestration';
import NoxBolt from '../components/UI/NoxBolt';
import NoxSystemCore from '../components/UI/NoxSystemCore';

const problems = [
  {
    icon: UserX,
    title: 'Leads gehen verloren',
    description: 'Manuelle Prozesse und fehlende Struktur lassen qualifizierte Kontakte unbearbeitet liegen.',
  },
  {
    icon: Timer,
    title: 'Langsame Response-Zeiten',
    description: 'Follow-up passiert zu spät — der Moment ist vorbei, der Interessent kalt.',
  },
  {
    icon: Network,
    title: 'Tools sprechen nicht miteinander',
    description: 'CRM, E-Mail, Kalender, Ads — Silos statt System. Keine gemeinsame Datenbasis.',
  },
  {
    icon: AlertTriangle,
    title: 'Manuelles Chaos skaliert nicht',
    description: 'Was bei 10 Leads funktioniert, kollabiert bei 100. Wachstum erfordert Struktur.',
  },
  {
    icon: MailX,
    title: 'Schwaches Follow-up',
    description: 'Keine systematische Nachverfolgung bedeutet verlorene Deals und vergessene Chancen.',
  },
  {
    icon: Gauge,
    title: 'Kein Überblick',
    description: 'Ohne Sicht auf den gesamten Workflow lassen sich keine fundierten Entscheidungen treffen.',
  },
];

const systems = [
  {
    number: '01',
    title: 'Leadgen Engine',
    problem: 'Keine strukturierte Nachfrage, keine echte Pipeline',
    result: 'Lernendes Demand-System mit qualifiziertem Zufluss',
    description:
      'Targeting, Research, Scraping, Enrichment und strukturierter Outbound — verbunden zu einem kontinuierlich lernenden Demand-System.',
    href: '/systems/leadforge',
    flow: ['Target', 'Enrich', 'Outbound', 'Learn'],
  },
  {
    number: '02',
    title: 'Pitch Mutation Engine',
    problem: 'Pitches variieren, Message-Market-Fit bleibt Zufall',
    result: 'Systematisch lernende Pitch-Architektur',
    description:
      'Mutation, Testing und gezielte Evolution der Verkaufsbotschaft — jede Iteration messbar, jede Version ein Lernzyklus.',
    href: '/systems/pitch-evolution-system',
    flow: ['Variant', 'Test', 'Signal', 'Mutate'],
  },
  {
    number: '03',
    title: 'YouTube Engine',
    problem: 'Content ohne Struktur, Reichweite ohne Autorität',
    result: 'Authority- und Content-Infrastruktur, die skaliert',
    description:
      'Topic-Intelligence, Hooks, Scripting-Logik, Publishing und Learning-Loops — verbunden zu einem operativen Autoritäts-System.',
    href: '/systems/content-engine',
    flow: ['Topic', 'Hook', 'Publish', 'Loop'],
  },
];

const processSteps = [
  {
    number: '01',
    title: 'Analyse',
    description: 'Bestehende Prozesse, Tools und Bottlenecks werden systematisch erfasst und bewertet.',
  },
  {
    number: '02',
    title: 'Design',
    description: 'Auf Basis der Analyse entsteht eine modulare System-Architektur mit klarem Scope.',
  },
  {
    number: '03',
    title: 'Build',
    description: 'Umsetzung der Systeme — präzise, produktionsreif, ohne unnötige Komplexität.',
  },
  {
    number: '04',
    title: 'Integrate',
    description: 'Anbindung an bestehende Tools und Infrastruktur. Nahtlos, nicht disruptiv.',
  },
  {
    number: '05',
    title: 'Optimize',
    description: 'Kontinuierliche Verbesserung auf Basis echter Daten und Rückkopplungen.',
  },
];

const differentiators = [
  'Systeme statt Hacks. Gebaut, um zu bleiben.',
  'Struktur statt Chaos. Architektur vor Code.',
  'Leverage statt Mehrarbeit. Output statt Aufwand.',
  'Modular und skalierbar. Gebaut, um zu wachsen.',
  'Ergebnisgebunden. Nicht an Deliverables, an Wirkung.',
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="w-10 h-[2px] bg-nox-red" />
      <span className="text-[15px] font-mono font-bold tracking-[0.26em] text-[#FF6B6B] uppercase">
        {children}
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen relative">

      {/* ─── HERO ─── */}
      {/* Gap 1: items-center + symmetric padding = vertically centered like design */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-28 pb-24 overflow-x-clip noise hero-grid">

        {/* Deep atmospheric base — design: radial at 50% 38% */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(28,10,12,1)_0%,#050505_55%,#020202_100%)]" />

        {/* Orchestration network */}
        <div className="absolute inset-0 mask-radial-fade">
          <HeroOrchestration />
        </div>

        {/* Vertical light spine — anchored through the bolt */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-[48%] bg-gradient-to-b from-transparent via-nox-red/30 to-nox-red/60 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-[52%] bg-gradient-to-t from-transparent via-nox-red/15 to-nox-red/50 pointer-events-none" />

        {/* Ambient core glow — design: top 46%, 680px, 0.16 opacity */}
        <div className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full bg-nox-red/[0.16] blur-[140px] pointer-events-none animate-glow-pulse" />
        <div className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[560px] rounded-full bg-red-950/22 blur-[180px] pointer-events-none" />

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#070707] via-[#070707]/60 to-transparent z-10 pointer-events-none" />

        {/* Content — Gap 1: reordered to Status pill → Bolt → Eyebrow → Headline → Subline → CTAs */}
        <div className="relative z-10 max-w-[1024px] mx-auto w-full text-center flex flex-col items-center">

          {/* 1. STATUS PILL — above the bolt (design order) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2.5 text-[11px] font-mono font-semibold tracking-[0.32em] text-white/78 uppercase px-4 py-2 border border-white/[0.10] rounded-full bg-white/[0.025] backdrop-blur-sm">
              <span className="relative w-1.5 h-1.5 flex-shrink-0">
                <span className="status-dot-pulse absolute inset-[-3px] rounded-full bg-nox-red/55" />
                <span className="absolute inset-0 rounded-full bg-nox-red-fire" style={{ boxShadow: '0 0 8px rgba(255,90,90,0.9)' }} />
              </span>
              Systeme online
            </span>
          </motion.div>

          {/* 2. SYSTEM CORE — operational infrastructure visual */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="relative w-full mb-6 -mx-4 px-4"
          >
            <NoxSystemCore />
          </motion.div>

          {/* 3. EYEBROW */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-3 text-[12px] font-mono font-semibold tracking-[0.32em] text-white/85 uppercase px-5 py-2.5 border border-white/[0.12] rounded-full bg-white/[0.03] backdrop-blur-sm">
              <span className="text-nox-red-fire font-bold tracking-[0.36em]">NOX</span>
              <span className="text-white/30">·</span>
              <span>High-End Learning Systems</span>
            </span>
          </motion.div>

          {/* 4. HEADLINE — design: clamp(44px, 7.6vw, 96px), lineHeight 0.98 */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 1.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="font-bold mb-7 leading-[0.98] tracking-[-0.028em] text-balance"
            style={{ fontSize: 'clamp(44px, 7.6vw, 96px)' }}
          >
            <span className="text-gradient-red">KI-Systeme.</span>
            <br />
            <span className="text-nox-red relative inline-block">
              Gebaut für Wachstum.
              <span className="absolute -bottom-1.5 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nox-red/70 to-transparent" />
            </span>
          </motion.h1>

          {/* 5. SUBLINE — design: clamp(16px, 1.3vw, 19px), maxWidth 640 */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="text-nox-white-muted/92 mb-11 max-w-[640px] leading-relaxed text-balance"
            style={{ fontSize: 'clamp(16px, 1.3vw, 19px)' }}
          >
            NOX Labs baut operative KI-Infrastruktur für Lead-Generierung, Qualifizierung und Workflow — strukturiert, messbar, produktionsreif.
          </motion.p>

          {/* 6. CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 flex-wrap"
          >
            <Link to="/contact">
              <button className="group relative px-8 py-4 bg-nox-red text-white font-semibold rounded-lg hover:bg-nox-red-deep transition-all duration-300 inline-flex items-center gap-2.5 shadow-[0_0_0_1px_rgba(232,64,64,0.25),0_12px_40px_-8px_rgba(201,48,48,0.55)] hover:shadow-[0_0_0_1px_rgba(232,64,64,0.4),0_18px_48px_-8px_rgba(201,48,48,0.7)] overflow-hidden">
                <span className="relative z-10">Gespräch buchen</span>
                <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              </button>
            </Link>
            <Link to="/systems">
              <button className="px-8 py-4 bg-white/[0.02] backdrop-blur-sm text-nox-white font-semibold rounded-lg border border-white/[0.12] hover:border-white/[0.28] hover:bg-white/[0.05] transition-all duration-300 inline-flex items-center gap-2.5">
                Systeme ansehen
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator — absolute to section (design: bottom 36px) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="absolute bottom-9 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2.5"
        >
          <span className="text-[10px] font-mono font-semibold tracking-[0.34em] text-white/42 uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-9 bg-gradient-to-b from-white/32 to-transparent"
          />
        </motion.div>
      </section>

      {/* ─── PROBLEMS ─── */}
      <section className="relative py-28 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-nox-red/25 to-transparent" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 max-w-3xl"
          >
            <SectionEyebrow>Das Problem</SectionEyebrow>
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-5 leading-[1.02] tracking-[-0.025em] text-depth-red-subtle">
              Was Wachstum<br />täglich kostet.
            </h2>
            <p className="text-nox-white-muted max-w-[540px] leading-relaxed text-[16px]">
              Die meisten Unternehmen haben kein Potenzialproblem — sie haben ein Strukturproblem.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.05] rounded-[18px] overflow-hidden border border-white/[0.05] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]"
          >
            {problems.map((problem, i) => {
              const Icon = problem.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="relative bg-[#080808] p-8 transition-all duration-500 group overflow-hidden"
                  style={{ minHeight: 200 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-nox-red/0 to-nox-red/0 group-hover:from-nox-red/[0.07] group-hover:to-nox-red/0 transition-all duration-500" />
                  <div className="relative">
                    <div
                      className="relative w-11 h-11 rounded-[11px] flex items-center justify-center mb-[22px] transition-all duration-500 group-hover:-translate-y-px"
                      style={{
                        background: 'linear-gradient(135deg, #161012, #0a0707)',
                        border: '1px solid rgba(201,48,48,0.16)',
                        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04), 0 4px 14px -4px rgba(201,48,48,0.25)',
                      }}
                    >
                      <div className="absolute inset-0 rounded-[11px] bg-nox-red/0 group-hover:bg-nox-red/[0.08] transition-all duration-500" />
                      <Icon
                        className="relative w-[18px] h-[18px] text-[#E84040] group-hover:text-[#FF5A5A] transition-colors duration-500"
                        strokeWidth={2.25}
                      />
                    </div>
                    <h3 className="text-base font-semibold text-nox-white mb-2.5 tracking-tight">{problem.title}</h3>
                    <p className="text-[14px] text-nox-white-muted leading-relaxed">{problem.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── CORE SYSTEMS ─── */}
      {/* Gap 3: section background gradient from design */}
      <section
        className="relative py-32 px-4"
        style={{ background: 'linear-gradient(to bottom, #070707 0%, #0a0708 50%, #070707 100%)' }}
      >
        {/* Gap 3: top divider from design */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-px bg-gradient-to-r from-transparent via-nox-red/22 to-transparent pointer-events-none" />
        {/* Ambient blooms — design: left 42%/right 18% */}
        <div className="absolute top-[42%] left-[-8%] w-[380px] h-[380px] rounded-full bg-nox-red/[0.05] blur-[110px] pointer-events-none" />
        <div className="absolute top-[18%] right-[-8%] w-[340px] h-[340px] rounded-full bg-nox-red/[0.04] blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-20 max-w-[760px]"
          >
            <SectionEyebrow>Core Engines</SectionEyebrow>
            <h2
              className="font-bold text-nox-white mb-6 leading-[1.02] tracking-[-0.025em] text-depth-red-subtle"
              style={{ fontSize: 'clamp(36px, 5.4vw, 60px)' }}
            >
              <span className="text-gradient-red">Drei Engines.</span>
              <br />
              <span className="text-nox-red">Ein System.</span>
            </h2>
            <p className="text-nox-white-muted max-w-[580px] leading-relaxed text-[16px]">
              NOX baut keine Tools. NOX baut lernende Engines — Demand, Message, Autorität. Jede für sich operativ, zusammen der Loop.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-[18px]"
          >
            {systems.map((system, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
                {/* Gap 2: min-h-[460px] + updated background gradient matching design */}
                <Link
                  to={system.href}
                  className="group relative border border-white/[0.07] rounded-[20px] p-[30px] hover:border-nox-red/[0.32] transition-all duration-500 flex flex-col overflow-hidden h-full cursor-pointer"
                  style={{
                    background: 'linear-gradient(160deg, #0f0d0e 0%, #070506 100%)',
                    minHeight: '460px',
                    boxShadow: '0 20px 60px -22px rgba(0,0,0,0.85), inset 0 1px 0 0 rgba(255,255,255,0.025)',
                  }}
                >
                  {/* Gap 2: two separate trace spans — scaleX sweep effect */}
                  <span className="engine-card-trace-top" aria-hidden="true" />
                  <span className="engine-card-trace-bottom" aria-hidden="true" />

                  {/* Gap 2: bloom positioned in top-right corner (design position) */}
                  <div className="engine-card-bloom" />

                  {/* Gap 2: CSS corner crosshair with intensification */}
                  <span className="engine-card-corner" aria-hidden="true" />

                  {/* Inner edge glow on hover */}
                  <div
                    className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ boxShadow: 'inset 0 0 40px 0 rgba(201,48,48,0.08)' }}
                  />

                  <div className="relative z-[1] flex flex-col h-full">
                    {/* Header: number + arrow chip */}
                    <div className="flex items-start justify-between mb-7">
                      <span
                        className="font-bold font-mono leading-[0.85] tracking-[-0.04em] transition-all duration-[600ms] text-nox-red/[0.18] group-hover:text-nox-red-fire/55"
                        style={{ fontSize: 84 }}
                      >
                        {system.number}
                      </span>
                      <div className="w-9 h-9 rounded-full border border-white/[0.10] bg-white/[0.025] flex items-center justify-center opacity-0 translate-x-[-6px] translate-y-[4px] group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-500">
                        <ArrowRight className="w-3.5 h-3.5 text-nox-red-fire" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-[23px] font-bold text-nox-white mb-[22px] tracking-[-0.015em] leading-[1.15]">
                      {system.title}
                    </h3>

                    {/* Problem / Result rows */}
                    <div className="flex flex-col gap-2.5 mb-[22px]">
                      <div className="flex items-baseline gap-3.5">
                        <span className="font-mono text-[10px] font-semibold tracking-[0.22em] text-white/42 uppercase flex-shrink-0 w-[62px]">Problem</span>
                        <span className="text-[13.5px] text-nox-white-muted leading-[1.5]">{system.problem}</span>
                      </div>
                      <div className="flex items-baseline gap-3.5">
                        <span className="font-mono text-[10px] font-semibold tracking-[0.22em] text-nox-red-fire uppercase flex-shrink-0 w-[62px]">Ergebnis</span>
                        <span className="text-[13.5px] text-nox-white font-medium leading-[1.5]">{system.result}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[14px] text-nox-white-muted leading-relaxed mb-7 flex-grow">
                      {system.description}
                    </p>

                    {/* Flow diagram */}
                    <div className="pt-[22px] border-t border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        {system.flow.map((node, ni) => (
                          <div key={ni} className="flex items-center gap-2">
                            <span
                              className="font-mono text-[10px] font-semibold tracking-[0.16em] uppercase px-2.5 py-[5px] rounded-[5px] transition-all duration-500 group-hover:text-nox-white-muted"
                              style={{
                                background: 'rgba(255,255,255,0.025)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                color: 'rgba(255,255,255,0.55)',
                                transitionDelay: `${ni * 60}ms`,
                              }}
                            >
                              {node}
                            </span>
                            {ni < system.flow.length - 1 && (
                              <span
                                className="flex-shrink-0 h-px w-3.5 transition-all duration-500 group-hover:bg-nox-red/50"
                                style={{
                                  background: 'rgba(255,255,255,0.15)',
                                  transitionDelay: `${ni * 60 + 30}ms`,
                                }}
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* CTA row */}
                      <div className="mt-5 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.22em] text-white/62 uppercase group-hover:text-nox-white-soft transition-colors duration-500">
                        <span className="relative">
                          Engine ansehen
                          <span className="absolute left-0 -bottom-0.5 h-px w-0 group-hover:w-full bg-nox-red/70 transition-all duration-500" />
                        </span>
                        <span className="inline-block group-hover:translate-x-1 transition-transform duration-400">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative py-32 px-4 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-20 max-w-[760px]"
          >
            <SectionEyebrow>Prozess</SectionEyebrow>
            <h2
              className="font-bold text-nox-white leading-[1.02] tracking-[-0.025em] text-depth-red-subtle mb-[22px]"
              style={{ fontSize: 'clamp(36px, 5.4vw, 60px)' }}
            >
              Wie NOX baut.
            </h2>
            {/* Gap 4: exact lede from design data.js */}
            <p className="text-nox-white-muted max-w-[540px] leading-relaxed text-[16px]">
              Klarer Scope, fester Zeitrahmen, messbare Ergebnisse. Kein Discovery-Theater, kein offenes Beratungsmandat.
            </p>
          </motion.div>

          <div className="relative">
            {/* Desktop: animated progress rail */}
            <div className="hidden lg:block absolute top-[30px] left-[4%] right-[4%] h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent pointer-events-none" />
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: 0.4 }}
              className="hidden lg:block absolute top-[30px] left-[4%] right-[4%] h-px origin-left pointer-events-none"
              style={{ background: 'linear-gradient(to right, rgba(201,48,48,0.7), rgba(201,48,48,0.4) 50%, rgba(201,48,48,0.1))' }}
            />

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6"
            >
              {processSteps.map((step, i) => (
                <motion.div key={i} variants={fadeUp} className="relative group cursor-default">
                  <div className="flex lg:flex-col items-start gap-5 lg:gap-0">
                    <div className="relative flex-shrink-0 lg:mb-6">
                      <div
                        className="absolute inset-[-12px] rounded-full animate-breath opacity-55 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ background: 'rgba(201,48,48,0.18)', filter: 'blur(22px)', animationDelay: `${i * 0.3}s` }}
                      />
                      <div
                        className="relative w-[60px] h-[60px] rounded-[14px] flex items-center justify-center transition-all duration-500 group-hover:-translate-y-0.5"
                        style={{
                          background: 'linear-gradient(135deg, #141014, #060304)',
                          border: '1px solid rgba(201,48,48,0.22)',
                          boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04), 0 10px 26px -12px rgba(201,48,48,0.4)',
                        }}
                      >
                        <span className="font-mono text-base font-bold text-nox-red group-hover:text-[#FF5A5A] tracking-[0.04em] transition-colors duration-500">
                          {step.number}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-nox-white mb-2 tracking-tight">{step.title}</h3>
                      <p className="text-[13.5px] text-nox-white-muted leading-[1.55]">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── WHY NOX ─── */}
      <section className="relative py-28 px-4 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:sticky lg:top-28"
            >
              <SectionEyebrow>Warum NOX</SectionEyebrow>
              <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-6 leading-[1.05] tracking-[-0.02em] text-depth-red-subtle">
                Kein generisches<br />AI Consulting.
              </h2>
              <p className="text-nox-white-muted leading-relaxed text-[15px] max-w-md">
                NOX baut lernende Systeme. Keine Decks, keine Hacks, keine Experimente. Nur Architektur, die liefert.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-3"
            >
              {differentiators.map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="group flex items-start gap-4 p-5 rounded-xl border border-white/[0.06] hover:border-nox-red/20 hover:bg-nox-red/[0.02] transition-all duration-300"
                >
                  <div className="relative w-5 h-5 rounded-full bg-nox-red/[0.15] border border-nox-red/30 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-nox-red/25 transition-all">
                    <div className="w-1.5 h-1.5 rounded-full bg-nox-red" />
                    <div className="absolute inset-0 rounded-full bg-nox-red/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-nox-white-muted group-hover:text-nox-white leading-relaxed text-sm transition-colors">{item}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── SOLUTION FINDER ─── */}
      <section className="relative py-28 px-4 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full bg-nox-red/[0.1] blur-[90px] animate-glow-pulse" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-nox-red/40 to-transparent" />
            </div>
            <div className="relative bg-gradient-to-b from-[#0d0d0d] to-[#080808] border border-nox-red/[0.18] rounded-3xl p-12 md:p-16 text-center overflow-hidden noise">
              <div className="absolute top-8 right-8 opacity-20 animate-float-slow pointer-events-none">
                <NoxBolt className="w-8 h-12" glow={false} />
              </div>

              <SectionEyebrow>Lösungsfinder</SectionEyebrow>
              <h2 className="text-3xl md:text-4xl font-bold text-nox-white mb-5 leading-[1.05] tracking-[-0.02em]">
                Welche Engines braucht<br />dein Business wirklich?
              </h2>
              <p className="text-nox-white-muted leading-relaxed mb-10 max-w-xl mx-auto">
                Geführtes Intake: Situation, Stack, Bottlenecks, Ziele — Ergebnis ist die passende NOX-Engine-Kombination. In unter zwei Minuten.
              </p>
              <Link to="/solution-finder">
                <button className="group relative px-8 py-4 bg-nox-red text-white font-semibold rounded-lg hover:bg-nox-red-deep transition-all duration-300 inline-flex items-center gap-2.5 shadow-[0_0_0_1px_rgba(232,64,64,0.25),0_16px_48px_-8px_rgba(201,48,48,0.6)] hover:shadow-[0_0_0_1px_rgba(232,64,64,0.4),0_20px_56px_-8px_rgba(201,48,48,0.75)] overflow-hidden">
                  <span className="relative z-10">Lösungsfinder starten</span>
                  <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative py-[168px] px-6 border-t border-white/[0.04] mt-12 overflow-hidden text-center">
        <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[560px] rounded-full bg-nox-red/[0.08] blur-[150px] pointer-events-none animate-glow-pulse" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-nox-red/32 to-transparent" />

        <div className="relative max-w-[880px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Floating bolt with bloom */}
            <div className="flex justify-center mb-9">
              <div className="relative">
                <div
                  className="absolute animate-breath rounded-full"
                  style={{ inset: '-32px', background: 'rgba(201,48,48,0.32)', filter: 'blur(50px)' }}
                />
                <div style={{ filter: 'drop-shadow(0 0 36px rgba(201,48,48,0.55))' }}>
                  <NoxBolt className="w-14 h-20" />
                </div>
              </div>
            </div>

            <h2
              className="font-bold mb-7 leading-[0.98] tracking-[-0.028em] text-balance"
              style={{ fontSize: 'clamp(44px, 7.5vw, 92px)' }}
            >
              <span className="text-gradient-red">Systeme,</span>
              <br />
              <span className="text-nox-red">die liefern.</span>
            </h2>

            <p className="text-nox-white-muted text-[18px] leading-relaxed mb-12 max-w-[520px] mx-auto">
              Klarer Scope. Messbarer Output. Kein Overhead.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
              <Link to="/contact">
                <button className="group relative px-8 py-4 bg-nox-red text-white font-semibold rounded-lg hover:bg-nox-red-deep transition-all duration-300 inline-flex items-center gap-2.5 shadow-[0_0_0_1px_rgba(232,64,64,0.25),0_16px_48px_-8px_rgba(201,48,48,0.6)] hover:shadow-[0_0_0_1px_rgba(232,64,64,0.45),0_20px_56px_-8px_rgba(201,48,48,0.8)] overflow-hidden">
                  <span className="relative z-10">Gespräch buchen</span>
                  <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                </button>
              </Link>
              <Link to="/systems">
                <button className="px-8 py-4 bg-white/[0.02] backdrop-blur-sm text-nox-white font-semibold rounded-lg border border-white/[0.12] hover:border-white/[0.28] hover:bg-white/[0.05] transition-all duration-300 inline-flex items-center gap-2.5">
                  Systeme ansehen
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
