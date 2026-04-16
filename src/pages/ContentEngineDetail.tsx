import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Search,
  Brain,
  LayoutGrid,
  Sparkles,
  FileText,
  CalendarClock,
  Repeat,
  Target,
  Youtube,
  TrendingUp,
  Eye,
  Users,
  Lightbulb,
  ListChecks,
  Play,
} from 'lucide-react';
import NoxBolt from '../components/UI/NoxBolt';

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

const problems = [
  {
    icon: Lightbulb,
    title: 'Themen werden geraten',
    description: 'Content-Ideen entstehen aus Bauchgefühl — nicht aus validierter Nachfrage oder Marktbewegung.',
  },
  {
    icon: Target,
    title: 'Hooks sind zu schwach',
    description: 'Ohne systematisches Hook-System verliert Content in den ersten Sekunden die Aufmerksamkeit.',
  },
  {
    icon: LayoutGrid,
    title: 'Formate sind inkonsistent',
    description: 'Jedes Video ein neues Experiment — keine wiederholbare Struktur, keine skalierbare Wirkung.',
  },
  {
    icon: Repeat,
    title: 'Kein Learning-Loop',
    description: 'Performance-Daten werden angesehen, aber nicht in den nächsten Zyklus übersetzt.',
  },
  {
    icon: Eye,
    title: 'Publishing ohne Plan',
    description: 'Posting-Frequenz und Reihenfolge sind zufällig — die Engine hat keinen strukturellen Rhythmus.',
  },
  {
    icon: TrendingUp,
    title: 'Reichweite ohne Autorität',
    description: 'Views ohne Positionierung erzeugen kein Vertrauen — und kein Vertrauen, keine Nachfrage.',
  },
];

const layers = [
  {
    number: '01',
    icon: Search,
    title: 'Research Layer',
    description:
      'Systematische Analyse von Markt, Zielgruppe, Plattform und Wettbewerb. Signal statt Bauchgefühl — die Datengrundlage für jede Entscheidung im System.',
  },
  {
    number: '02',
    icon: Brain,
    title: 'Topic Intelligence Layer',
    description:
      'Themen-Cluster, Prioritäten und Content-Winkel werden identifiziert, bewertet und in eine strukturierte Pipeline übersetzt.',
  },
  {
    number: '03',
    icon: LayoutGrid,
    title: 'Format Layer',
    description:
      'Wiederholbare Formate, Storylines und Strukturen — die Basis für Skalierung und konsistente Wiedererkennbarkeit.',
  },
  {
    number: '04',
    icon: Sparkles,
    title: 'Hook & Title Layer',
    description:
      'Hooks und Titel werden auf Basis von Pattern-Intelligenz generiert, geprüft und systematisch optimiert — nicht zufällig formuliert.',
  },
  {
    number: '05',
    icon: FileText,
    title: 'Script / Outline Layer',
    description:
      'Strukturierte Outlines und Scripts mit klarer Dramaturgie, CTA-Logik und Positionierungslinie — produktionsreif, nicht generisch.',
  },
  {
    number: '06',
    icon: CalendarClock,
    title: 'Publishing Layer',
    description:
      'Queue-Management, Publishing-Rhythmus, Variationen und Sequenzlogik — Content wird orchestriert, nicht nur veröffentlicht.',
  },
  {
    number: '07',
    icon: Repeat,
    title: 'Learning Layer',
    description:
      'CTR, Watchtime, Retention und Audience-Response fließen zurück ins System und verändern die nächste Runde an Themen, Hooks und Formaten.',
  },
];

const outputs = [
  'Strukturierte Themen-Listen',
  'Priorisierte Content-Ideen',
  'Hook-Varianten pro Thema',
  'Titel-Alternativen mit Performance-Logik',
  'Outlines und Dramaturgie-Gerüste',
  'Produktionsreife Scripts',
  'Publishing-Queue mit Sequenzlogik',
  'Repurposing-Ideen (Short-Form, Posts)',
  'CTA-Varianten auf Angebot und Funnel',
];

