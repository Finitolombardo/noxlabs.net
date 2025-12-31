import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertTriangle, Layers, CheckCircle2 } from 'lucide-react';
import Button from '../components/UI/Button';
import Accordion from '../components/UI/Accordion';

export default function ContentEngineDetail() {
  const stats = [
    {
      label: 'Lernt aus echten Signalen',
      description: 'Nutzerreaktionen, Marktbewegungen und Wettbewerbsauftritte'
    },
    {
      label: 'Extrahiert Strukturen, nicht Texte',
      description: 'Hooks, Narrative und Formate werden abstrahiert'
    },
    {
      label: 'Wird als laufendes System betrieben',
      description: 'Kontinuierliche Weiterentwicklung'
    }
  ];

  const problems = [
    {
      title: 'Content basiert auf Annahmen',
      description: 'Themen, Hooks und Formate werden geplant, ohne echte Marktvalidierung.'
    },
    {
      title: 'Erfolg wird nicht zerlegt',
      description: 'Views, Likes und Reichweite zeigen Zahlen – aber keine Ursachen.'
    },
    {
      title: 'Wiederholung statt Lernen',
      description: 'Erfolgreiche Inhalte werden nachgeahmt, ohne zu verstehen, warum sie funktionieren.'
    },
    {
      title: 'Kein systematischer Wissensaufbau',
      description: 'Content-Erkenntnisse gehen verloren, statt strukturiert gespeichert zu werden.'
    }
  ];

  const principles = [
    {
      title: 'Lernt aus echten Signalen',
      description: 'Nutzerreaktionen, Marktbewegungen und Wettbewerbsauftritte werden als Lernmaterial behandelt.'
    },
    {
      title: 'Extrahiert Strukturen, nicht Texte',
      description: 'Hooks, Narrative, Formate und Positionierungen werden abstrahiert – nicht kopiert.'
    },
    {
      title: 'Wandelt Erkenntnisse in Assets',
      description: 'Aus Signalen entstehen wiederverwendbare Content-Module, Vorlagen und Strategien.'
    }
  ];

  const solutionSteps = [
    {
      title: 'Markt- & Wettbewerbsanalyse',
      description: 'Erfolgreiche Unternehmen, Einzelpersonen und Marken werden identifiziert und systematisch analysiert.',
      details: [
        'Was passiert: Erfolgreiche Marktteilnehmer werden anhand von Reichweite, Engagement und Positionierung identifiziert.',
        'Warum relevant: Die erfolgreichsten Akteure zeigen, welche Content-Strategien in Ihrem Markt funktionieren.',
        'Ihr Vorteil: Sie verstehen, welche Muster bereits validiert sind – statt blind zu testen.',
        'Kontext-Erkennung: Branche, Plattform, Zielgruppe und Produktkategorie werden berücksichtigt.'
      ]
    },
    {
      title: 'Pattern-Erkennung',
      description: 'Wiederkehrende Erfolgsmechaniken in Hooks, Formaten, Plattform-Nutzung und Tonalität werden extrahiert.',
      details: [
        'Was passiert: Analyse von Einstiegstypen, narrativen Strukturen, Länge, Tonalität und visueller Gestaltung.',
        'Warum relevant: Einzelne erfolgreiche Posts sind Zufall. Wiederkehrende Muster sind Signal.',
        'Ihr Vorteil: Sie sehen, welche Content-Strukturen systematisch funktionieren – nicht nur einmalig.',
        'Abstraktion statt Kopie: Es werden Prinzipien extrahiert, keine Texte kopiert.'
      ]
    },
    {
      title: 'Signal-Bewertung',
      description: 'Korrelationen zwischen Struktur, Plattform und Erfolg werden sichtbar gemacht.',
      details: [
        'Was passiert: Vergleich zwischen verschiedenen Content-Ansätzen und deren messbaren Ergebnissen.',
        'Warum relevant: Nicht jeder erfolgreiche Content ist übertragbar. Korrelationen zeigen, was replizierbar ist.',
        'Ihr Vorteil: Sie wissen, welche Strukturen für Ihr Produkt und Ihre Zielgruppe relevant sind.',
        'Kausalitätscheck: Welche Mechanik hat welchen Effekt verursacht – keine Zufallsoptimierung.'
      ]
    },
    {
      title: 'Übersetzung in Content-Strukturen',
      description: 'Die gewonnenen Muster werden auf das Produkt, die Branche und das Ziel des Kunden übertragen.',
      details: [
        'Was passiert: Abstrakte Patterns werden konkret auf Ihr Angebot, Ihre Positionierung und Ihre Zielgruppe angepasst.',
        'Warum relevant: Gute Patterns ohne Übersetzung helfen nicht. Konkrete Strukturen schon.',
        'Ihr Vorteil: Sie erhalten wiederverwendbare Content-Module, keine vagen Insights.',
        'Fokus-Empfehlungen: Welche Plattformen, Formate und Hooks haben das größte Potenzial.'
      ]
    },
    {
      title: 'Integration in bestehende Systeme',
      description: 'Erkenntnisse können direkt in Outreach-, Repurposing- oder Publishing-Systeme eingespeist werden.',
      details: [
        'Was passiert: Content-Strukturen werden als Vorlagen, Briefings oder automatisierte Workflows bereitgestellt.',
        'Warum relevant: Erkenntnisse ohne Umsetzung sind wertlos. Integration schließt den Kreislauf.',
        'Ihr Vorteil: Sie können Erkenntnisse direkt nutzen – ohne manuelle Übersetzung.',
        'System-Orchestrierung: Verbindung mit Pitch-Evolution, Leadforge oder Publishing-Tools möglich.'
      ]
    }
  ];

  const extensions = [
    {
      title: 'Market Pattern Intelligence',
      description: 'Automatisierte Analyse der erfolgreichsten Marktteilnehmer inklusive Plattformen, Content-Strukturen und Positionierung.',
      details: [
        'Was ändert sich: Kontinuierliche Überwachung statt einmaliger Analyse.',
        'Warum mächtig: Märkte verändern sich. Automatisiertes Tracking zeigt neue Trends frühzeitig.',
        'Für wen sinnvoll: Unternehmen in dynamischen Märkten mit hoher Content-Frequenz.',
        'Langfristiger Vorteil: Sie bleiben am Puls des Marktes, ohne manuell zu recherchieren.'
      ]
    },
    {
      title: 'Competitive Presence Mapping',
      description: 'Analyse, wo und wie Wettbewerber sichtbar sind – inklusive Funnel-Logik und Kanalprioritäten.',
      details: [
        'Was ändert sich: Nicht nur Content, sondern die gesamte Präsenzstrategie wird analysiert.',
        'Warum mächtig: Sie sehen, welche Plattformen, Formate und Kanäle Wettbewerber priorisieren.',
        'Für wen sinnvoll: Unternehmen, die ihre Content-Strategie neu ausrichten oder erweitern wollen.',
        'Strategischer Vorteil: Sie verstehen die Logik hinter der Sichtbarkeit – nicht nur die Oberfläche.'
      ]
    },
    {
      title: 'Deep Signal Enrichment',
      description: 'Anreicherung mit zusätzlichen Kontextdaten wie Social Proof, Tonalität, Narrative und Engagement-Muster.',
      details: [
        'Was ändert sich: Tiefere Analyse der emotionalen und narrativen Ebene von Content.',
        'Warum mächtig: Content funktioniert nicht nur durch Struktur, sondern durch Resonanz.',
        'Für wen sinnvoll: Marken mit starkem Fokus auf Storytelling und emotionaler Ansprache.',
        'Narrative Intelligenz: Sie verstehen, welche Geschichten in Ihrem Markt funktionieren.'
      ]
    },
    {
      title: 'Content Engine Sync',
      description: 'Direkte Übergabe der Erkenntnisse an bestehende Content- oder Outreach-Systeme.',
      details: [
        'Was ändert sich: Automatisierte Integration statt manueller Übersetzung.',
        'Warum mächtig: Erkenntnisse werden direkt umsetzbar, ohne Medienbruch.',
        'Für wen sinnvoll: Teams mit etablierten Content-Workflows und Publishing-Tools.',
        'Geschlossener Kreislauf: Von Analyse über Strukturierung bis zur Ausspielung – alles verbunden.'
      ]
    }
  ];

  const targetAudience = [
    'Unternehmen mit erklärungsbedürftigen Produkten',
    'Teams mit regelmäßigem Content-Bedarf',
    'Gründer & Marken im Aufbau von Authority',
    'Systeme, die bereits Daten erzeugen, aber nicht daraus lernen'
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
            className="inline-flex items-center gap-2 text-gray-400 hover:text-[#f5c542] transition-colors mb-8"
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
          <div className="absolute inset-0 bg-gradient-to-r from-[#d6a400]/20 to-[#f5c542]/20 rounded-3xl blur-2xl" />
          <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-[#d6a400]/30 rounded-3xl p-8 md:p-12">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs px-3 py-1 bg-white/10 text-gray-300 rounded-full border border-white/10">
                Content
              </span>
              <span className="text-xs px-3 py-1 bg-white/10 text-gray-300 rounded-full border border-white/10">
                Ops
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Content Engine – systematisches Lernen aus Markt- & Nutzerreaktionen
            </h1>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Ein Content-System, das reale Marktreaktionen, Einwände und erfolgreiche Muster in skalierbare Content-Assets übersetzt – statt Inhalte zu raten.
            </p>

            <div className="mb-8">
              <p className="text-gray-300 leading-relaxed">
                Die Content Engine ist kein Redaktionsplan und kein Generator.
                Sie ist ein lernendes System, das aus echten Markt-, Wettbewerbs- und Nutzer-Signalen strukturiertes Content-Wissen aufbaut und wiederverwendbar macht.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="border-l-2 border-[#d6a400] pl-4"
                >
                  <h3 className="text-white font-semibold mb-2 leading-snug text-sm">{stat.label}</h3>
                  <p className="text-xs text-gray-400">{stat.description}</p>
                </div>
              ))}
            </div>

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

        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                Warum klassische Content-Strategien stagnieren
              </h2>
              <div className="w-16 h-1 bg-[#d6a400] mb-8" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {problems.map((problem, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6"
                  >
                    <h3 className="text-white font-semibold mb-2">{problem.title}</h3>
                    <p className="text-sm text-gray-400">{problem.description}</p>
                  </div>
                ))}
              </div>

              <div className="border-l-4 border-[#d6a400] pl-6 py-4">
                <p className="text-xl text-white font-light italic">
                  Das eigentliche Problem ist nicht Content-Mangel – sondern fehlende Struktur im Lernen.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                Was die Content Engine anders macht
              </h2>
              <div className="w-16 h-1 bg-[#d6a400] mb-8" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {principles.map((principle, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6"
                  >
                    <h3 className="text-white font-semibold mb-3">{principle.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{principle.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                Wie das System arbeitet
              </h2>
              <div className="w-16 h-1 bg-[#d6a400] mb-8" />

              <div className="space-y-4">
                {solutionSteps.map((step, index) => (
                  <Accordion
                    key={index}
                    title={step.title}
                    description={step.description}
                    details={step.details}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                Optionale Module
              </h2>
              <div className="w-16 h-1 bg-[#d6a400] mb-8" />

              <p className="text-gray-400 mb-8 leading-relaxed">
                Das Basissystem ist immer enthalten. Module können je nach Bedarf ergänzt werden. Die Auswahl erfolgt im Konfigurator.
              </p>

              <div className="space-y-4">
                {extensions.map((extension, index) => (
                  <Accordion
                    key={index}
                    title={extension.title}
                    description={extension.description}
                    details={extension.details}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                Für wen die Content Engine geeignet ist
              </h2>
              <div className="w-16 h-1 bg-[#d6a400] mb-8" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {targetAudience.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#d6a400] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                Betrieb & Weiterentwicklung
              </h2>
              <div className="w-16 h-1 bg-[#d6a400] mb-8" />

              <div className="border-l-4 border-[#d6a400] pl-6 py-4 bg-gradient-to-r from-[#d6a400]/10 to-transparent rounded-r-xl mb-8">
                <p className="text-xl text-white font-light leading-relaxed">
                  Die Content Engine ist kein einmaliges Setup.
                  Sie wird betrieben, überwacht und kontinuierlich erweitert.
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6">
                <div className="space-y-4 text-gray-300">
                  <div className="flex items-start gap-3">
                    <span className="text-[#d6a400] mt-1">•</span>
                    <div>
                      <strong className="text-white">Laufender Betrieb:</strong>
                      <span className="text-sm text-gray-400 block mt-1">
                        Kontinuierliche Analyse, Pattern-Erkennung und Anpassung
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#d6a400] mt-1">•</span>
                    <div>
                      <strong className="text-white">Erweiterbare Module:</strong>
                      <span className="text-sm text-gray-400 block mt-1">
                        System kann mit zusätzlichen Analyse-Ebenen erweitert werden
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#d6a400] mt-1">•</span>
                    <div>
                      <strong className="text-white">Anpassung an Marktveränderungen:</strong>
                      <span className="text-sm text-gray-400 block mt-1">
                        System reagiert auf neue Plattformen, Formate und Content-Trends
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#d6a400]/20 to-[#f5c542]/20 rounded-2xl blur-xl" />
              <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-[#d6a400]/30 rounded-2xl p-10 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Bereit, Content nicht mehr zu raten – sondern abzuleiten?
                </h2>
                <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                  Unverbindliche Erstberatung. Systemische Analyse. Transparente Einschätzung.
                </p>
                <Link to="/contact">
                  <Button variant="primary" className="text-lg px-8 py-4">
                    Unverbindlich besprechen
                    <ArrowRight className="inline-block ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}
