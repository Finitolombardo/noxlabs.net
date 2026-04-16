import { motion } from 'framer-motion';

interface RoadmapSystem {
  name: string;
  subtitle: string;
  status: 'in-entwicklung' | 'geplant' | 'research';
  description: string;
  bullets: string[];
}

const roadmapSystems: RoadmapSystem[] = [
  {
    name: 'Projekt Y',
    subtitle: 'Autonomer Sales-Conversation-Analyzer & Performance-Optimizer',
    status: 'in-entwicklung',
    description: 'Analysiert Verkaufsgespräche objektiv (Audio + Outcome), erkennt Trigger-Reaktions-Muster und liefert konkrete Verbesserungen in Sprache, Timing und Struktur. Lernt aus echten Ergebnissen statt „Gefühlen".',
    bullets: [
      'Transkription + Timeline + Phasen-Erkennung',
      'Trigger-Reaktions-Korrelationen (messbar)',
      'Phrase-Impact-Scoring (Bibliothek + Blacklist)',
      'A/B-Reframes, getestet in echten Calls',
      'Silent-Failure-Detection („nett aber wirkungslos")',
    ],
  },
  {
    name: 'Projekt X',
    subtitle: 'Autonomer Workflow-Generator & Optimierungs-Agent (n8n)',
    status: 'geplant',
    description: 'Erzeugt aus einer Spezifikation produktionsreife n8n-Workflows, testet Node-weise, optimiert Kosten und versioniert automatisch. Ziel: Automatisierungen industriell bauen statt basteln.',
    bullets: [
      'Spec → Blueprint → Builder',
      'Node Unit Tests + End-to-End Tests',
      'Kosten-Optimizer (LLM nur bei Unklarheit)',
      'Versionierung, Rollback, Modularität',
    ],
  },
  {
    name: 'Projekt NOX',
    subtitle: 'LifeOS: Entscheidungs- & Skill-System (AR + Biometrie + Quest-Engine)',
    status: 'research',
    description: 'Research-Projekt für ein persönliches System, das Kontext, Zustand und Ziele verbindet und daraus Quests, Skillbäume und Interventionen ableitet. Fokus: Handlungsqualität, nicht Motivation.',
    bullets: [
      'Quest-/Skillbaum-Logik & Progression',
      'Biometrie-Trigger (Stress, Müdigkeit, Impuls)',
      'Datenschutz-first (Edge-Verarbeitung, minimaler Cloud-Teil)',
      'Finanzmuster → Prävention & Entscheidungen',
    ],
  },
];

export default function Roadmap() {
  const inDevelopment = roadmapSystems.filter((s) => s.status === 'in-entwicklung');
  const planned = roadmapSystems.filter((s) => s.status === 'geplant');
  const research = roadmapSystems.filter((s) => s.status === 'research');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-entwicklung':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono tracking-[0.24em] uppercase bg-nox-red/10 text-nox-red border border-nox-red/30">
            In Entwicklung
          </span>
        );
      case 'geplant':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono tracking-[0.24em] uppercase bg-white/[0.04] text-nox-white-muted border border-white/15">
            Geplant
          </span>
        );
      case 'research':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono tracking-[0.24em] uppercase bg-white/[0.03] text-white/55 border border-white/10">
            Research
          </span>
        );
      default:
        return null;
    }
  };

  const renderSystemCard = (system: RoadmapSystem) => (
    <motion.div
      key={system.name}
      variants={itemVariants}
      className="group relative bg-gradient-to-br from-[#0d0a0b]/80 to-[#070707]/80 border border-white/[0.08] rounded-2xl p-7 hover:border-nox-red/25 transition-all overflow-hidden mb-6"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-nox-red/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-nox-white mb-1 tracking-tight">{system.name}</h3>
            <p className="text-sm text-nox-white-muted">{system.subtitle}</p>
          </div>
          {getStatusBadge(system.status)}
        </div>
        <p className="text-nox-white-muted text-sm leading-relaxed mb-5">{system.description}</p>
        <div className="space-y-2">
          {system.bullets.map((bullet, index) => (
            <div key={index} className="flex items-start gap-2.5">
              <span className="text-nox-red/70 mt-1 flex-shrink-0">—</span>
              <span className="text-sm text-nox-white-muted leading-relaxed">{bullet}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const sectionHeader = (eyebrow: string, title: string, sub: string) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <p className="text-[10px] font-mono tracking-[0.32em] text-nox-red/70 uppercase mb-3">{eyebrow}</p>
      <h2 className="text-3xl md:text-4xl font-bold text-nox-white text-depth-red-subtle tracking-tight mb-3">{title}</h2>
      <p className="text-nox-white-muted text-lg max-w-4xl leading-relaxed">{sub}</p>
    </motion.div>
  );

  return (
    <div className="relative min-h-screen pt-32 pb-24 px-4 noise">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full bg-nox-red/[0.06] blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid mask-radial-fade opacity-40 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-3 text-[10px] font-mono tracking-[0.32em] text-nox-red/80 uppercase mb-6">
            <span className="w-8 h-px bg-nox-red/40" />
            <span>Produktvision</span>
            <span className="w-8 h-px bg-nox-red/40" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-nox-white mb-5 text-depth-red-subtle tracking-tight">
            Roadmap
          </h1>
          <p className="text-lg text-nox-white-muted max-w-3xl mx-auto leading-relaxed">
            Transparente Produktvision und Entwicklungsrichtung — ohne Marketing-Floskeln.
          </p>
        </motion.div>

        {inDevelopment.length > 0 && (
          <div className="mb-20">
            {sectionHeader('01 — Aktiv', 'In Entwicklung', 'Systeme, die aktuell gebaut und getestet werden.')}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl">
              {inDevelopment.map(renderSystemCard)}
            </motion.div>
          </div>
        )}

        {planned.length > 0 && (
          <div className="mb-20">
            {sectionHeader('02 — Pipeline', 'Geplant', 'Systeme in Planung mit klar definiertem Scope.')}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl">
              {planned.map(renderSystemCard)}
            </motion.div>
          </div>
        )}

        {research.length > 0 && (
          <div className="mb-12">
            {sectionHeader('03 — Research', 'Research', 'Experimentelle Konzepte und technische Machbarkeitsprüfung.')}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl">
              {research.map(renderSystemCard)}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