const learningSignals = [
  {
    icon: Eye,
    title: 'Click-Through-Rate',
    description: 'Welche Hooks und Titel wirklich Aufmerksamkeit erzeugen — nicht nur intern gut klingen.',
  },
  {
    icon: Play,
    title: 'Watchtime & Retention',
    description: 'Welche Formate und Dramaturgien Zuschauer halten — und wo Content strukturell abbricht.',
  },
  {
    icon: Users,
    title: 'Audience-Response',
    description: 'Kommentare, Shares und Reaktionen als qualitatives Signal für Resonanz und Positionierung.',
  },
  {
    icon: Target,
    title: 'Conversion zu Community',
    description: 'Wie Content in Skool / Community / Angebot übersetzt — welche Themen echte Nachfrage auslösen.',
  },
  {
    icon: TrendingUp,
    title: 'Topic-Cluster-Performance',
    description: 'Welche Themen-Felder wachsen, sich verstärken und als Autoritäts-Anker funktionieren.',
  },
];

const mvpItems = [
  'Themen sammeln und strukturiert ablegen',
  'Themen clustern und Prioritäten setzen',
  'Hooks, Titel und Outlines generieren',
  'Publishing-Queue verwalten',
  'Performance-Feedback manuell oder semi-automatisch zurückführen',
];

const roadmapItems = [
  'Automatisches Clustering aus Performance-Signalen',
  'Follow-up-Video-Vorschläge aus Topic-Verhalten',
  'Short-Form-Extraktion aus Long-Form-Content',
  'CTA-Optimierung auf Funnel-Daten',
  'Script-Mutation und Variations-Testing',
  'Stärkere Self-Learning-Loops über alle Layer',
  'Integrationen für Avatar-Video, Rendering, Publishing',
];

const ecosystem = [
  {
    number: '01',
    title: 'Leadgen Engine',
    role: 'Demand',
    description: 'Erzeugt strukturierten Zufluss an qualifizierter Nachfrage — das Fundament der Pipeline.',
    href: '/systems/leadforge',
  },
  {
    number: '02',
    title: 'Pitch Mutation Engine',
    role: 'Message',
    description: 'Testet, lernt und evolviert die Verkaufsbotschaft — Message-Market-Fit als System, nicht als Zufall.',
    href: '/systems/pitch-evolution-system',
  },
  {
    number: '03',
    title: 'YouTube Engine',
    role: 'Authority',
    description: 'Baut Autorität, Reichweite und Vertrauen — speist Community, Nachfrage und Funnel-Oberkante.',
    href: '/systems/content-engine',
    active: true,
  },
];

