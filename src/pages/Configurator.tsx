import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/UI/Button';

interface FormData {
  goal: string;
  industry: string;
  channel: string;
  volume: string;
  integrations: string[];
  name: string;
  email: string;
  phone: string;
  company: string;
  fastTrack: boolean;
}

export default function Configurator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    goal: '',
    industry: '',
    channel: '',
    volume: '',
    integrations: [],
    name: '',
    email: '',
    phone: '',
    company: '',
    fastTrack: false
  });

  const totalSteps = 6;

  const goals = [
    { value: 'leads', label: 'Leads generieren' },
    { value: 'bookings', label: 'Buchungen automatisieren' },
    { value: 'outreach', label: 'Outreach skalieren' },
    { value: 'support', label: 'Support optimieren' },
    { value: 'other', label: 'Sonstiges' }
  ];

  const industries = [
    { value: 'agency', label: 'Agentur' },
    { value: 'recruiting', label: 'Recruiting' },
    { value: 'local', label: 'Local Business' },
    { value: 'other', label: 'Andere' }
  ];

  const channels = [
    { value: 'email', label: 'Email' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'website', label: 'Website' },
    { value: 'mixed', label: 'Mixed' }
  ];

  const volumes = [
    { value: 'low', label: 'Low (< 100/Monat)' },
    { value: 'med', label: 'Medium (100-500/Monat)' },
    { value: 'high', label: 'High (> 500/Monat)' }
  ];

  const integrationOptions = [
    'Notion',
    'n8n',
    'Cal.com',
    'Google Sheets',
    'CRM',
    'WhatsApp'
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
  };

  const toggleIntegration = (integration: string) => {
    if (formData.integrations.includes(integration)) {
      setFormData({
        ...formData,
        integrations: formData.integrations.filter((i) => i !== integration)
      });
    } else {
      setFormData({
        ...formData,
        integrations: [...formData.integrations, integration]
      });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.goal !== '';
      case 2:
        return formData.industry !== '';
      case 3:
        return formData.channel !== '';
      case 4:
        return formData.volume !== '';
      case 5:
        return formData.integrations.length > 0;
      case 6:
        return formData.name !== '' && formData.email !== '';
      default:
        return false;
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  if (submitted) {
    return (
      <div className="min-h-screen py-20 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#d6a400]/20 to-[#f5c542]/20 rounded-3xl blur-2xl" />
            <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-[#d6a400]/30 rounded-3xl p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#d6a400] to-[#f5c542] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-black" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Vielen Dank!
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                Wir haben deine Anfrage erhalten und melden uns innerhalb von 24 Stunden
                bei dir mit einem maßgeschneiderten Angebot.
              </p>
              <Link to="/systems">
                <Button variant="primary">Zurück zu Systemen</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            System Konfigurator
          </h1>
          <p className="text-gray-400">
            Schritt {currentStep} von {totalSteps}
          </p>
        </motion.div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full mx-1 transition-all ${
                  index < currentStep
                    ? 'bg-gradient-to-r from-[#d6a400] to-[#f5c542]'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait" custom={1}>
            <motion.div
              key={currentStep}
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8 mb-8"
            >
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Was willst du automatisieren?
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {goals.map((goal) => (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, goal: goal.value })}
                        className={`p-6 rounded-xl border-2 transition-all text-left ${
                          formData.goal === goal.value
                            ? 'border-[#d6a400] bg-[#d6a400]/10'
                            : 'border-white/10 hover:border-white/20 bg-white/5'
                        }`}
                      >
                        <div className="text-lg font-semibold text-white">
                          {goal.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Welche Branche?
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {industries.map((industry) => (
                      <button
                        key={industry.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, industry: industry.value })
                        }
                        className={`p-6 rounded-xl border-2 transition-all text-left ${
                          formData.industry === industry.value
                            ? 'border-[#d6a400] bg-[#d6a400]/10'
                            : 'border-white/10 hover:border-white/20 bg-white/5'
                        }`}
                      >
                        <div className="text-lg font-semibold text-white">
                          {industry.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Kanal</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {channels.map((channel) => (
                      <button
                        key={channel.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, channel: channel.value })
                        }
                        className={`p-6 rounded-xl border-2 transition-all text-left ${
                          formData.channel === channel.value
                            ? 'border-[#d6a400] bg-[#d6a400]/10'
                            : 'border-white/10 hover:border-white/20 bg-white/5'
                        }`}
                      >
                        <div className="text-lg font-semibold text-white">
                          {channel.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Volumen</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {volumes.map((volume) => (
                      <button
                        key={volume.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, volume: volume.value })
                        }
                        className={`p-6 rounded-xl border-2 transition-all text-left ${
                          formData.volume === volume.value
                            ? 'border-[#d6a400] bg-[#d6a400]/10'
                            : 'border-white/10 hover:border-white/20 bg-white/5'
                        }`}
                      >
                        <div className="text-lg font-semibold text-white">
                          {volume.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Integrationen
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Wähle alle gewünschten Integrationen aus (mehrfach möglich)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {integrationOptions.map((integration) => (
                      <button
                        key={integration}
                        type="button"
                        onClick={() => toggleIntegration(integration)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.integrations.includes(integration)
                            ? 'border-[#d6a400] bg-[#d6a400]/10'
                            : 'border-white/10 hover:border-white/20 bg-white/5'
                        }`}
                      >
                        <div className="text-sm font-semibold text-white">
                          {integration}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Kontakt</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#d6a400]/30"
                        placeholder="Max Mustermann"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#d6a400]/30"
                        placeholder="max@beispiel.de"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Telefon (optional)
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#d6a400]/30"
                        placeholder="+49 123 456789"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Firma (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#d6a400]/30"
                        placeholder="Beispiel GmbH"
                      />
                    </div>

                    <div className="pt-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.fastTrack}
                          onChange={(e) =>
                            setFormData({ ...formData, fastTrack: e.target.checked })
                          }
                          className="w-5 h-5 mt-0.5 accent-[#d6a400] cursor-pointer"
                        />
                        <span className="text-sm text-gray-300">
                          Ich will in 14 Tagen live gehen
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrev}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="inline-block mr-2 w-5 h-5" />
              Zurück
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Weiter
                <ArrowRight className="inline-block ml-2 w-5 h-5" />
              </Button>
            ) : (
              <Button type="submit" variant="primary" disabled={!canProceed()}>
                Absenden
                <CheckCircle2 className="inline-block ml-2 w-5 h-5" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
