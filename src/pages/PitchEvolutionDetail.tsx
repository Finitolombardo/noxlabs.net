import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertTriangle, Layers, CheckCircle2 } from 'lucide-react';
import Button from '../components/UI/Button';
import Accordion from '../components/UI/Accordion';

export default function PitchEvolutionDetail() {
  const stats = [
    {
      label: 'Lernt aus Antworten, nicht aus Klicks',
      description: 'Echte Signale statt indirekter Metriken'
    },
    {
      label: 'Entwickelt Texte datenbasiert weiter',
      description: 'Keine Optimierung nach Bauchgefühl'
    },
    {
      label: 'Wird als laufendes System betrieben',
      description: 'Kontinuierliche Verbesserung'
    }
  ];

  const problems = [
    {
      title: 'Antworten werden nicht systematisch ausgewertet',
      description: 'Sie werden gelesen, aber ihr Lernpotenzial bleibt ungenutzt.'
    },
    {
      title: 'A/B-Tests zeigen Zahlen, aber keine Ursachen',
      description: 'Öffnungsraten steigen oder fallen – aber warum, bleibt unklar.'
    },
    {
      title: 'Optimierung basiert auf Bauchgefühl',
      description: 'Textanpassungen folgen Vermutungen statt Evidenz.'
    },
    {
      title: 'Jede Kampagne startet wieder bei null',
      description: 'Gelerntes aus vergangenen Kampagnen fließt nicht strukturiert ein.'
    }
  ];

  const solutionSteps = [
    {
      title: 'Antworten analysieren',
      description: 'Jede Antwort wird strukturiert ausgewertet und in ihrem Kontext verstanden.',
      details: [
        'Was passiert: Klassifikationslogik nach Relevanz, Intent und Tonalität ordnet jede Antwort ein.',
        'Warum relevant: Antworten enthalten Einwände, Sprache und Kontext – das stärkste Trainingssignal.',
        'Ihr Vorteil: Sie verstehen, was Leads wirklich denken, nicht nur, ob sie öffnen.',
        'Kontext-Erkennung: Welche Variante, welcher Markt, welcher Kanal – alles wird zugeordnet.'
      ]
    },
    {
      title: 'Muster erkennen',
      description: 'Wiederkehrende Einwände, Trigger und Reaktionsmuster werden systematisch sichtbar.',
      details: [
        'Was passiert: Häufigkeitsanalyse über Zeit, Kampagnen und Zielgruppen zeigt wiederkehrende Signale.',
        'Warum relevant: Einzelne Antworten sind Rauschen. Muster sind Signal.',
        'Ihr Vorteil: Sie sehen, welche Argumente strukturell schwach sind und welche Sprache ankommt.',
        'Variantenzuordnung: Welcher Text löst welche Reaktion aus – kausal nachvollziehbar.'
      ]
    },
    {
      title: 'Varianten bewerten',
      description: 'Texte werden auf Basis echter Antworten verglichen, nicht auf Basis von Öffnungsraten.',
      details: [
        'Was passiert: Vergleich pro Problemfokus, Zielgruppe und Mutation – immer kausal sauber.',
        'Warum relevant: Öffnungsraten sind indirekt. Antworten zeigen echtes Interesse oder echte Ablehnung.',
        'Ihr Vorteil: Sie wissen, welche Texte funktionieren und warum – nicht nur, dass etwas funktioniert.',
        'Kausalitätscheck: Welche Mutation hat welchen Effekt verursacht – keine Zufallsoptimierung.'
      ]
    },
    {
      title: 'Empfehlungen ableiten',
      description: 'Das System liefert konkrete, begründete Handlungsempfehlungen statt vager Insights.',
      details: [
        'Was passiert: Konkrete Textanpassungen mit Begründung aus realen Antworten werden vorgeschlagen.',
        'Warum relevant: Vage Insights wie "Text kürzer machen" helfen nicht. Konkrete Empfehlungen schon.',
        'Ihr Vorteil: Sie können Entscheidungen nachvollziehen und lernen, was in Ihrer Zielgruppe wirkt.',
        'Fokus-Empfehlungen: Wo liegt das größte Optimierungspotenzial – priorisiert nach Lernpotenzial.'
      ]
    }
  ];

  const mutationVariables = [
    {
      name: 'Problemfokus',
      effect: 'Welches Kernproblem des Leads wird angesprochen'
    },
    {
      name: 'Angebotsform',
      effect: 'Wie wird die Lösung präsentiert (Demo, Gespräch, Report)'
    },
    {
      name: 'Proof-Typ',
      effect: 'Welche Glaubwürdigkeit wird genutzt (Case, Daten, Social Proof)'
    },
    {
      name: 'Antwort-Reibung',
      effect: 'Wie aufwändig ist die gewünschte Antwort'
    },
    {
      name: 'Personalisierungsgrad',
      effect: 'Tiefe der individuellen Ansprache'
    },
    {
      name: 'Länge',
      effect: 'Informationsdichte und Prägnanz'
    },
    {
      name: 'Betreff-Stil',
      effect: 'Neugier, Konkretion oder Direktheit'
    },
    {
      name: 'Positionierung',
      effect: 'Rolle des Absenders (Experte, Partner, Peer)'
    },
    {
      name: 'Risiko-Umkehr',
      effect: 'Wer trägt das Risiko der Entscheidung'
    },
    {
      name: 'Einstiegstyp',
      effect: 'Wie startet die Nachricht (Frage, Beobachtung, Behauptung)'
    }
  ];

  const learningRules = [
    {
      rule: 'Pro Versandpfad wird nur eine Variable mutiert',
      why: 'Nur so bleibt kausal klar, was wirkt. Mehrere Lernpfade können parallel existieren (z.B. über mehrere Mailboxen).'
    },
    {
      rule: 'Erfolgreiche Mutationen werden neue Baseline',
      why: 'Kontinuierliche Verbesserung statt Rückkehr zum Start'
    },
    {
      rule: 'Schlechte Mutationen werden verworfen',
      why: 'Keine Ressourcen für nachweislich schwache Varianten'
    },
    {
      rule: 'Problemfokus-Wechsel erst nach mehrfacher Evidenz',
      why: 'Der Problemfokus (das Kernproblem, mit dem der Lead angesprochen wird) ist die grundlegendste Variable und braucht statistische Sicherheit.'
    }
  ];

  const extensions = [
    {
      title: 'Mehrsprachige Lernlogik',
      description: 'Eigene Lernmodelle pro Sprache und Markt. Das System lernt kulturelle Argumentationsmuster, nicht nur Übersetzungen.',
      details: [
        'Was ändert sich: Separate Mutationslogik und Antwortanalyse pro Sprache.',
        'Warum mächtig: Tonalität, Einwände und Pitch-Stil unterscheiden sich fundamental zwischen Märkten.',
        'Für wen sinnvoll: Unternehmen mit internationaler Outreach-Strategie.',
        'Langfristiger Vorteil: Regionalspezifische Pitch-Stile statt globalem Durchschnitt.'
      ]
    },
    {
      title: 'Mehrere Märkte / Regionen',
      description: 'Separate Lernlogik pro Markt. Vergleich zwischen Märkten möglich.',
      details: [
        'Was ändert sich: Jeder Markt läuft als eigenständiges Lernsystem.',
        'Warum mächtig: Sie sehen, welche Argumentationslogik in welchem Markt funktioniert.',
        'Für wen sinnvoll: B2B-Unternehmen mit regionalen Unterschieden (DACH vs. UK vs. USA).',
        'Skalierung ohne Qualitätsverlust: Mehr Märkte = mehr Lerngeschwindigkeit.'
      ]
    },
    {
      title: 'Automatische Varianten-Vorschläge',
      description: 'System erzeugt neue Pitch-Varianten aus realen Antwortmustern. Zwei Modi: kontrolliert (manuelle Freigabe) oder autonom (automatische Ausspielung).',
      details: [
        'Was ändert sich: Statt nur zu analysieren, schlägt das System neue Textvarianten vor.',
        'Warum mächtig: Lernen wird schneller, weil das System proaktiv testet.',
        'Für wen sinnvoll: Teams mit hohem Versandvolumen und klarer Zielgruppe.',
        'Autonomer Modus = maximaler Nutzen: System optimiert vollständig eigenständig.'
      ]
    },
    {
      title: 'Flexible Versand-Anbindung',
      description: 'Standard: Kampagnen-Tools (z.B. Instantly). Optional: bestehende Postfächer (Gmail etc.).',
      details: [
        'Was ändert sich: Anbindung an Ihre bestehende Infrastruktur statt Tool-Zwang.',
        'Warum mächtig: Sie können Ihre bewährten Postfächer und Warmup-Strategien weiter nutzen.',
        'Für wen sinnvoll: Teams mit etablierten Versand-Setups.',
        'Kein Tool-Zwang: Sie bestimmen, wie Sie versenden.'
      ]
    }
  ];

  const orchestrationOptions = [
    {
      title: 'Verbindung mit Leadforge (Leadgenerierung)',
      points: [
        'Leads, Ansprechpartner und Kontextdaten werden geliefert',
        'Pitch-Evolution übernimmt Versand und Optimierung',
        'Geschlossener Lernkreislauf'
      ]
    },
    {
      title: 'CRM-Anbindung',
      points: [
        'Qualifizierte Leads inkl. Antwort-Kontext',
        'Sales spricht informierte Kontakte',
        'Nachvollziehbare Gesprächshistorie'
      ]
    },
    {
      title: 'Perspektive: Content-Systeme',
      points: [
        'Einwände und Trigger → Content-Ideen',
        'Mehrsprachige Assets',
        'Zukünftige Erweiterung, keine Zusage'
      ]
    }
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
            className="inline-flex items-center gap-2 text-nox-white-muted hover:text-nox-red transition-colors mb-8"
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
          <div className="absolute inset-0 bg-gradient-to-r from-[#E84040]/20 to-[#FF6B6B]/20 rounded-3xl blur-2xl" />
          <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-[#E84040]/30 rounded-3xl p-8 md:p-12">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs px-3 py-1 bg-white/10 text-nox-white-muted rounded-full border border-white/10">
                Leadgen
              </span>
              <span className="text-xs px-3 py-1 bg-white/10 text-nox-white-muted rounded-full border border-white/10">
                Outreach
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-nox-white mb-4">
              Pitch-Evolutionssystem
            </h1>

            <p className="text-xl text-nox-white-muted mb-8 leading-relaxed">
              Ein lernendes Outreach-System, das aus echten Antworten strukturiertes Wissen
              gewinnt – und daraus bessere Entscheidungen ableitet.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="border-l-2 border-[#E84040] pl-4"
                >
                  <h3 className="text-nox-white font-semibold mb-2 leading-snug text-sm">{stat.label}</h3>
                  <p className="text-xs text-nox-white-muted">{stat.description}</p>
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
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Warum klassische Outreach-Optimierung stagniert
              </h2>
              <div className="w-16 h-1 bg-[#E84040] mb-8" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {problems.map((problem, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6"
                  >
                    <h3 className="text-nox-white font-semibold mb-2">{problem.title}</h3>
                    <p className="text-sm text-nox-white-muted">{problem.description}</p>
                  </div>
                ))}
              </div>

              <div className="border-l-4 border-[#E84040] pl-6 py-4">
                <p className="text-xl text-nox-white font-light italic">
                  Das eigentliche Problem ist nicht der Text – sondern fehlendes Lernen.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Antworten sind das stärkste Trainingssignal
              </h2>
              <div className="w-16 h-1 bg-[#E84040] mb-8" />

              <p className="text-nox-white-muted leading-relaxed mb-6">
                Öffnungen und Klicks sind indirekt. Antworten enthalten Einwände, Sprache,
                Motivation und Kontext. Das System behandelt jede Antwort als Lernmaterial.
              </p>

              <div className="bg-gradient-to-br from-[#E84040]/10 to-transparent border-l-4 border-[#E84040] p-8 rounded-r-xl">
                <p className="text-2xl text-nox-white font-light">
                  Nicht mehr versenden – besser verstehen.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Wie das System arbeitet
              </h2>
              <div className="w-16 h-1 bg-[#E84040] mb-8" />

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

              <div className="mt-8 bg-gradient-to-br from-[#2a0a0c]/40 to-transparent border border-nox-red/30 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-nox-white-muted leading-relaxed font-medium mb-2">
                      Die Antwortklassifizierung ist kein Modul – sie ist das Fundament des
                      Systems.
                    </p>
                    <p className="text-sm text-nox-white-muted">
                      Ohne sie existiert keine Pitch-Evolution.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Gezielte Pitch-Mutation statt blindem Testing
              </h2>
              <div className="w-16 h-1 bg-[#E84040] mb-8" />

              <p className="text-nox-white-muted leading-relaxed mb-8">
                Das System arbeitet mit festen Mutations-Variablen. Pro Lerniteration wird immer
                nur eine Variable verändert, alle anderen bleiben konstant.
              </p>

              <h3 className="text-xl font-semibold text-nox-white mb-6">
                Die 10 Mutations-Variablen
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {mutationVariables.map((variable, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-900/30 to-gray-800/20 border border-white/10 rounded-lg p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[#E84040] font-mono text-sm font-bold">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h4 className="text-nox-white font-semibold">{variable.name}</h4>
                    </div>
                    <p className="text-sm text-nox-white-muted leading-relaxed">{variable.effect}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-semibold text-nox-white mb-6">Lernregeln</h3>
              <div className="space-y-4 mb-8">
                {learningRules.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-6 h-6 bg-[#E84040] rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">{index + 1}</span>
                      </div>
                      <p className="text-nox-white font-medium">{item.rule}</p>
                    </div>
                    <p className="text-sm text-nox-white-muted ml-9">{item.why}</p>
                  </div>
                ))}
              </div>

              <div className="border-l-4 border-[#E84040] pl-6 py-4">
                <p className="text-lg text-nox-white font-light">
                  Ergebnis: Kausale Lernkurve, keine Zufallsoptimierung
                </p>
              </div>

              <div className="mt-8 bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-nox-white mb-4">
                  Parallele Lerniterationen
                </h3>
                <p className="text-nox-white-muted leading-relaxed mb-4">
                  Das System kann mehrere Lerniterationen parallel betreiben – zum Beispiel über
                  mehrere Versandkonten oder Kampagnen. Jede Iteration lernt kausal sauber, ohne
                  Signalvermischung.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#E84040] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-nox-white">Getrennte Versandpfade:</strong>
                      <span className="text-sm text-nox-white-muted block mt-1">
                        Jeder Pfad testet eine Variable isoliert
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#E84040] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-nox-white">Keine Signalvermischung:</strong>
                      <span className="text-sm text-nox-white-muted block mt-1">
                        Sie wissen immer, welche Änderung welchen Effekt hatte
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#E84040] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-nox-white">Höhere Lerngeschwindigkeit:</strong>
                      <span className="text-sm text-nox-white-muted block mt-1">
                        Mehrere Hypothesen werden gleichzeitig geprüft
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Optionale Erweiterungen
              </h2>
              <div className="w-16 h-1 bg-[#E84040] mb-8" />

              <p className="text-nox-white-muted mb-8 leading-relaxed">
                Das Basissystem ist immer enthalten. Erweiterungen können je nach Bedarf ergänzt
                werden. Die Auswahl erfolgt im Konfigurator.
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
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                System-Orchestrierung
              </h2>
              <div className="w-16 h-1 bg-[#E84040] mb-8" />

              <p className="text-nox-white-muted mb-8 leading-relaxed">
                Optional: Verbindung mit anderen Systemen für geschlossene Lernkreisläufe.
              </p>

              <div className="space-y-6">
                {orchestrationOptions.map((option, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <Layers className="w-5 h-5 text-[#E84040] flex-shrink-0 mt-0.5" />
                      <h3 className="text-nox-white font-semibold">{option.title}</h3>
                    </div>
                    <ul className="space-y-2 ml-8">
                      {option.points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-nox-white-muted">
                          <span className="text-[#E84040] mt-1">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Betrieb & Weiterentwicklung
              </h2>
              <div className="w-16 h-1 bg-[#E84040] mb-8" />

              <div className="border-l-4 border-[#E84040] pl-6 py-4 bg-gradient-to-r from-[#E84040]/10 to-transparent rounded-r-xl mb-8">
                <p className="text-xl text-nox-white font-light leading-relaxed">
                  Das Pitch-Evolutionssystem wird nicht eingerichtet und übergeben – es wird
                  betrieben, überwacht und kontinuierlich weiterentwickelt.
                </p>
              </div>

              <p className="text-nox-white-muted leading-relaxed mb-6">
                Antwortmuster ändern sich. Märkte verändern sich. Argumente verlieren an Kraft
                oder gewinnen an Relevanz. Ein statisches System stagniert. Ein betriebenes
                System lernt.
              </p>

              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6">
                <div className="space-y-4 text-nox-white-muted">
                  <div className="flex items-start gap-3">
                    <span className="text-[#E84040] mt-1">•</span>
                    <div>
                      <strong className="text-nox-white">Monatlicher Retainer:</strong>
                      <span className="text-sm text-nox-white-muted block mt-1">
                        Kein Einmal-Projekt. Kein Setup-and-forget.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#E84040] mt-1">•</span>
                    <div>
                      <strong className="text-nox-white">Laufender Betrieb:</strong>
                      <span className="text-sm text-nox-white-muted block mt-1">
                        Kontinuierliche Analyse, Mutationsentscheidungen und Optimierung
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#E84040] mt-1">•</span>
                    <div>
                      <strong className="text-nox-white">Aktive Weiterentwicklung:</strong>
                      <span className="text-sm text-nox-white-muted block mt-1">
                        System wird nicht sich selbst überlassen. Hypothesen werden geprüft,
                        Lernlogik wird angepasst.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#E84040]/20 to-[#FF6B6B]/20 rounded-2xl blur-xl" />
              <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-[#E84040]/30 rounded-2xl p-10 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-nox-white mb-4">
                  Bereit für strukturiertes Lernen?
                </h2>
                <p className="text-nox-white-muted mb-6 max-w-2xl mx-auto">
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