export default function ContentEngineDetail() {
  return (
    <div className="min-h-screen relative">

      {/* ─── HERO ─── */}
      <section className="relative min-h-[90vh] flex items-start justify-center px-4 pt-40 md:pt-48 pb-24 overflow-x-clip noise">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(18,8,10,1)_0%,#050505_60%,#030303_100%)]" />

        {/* Vertical beams */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-[48%] bg-gradient-to-b from-transparent via-nox-red/30 to-nox-red/60 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-[52%] bg-gradient-to-t from-transparent via-nox-red/15 to-nox-red/50 pointer-events-none" />

        {/* Ambient glows */}
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full bg-nox-red/[0.14] blur-[120px] pointer-events-none animate-glow-pulse" />
        <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] rounded-full bg-red-950/25 blur-[180px] pointer-events-none" />

        {/* Fade to page */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#070707] via-[#070707]/80 to-transparent z-10 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <Link
              to="/systems"
              className="inline-flex items-center gap-2 text-[11px] font-mono font-semibold tracking-[0.28em] uppercase text-white/55 hover:text-nox-red transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Zurück zu Systemen
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="flex justify-center mb-8"
          >
            <span className="text-[12px] font-mono font-semibold tracking-[0.32em] text-white/80 uppercase px-5 py-2.5 border border-white/[0.14] rounded-full bg-white/[0.035] backdrop-blur-sm inline-flex items-center gap-2">
              <Youtube className="w-3.5 h-3.5 text-[#FF5A5A]" />
              <span className="text-[#FF5A5A]">Engine 03</span>
              <span className="text-white/40 mx-1">·</span>
              Authority · Reach · Trust
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold mb-6 leading-[1] tracking-[-0.025em] text-balance"
          >
            <span className="text-gradient-red">YouTube Engine.</span>
            <br />
            <span className="text-nox-red relative inline-block">
              Autorität als System.
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nox-red/70 to-transparent" />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.9 }}
            className="text-lg md:text-xl text-nox-white-muted/90 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Ein lernendes Content-System für Themen, Hooks, Struktur, Publishing und Feedback-Loops —
            gebaut, um Aufmerksamkeit in Vertrauen und Vertrauen in Nachfrage zu verwandeln.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/contact">
              <button className="group relative px-8 py-4 bg-nox-red text-white font-semibold rounded-lg hover:bg-nox-red-deep transition-all duration-300 inline-flex items-center gap-2.5 shadow-[0_0_0_1px_rgba(232,64,64,0.25),0_12px_40px_-8px_rgba(201,48,48,0.55)] hover:shadow-[0_0_0_1px_rgba(232,64,64,0.4),0_18px_48px_-8px_rgba(201,48,48,0.7)] overflow-hidden">
                <span className="relative z-10">Gespräch buchen</span>
                <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              </button>
            </Link>
            <a href="#architektur">
              <button className="px-8 py-4 bg-white/[0.02] backdrop-blur-sm text-nox-white font-semibold rounded-lg border border-white/[0.12] hover:border-white/[0.28] hover:bg-white/[0.05] transition-all duration-300 inline-flex items-center gap-2.5">
                Architektur ansehen
                <ArrowRight className="w-4 h-4" />
              </button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── WHAT IT IS ─── */}
      <section className="relative py-28 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-10"
          >
            <SectionEyebrow>Was sie ist</SectionEyebrow>
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-6 leading-[1.05] tracking-[-0.02em] text-depth-red-subtle">
              Keine Video-Automation.<br />Eine Content-Intelligenz.
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="relative bg-gradient-to-br from-[#0f0f0f] to-[#070707] border border-white/[0.07] rounded-2xl p-8">
              <p className="text-[11px] font-mono font-bold tracking-[0.26em] text-white/45 uppercase mb-4">Sie ist nicht</p>
              <ul className="space-y-3 text-[15px] text-nox-white-muted leading-relaxed">
                <li>— ein Script-Generator</li>
                <li>— ein Thumbnail-Tool</li>
                <li>— ein generisches Posting-System</li>
                <li>— ein AI-Automatisierungs-Trick</li>
              </ul>
            </div>
            <div className="relative bg-gradient-to-br from-[#0f0f0f] to-[#070707] border border-nox-red/30 rounded-2xl p-8 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-nox-red/[0.14] blur-[90px] pointer-events-none" />
              <p className="text-[11px] font-mono font-bold tracking-[0.26em] text-[#FF6B6B] uppercase mb-4">Sie ist</p>
              <ul className="space-y-3 text-[15px] text-nox-white leading-relaxed relative">
                <li>— ein Research- und Topic-System</li>
                <li>— ein Hook- und Format-System</li>
                <li>— ein Script- und Publishing-System</li>
                <li>— ein Learning-Loop für Autorität und Nachfrage</li>
              </ul>
            </div>
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
            <SectionEyebrow>Warum sie existiert</SectionEyebrow>
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-5 leading-[1.05] tracking-[-0.02em] text-depth-red-subtle">
              Reichweite<br />ohne Struktur.
            </h2>
            <p className="text-nox-white-muted max-w-lg leading-relaxed text-[15px]">
              Content ist kein Kreativitätsproblem. Content ist ein Systemproblem — die meisten Creator posten ohne strukturelle Wachstumslogik.
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
                    <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#161012] to-[#0a0707] border border-nox-red/15 flex items-center justify-center mb-5 group-hover:border-nox-red/50 transition-all duration-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_4px_12px_-4px_rgba(201,48,48,0.25)]">
                      <Icon className="relative w-[18px] h-[18px] text-[#E84040] group-hover:text-[#FF5A5A] transition-colors duration-500" strokeWidth={2.25} />
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

      {/* ─── CORE LAYERS ─── */}
      <section id="architektur" className="relative py-28 px-4">
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-nox-red/[0.04] blur-[100px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 max-w-3xl"
          >
            <SectionEyebrow>Architektur</SectionEyebrow>
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-5 leading-[1.05] tracking-[-0.02em] text-depth-red-subtle">
              Sieben Layer.<br />Eine Engine.
            </h2>
            <p className="text-nox-white-muted max-w-xl leading-relaxed text-[15px]">
              Jede Ebene hat eine klar definierte Rolle — von der ersten Recherche bis zum Feedback-Signal aus dem Publikum.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {layers.map((layer, i) => {
              const Icon = layer.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                  className="group relative bg-gradient-to-br from-[#0f0f0f] to-[#070707] border border-white/[0.07] rounded-2xl p-7 hover:border-nox-red/30 transition-all duration-500 overflow-hidden"
                  style={{ boxShadow: '0 20px 60px -20px rgba(0,0,0,0.8), inset 0 1px 0 0 rgba(255,255,255,0.02)' }}
                >
                  <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-nox-red/0 group-hover:bg-nox-red/[0.1] blur-[90px] transition-all duration-700 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none transition-opacity duration-500 opacity-60 group-hover:opacity-100">
                    <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-l from-nox-red/40 to-transparent" />
                    <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-nox-red/40 to-transparent" />
                  </div>

                  <div className="relative">
                    <div className="flex items-start justify-between mb-5">
                      <span className="text-4xl font-bold text-nox-red/20 font-mono leading-none group-hover:text-nox-red/50 transition-colors duration-500">
                        {layer.number}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#161012] to-[#0a0707] border border-nox-red/20 group-hover:border-nox-red/60 flex items-center justify-center transition-all duration-500">
                        <Icon className="w-[18px] h-[18px] text-[#E84040] group-hover:text-[#FF5A5A] transition-colors" strokeWidth={2.25} />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-nox-white mb-3 tracking-tight">{layer.title}</h3>
                    <p className="text-sm text-nox-white-muted leading-relaxed">{layer.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── OUTPUTS ─── */}
      <section className="relative py-28 px-4 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-14 max-w-3xl"
          >
            <SectionEyebrow>Outputs</SectionEyebrow>
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-5 leading-[1.05] tracking-[-0.02em] text-depth-red-subtle">
              Was die Engine<br />produziert.
            </h2>
            <p className="text-nox-white-muted max-w-xl leading-relaxed text-[15px]">
              Jeder Output ist strukturierter, wiederverwendbarer Asset — kein einmaliges Ergebnis, sondern operatives Material.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {outputs.map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="group flex items-start gap-4 p-5 rounded-xl border border-white/[0.06] hover:border-nox-red/20 hover:bg-nox-red/[0.02] transition-all duration-300"
              >
                <div className="relative w-5 h-5 rounded-full bg-nox-red/[0.15] border border-nox-red/30 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-nox-red/25 transition-all">
                  <div className="w-1.5 h-1.5 rounded-full bg-nox-red" />
                </div>
                <span className="text-nox-white-muted group-hover:text-nox-white leading-relaxed text-sm transition-colors">{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── LEARNING LOOP ─── */}
      <section className="relative py-28 px-4 border-t border-white/[0.04] overflow-hidden">
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-nox-red/[0.06] blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 max-w-3xl"
          >
            <SectionEyebrow>Learning Loop</SectionEyebrow>
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-5 leading-[1.05] tracking-[-0.02em] text-depth-red-subtle">
              Das System<br />lernt mit.
            </h2>
            <p className="text-nox-white-muted max-w-xl leading-relaxed text-[15px]">
              Die YouTube Engine ist kein statischer Workflow. Sie nutzt reale Performance-Signale als Input für die nächste Content-Runde — jeder Zyklus macht das System präziser.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5"
          >
            {learningSignals.map((signal, i) => {
              const Icon = signal.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="group relative bg-gradient-to-br from-[#0f0f0f] to-[#070707] border border-white/[0.07] rounded-2xl p-6 hover:border-nox-red/30 transition-all duration-500"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#161012] to-[#0a0707] border border-nox-red/20 flex items-center justify-center mb-5 group-hover:border-nox-red/60 transition-all">
                    <Icon className="w-[18px] h-[18px] text-[#E84040] group-hover:text-[#FF5A5A] transition-colors" strokeWidth={2.25} />
                  </div>
                  <h3 className="text-sm font-bold text-nox-white mb-2 tracking-tight">{signal.title}</h3>
                  <p className="text-[13px] text-nox-white-muted leading-relaxed">{signal.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── MVP VS ROADMAP ─── */}
      <section className="relative py-28 px-4 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-14 max-w-3xl"
          >
            <SectionEyebrow>Scope</SectionEyebrow>
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-5 leading-[1.05] tracking-[-0.02em] text-depth-red-subtle">
              MVP heute.<br />Roadmap dahinter.
            </h2>
            <p className="text-nox-white-muted max-w-xl leading-relaxed text-[15px]">
              Klare Trennung zwischen operativem Setup und perspektivischer Evolution. Kein Overselling — nur ein ehrlicher Blick auf Heute und Morgen.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative bg-gradient-to-br from-[#0f0f0f] to-[#070707] border border-nox-red/30 rounded-2xl p-8 overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-nox-red/[0.14] blur-[90px] pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <ListChecks className="w-5 h-5 text-[#FF5A5A]" />
                  <span className="text-[12px] font-mono font-bold tracking-[0.28em] text-[#FF6B6B] uppercase">MVP — operativ</span>
                </div>
                <h3 className="text-2xl font-bold text-nox-white mb-5 tracking-tight">Was du sofort bekommst</h3>
                <ul className="space-y-3">
                  {mvpItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-nox-red/[0.15] border border-nox-red/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-nox-red" />
                      </div>
                      <span className="text-[14px] text-nox-white-muted leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative bg-gradient-to-br from-[#0f0f0f] to-[#070707] border border-white/[0.08] rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-white/60" />
                <span className="text-[12px] font-mono font-bold tracking-[0.28em] text-white/55 uppercase">Roadmap — Expansion</span>
              </div>
              <h3 className="text-2xl font-bold text-nox-white mb-5 tracking-tight">Was später möglich wird</h3>
              <ul className="space-y-3">
                {roadmapItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.1] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                    </div>
                    <span className="text-[14px] text-nox-white-muted leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 pt-5 border-t border-white/[0.06] text-xs text-white/45 leading-relaxed">
                Roadmap-Features sind keine zugesagten Lieferumfänge — sie zeigen die Evolutionsrichtung der Engine.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── ECOSYSTEM ROLE ─── */}
      <section className="relative py-28 px-4 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 max-w-3xl"
          >
            <SectionEyebrow>Rolle im NOX-Stack</SectionEyebrow>
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-5 leading-[1.05] tracking-[-0.02em] text-depth-red-subtle">
              Ein Ökosystem.<br />Drei Engines.
            </h2>
            <p className="text-nox-white-muted max-w-xl leading-relaxed text-[15px]">
              Die YouTube Engine arbeitet nicht isoliert. Sie ist der Autoritäts-Layer innerhalb einer dreiteiligen NOX-Architektur.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {ecosystem.map((sys, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Link
                  to={sys.href}
                  className={`group relative block bg-gradient-to-br from-[#0f0f0f] to-[#070707] border rounded-2xl p-7 transition-all duration-500 h-full ${
                    sys.active
                      ? 'border-nox-red/40 shadow-[0_30px_80px_-20px_rgba(201,48,48,0.3)]'
                      : 'border-white/[0.07] hover:border-nox-red/30'
                  }`}
                >
                  {sys.active && (
                    <div className="absolute top-4 right-4 text-[10px] font-mono font-bold tracking-[0.2em] text-[#FF6B6B] uppercase px-2 py-1 bg-nox-red/10 border border-nox-red/30 rounded">
                      Aktuell
                    </div>
                  )}
                  <span className="text-4xl font-bold text-nox-red/20 font-mono leading-none group-hover:text-nox-red/50 transition-colors duration-500 block mb-5">
                    {sys.number}
                  </span>
                  <div className="text-[11px] font-mono font-bold tracking-[0.26em] text-[#FF6B6B] uppercase mb-2">{sys.role}</div>
                  <h3 className="text-lg font-bold text-nox-white mb-3 tracking-tight">{sys.title}</h3>
                  <p className="text-sm text-nox-white-muted leading-relaxed">{sys.description}</p>
                </Link>
              </motion.div>
            ))}
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
              <span className="text-gradient-red">Autorität.</span>
              <br />
              <span className="text-nox-red">Als Infrastruktur.</span>
            </h2>
            <p className="text-nox-white-muted text-lg mb-12 max-w-md mx-auto leading-relaxed">
              Kein Posten. Kein Raten. Ein System, das Reichweite, Vertrauen und Nachfrage aufbaut.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/contact">
                <button className="group relative px-8 py-4 bg-nox-red text-white font-semibold rounded-lg hover:bg-nox-red-deep transition-all duration-300 inline-flex items-center gap-2.5 shadow-[0_0_0_1px_rgba(232,64,64,0.25),0_16px_48px_-8px_rgba(201,48,48,0.6)] hover:shadow-[0_0_0_1px_rgba(232,64,64,0.45),0_20px_56px_-8px_rgba(201,48,48,0.8)] overflow-hidden">
                  <span className="relative z-10">Gespräch buchen</span>
                  <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                </button>
              </Link>
              <Link to="/configurator">
                <button className="px-8 py-4 bg-white/[0.02] backdrop-blur-sm text-nox-white font-semibold rounded-lg border border-white/[0.12] hover:border-white/[0.28] hover:bg-white/[0.05] transition-all duration-300 inline-flex items-center gap-2.5">
                  Lösungsfinder starten
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
