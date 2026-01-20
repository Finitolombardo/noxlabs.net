import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Target, TrendingUp } from 'lucide-react';
import Button from '../components/UI/Button';

export default function Home() {
  const processSteps = [
    {
      icon: Target,
      title: 'Bedarf klären',
      description: 'Analyse bestehender Prozesse und Auswahl passender Module.'
    },
    {
      icon: Zap,
      title: 'Systeme aktivieren & konfigurieren',
      description: 'Initiale Inbetriebnahme der gewählten Systeme. Erste produktive Version in ca. 14 Tagen.'
    },
    {
      icon: TrendingUp,
      title: 'Betrieb & modulare Erweiterung',
      description: 'Stabiler Betrieb mit optionaler Weiterentwicklung einzelner Module.'
    }
  ];

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
    <div className="min-h-screen">
      <section className="relative py-20 md:py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/20 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="flex justify-center mb-8"
          >
            <img
              src="/dein_abschnittstext_(2).png"
              alt="NOX"
              className="w-80 md:w-96 h-auto object-contain"
            />
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-nox-white mb-6 leading-tight"
            style={{ textShadow: '0 0 40px rgba(255, 182, 193, 0.15), 0 0 20px rgba(255, 182, 193, 0.1)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Systeme, die strukturieren –{' '}
            <span className="text-nox-white-soft">
              und gezielt evolvieren.
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-nox-white-muted mb-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Modulare Architektur für kontrolliertes Wachstum.<br />
            Von stabilen Spezial-Systemen bis zu lernenden Kernsystemen – ohne Chaos.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link to="/systems">
              <button className="px-8 py-4 bg-nox-yellow text-black font-semibold rounded-lg hover:bg-nox-yellow-hover transition-all duration-300 inline-flex items-center gap-2">
                Systeme ansehen
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link to="/contact">
              <Button variant="secondary">
                Termin vereinbaren
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-lg md:text-xl text-nox-white-muted leading-relaxed max-w-3xl mx-auto">
              Nicht jedes System muss lernen. NOX kombiniert stabile, spezialisierte Systeme
              mit lernenden Kernsystemen, dort wo echte Rückkopplung entsteht.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-nox-white mb-2">Stabile Systeme für definierte Aufgaben</h3>
              <p className="text-nox-white-muted leading-relaxed text-sm">
                Automatisierung dort, wo Prozesse klar sind und Stabilität wichtiger ist als Experimente.
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-nox-white mb-2">Erweiterbar durch Feedback & Daten</h3>
              <p className="text-nox-white-muted leading-relaxed text-sm">
                Systeme können modular erweitert werden, sobald echte Rückkopplung verfügbar ist.
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-nox-white mb-2">Gemeinsame Architektur statt Tool-Sammlung</h3>
              <p className="text-nox-white-muted leading-relaxed text-sm">
                Keine isolierten Einzellösungen. Alle Module folgen einer konsistenten Systemlogik.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-b from-black/30 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-4" style={{ textShadow: '0 0 30px rgba(255, 182, 193, 0.12)' }}>
              Hauptsysteme
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all flex flex-col"
            >
              <h3 className="text-2xl font-bold text-nox-white mb-4">Leadforge</h3>
              <p className="text-nox-white-muted mb-6 leading-relaxed flex-grow">
                Fundament für strukturierte Lead-Erfassung und Anreicherung. Aktuell regelbasiert – vorbereitet für datengetriebene Weiterentwicklung.
              </p>
              <Link to="/systems/leadforge" className="text-nox-white-soft hover:text-nox-white font-semibold inline-flex items-center gap-2 transition-colors">
                Details ansehen
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all flex flex-col"
            >
              <h3 className="text-2xl font-bold text-nox-white mb-4">Pitch-Evolutionssystem</h3>
              <p className="text-nox-white-muted mb-6 leading-relaxed flex-grow">
                Entwickelt Ansprache systematisch weiter – basierend auf realen Reaktionen, Klassifikationen und kausalen Anpassungen.
              </p>
              <Link to="/systems/pitch-evolution-system" className="text-nox-white-soft hover:text-nox-white font-semibold inline-flex items-center gap-2 transition-colors">
                Details ansehen
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all flex flex-col"
            >
              <h3 className="text-2xl font-bold text-nox-white mb-4">Content Engine</h3>
              <p className="text-nox-white-muted mb-6 leading-relaxed flex-grow">
                Lernendes System, das aus echten Markt- und Nutzer-Signalen strukturiertes Content-Wissen aufbaut und skalierbar macht.
              </p>
              <Link to="/systems/content-engine" className="text-nox-white-soft hover:text-nox-white font-semibold inline-flex items-center gap-2 transition-colors">
                Details ansehen
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <p className="text-nox-white-muted max-w-3xl mx-auto leading-relaxed">
              Ergänzend existieren spezialisierte Systeme für einzelne Anwendungsfälle.
              Diese sind bewusst stabil ausgelegt und kein Teil der lernenden Kernlogik.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-nox-white mb-4" style={{ textShadow: '0 0 30px rgba(255, 182, 193, 0.12)' }}>
              Wie es abläuft
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="relative group h-full"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all h-full flex flex-col">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-gray-400 text-sm font-semibold mb-2">
                      Schritt {index + 1}
                    </div>
                    <h3 className="text-2xl font-bold text-nox-white mb-4">
                      {step.title}
                    </h3>
                    <p className="text-nox-white-muted leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800/10 to-gray-800/5 rounded-3xl blur-2xl" />
            <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-white/10 rounded-3xl p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-nox-white mb-8">
                Bereit für Systeme, die mitwachsen?
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/systems">
                  <button className="px-8 py-4 bg-nox-yellow text-black font-semibold rounded-lg hover:bg-nox-yellow-hover transition-all duration-300 inline-flex items-center gap-2">
                    Systeme ansehen
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <Link to="/contact">
                  <Button variant="secondary" className="text-lg px-8 py-4">
                    Termin vereinbaren
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
