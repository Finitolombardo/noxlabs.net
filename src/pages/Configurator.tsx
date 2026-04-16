import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, AlertCircle } from 'lucide-react';

const CONFIG_FORM_URL = "";

export default function Configurator() {
  return (
    <div className="relative min-h-screen pt-32 pb-24 px-4 noise">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[380px] rounded-full bg-nox-red/[0.06] blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid mask-radial-fade opacity-40 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 text-[10px] font-mono tracking-[0.32em] text-nox-red/80 uppercase mb-6">
            <span className="w-8 h-px bg-nox-red/40" />
            <span>Lösungsfinder</span>
            <span className="w-8 h-px bg-nox-red/40" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-nox-white mb-5 text-depth-red-subtle tracking-tight">
            Hauptsystem konfigurieren
          </h1>
          <p className="text-lg md:text-xl text-nox-white-muted max-w-3xl mx-auto leading-relaxed">
            Wähle das Hauptsystem und trage die Basisdaten ein. Wir melden uns mit einem konkreten Setup-Vorschlag.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          {CONFIG_FORM_URL ? (
            <div className="relative w-full bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-nox-red/5 to-transparent pointer-events-none" />
              <iframe
                src={CONFIG_FORM_URL}
                className="w-full min-h-[900px] md:min-h-[1100px] border-0"
                title="Hauptsystem Konfigurationsformular"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-nox-red/10 to-nox-red/5 rounded-3xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 border-2 border-nox-red/20 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-nox-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-nox-red" />
                </div>
                <h3 className="text-2xl font-bold text-nox-white mb-4">
                  Formular-Link fehlt noch
                </h3>
                <p className="text-nox-white-muted text-lg mb-6 max-w-md mx-auto">
                  Bitte CONFIG_FORM_URL in der Configurator.tsx setzen, um das Formular anzuzeigen.
                </p>
                <div className="inline-block bg-black/30 border border-white/10 rounded-lg px-4 py-3">
                  <code className="text-sm text-nox-red font-mono">
                    const CONFIG_FORM_URL = "URL_HIER_EINTRAGEN"
                  </code>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
            <div className="flex-1 text-left">
              <h3 className="text-xl font-bold text-nox-white mb-2">
                Lieber persönlich sprechen?
              </h3>
              <p className="text-nox-white-muted">
                Buche direkt einen Termin für eine individuelle Beratung.
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-nox-white rounded-lg border border-white/10 hover:border-nox-red/30 transition-all font-medium whitespace-nowrap"
            >
              <Calendar className="w-5 h-5" />
              Termin vereinbaren
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
