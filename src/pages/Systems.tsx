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
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

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
            <span>Produktarchitektur</span>
            <span className="w-8 h-px bg-nox-red/40" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-nox-white mb-5 text-depth-red-subtle tracking-tight">
            Systeme, die Wachstum tragen
          </h1>
          <p className="text-lg text-nox-white-muted max-w-3xl mx-auto leading-relaxed">
            Lernende Retainer-Systeme für nachhaltiges Wachstum — ergänzt durch spezialisierte Module.
          </p>
        </motion.div>

        <div className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-3">
              <div>
                <p className="text-[10px] font-mono tracking-[0.32em] text-nox-red/70 uppercase mb-3">01 — Hauptsysteme</p>
                <h2 className="text-3xl md:text-4xl font-bold text-nox-white text-depth-red-subtle tracking-tight">
                  Laufend betrieben &amp; lernend
                </h2>
              </div>
              <Link
                to="/configurator"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-nox-red text-white rounded-lg hover:bg-nox-red-deep transition-all font-semibold whitespace-nowrap shadow-[0_0_0_1px_rgba(232,64,64,0.2),0_8px_24px_-8px_rgba(201,48,48,0.5)]"
              >
                Hauptsystem konfigurieren
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-nox-white-muted text-lg max-w-4xl leading-relaxed">
              Diese Systeme sind keine einmaligen Setups. Sie werden betrieben, überwacht und kontinuierlich weiterentwickelt.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {mainSystems.map((system) => (
              <motion.div key={system.slug} variants={itemVariants} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
                <Link
                  to={`/systems/${system.slug}`}
                  className="group relative block h-full bg-gradient-to-br from-[#0d0a0b]/80 to-[#070707]/80 border border-white/[0.08] rounded-2xl p-8 hover:border-nox-red/30 transition-all overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-nox-red/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute -inset-px rounded-2xl bg-nox-red/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative flex flex-col h-full">
                    <h3 className="text-2xl font-bold text-nox-white mb-4 tracking-tight">{system.name}</h3>
                    <p className="text-nox-white-muted mb-6 leading-relaxed">{system.description}</p>

                    <ul className="space-y-2 mb-7 flex-grow">
                      {system.properties.map((property, idx) => (
                        <li key={idx} className="text-nox-white-muted text-sm flex gap-2">
                          <span className="text-nox-red/70 mt-0.5">—</span>
                          <span>{property}</span>
                        </li>
                      ))}
                    </ul>

                    <span className="mt-auto inline-flex items-center gap-2 text-sm text-nox-white-muted group-hover:text-nox-white transition-colors">
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

        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <p className="text-[10px] font-mono tracking-[0.32em] text-nox-red/70 uppercase mb-3">02 — Spezial &amp; Einstieg</p>
            <h2 className="text-3xl md:text-4xl font-bold text-nox-white mb-3 text-depth-red-subtle tracking-tight">
              Module &amp; Einstiegssysteme
            </h2>
            <p className="text-nox-white-muted text-lg max-w-4xl leading-relaxed">
              Eigenständig nutzbar — oder als Ergänzung zu den Hauptsystemen.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {specialSystems.map((system) => (
              <motion.div key={system.slug} variants={itemVariants} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
                <div className="group relative block h-full bg-gradient-to-br from-[#0d0a0b]/80 to-[#070707]/80 border border-white/[0.08] rounded-2xl p-8 hover:border-nox-red/25 transition-all overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-nox-red/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative flex flex-col h-full">
                    <h3 className="text-2xl font-bold text-nox-white mb-4 tracking-tight">{system.name}</h3>
                    <p className="text-nox-white-muted mb-6 leading-relaxed flex-grow">{system.description}</p>

                    <div className="flex flex-col gap-3 mt-auto">
                      <Link
                        to={`/systems/${system.slug}`}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-nox-white rounded-lg border border-white/10 hover:border-nox-red/30 transition-all text-sm font-medium"
                      >
                        Details ansehen
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      {system.isConfigurable && (
                        <Link
                          to="/configurator"
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-nox-red text-white rounded-lg hover:bg-nox-red-deep transition-all text-sm font-semibold shadow-[0_0_0_1px_rgba(232,64,64,0.2),0_6px_20px_-8px_rgba(201,48,48,0.5)]"
                        >
                          Konfigurieren
                        </Link>
                      )}
                    </div>
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
