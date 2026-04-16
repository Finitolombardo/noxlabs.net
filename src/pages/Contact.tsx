import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Send } from 'lucide-react';
import Button from '../components/UI/Button';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', company: '', message: '' });
    }, 3000);
  };

  return (
    <div className="relative min-h-screen pt-32 pb-24 px-4 noise">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[380px] rounded-full bg-nox-red/[0.06] blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid mask-radial-fade opacity-40 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-3 text-[10px] font-mono tracking-[0.32em] text-nox-red/80 uppercase mb-6">
            <span className="w-8 h-px bg-nox-red/40" />
            <span>Kontakt</span>
            <span className="w-8 h-px bg-nox-red/40" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-nox-white mb-5 text-depth-red-subtle tracking-tight">
            Lass uns sprechen
          </h1>
          <p className="text-lg text-nox-white-muted max-w-2xl mx-auto leading-relaxed">
            Fragen oder direkt starten? Schreib uns eine Nachricht — wir melden uns innerhalb von 24 Stunden.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative bg-gradient-to-br from-[#0d0a0b]/80 to-[#070707]/80 border border-white/[0.08] rounded-2xl p-8 h-full overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-nox-red/30 to-transparent" />
              <h2 className="text-2xl font-bold text-nox-white mb-8 tracking-tight">
                Direkter Kontakt
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#161012] to-[#0a0707] border border-nox-red/20 flex items-center justify-center flex-shrink-0 shadow-[inset_0_0_16px_rgba(201,48,48,0.12)]">
                    <Mail className="w-[18px] h-[18px] text-[#E84040]" strokeWidth={2.25} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-nox-white mb-1">E-Mail</h3>
                    <p className="text-sm text-nox-white-muted leading-relaxed">
                      Schreib deine Anfrage — wir melden uns schnellstmöglich.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#161012] to-[#0a0707] border border-nox-red/20 flex items-center justify-center flex-shrink-0 shadow-[inset_0_0_16px_rgba(201,48,48,0.12)]">
                    <MessageSquare className="w-[18px] h-[18px] text-[#E84040]" strokeWidth={2.25} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-nox-white mb-1">Direkt buchen</h3>
                    <p className="text-sm text-nox-white-muted leading-relaxed">
                      Termin für ein kostenloses Erstgespräch. (Coming Soon)
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/[0.06]">
                <p className="text-[10px] font-mono tracking-[0.32em] text-nox-red/70 uppercase mb-4">Häufige Fragen</p>
                <div className="space-y-4 text-sm text-nox-white-muted leading-relaxed">
                  <p>
                    <span className="text-nox-white font-medium">Wie lange dauert die Umsetzung?</span>
                    <br />
                    Custom Systeme in 14 Tagen live. Standard-Systeme oft schneller.
                  </p>
                  <p>
                    <span className="text-nox-white font-medium">Was kostet ein System?</span>
                    <br />
                    Abhängig von Komplexität und Integrationen. Im Erstgespräch besprechen wir Budget.
                  </p>
                  <p>
                    <span className="text-nox-white font-medium">Brauche ich technisches Know-How?</span>
                    <br />
                    Nein. Wir übernehmen Setup, Onboarding und Support.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="relative">
              <div className="absolute -inset-px bg-nox-red/[0.06] rounded-2xl blur-xl pointer-events-none" />
              <div className="relative bg-gradient-to-br from-[#0d0a0b]/90 to-[#070707]/90 border border-nox-red/20 rounded-2xl p-8 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-nox-red/40 to-transparent" />
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 rounded-full bg-nox-red/15 border border-nox-red/40 flex items-center justify-center mx-auto mb-4 shadow-[0_0_32px_rgba(201,48,48,0.3)]">
                      <Send className="w-7 h-7 text-nox-red" strokeWidth={2.25} />
                    </div>
                    <h3 className="text-2xl font-bold text-nox-white mb-2 tracking-tight">Nachricht gesendet</h3>
                    <p className="text-nox-white-muted">Wir melden uns in Kürze bei dir.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-nox-white-muted mb-2">Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] rounded-lg text-nox-white placeholder-white/25 focus:outline-none focus:border-nox-red/40 transition-colors"
                        placeholder="Max Mustermann"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-nox-white-muted mb-2">E-Mail *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] rounded-lg text-nox-white placeholder-white/25 focus:outline-none focus:border-nox-red/40 transition-colors"
                        placeholder="max@beispiel.de"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-nox-white-muted mb-2">Firma (optional)</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] rounded-lg text-nox-white placeholder-white/25 focus:outline-none focus:border-nox-red/40 transition-colors"
                        placeholder="Beispiel GmbH"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-nox-white-muted mb-2">Nachricht *</label>
                      <textarea
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] rounded-lg text-white placeholder-white/25 focus:outline-none focus:border-nox-red/40 resize-none transition-colors"
                        placeholder="Erzähl uns von deinem Projekt..."
                      />
                    </div>

                    <Button type="submit" variant="primary" className="w-full">
                      Nachricht senden
                      <Send className="inline-block ml-2 w-5 h-5" />
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
