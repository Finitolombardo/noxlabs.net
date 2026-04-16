import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Users,
  Clock,
  GitMerge,
  AlertCircle,
  Mail,
  BarChart2,
} from 'lucide-react';
import HeroOrchestration from '../components/UI/HeroOrchestration';
import NoxBolt from '../components/UI/NoxBolt';

const problems = [
  {
    icon: Users,
    title: 'Leads gehen verloren',
    description: 'Manuelle Prozesse und fehlende Struktur lassen qualifizierte Kontakte unbearbeitet liegen.',
  },
  {
    icon: Clock,
    title: 'Langsame Response-Zeiten',
    description: 'Follow-up passiert zu spät — der Moment ist vorbei, der Interessent kalt.',
  },
  {
    icon: GitMerge,
    title: 'Tools sprechen nicht miteinander',
    description: 'CRM, E-Mail, Kalender, Ads — Silos statt System. Keine gemeinsame Datenbasis.',
  },
  {
    icon: AlertCircle,
    title: 'Manuelles Chaos skaliert nicht',
    description: 'Was bei 10 Leads funktioniert, kollabiert bei 100. Wachstum erfordert Struktur.',
  },
  {
    icon: Mail,
    title: 'Schwaches Follow-up',
    description: 'Keine systematische Nachverfolgung bedeutet verlorene Deals und vergessene Chancen.',
  },
  {
    icon: BarChart2,
    title: 'Kein Überblick',
    description: 'Ohne Visibility über den gesamten Workflow lassen sich keine fundierten Entscheidungen treffen.',
  },
];

