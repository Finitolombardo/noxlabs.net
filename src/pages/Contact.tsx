import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Send } from 'lucide-react';
import Button from '../components/UI/Button';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
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
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-nox-white mb-4">
            Kontakt
          </h1>
          <p className="text-lg text-nox-white-muted max-w-2xl mx-auto">
            Hast du Fragen oder möchtest du direkt starten? Schreib uns eine Nachricht
            und wir melden uns innerhalb von 24 Stunden.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8 h-full">
              <h2 className="text-2xl font-bold text-nox-white mb-6">
                Lass uns sprechen
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#d6a400] to-[#f5c542] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-nox-white mb-1">Email</h3>
                    <p className="text-nox-white-muted">
                      Schreib uns deine Anfrage und wir melden uns schnellstmöglich.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#d6a400] to-[#f5c542] rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-nox-white mb-1">
                      Direkt buchen
                    </h3>
                    <p className="text-nox-white-muted">
                      Buche dir einen Termin für ein kostenloses Erstgespräch. (Coming
                      Soon)
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="text-lg font-semibold text-nox-white mb-4">
                  Häufige Fragen
                </h3>
                <div className="space-y-3 text-sm text-nox-white-muted">
                  <p>
                    <span className="text-nox-white font-medium">
                      Wie lange dauert die Umsetzung?
                    </span>
                    <br />
                    Custom Systeme sind in 14 Tagen live. Standard-Systeme oft
                    schneller.
                  </p>
                  <p>
                    <span className="text-nox-white font-medium">Was kostet ein System?</span>
                    <br />
                    Abhängig von Komplexität und Integrationen. Im Erstgespräch besprechen
                    wir dein Budget.
                  </p>
                  <p>
                    <span className="text-nox-white font-medium">
                      Brauche ich technisches Know-How?
                    </span>
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
              <div className="absolute inset-0 bg-gradient-to-r from-[#d6a400]/10 to-[#f5c542]/10 rounded-2xl blur-xl" />
              <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-[#d6a400]/30 rounded-2xl p-8">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-[#d6a400] to-[#f5c542] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="text-2xl font-bold text-nox-white mb-2">
                      Nachricht gesendet!
                    </h3>
                    <p className="text-nox-white-muted">
                      Wir melden uns in Kürze bei dir.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-nox-white-muted mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-nox-white placeholder-gray-500 focus:outline-none focus:border-[#d6a400]/30"
                        placeholder="Max Mustermann"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-nox-white-muted mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-nox-white placeholder-gray-500 focus:outline-none focus:border-[#d6a400]/30"
                        placeholder="max@beispiel.de"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-nox-white-muted mb-2">
                        Firma (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-nox-white placeholder-gray-500 focus:outline-none focus:border-[#d6a400]/30"
                        placeholder="Beispiel GmbH"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-nox-white-muted mb-2">
                        Nachricht *
                      </label>
                      <textarea
                        required
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        rows={6}
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#d6a400]/30 resize-none"
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
