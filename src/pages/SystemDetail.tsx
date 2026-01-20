import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Puzzle } from 'lucide-react';
import Button from '../components/UI/Button';
import IntegrationChip from '../components/UI/IntegrationChip';
import { systems } from '../data/systems';
import PitchEvolutionDetail from './PitchEvolutionDetail';
import LeadforgeDetail from './LeadforgeDetail';
import ContentEngineDetail from './ContentEngineDetail';

export default function SystemDetail() {
  const { slug } = useParams<{ slug: string }>();
  const system = systems.find((s) => s.slug === slug);

  if (!system) {
    return <Navigate to="/systems" replace />;
  }

  if (slug === 'pitch-evolution-system') {
    return <PitchEvolutionDetail />;
  }

  if (slug === 'leadforge') {
    return <LeadforgeDetail />;
  }

  if (slug === 'content-engine') {
    return <ContentEngineDetail />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to="/systems"
            className="inline-flex items-center gap-2 text-nox-white-muted hover:text-nox-yellow transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zu Systemen
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-12"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-nox-yellow/20 to-nox-yellow-hover/20 rounded-3xl blur-2xl" />
          <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-nox-yellow/30 rounded-3xl p-8 md:p-12">
            <div className="flex flex-wrap gap-2 mb-4">
              {system.category.map((cat) => (
                <span
                  key={cat}
                  className="text-xs px-3 py-1 bg-white/10 text-nox-white-muted rounded-full border border-white/10"
                >
                  {cat}
                </span>
              ))}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-nox-white mb-4">
              {system.name}
            </h1>

            <p className="text-xl text-nox-white-muted mb-8 leading-relaxed">
              {system.oneLiner}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/configurator">
                <Button variant="primary" className="group">
                  Konfigurieren
                  <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="secondary">Termin buchen</Button>
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          <motion.section variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-700/40 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-nox-white">Problem</h2>
              </div>
              <p className="text-nox-white-muted leading-relaxed">{system.problem}</p>
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-nox-white">Lösung / Ablauf</h2>
              </div>
              <ul className="space-y-3">
                {system.solutionBullets.map((bullet, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#E5B73C] to-[#F2C94C] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-nox-white-muted leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.section>

          {system.modules && system.modules.length > 0 && (
            <motion.section variants={itemVariants}>
              <div className="bg-gradient-to-br from-[#F2C94C]/10 to-transparent border border-[#F2C94C]/30 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-nox-yellow/20 rounded-lg flex items-center justify-center">
                    <Puzzle className="w-6 h-6 text-nox-yellow" />
                  </div>
                  <h2 className="text-2xl font-bold text-nox-white">Enthaltene Module</h2>
                </div>
                <div className="space-y-3">
                  {system.modules.map((module, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-nox-yellow" />
                      <span className="text-nox-white-muted">{module}</span>
                    </div>
                  ))}
                </div>
                {system.slug === 'reply-classifier' && (
                  <p className="mt-4 text-sm text-gray-400 italic">
                    Als Standalone oder als Modul in Pitch Evolution verwendbar.
                  </p>
                )}
              </div>
            </motion.section>
          )}

          <motion.section variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-nox-white mb-6 flex items-center gap-2">
                  <span className="text-nox-yellow">→</span> Input
                </h3>
                <ul className="space-y-3">
                  {system.inputBullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-nox-yellow rounded-full flex-shrink-0 mt-2" />
                      <span className="text-nox-white-muted text-sm leading-relaxed">
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-nox-white mb-6 flex items-center gap-2">
                  <span className="text-nox-yellow">←</span> Output
                </h3>
                <ul className="space-y-3">
                  {system.outputBullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[#E8DDE1] text-sm leading-relaxed">
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-nox-white mb-6">Integrationen</h2>
              <div className="flex flex-wrap gap-3">
                {system.integrations.map((integration) => (
                  <IntegrationChip key={integration} name={integration} />
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <div className="bg-gradient-to-br from-yellow-900/20 to-transparent border border-yellow-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-yellow-400 mb-2">
                    Wichtiger Hinweis
                  </h3>
                  <p className="text-sm text-gray-400">
                    Ergebnisse sind abhängig von Daten, Angebot und Umsetzung. Wir
                    unterstützen dich bei der Optimierung nach Go-Live.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section variants={itemVariants} className="pt-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-nox-yellow/20 to-nox-yellow-hover/20 rounded-2xl blur-xl" />
              <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-nox-yellow/30 rounded-2xl p-10 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-nox-white mb-4">
                  Bereit loszulegen?
                </h2>
                <p className="text-nox-white-muted mb-6 max-w-2xl mx-auto">
                  Starte den Konfigurator und erhalte ein maßgeschneidertes Angebot für
                  dieses System.
                </p>
                <Link to="/configurator">
                  <Button variant="primary" className="text-lg px-8 py-4">
                    Konfigurator starten
                    <ArrowRight className="inline-block ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </div>
  );
}