const systems = [
  {
    number: '01',
    title: 'Lead Generation Engine',
    problem: 'Zu wenig qualifizierte Leads im System',
    result: 'Kontinuierlicher, strukturierter Lead-Zufluss',
    description:
      'Automatisiertes System zur Identifikation, Erfassung und Anreicherung von Zielkontakten — über Outreach, Scraping und Signal-Monitoring.',
    href: '/systems/leadforge',
  },
  {
    number: '02',
    title: 'AI Intake & Qualifizierung',
    problem: 'Leads werden nicht qualifiziert — oder zu spät',
    result: 'Sofortige, automatisierte Erstqualifizierung',
    description:
      'KI-gestütztes System zur automatischen Qualifizierung eingehender Anfragen — mit Scoring, Routing und CRM-Integration.',
    href: '/systems',
  },
  {
    number: '03',
    title: 'CRM & Workflow-Integration',
    problem: 'Tools arbeiten isoliert, Daten gehen verloren',
    result: 'Verbundene Infrastruktur mit klarem Datenfluss',
    description:
      'Verbindet CRM, E-Mail, Kalender und Ops-Tools zu einem kohärenten System. Kein manueller Datentransfer, keine Silos.',
    href: '/systems',
  },
  {
    number: '04',
    title: 'Content & SEO Intelligence',
    problem: 'Content produziert, aber keine organische Skalierung',
    result: 'Systematisch skalierender organischer Traffic',
    description:
      'Lernendes System, das aus Markt- und Nutzersignalen strukturiertes Content-Wissen aufbaut und skalierbar macht.',
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
  'Systeme statt Hacks — nachhaltig, nicht kurzfristig',
  'Struktur statt Chaos — klare Architektur von Anfang an',
  'Leverage statt Mehrarbeit — mehr Output, weniger manuelle Arbeit',
  'Modular und skalierbar — gebaut, um zu wachsen',
  'Ergebnisgebunden — kein Consulting, keine Floskeln',
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
    <div className="flex items-center gap-3 mb-5">
      <span className="w-6 h-px bg-nox-red/70" />
      <span className="text-[11px] font-mono tracking-[0.35em] text-nox-red/80 uppercase">
        {children}
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen relative">

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden noise">
        {/* Deep atmospheric base */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(18,8,10,1)_0%,#050505_60%,#030303_100%)]" />

        {/* Orchestration network */}
        <div className="absolute inset-0 mask-radial-fade">
          <HeroOrchestration />
        </div>

        {/* Vertical light beam */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-[55%] bg-gradient-to-b from-transparent via-nox-red/25 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-[45%] bg-gradient-to-t from-transparent via-nox-red/15 to-transparent pointer-events-none" />

        {/* Hero glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-red-950/25 blur-[160px] pointer-events-none animate-glow-pulse" />

        {/* Fade to page */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#070707] via-[#070707]/80 to-transparent z-10 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Lightning Bolt brand mark */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center mb-8 relative"
          >
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-nox-red/40 scale-150 animate-breath" />
              <NoxBolt className="relative w-14 h-20 md:w-16 md:h-24 drop-shadow-[0_0_24px_rgba(201,48,48,0.5)]" />
            </div>
          </motion.div>

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="flex justify-center mb-7"
          >
            <span className="text-[11px] font-mono tracking-[0.4em] text-nox-white-muted/80 uppercase px-5 py-2 border border-white/[0.08] rounded-full bg-white/[0.02] backdrop-blur-sm">
              <span className="text-nox-red/90">NOX</span> · High-End AI Systems
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-[5.75rem] font-bold mb-7 leading-[1.02] tracking-[-0.02em] text-balance"
          >
            <span className="text-gradient-red">KI-Systeme für</span>
            <br />
            <span className="text-nox-red relative inline-block">
              skalierbares Wachstum.
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nox-red/60 to-transparent" />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.9 }}
            className="text-lg md:text-xl text-nox-white-muted mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            NOX Labs baut Systeme für Lead-Generierung, Qualifizierung, Workflow-Automatisierung und Business-Leverage — strukturiert, messbar, ohne Experimente.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/contact">
              <button className="group relative px-8 py-4 bg-nox-red text-white font-semibold rounded-lg hover:bg-nox-red-deep transition-all duration-300 inline-flex items-center gap-2.5 shadow-[0_0_0_1px_rgba(232,64,64,0.25),0_12px_40px_-8px_rgba(201,48,48,0.55)] hover:shadow-[0_0_0_1px_rgba(232,64,64,0.4),0_18px_48px_-8px_rgba(201,48,48,0.7)] overflow-hidden">
                <span className="relative z-10">Book a Call</span>
                <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              </button>
            </Link>
            <Link to="/systems">
              <button className="px-8 py-4 bg-white/[0.02] backdrop-blur-sm text-nox-white font-semibold rounded-lg border border-white/[0.12] hover:border-white/[0.28] hover:bg-white/[0.05] transition-all duration-300 inline-flex items-center gap-2.5">
                Explore Systems
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
            <span className="text-[10px] font-mono tracking-[0.3em] text-white/30 uppercase">Scroll</span>
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
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-5 leading-[1.1] tracking-[-0.01em]">
              Was euch täglich<br />Wachstum kostet.
            </h2>
            <p className="text-nox-white-muted max-w-lg leading-relaxed text-[15px]">
              Die meisten Businesses haben nicht zu wenig Potenzial — sie haben zu viel strukturellen Lärm.
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
                    <div className="w-10 h-10 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-5 group-hover:border-nox-red/30 group-hover:bg-nox-red/[0.08] transition-all duration-500">
                      <Icon className="w-4 h-4 text-nox-red/70 group-hover:text-nox-red transition-colors" />
                    </div>
                    <h3 className="text-base font-semibold text-nox-white mb-2.5 tracking-tight">{problem.title}</h3>
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
            <SectionEyebrow>Systeme</SectionEyebrow>
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-5 leading-[1.1] tracking-[-0.01em]">
              Die Infrastruktur<br />für Wachstum.
            </h2>
            <p className="text-nox-white-muted max-w-lg leading-relaxed text-[15px]">
              Keine Tool-Sammlung. Keine Experimente. Systeme mit klarem Scope, definiertem Ergebnis und skalierbarer Architektur.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {systems.map((system, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="group relative bg-gradient-to-br from-[#0f0f0f] to-[#080808] border border-white/[0.07] rounded-2xl p-8 hover:border-nox-red/25 transition-all duration-500 flex flex-col overflow-hidden"
                style={{
                  boxShadow: '0 20px 60px -20px rgba(0,0,0,0.8)',
                }}
              >
                {/* Hover glow */}
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-nox-red/0 group-hover:bg-nox-red/[0.1] blur-[80px] transition-all duration-700 pointer-events-none" />

                {/* Card corner accent */}
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                  <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-l from-nox-red/30 to-transparent" />
                  <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-nox-red/30 to-transparent" />
                </div>

                <div className="relative">
                  <div className="flex items-start justify-between mb-6">
                    <span className="text-5xl font-bold text-nox-red/20 font-mono leading-none group-hover:text-nox-red/40 transition-colors duration-500">
                      {system.number}
                    </span>
                    <div className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <ArrowRight className="w-3.5 h-3.5 text-nox-red" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-nox-white mb-4 tracking-tight">{system.title}</h3>
                  <div className="space-y-2 mb-5">
                    <div className="flex items-baseline gap-3">
                      <span className="text-[10px] font-mono tracking-widest text-gray-600 uppercase flex-shrink-0 w-14">Problem</span>
                      <span className="text-sm text-nox-white-muted">{system.problem}</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-[10px] font-mono tracking-widest text-nox-red/60 uppercase flex-shrink-0 w-14">Result</span>
                      <span className="text-sm text-nox-white font-medium">{system.result}</span>
                    </div>
                  </div>
                  <p className="text-sm text-nox-white-muted leading-relaxed mb-7 flex-grow">{system.description}</p>
                  <Link
                    to={system.href}
                    className="text-sm text-nox-white-muted hover:text-nox-white inline-flex items-center gap-2 transition-colors w-fit"
                  >
                    Details ansehen
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
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
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white leading-[1.1] tracking-[-0.01em]">
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
                <motion.div key={i} variants={fadeUp} className="relative">
                  <div className="flex lg:flex-col items-start gap-5 lg:gap-0">
                    <div className="relative flex-shrink-0 lg:mb-6">
                      <div className="absolute inset-0 bg-nox-red/20 blur-xl rounded-full animate-breath" style={{ animationDelay: `${i * 0.3}s` }} />
                      <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-[#121212] to-[#080808] border border-nox-red/20 flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_24px_-12px_rgba(201,48,48,0.4)]">
                        <span className="text-base font-bold text-nox-red font-mono tracking-wider">{step.number}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-nox-white mb-2 tracking-tight">{step.title}</h3>
                      <p className="text-sm text-nox-white-muted leading-relaxed">{step.description}</p>
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
              <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-6 leading-[1.1] tracking-[-0.01em]">
                Kein generisches<br />AI Consulting.
              </h2>
              <p className="text-nox-white-muted leading-relaxed text-[15px] max-w-md">
                NOX Labs baut operative Systeme, die an echten Business-Ergebnissen gemessen werden. Kein Berater-Sprech, keine Random-Automatisierungen, kein Aufwand ohne Output.
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

              <SectionEyebrow>Solution Finder</SectionEyebrow>
              <h2 className="text-3xl md:text-4xl font-bold text-nox-white mb-5 leading-tight tracking-tight">
                Welche Systeme braucht<br />dein Business?
              </h2>
              <p className="text-nox-white-muted leading-relaxed mb-10 max-w-xl mx-auto">
                Gib deine Situation, Tools, Bottlenecks und Ziele ein — und erhalte die passende NOX System-Kombination für dein Business.
              </p>
              <Link to="/configurator">
                <button className="group relative px-8 py-4 bg-nox-red text-white font-semibold rounded-lg hover:bg-nox-red-deep transition-all duration-300 inline-flex items-center gap-2.5 shadow-[0_0_0_1px_rgba(232,64,64,0.25),0_16px_48px_-8px_rgba(201,48,48,0.6)] hover:shadow-[0_0_0_1px_rgba(232,64,64,0.4),0_20px_56px_-8px_rgba(201,48,48,0.75)] overflow-hidden">
                  <span className="relative z-10">Start Solution Finder</span>
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
              <p className="text-[10px] font-mono tracking-[0.3em] text-gray-600 uppercase mb-2">Entry Layer</p>
              <h3 className="text-lg font-bold text-nox-white mb-2 tracking-tight">Schneller starten mit GetVoidra</h3>
              <p className="text-nox-white-muted text-sm max-w-md leading-relaxed">
                Für kleinere, sofort einsatzreiche Systeme und Einstiegsautomatisierungen: GetVoidra ist der produktisierte NOX-Layer für schnelle Deployments ohne großen Scope.
              </p>
            </div>
            <div className="relative flex-shrink-0">
              <Link to="/systems">
                <button className="px-6 py-3 text-sm font-semibold text-nox-white border border-white/[0.15] rounded-lg hover:border-white/[0.3] hover:bg-white/[0.04] transition-all duration-300 inline-flex items-center gap-2 group/btn">
                  Entry Systems ansehen
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
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.02] tracking-[-0.02em] text-balance">
              <span className="text-gradient-red">Bereit für Systeme,</span>
              <br />
              <span className="text-nox-red">die funktionieren?</span>
            </h2>
            <p className="text-nox-white-muted text-lg mb-12 max-w-md mx-auto leading-relaxed">
              Kein Consulting-Sprech. Kein Overhead. Systeme mit klarem Scope und messbarem Ergebnis.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/contact">
                <button className="group relative px-8 py-4 bg-nox-red text-white font-semibold rounded-lg hover:bg-nox-red-deep transition-all duration-300 inline-flex items-center gap-2.5 shadow-[0_0_0_1px_rgba(232,64,64,0.25),0_16px_48px_-8px_rgba(201,48,48,0.6)] hover:shadow-[0_0_0_1px_rgba(232,64,64,0.45),0_20px_56px_-8px_rgba(201,48,48,0.8)] overflow-hidden">
                  <span className="relative z-10">Book a Call</span>
                  <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                </button>
              </Link>
              <Link to="/systems">
                <button className="px-8 py-4 bg-white/[0.02] backdrop-blur-sm text-nox-white font-semibold rounded-lg border border-white/[0.12] hover:border-white/[0.28] hover:bg-white/[0.05] transition-all duration-300 inline-flex items-center gap-2.5">
                  Explore Systems
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
