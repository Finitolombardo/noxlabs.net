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
  },
  {
    number: '02',
    title: 'Pitch Mutation Engine',
    problem: 'Pitches variieren, Message-Market-Fit bleibt Zufall',
    result: 'Systematisch lernende Pitch-Architektur',
    description:
      'Mutation, Testing und gezielte Evolution der Verkaufsbotschaft — jede Iteration messbar, jede Version ein Lernzyklus.',
    href: '/systems/pitch-evolution-system',
  },
  {
    number: '03',
    title: 'YouTube Engine',
    problem: 'Content ohne Struktur, Reichweite ohne Autorität',
    result: 'Authority- und Content-Infrastruktur, die skaliert',
    description:
      'Topic-Intelligence, Hooks, Scripting-Logik, Publishing und Learning-Loops — verbunden zu einem operativen Autoritäts-System.',
    href: '/systems/content-engine',
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
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
      <section className="relative min-h-screen flex items-start justify-center px-4 pt-40 md:pt-48 lg:pt-56 pb-24 overflow-x-clip noise">
        {/* Deep atmospheric base */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(18,8,10,1)_0%,#050505_60%,#030303_100%)]" />

        {/* Orchestration network */}
        <div className="absolute inset-0 mask-radial-fade">
          <HeroOrchestration />
        </div>

        {/* Vertical light beam — anchored through the core */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-[48%] bg-gradient-to-b from-transparent via-nox-red/30 to-nox-red/60 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-[52%] bg-gradient-to-t from-transparent via-nox-red/15 to-nox-red/50 pointer-events-none" />

        {/* Hero core glow — anchored to bolt position (upper-center) */}
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full bg-nox-red/[0.18] blur-[120px] pointer-events-none animate-glow-pulse" />
        <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] rounded-full bg-red-950/25 blur-[180px] pointer-events-none" />

        {/* Fade to page */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#070707] via-[#070707]/80 to-transparent z-10 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* ─── NEW HERO LIGHTNING ─── free-floating, ambient glow only, no container */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex justify-center items-center mx-auto mt-6 md:mt-10 mb-10 md:mb-12 w-full h-[230px] md:h-[270px] lg:h-[310px] overflow-visible"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[520px] h-[520px] rounded-full bg-nox-red/[0.14] blur-[130px]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[320px] h-[320px] rounded-full bg-nox-red/30 blur-[80px] animate-breath" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[160px] h-[160px] rounded-full bg-[#FF4D4D]/40 blur-[46px] animate-breath" style={{ animationDelay: '0.7s' }} />
            </div>

            <motion.img
              src="/nox_icon_app_square_1024.png"
              alt="NOX"
              className="relative w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 object-contain drop-shadow-[0_0_55px_rgba(201,48,48,0.6)]"
              animate={{ opacity: [0.94, 1, 0.94] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="flex justify-center mb-5"
          >
            <span className="text-[12px] font-mono font-semibold tracking-[0.32em] text-white/80 uppercase px-5 py-2.5 border border-white/[0.14] rounded-full bg-white/[0.035] backdrop-blur-sm">
              <span className="text-[#FF5A5A]">NOX</span> <span className="text-white/40 mx-1">·</span> High-End Learning Systems
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-[6rem] font-bold mb-6 leading-[1] tracking-[-0.025em] text-balance"
          >
            <span className="text-gradient-red">KI-Systeme.</span>
            <br />
            <span className="text-nox-red relative inline-block">
              Gebaut für Wachstum.
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nox-red/70 to-transparent" />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.9 }}
            className="text-lg md:text-xl text-nox-white-muted/90 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            NOX Labs baut operative KI-Infrastruktur für Lead-Generierung, Qualifizierung und Workflow — strukturiert, messbar, produktionsreif.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
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

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-[11px] font-mono font-semibold tracking-[0.32em] text-white/50 uppercase">Scroll</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent"
            />
          </motion.div>
        </div>
      </section>

      {/* ─── PROBLEMS ─── */}
      <section className="relative py-28 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 max-w-3xl"
          >
            <SectionEyebrow>Das Problem</SectionEyebrow>
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-5 leading-[1.05] tracking-[-0.02em] text-depth-red-subtle">
              Was Wachstum<br />täglich kostet.
            </h2>
            <p className="text-nox-white-muted max-w-lg leading-relaxed text-[15px]">
              Die meisten Unternehmen haben kein Potenzialproblem — sie haben ein Strukturproblem.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.05] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
          >
            {problems.map((problem, i) => {
              const Icon = problem.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="relative bg-[#080808] p-8 transition-all duration-500 group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-nox-red/0 via-nox-red/0 to-nox-red/0 group-hover:from-nox-red/[0.06] group-hover:to-nox-red/[0.01] transition-all duration-500" />
                  <div className="relative">
                    <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#161012] to-[#0a0707] border border-nox-red/15 flex items-center justify-center mb-5 group-hover:border-nox-red/50 transition-all duration-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_4px_12px_-4px_rgba(201,48,48,0.25)] group-hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_8px_20px_-4px_rgba(201,48,48,0.45)]">
                      <div className="absolute inset-0 rounded-xl bg-nox-red/0 group-hover:bg-nox-red/[0.08] blur-md transition-all duration-500" />
                      <Icon
                        className="relative w-[18px] h-[18px] text-[#E84040] group-hover:text-[#FF5A5A] transition-colors duration-500"
                        strokeWidth={2.25}
                      />
                    </div>
                    <h3 className="text-base font-semibold text-nox-white mb-2.5 tracking-tight text-depth-red-subtle">{problem.title}</h3>
                    <p className="text-sm text-nox-white-muted leading-relaxed">{problem.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── CORE SYSTEMS ─── */}
      <section className="relative py-28 px-4">
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-nox-red/[0.04] blur-[100px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 max-w-3xl"
          >
            <SectionEyebrow>Core Engines</SectionEyebrow>
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-5 leading-[1.05] tracking-[-0.02em] text-depth-red-subtle">
              Drei Engines.<br />Ein System.
            </h2>
            <p className="text-nox-white-muted max-w-xl leading-relaxed text-[15px]">
              NOX baut keine Tools. NOX baut lernende Engines — Demand, Message, Autorität. Jede für sich operativ, zusammen der Loop.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {systems.map((system, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              >
              <Link
                to={system.href}
                className="group relative bg-gradient-to-br from-[#0f0f0f] to-[#070707] border border-white/[0.07] rounded-2xl p-8 hover:border-nox-red/30 transition-all duration-500 flex flex-col overflow-hidden hover:shadow-[0_30px_80px_-20px_rgba(201,48,48,0.25),inset_0_1px_0_0_rgba(255,255,255,0.04)] h-full cursor-pointer"
                style={{
                  boxShadow: '0 20px 60px -20px rgba(0,0,0,0.8), inset 0 1px 0 0 rgba(255,255,255,0.02)',
                }}
              >
                {/* Inner edge glow on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 40px 0 rgba(201,48,48,0.08)' }}
                />

                {/* Hover glow bloom */}
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-nox-red/0 group-hover:bg-nox-red/[0.14] blur-[90px] transition-all duration-700 pointer-events-none" />

                {/* Top sheen on hover */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nox-red/0 group-hover:via-nox-red/60 to-transparent transition-all duration-700 pointer-events-none" />

                {/* Card corner accent */}
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none transition-opacity duration-500 opacity-60 group-hover:opacity-100">
                  <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-l from-nox-red/40 to-transparent" />
                  <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-nox-red/40 to-transparent" />
                </div>

                <div className="relative">
                  <div className="flex items-start justify-between mb-6">
                    <span className="text-5xl font-bold text-nox-red/20 font-mono leading-none group-hover:text-nox-red/50 transition-colors duration-500">
                      {system.number}
                    </span>
                    <div className="w-9 h-9 rounded-full border border-white/[0.08] bg-white/[0.02] flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                      <ArrowRight className="w-3.5 h-3.5 text-nox-red" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-nox-white mb-4 tracking-tight">{system.title}</h3>
                  <div className="space-y-2 mb-5">
                    <div className="flex items-baseline gap-3">
                      <span className="text-[11px] font-mono font-semibold tracking-[0.2em] text-white/45 uppercase flex-shrink-0 w-16">Problem</span>
                      <span className="text-sm text-nox-white-muted">{system.problem}</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-[11px] font-mono font-semibold tracking-[0.2em] text-[#FF5A5A] uppercase flex-shrink-0 w-16">Ergebnis</span>
                      <span className="text-sm text-nox-white font-medium">{system.result}</span>
                    </div>
                  </div>
                  <p className="text-sm text-nox-white-muted leading-relaxed mb-7 flex-grow">{system.description}</p>
                  <span className="relative text-sm text-nox-white-muted group-hover:text-nox-white inline-flex items-center gap-2 transition-colors w-fit">
                    <span className="relative">
                      Details ansehen
                      <span className="absolute -bottom-0.5 left-0 h-px w-0 group-hover:w-full bg-nox-red/60 transition-all duration-500" />
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="relative py-28 px-4 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-20"
          >
            <SectionEyebrow>Prozess</SectionEyebrow>
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white leading-[1.05] tracking-[-0.02em] text-depth-red-subtle">
              Wie NOX baut.
            </h2>
          </motion.div>

          <div className="relative">
            {/* Desktop: animated progress line */}
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block absolute top-7 left-[5%] right-[5%] h-px origin-left bg-gradient-to-r from-nox-red/60 via-nox-red/30 to-transparent"
            />
            {/* Desktop: static baseline */}
            <div className="hidden lg:block absolute top-7 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

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
                      {/* Ambient breathing glow */}
                      <div
                        className="absolute inset-0 bg-nox-red/20 blur-xl rounded-full animate-breath opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ animationDelay: `${i * 0.3}s` }}
                      />
                      {/* Hover ring */}
                      <div className="absolute -inset-1 rounded-2xl border border-nox-red/0 group-hover:border-nox-red/30 transition-all duration-500" />
                      {/* Tile */}
                      <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-[#121212] to-[#070707] border border-nox-red/20 group-hover:border-nox-red/60 flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_24px_-12px_rgba(201,48,48,0.4)] group-hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_14px_32px_-10px_rgba(201,48,48,0.7)] transition-all duration-500 group-hover:-translate-y-0.5">
                        <span className="text-base font-bold text-nox-red font-mono tracking-wider transition-all duration-500 group-hover:text-[#FF5A5A]">{step.number}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-nox-white mb-2 tracking-tight transition-colors duration-300">{step.title}</h3>
                      <p className="text-sm text-nox-white-muted group-hover:text-nox-white-muted/95 leading-relaxed transition-colors duration-300">{step.description}</p>
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
              {/* Floating bolt accent */}
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
              <Link to="/configurator">
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

      {/* ─── GETVOIDRA BRIDGE ─── */}
      <section className="py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8 p-8 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.015] to-transparent overflow-hidden group hover:border-white/[0.1] transition-all duration-500"
          >
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-nox-red/[0.03] blur-[60px] pointer-events-none" />
            <div className="relative">
              <p className="text-[14px] font-mono font-bold tracking-[0.24em] text-[#FF6B6B] uppercase mb-3">Entry Layer <span className="text-white/40">·</span> GetVoidra</p>
              <h3 className="text-lg font-bold text-nox-white mb-2 tracking-tight">Der produktisierte NOX-Layer.</h3>
              <p className="text-nox-white-muted text-sm max-w-md leading-relaxed">
                Ready-to-deploy Add-Ons und kleinere Systeme — schnelle Deployments, schmaler Scope, klarer Einstieg in die NOX-Architektur.
              </p>
            </div>
            <div className="relative flex-shrink-0">
              <Link to="/systems">
                <button className="px-6 py-3 text-sm font-semibold text-nox-white border border-white/[0.15] rounded-lg hover:border-white/[0.3] hover:bg-white/[0.04] transition-all duration-300 inline-flex items-center gap-2 group/btn">
                  Entry-Systeme ansehen
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="relative py-40 px-4 border-t border-white/[0.04] mt-14 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-nox-red/[0.06] blur-[140px] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-nox-red/30 to-transparent" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 blur-2xl bg-nox-red/30 scale-150 animate-breath" />
                <NoxBolt className="relative w-10 h-14" />
              </div>
            </div>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1] tracking-[-0.025em] text-balance">
              <span className="text-gradient-red">Systeme,</span>
              <br />
              <span className="text-nox-red">die liefern.</span>
            </h2>
            <p className="text-nox-white-muted text-lg mb-12 max-w-md mx-auto leading-relaxed">
              Klarer Scope. Messbarer Output. Kein Overhead.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
