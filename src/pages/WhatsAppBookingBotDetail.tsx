import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, MessageSquare, FileSpreadsheet, Calendar, AlertCircle, X } from 'lucide-react';
import Button from '../components/UI/Button';

export default function WhatsAppBookingBotDetail() {
  const benefits = [
    {
      icon: Clock,
      title: 'Sofort-Reaktion',
      description: 'Anfragen werden 24/7 beantwortet – ohne zusätzliches Personal und ohne Wartezeit für Ihre Kunden.'
    },
    {
      icon: MessageSquare,
      title: 'Terminbuchung & Vorqualifizierung',
      description: 'Weniger Ping-Pong. Der Bot erfasst Kontext, prüft Verfügbarkeit und bucht direkt – oder leitet strukturiert weiter.'
    },
    {
      icon: FileSpreadsheet,
      title: 'Übergabe & Nachverfolgung',
      description: 'Keine verlorenen Leads. Alle Anfragen landen strukturiert in CRM, Notion oder Google Sheets – mit Kontext und Status.'
    }
  ];

  const features = [
    'Intelligente FAQ-Beantwortung basierend auf Ihrer Service-Palette',
    'Vorqualifizierung durch gezielte Fragen (Budget, Zeitrahmen, Wunschtermin)',
    'Direkte Terminbuchung via Cal.com / Calendly oder strukturierte Weiterleitung',
    'Automatische Follow-ups bei fehlenden Informationen oder abgebrochenen Buchungen',
    'Übergabe an Team / CRM mit vollständigem Kontext',
    'Reporting: Anzahl Anfragen, gebuchte Termine, häufigste Ablehnungsgründe'
  ];

  const tiers = [
    {
      name: 'Starter',
      description: 'Basis-Antwort + strukturierte Übergabe',
      examples: 'Friseur, Kosmetikstudio, kleine Praxen',
      goal: 'Anfragen entgegennehmen, Kontext erfassen, manuell nachfassen',
      includes: [
        'FAQ-Automatisierung',
        'Kontaktdaten-Erfassung',
        'Strukturierte Übergabe an Google Sheets oder Notion',
        'Basic Reporting'
      ]
    },
    {
      name: 'Booking',
      description: 'Inkl. Terminlogik & Kalender-Sync',
      examples: 'Beratung, Dienstleister, medizinische Praxen',
      goal: 'Terminbuchung automatisieren, Ping-Pong eliminieren',
      includes: [
        'Alles aus Starter',
        'Cal.com / Calendly Integration',
        'Terminvorschläge basierend auf Verfügbarkeit',
        'Automatische Buchungsbestätigung',
        'Reminder-Funktion (24h vorher)'
      ]
    },
    {
      name: 'Sales / Retention',
      description: 'Inkl. Follow-ups, Reaktivierung, Upsell',
      examples: 'Coaching, High-Ticket-Services, Agencies',
      goal: 'Leads aktiv nachverfolgen, Conversion steigern',
      includes: [
        'Alles aus Booking',
        'Automatische Follow-ups bei Nicht-Antwort',
        'Reaktivierungs-Sequenzen für verlorene Leads',
        'Upsell-Trigger bei bestimmten Signalen',
        'CRM-Integration mit erweiterten Datenfeldern'
      ]
    }
  ];

  const suitableFor = [
    'Lokale Dienstleister mit hohem Anfragevolumen (10+ pro Woche)',
    'Branchen mit wiederkehrenden Terminanfragen (Beauty, Gesundheit, Beratung)',
    'Teams, die WhatsApp bereits als primären Kanal nutzen',
    'Unternehmen, die außerhalb der Geschäftszeiten Anfragen verlieren'
  ];

  const notSuitableFor = [
    'Sehr komplexe Produkte mit langen Erklärungszyklen (besser: persönliches Gespräch)',
    'Weniger als 5 Anfragen pro Woche (manuell schneller)',
    'Unternehmen ohne WhatsApp Business Account oder Bereitschaft zur Einrichtung'
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
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
          className="relative mb-16"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#d6a400]/20 to-[#f5c542]/20 rounded-3xl blur-2xl" />
          <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-[#d6a400]/30 rounded-3xl p-8 md:p-12">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs px-3 py-1 bg-white/10 text-nox-white-muted rounded-full border border-white/10">
                Booking
              </span>
              <span className="text-xs px-3 py-1 bg-white/10 text-nox-white-muted rounded-full border border-white/10">
                Ops
              </span>
            </div>

            <h1
              className="text-3xl md:text-5xl font-bold text-nox-white mb-4"
              style={{ textShadow: '0 0 30px rgba(255, 182, 193, 0.12)' }}
            >
              WhatsApp Booking Bot – Anfragen automatisch zu Terminen machen
            </h1>

            <p className="text-xl text-nox-white-muted mb-8 leading-relaxed">
              Kunden wollen per WhatsApp buchen. Dieser Bot übernimmt Antwort, Vorqualifizierung und Terminbuchung – 24/7, ohne manuelle Koordination.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/contact">
                <Button variant="primary" className="group">
                  Termin vereinbaren
                  <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/systems">
                <Button variant="secondary">Alle Systeme ansehen</Button>
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          <motion.div variants={itemVariants}>
            <h2
              className="text-3xl font-bold text-nox-white mb-8 text-center"
              style={{ textShadow: '0 0 30px rgba(255, 182, 193, 0.12)' }}
            >
              Warum ein WhatsApp Booking Bot?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8 hover:border-nox-yellow/30 transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#E5B73C] to-[#F2C94C] rounded-xl flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-xl font-bold text-nox-white mb-3">{benefit.title}</h3>
                  <p className="text-nox-white-muted leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2
                className="text-3xl font-bold text-nox-white mb-6"
                style={{ textShadow: '0 0 30px rgba(255, 182, 193, 0.12)' }}
              >
                Was der Bot kann
              </h2>
              <div className="w-16 h-1 bg-[#d6a400] mb-8" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#E5B73C] to-[#F2C94C] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-nox-white-muted leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2
                className="text-3xl font-bold text-nox-white mb-6"
                style={{ textShadow: '0 0 30px rgba(255, 182, 193, 0.12)' }}
              >
                Pakete & Optionen
              </h2>
              <div className="w-16 h-1 bg-[#d6a400] mb-8" />

              <p className="text-nox-white-muted mb-8 leading-relaxed">
                Die Pakete sind nischenspezifisch und werden im Erstgespräch exakt auf Ihr Geschäftsmodell zugeschnitten. Hier eine Orientierung:
              </p>

              <div className="space-y-6">
                {tiers.map((tier, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-900/30 to-gray-800/20 border border-white/10 rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-nox-white mb-2">{tier.name}</h3>
                        <p className="text-nox-white-muted mb-3">{tier.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-black/20 border border-white/10 rounded-lg p-4">
                        <p className="text-xs text-nox-white-muted uppercase tracking-wide mb-2">Typische Kunden</p>
                        <p className="text-sm text-nox-white">{tier.examples}</p>
                      </div>
                      <div className="bg-black/20 border border-white/10 rounded-lg p-4">
                        <p className="text-xs text-nox-white-muted uppercase tracking-wide mb-2">Ziel</p>
                        <p className="text-sm text-nox-white">{tier.goal}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-nox-white-muted font-semibold mb-3">Inkludiert:</p>
                      {tier.includes.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#d6a400] flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-nox-white-muted">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-gradient-to-br from-[#d6a400]/10 to-transparent border-l-4 border-[#d6a400] p-6 rounded-r-xl">
                <p className="text-lg text-nox-white leading-relaxed">
                  Die finale Konfiguration und Preisgestaltung erfolgt nach einer kurzen Bedarfsanalyse. Keine versteckten Kosten.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <h3
                      className="text-2xl font-bold text-nox-white"
                      style={{ textShadow: '0 0 30px rgba(255, 182, 193, 0.12)' }}
                    >
                      Für wen geeignet
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {suitableFor.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-nox-white-muted leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <X className="w-6 h-6 text-red-400" />
                    </div>
                    <h3
                      className="text-2xl font-bold text-nox-white"
                      style={{ textShadow: '0 0 30px rgba(255, 182, 193, 0.12)' }}
                    >
                      Nicht geeignet für
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {notSuitableFor.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="text-nox-white-muted leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-yellow-900/20 to-transparent border border-yellow-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-yellow-400 mb-2">
                    Wichtiger Hinweis
                  </h3>
                  <p className="text-sm text-gray-400">
                    Der Bot übernimmt Routineanfragen und Buchungen. Komplexe Sonderfälle werden strukturiert an Ihr Team weitergeleitet. Wir unterstützen Sie beim Feintuning nach Go-Live.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#d6a400]/20 to-[#f5c542]/20 rounded-2xl blur-xl" />
              <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-[#d6a400]/30 rounded-2xl p-10 text-center">
                <h2
                  className="text-2xl md:text-3xl font-bold text-nox-white mb-4"
                  style={{ textShadow: '0 0 30px rgba(255, 182, 193, 0.12)' }}
                >
                  Bereit, WhatsApp-Anfragen zu automatisieren?
                </h2>
                <p className="text-nox-white-muted mb-6 max-w-2xl mx-auto">
                  Wenn Sie pro Woche mehr als 10 WhatsApp-Anfragen bekommen, lohnt sich die Automatisierung fast immer. Lassen Sie uns über Ihre konkrete Situation sprechen.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/contact">
                    <Button variant="primary" className="text-lg px-8 py-4">
                      Termin vereinbaren
                      <Calendar className="inline-block ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/systems">
                    <Button variant="secondary" className="text-lg px-8 py-4">
                      Alle Systeme ansehen
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}
