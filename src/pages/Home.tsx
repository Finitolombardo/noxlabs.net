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
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export default function Home() {
  return (
    <div className="min-h-screen">

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#070707] to-transparent z-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-red-950/20 blur-[140px] animate-glow-pulse" />
          <div className="absolute top-1/4 right-1/3 w-[300px] h-[300px] rounded-full bg-red-900/10 blur-[100px]" />
          <div className="absolute bottom-1/3 left-1/4 w-[250px] h-[250px] rounded-full bg-gray-800/15 blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-[40%] bg-gradient-to-b from-transparent via-nox-red/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex justify-center mb-10"
          >
            <img
              src="/dein_abschnittstext_(2).png"
              alt="NOX Labs"
              className="w-56 md:w-72 h-auto object-contain opacity-90"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <span className="text-[11px] font-mono tracking-[0.35em] text-nox-red/80 uppercase px-5 py-2 border border-nox-red/25 rounded-full bg-nox-red/[0.06]">
              High-End AI Systems
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.9 }}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold text-nox-white mb-6 leading-[1.04] tracking-tight"
          >
            KI-Systeme für
            <br />
            <span className="text-nox-red">skalierbares Wachstum.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg md:text-xl text-nox-white-muted mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            NOX Labs baut Systeme für Lead-Generierung, Qualifizierung, Workflow-Automatisierung und Business-Leverage — strukturiert, messbar, ohne Experimente.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/contact">
              <button className="group px-8 py-4 bg-nox-red text-white font-semibold rounded-lg hover:bg-nox-red-deep transition-all duration-300 inline-flex items-center gap-2.5 shadow-lg shadow-nox-red/20 hover:shadow-nox-red/30">
                Book a Call
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <Link to="/systems">
              <button className="px-8 py-4 bg-transparent text-nox-white font-semibold rounded-lg border border-white/[0.18] hover:border-white/[0.35] hover:bg-white/[0.04] transition-all duration-300 inline-flex items-center gap-2.5">
                Explore Systems
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── PROBLEMS ─── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-14"
          >
            <p className="text-[11px] font-mono tracking-[0.35em] text-nox-red/70 uppercase mb-4">Das Problem</p>
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-4 max-w-2xl leading-tight">
              Was euch täglich Wachstum kostet.
            </h2>
            <p className="text-nox-white-muted max-w-lg leading-relaxed">
              Die meisten Businesses haben nicht zu wenig Potenzial — sie haben zu viel strukturellen Lärm.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.05]"
          >
            {problems.map((problem, i) => {
              const Icon = problem.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="bg-[#070707] p-8 hover:bg-gray-900/30 transition-colors duration-300 group"
                >
                  <Icon className="w-5 h-5 text-nox-red/80 mb-5 group-hover:text-nox-red transition-colors" />
                  <h3 className="text-base font-semibold text-nox-white mb-2">{problem.title}</h3>
                  <p className="text-sm text-nox-white-muted leading-relaxed">{problem.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── CORE SYSTEMS ─── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-14"
          >
            <p className="text-[11px] font-mono tracking-[0.35em] text-nox-red/70 uppercase mb-4">Systeme</p>
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-4 leading-tight">
              Die Infrastruktur für Wachstum.
            </h2>
            <p className="text-nox-white-muted max-w-lg leading-relaxed">
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
                className="group bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] border border-white/[0.07] rounded-2xl p-8 hover:border-white/[0.13] hover:from-[#111] hover:to-[#0d0d0d] transition-all duration-300 flex flex-col"
              >
                <span className="text-5xl font-bold text-nox-red/20 font-mono leading-none mb-6 block">{system.number}</span>
                <h3 className="text-xl font-bold text-nox-white mb-4">{system.title}</h3>
                <div className="space-y-2 mb-5">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[10px] font-mono tracking-widest text-gray-600 uppercase flex-shrink-0">Problem</span>
                    <span className="text-sm text-nox-white-muted">{system.problem}</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-[10px] font-mono tracking-widest text-nox-red/50 uppercase flex-shrink-0">Result</span>
                    <span className="text-sm text-nox-white font-medium">{system.result}</span>
                  </div>
                </div>
                <p className="text-sm text-nox-white-muted leading-relaxed mb-7 flex-grow">{system.description}</p>
                <Link
                  to={system.href}
                  className="text-sm text-nox-white-muted hover:text-nox-white inline-flex items-center gap-2 transition-colors"
                >
                  Details ansehen
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 px-4 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <p className="text-[11px] font-mono tracking-[0.35em] text-nox-red/70 uppercase mb-4">Prozess</p>
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white leading-tight">
              Wie NOX baut.
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4"
          >
            {processSteps.map((step, i) => (
              <motion.div key={i} variants={fadeUp} className="relative">
                <div className="flex lg:flex-col items-start gap-5 lg:gap-0">
                  <div className="w-14 h-14 rounded-xl bg-[#0f0f0f] border border-white/[0.07] flex items-center justify-center flex-shrink-0 lg:mb-6">
                    <span className="text-lg font-bold text-nox-red font-mono">{step.number}</span>
                  </div>
                  <div className="lg:mt-0">
                    <h3 className="text-base font-bold text-nox-white mb-2">{step.title}</h3>
                    <p className="text-sm text-nox-white-muted leading-relaxed">{step.description}</p>
                  </div>
                </div>
                {i < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-full w-full h-px bg-gradient-to-r from-white/[0.06] to-transparent -translate-x-4 translate-y-0" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── WHY NOX ─── */}
      <section className="py-24 px-4 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[11px] font-mono tracking-[0.35em] text-nox-red/70 uppercase mb-4">Warum NOX</p>
              <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-6 leading-tight">
                Kein generisches<br />AI Consulting.
              </h2>
              <p className="text-nox-white-muted leading-relaxed text-lg">
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
                  className="flex items-start gap-4 p-5 rounded-xl border border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.02] transition-all duration-300"
                >
                  <div className="w-5 h-5 rounded-full bg-nox-red/[0.15] border border-nox-red/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-nox-red" />
                  </div>
                  <span className="text-nox-white-muted leading-relaxed text-sm">{item}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── SOLUTION FINDER ─── */}
      <section className="py-24 px-4 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-nox-red/[0.08] blur-[80px]" />
            </div>
            <div className="relative bg-[#0c0c0c] border border-nox-red/[0.2] rounded-3xl p-12 md:p-16 text-center">
              <p className="text-[11px] font-mono tracking-[0.35em] text-nox-red/70 uppercase mb-5">Solution Finder</p>
              <h2 className="text-3xl md:text-4xl font-bold text-nox-white mb-4 leading-tight">
                Welche Systeme braucht dein Business?
              </h2>
              <p className="text-nox-white-muted leading-relaxed mb-10 max-w-xl mx-auto">
                Gib deine Situation, Tools, Bottlenecks und Ziele ein — und erhalte die passende NOX System-Kombination für dein Business.
              </p>
              <Link to="/configurator">
                <button className="group px-8 py-4 bg-nox-red text-white font-semibold rounded-lg hover:bg-nox-red-deep transition-all duration-300 inline-flex items-center gap-2.5 shadow-lg shadow-nox-red/25">
                  Start Solution Finder
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── GETVOIDRA BRIDGE ─── */}
      <section className="py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 p-8 rounded-2xl border border-white/[0.06] bg-white/[0.015]"
          >
            <div>
              <p className="text-[10px] font-mono tracking-[0.3em] text-gray-600 uppercase mb-2">Entry Layer</p>
              <h3 className="text-lg font-bold text-nox-white mb-2">Schneller starten mit GetVoidra</h3>
              <p className="text-nox-white-muted text-sm max-w-md leading-relaxed">
                Für kleinere, sofort einsatzreiche Systeme und Einstiegsautomatisierungen: GetVoidra ist der produktisierte NOX-Layer für schnelle Deployments ohne großen Scope.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link to="/systems">
                <button className="px-6 py-3 text-sm font-semibold text-nox-white border border-white/[0.15] rounded-lg hover:border-white/[0.3] hover:bg-white/[0.04] transition-all duration-300 inline-flex items-center gap-2">
                  Entry Systems ansehen
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-36 px-4 border-t border-white/[0.04] mt-14">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-nox-white mb-6 leading-[1.04] tracking-tight">
              Bereit für Systeme,<br />
              <span className="text-nox-red">die funktionieren?</span>
            </h2>
            <p className="text-nox-white-muted text-lg mb-12 max-w-md mx-auto leading-relaxed">
              Kein Consulting-Sprech. Kein Overhead. Systeme mit klarem Scope und messbarem Ergebnis.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/contact">
                <button className="group px-8 py-4 bg-nox-red text-white font-semibold rounded-lg hover:bg-nox-red-deep transition-all duration-300 inline-flex items-center gap-2.5 shadow-lg shadow-nox-red/25">
                  Book a Call
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </Link>
              <Link to="/systems">
                <button className="px-8 py-4 bg-transparent text-nox-white font-semibold rounded-lg border border-white/[0.18] hover:border-white/[0.35] hover:bg-white/[0.04] transition-all duration-300 inline-flex items-center gap-2.5">
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
