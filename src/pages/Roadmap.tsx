import { motion } from 'framer-motion';

interface RoadmapSystem {
  name: string;
  status: 'in-entwicklung' | 'geplant' | 'research';
  description: string;
}

const roadmapSystems: RoadmapSystem[] = [
  {
    name: 'Reply Classifier',
    status: 'in-entwicklung',
    description: 'Automatische Klassifikation von E-Mail-Antworten nach Interesse, Einwänden und Bounce-Typ'
  },
  {
    name: 'Outreach Performance Dashboard',
    status: 'geplant',
    description: 'Echtzeit-Monitoring und KPI-Tracking für alle aktiven Outreach-Systeme'
  },
  {
    name: 'Content Timing Optimizer',
    status: 'geplant',
    description: 'Datengetriebene Empfehlungen für optimale Versandzeiten basierend auf historischer Performance'
  },
  {
    name: 'Voice-to-CRM Pipeline',
    status: 'research',
    description: 'Automatische Erfassung und Strukturierung von Verkaufsgesprächen für CRM-Integration'
  },
  {
    name: 'Multi-Channel Attribution System',
    status: 'research',
    description: 'Tracking und Attribution von Leads über mehrere Kanäle (E-Mail, WhatsApp, LinkedIn, Website)'
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
        <h3 className="text-xl font-bold text-nox-white">{system.name}</h3>
        {getStatusBadge(system.status)}
      </div>
      <p className="text-nox-white-muted text-sm leading-relaxed">
        {system.description}
      </p>
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
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
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
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
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
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {research.map(renderSystemCard)}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
