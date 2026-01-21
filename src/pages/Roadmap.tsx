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
      'Silent-Failure-Detection („nett aber wirkungslos")'
    ]
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
      'Versionierung, Rollback, Modularität'
    ]
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
      'Finanzmuster → Prävention & Entscheidungen'
    ]
  }
];

export default function Roadmap() {
  const inDevelopment = roadmapSystems.filter(s => s.status === 'in-entwicklung');
  const planned = roadmapSystems.filter(s => s.status === 'geplant');
  const research = roadmapSystems.filter(s => s.status === 'research');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-entwicklung':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-nox-yellow/10 text-nox-yellow border border-nox-yellow/30">
            In Entwicklung
          </span>
        );
      case 'geplant':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            Geplant
          </span>
        );
      case 'research':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
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
      className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-6"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-xl font-bold text-nox-white mb-1">{system.name}</h3>
          <p className="text-sm text-nox-white-muted">{system.subtitle}</p>
        </div>
        {getStatusBadge(system.status)}
      </div>
      <p className="text-nox-white-muted text-sm leading-relaxed mb-4">
        {system.description}
      </p>
      <div className="space-y-2">
        {system.bullets.map((bullet, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-[#d6a400] mt-1 flex-shrink-0">•</span>
            <span className="text-sm text-nox-white-muted leading-relaxed">{bullet}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-nox-white mb-4" style={{ textShadow: '0 0 40px rgba(255, 182, 193, 0.15), 0 0 20px rgba(255, 182, 193, 0.1)' }}>
            Roadmap
          </h1>
          <p className="text-lg text-nox-white-muted max-w-3xl mx-auto">
            Transparente Produktvision und Entwicklungsrichtung – ohne Marketing-Floskeln.
          </p>
        </motion.div>

        {inDevelopment.length > 0 && (
          <div className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-nox-white mb-3" style={{ textShadow: '0 0 30px rgba(255, 182, 193, 0.12)' }}>
                In Entwicklung
              </h2>
              <p className="text-nox-white-muted text-lg max-w-4xl">
                Systeme, die aktuell gebaut und getestet werden.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-4xl"
            >
              {inDevelopment.map(renderSystemCard)}
            </motion.div>
          </div>
        )}

        {planned.length > 0 && (
          <div className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-nox-white mb-3" style={{ textShadow: '0 0 30px rgba(255, 182, 193, 0.12)' }}>
                Geplant
              </h2>
              <p className="text-nox-white-muted text-lg max-w-4xl">
                Systeme in Planung mit klar definiertem Scope.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-4xl"
            >
              {planned.map(renderSystemCard)}
            </motion.div>
          </div>
        )}

        {research.length > 0 && (
          <div className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-nox-white mb-3" style={{ textShadow: '0 0 30px rgba(255, 182, 193, 0.12)' }}>
                Research
              </h2>
              <p className="text-nox-white-muted text-lg max-w-4xl">
                Experimentelle Konzepte und technische Machbarkeitsprüfung.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-4xl"
            >
              {research.map(renderSystemCard)}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
