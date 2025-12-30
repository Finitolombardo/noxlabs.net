import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { systems } from '../data/systems';

export default function Systems() {
  const mainSystems = systems.filter((s) => s.isMainSystem);
  const specialSystems = systems.filter((s) => !s.isMainSystem);

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

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-[#FFF1F4] mb-4" style={{ textShadow: '0 0 40px rgba(255, 182, 193, 0.15), 0 0 20px rgba(255, 182, 193, 0.1)' }}>
            Produktarchitektur
          </h1>
          <p className="text-lg text-[#E8DDE1] max-w-3xl mx-auto">
            Lernende Retainer-Systeme für nachhaltiges Wachstum – ergänzt durch spezialisierte Module.
          </p>
        </motion.div>

        <div className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#FFF1F4] mb-3" style={{ textShadow: '0 0 30px rgba(255, 182, 193, 0.12)' }}>
              Hauptsysteme (laufend betrieben & lernend)
            </h2>
            <p className="text-[#E8DDE1] text-lg max-w-4xl">
              Diese Systeme sind nicht einmalige Setups. Sie werden betrieben, überwacht und kontinuierlich weiterentwickelt.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {mainSystems.map((system, index) => (
              <motion.div key={system.slug} variants={itemVariants}>
                <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8 hover:border-[#F2C94C]/30 transition-all h-full flex flex-col">
                  <h3 className="text-2xl font-bold text-[#FFF1F4] mb-4">{system.name}</h3>
                  <p className="text-[#E8DDE1] mb-6 leading-relaxed">
                    {system.description}
                  </p>

                  <div className="mb-6 flex-grow">
                    <ul className="space-y-2">
                      {system.properties.map((property, idx) => (
                        <li key={idx} className="text-gray-400 text-sm">
                          • {property}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                    <Link
                      to={`/systems/${system.slug}`}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 hover:border-[#F2C94C]/30 transition-all text-sm font-medium"
                    >
                      Details ansehen
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/configurator"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E5B73C] to-[#F2C94C] text-black rounded-lg hover:shadow-lg hover:shadow-[#F2C94C]/20 transition-all text-sm font-semibold"
                    >
                      Konfigurieren
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#FFF1F4] mb-3" style={{ textShadow: '0 0 30px rgba(255, 182, 193, 0.12)' }}>
              Spezial- & Einstiegssysteme
            </h2>
            <p className="text-[#E8DDE1] text-lg max-w-4xl">
              Diese Systeme sind eigenständig nutzbar oder dienen als Ergänzung zu Hauptsystemen.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {specialSystems.map((system, index) => (
              <motion.div key={system.slug} variants={itemVariants}>
                <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all h-full flex flex-col">
                  <h3 className="text-2xl font-bold text-[#FFF1F4] mb-4">{system.name}</h3>
                  <p className="text-[#E8DDE1] mb-6 leading-relaxed flex-grow">
                    {system.description}
                  </p>

                  <div className="flex flex-col gap-3 mt-auto">
                    <Link
                      to={`/systems/${system.slug}`}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 hover:border-white/20 transition-all text-sm font-medium"
                    >
                      Details ansehen
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    {system.isConfigurable && (
                      <Link
                        to="/configurator"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E5B73C] to-[#F2C94C] text-black rounded-lg hover:shadow-lg hover:shadow-[#F2C94C]/20 transition-all text-sm font-semibold"
                      >
                        Konfigurieren
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
