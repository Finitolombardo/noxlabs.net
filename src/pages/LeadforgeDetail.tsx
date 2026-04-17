import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertTriangle, Layers, CheckCircle2 } from 'lucide-react';
import Button from '../components/UI/Button';
import Accordion from '../components/UI/Accordion';

export default function LeadforgeDetail() {
  const stats = [
    {
      label: 'Kontextbasierte Daten statt CSV-Rohlisten',
      description: 'Strukturierte Intelligence von Anfang an'
    },
    {
      label: 'Erweiterbar durch Intelligence- & Enrichment-Layer',
      description: 'Von Basic bis Deep Research skalierbar'
    },
    {
      label: 'Skalierbar über Länder, Märkte und Volumen',
      description: 'Einzelstadt bis Multi-Country'
    }
  ];

  const problems = [
    {
      title: 'Rohlisten ohne Kontext',
      description: 'Name und Email existieren, aber Relevanz, Timing und Priorität fehlen.'
    },
    {
      title: 'Keine Anreicherung oder Priorisierung',
      description: 'Alle Leads werden gleich behandelt, obwohl sie unterschiedliche Potenziale haben.'
    },
    {
      title: 'Jede Kampagne startet wieder bei null',
      description: 'Learnings aus vergangenen Recherchen fließen nicht strukturiert ein.'
    },
    {
      title: 'Leads sind Datenpunkte, keine Entscheidungsgrundlage',
      description: 'Was fehlt: Kontext, Priorität und systemfähige Übergabe an Outreach.'
    }
  ];

  const solutionSteps = [
    {
      title: 'Lead Acquisition',
      description: 'Strukturierte Lead-Erfassung nach Stadt, Land, Nische und Typ.',
      details: [
        'Was passiert: Zielparameter werden definiert – Stadt/Region, Land, Branche/Nische, Lead-Typ (B2B/Investoren).',
        'Warum relevant: Ohne klare Parameter entsteht Rauschen statt Signal. Struktur schafft Wiederholbarkeit.',
        'Ihr Vorteil: Sie erhalten genau die Leads, die Sie definiert haben – nicht, was eine Datenbank gerade liefert.',
        'Skalierung: Von Einzelstadt bis Multi-Country mit konsistenter Qualität.'
      ]
    },
    {
      title: 'Enrichment & Context',
      description: 'Anreicherung über Unternehmensdaten, Social Signals, Reviews und Marktinformationen.',
      details: [
        'Was passiert: Basis-Enrichment liefert Firmengröße, Website-Daten, Standort-Kontext.',
        'Warum relevant: Ein Lead ohne Kontext ist wertlos. Erst Anreicherung macht ihn ansprechbar.',
        'Ihr Vorteil: Sie sprechen nicht blind an – Sie wissen, mit wem Sie sprechen.',
        'Modular erweiterbar: Von Basis-Daten bis Deep Intelligence je nach Bedarf.'
      ]
    },
    {
      title: 'Intelligence Layer',
      description: 'Optionale Deep-Analyse für bessere Priorisierung und Personalisierung.',
      details: [
        'Was passiert: Social Media Analyse, Review-Analyse, Pain Signal Detection, Trigger Events.',
        'Warum relevant: Nicht jeder Lead ist gleich wichtig. Intelligence schafft Priorisierung.',
        'Ihr Vorteil: Sie wissen, wen Sie zuerst ansprechen sollten – und mit welchem Kontext.',
        'Optional: Nur wenn Deep Research sinnvoll ist. Basis-System funktioniert auch ohne.'
      ]
    },
    {
      title: 'Delivery & Integration',
      description: 'Übergabe an CRM, Sheets oder Outreach-Systeme.',
      details: [
        'Was passiert: Strukturierte Übergabe in Google Sheets, Notion, CRM oder direkt an Outreach-Tools.',
        'Warum relevant: Leads müssen systemfähig sein – ohne manuelle Nachbearbeitung.',
        'Ihr Vorteil: Direkt nutzbar, keine Copy-Paste-Workflows.',
        'Flexibel: Sie bestimmen, wohin die Leads fließen.'
      ]
    }
  ];

  const coreSystem = [
    'Strukturierte Lead-Erfassung nach Geo, Nische und Typ',
    'Automatisches Rescraping & Fallback-Logik bei Fehlern',
    'Validierte, nutzbare Leads statt Rohdaten',
    'Deduplication & Suppression gegen Dubletten'
  ];

  const geoMarketScope = [
    {
      name: 'Einzelstadt',
      effect: 'Fokussierte lokale Recherche'
    },
    {
      name: 'Multi-City',
      effect: 'Mehrere Städte, gleiche Strategie'
    },
    {
      name: 'Länderweit',
      effect: 'Nationale Skalierung'
    },
    {
      name: 'Multi-Country',
      effect: 'Internationale Märkte'
    }
  ];

  const leadTypeModule = [
    {
      name: 'B2B-Unternehmen',
      effect: 'Klassisches B2B-Leadgen nach Branche und Größe'
    },
    {
      name: 'Investoren',
      effect: 'Angel, VC, Fonds – recherchiert und kontextualisiert'
    },
    {
      name: 'Crowdfunding',
      effect: 'In Entwicklung – noch keine Zusage'
    }
  ];

  const deepIntelligence = [
    {
      title: 'Social Media Analyse',
      description: 'LinkedIn, Twitter/X, Facebook – was posten und teilen die Entscheider?',
      details: [
        'Was ändert sich: Statt nur Namen erhalten Sie Kontext über Aktivität und Interessen.',
        'Warum mächtig: Sie können personalisierter ansprechen – nicht nur "Hallo [Name]".',
        'Für wen sinnvoll: High-Value-Outreach mit kleinem Volumen.',
        'Erhöht Relevanz: Deutlich höhere Antwortrate durch echten Kontext.'
      ]
    },
    {
      title: 'Reviews & Reputation',
      description: 'Google Reviews, Trustpilot, G2 – was sagen Kunden und Nutzer?',
      details: [
        'Was ändert sich: Sie sehen, wo das Unternehmen Probleme oder Stärken hat.',
        'Warum mächtig: Pain Points sind sichtbar – perfekte Ansprache-Trigger.',
        'Für wen sinnvoll: Solution-Selling mit klarem Problem-Fit.',
        'Insider-Kontext: Sie wissen mehr als das Unternehmen selbst über seine Wahrnehmung.'
      ]
    },
    {
      title: 'Unternehmens- & Markt-Kontext',
      description: 'Größe, Wachstum, Finanzierung, Marktposition – strukturiert erfasst.',
      details: [
        'Was ändert sich: Statt blind anzusprechen, wissen Sie, ob der Lead passt.',
        'Warum mächtig: Sie verschwenden keine Ressourcen auf unpassende Leads.',
        'Für wen sinnvoll: Enterprise-Outreach mit klaren ICP-Kriterien.',
        'Bessere Priorisierung: Sie sprechen die besten Leads zuerst an.'
      ]
    },
    {
      title: 'Pain Signals & Trigger',
      description: 'Hiring-Signale, Tech-Stack-Änderungen, Expansion-Trigger – proaktiv erkannt.',
      details: [
        'Was ändert sich: Sie sprechen Leads an, wenn sie gerade ein Problem haben.',
        'Warum mächtig: Timing ist alles. Trigger erhöhen Relevanz massiv.',
        'Für wen sinnvoll: Sales-Teams mit klarem Timing-Vorteil.',
        'Intent-Based Outreach: Nicht mehr pushen, sondern zur richtigen Zeit da sein.'
      ]
    }
  ];

  const extensions = [
    {
      title: 'Leadgen Agent Control (Advanced)',
      description: 'Manuelle Steuerung von Stadt, Land, Nische und Volumen. Für Power-User & Enterprise.',
      details: [
        'Was ändert sich: Sie können selbst neue Märkte definieren und Recherche-Runs starten.',
        'Warum mächtig: Maximale Flexibilität ohne Entwickler-Abhängigkeit.',
        'Für wen sinnvoll: Agencies, Sales-Teams mit schnellen Marktveränderungen.',
        'Autonomie: Keine Wartezeiten, sofortige Anpassung.'
      ]
    },
    {
      title: 'Re-Scrape Engine',
      description: 'Automatisches Retry für fehlgeschlagene Leads + kontinuierliche Daten-Updates.',
      details: [
        'Was ändert sich: Fehlgeschlagene Scrapes werden automatisch wiederholt.',
        'Warum mächtig: Höhere Datenausbeute ohne manuelle Nacharbeit.',
        'Für wen sinnvoll: Hochvolumen-Outreach mit strikten Qualitätsanforderungen.',
        'Intelligent: Zeitversetzt, mit variierten Parametern, nicht blind.'
      ]
    },
    {
      title: 'Quality Score Layer',
      description: 'Bewertung der Datenvollständigkeit + Flags für problematische Leads.',
      details: [
        'Was ändert sich: Jeder Lead erhält einen Quality Score.',
        'Warum mächtig: Sie können Outreach-Intensität nach Datenqualität steuern.',
        'Für wen sinnvoll: Teams mit strikten Qualitätsrichtlinien.',
        'Priorisierung: Beste Leads zuerst, schwache Leads später oder gar nicht.'
      ]
    }
  ];

  const orchestrationOptions = [
    {
      title: 'Verbindung mit Pitch-Evolution (Outreach-Optimierung)',
      points: [
        'Leadgen Engine liefert angereicherte, validierte Leads',
        'Pitch-Evolution übernimmt Versand und lernende Optimierung',
        'Geschlossener Kreislauf: Recherche → Ansprache → Lernen'
      ]
    },
    {
      title: 'Verbindung mit Content-Repurposing',
      points: [
        'Extrahierte Services und Pain Points fließen in Content-Assets',
        'Objections und Use Cases werden systematisch dokumentiert',
        'Lead-Kontext wird zu Content-Ideen'
      ]
    },
    {
      title: 'CRM / Notion Sync',
      points: [
        'Strukturierte Lead-Datenbank mit Lifecycle States',
        'Automatische Updates bei Status-Änderungen',
        'Historische Recherche-Daten bleiben nachvollziehbar'
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
          <div className="absolute inset-0 bg-gradient-to-r from-[#EF3A4C]/20 to-[#FF4D5E]/20 rounded-3xl blur-2xl" />
          <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-[#EF3A4C]/30 rounded-3xl p-8 md:p-12">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs px-3 py-1 bg-white/10 text-nox-white-muted rounded-full border border-white/10">
                Leadgen
              </span>
              <span className="text-xs px-3 py-1 bg-white/10 text-nox-white-muted rounded-full border border-white/10">
                Outreach
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-nox-white mb-4">
              Leadgen Engine – strukturierte Lead-Intelligence statt Rohlisten
            </h1>

            <p className="text-xl text-nox-white-muted mb-8 leading-relaxed">
              Von lokalen B2B-Leads bis Investoren: kontextualisiert, anreicherbar und systemfähig für skalierbaren Outreach.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="border-l-2 border-[#EF3A4C] pl-4"
                >
                  <h3 className="text-nox-white font-semibold mb-2 leading-snug text-sm">{stat.label}</h3>
                  <p className="text-xs text-nox-white-muted">{stat.description}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/solution-finder">
                <Button variant="primary" className="group">
                  Setup anfragen
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
                Warum klassische Leadgenerierung stagniert
              </h2>
              <div className="w-16 h-1 bg-[#EF3A4C] mb-8" />

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

              <div className="border-l-4 border-[#EF3A4C] pl-6 py-4">
                <p className="text-xl text-nox-white font-light italic">
                  Das eigentliche Problem ist nicht der Lead – sondern fehlende Intelligence.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Kontext ist das stärkste Differenzierungsmerkmal
              </h2>
              <div className="w-16 h-1 bg-[#EF3A4C] mb-8" />

              <p className="text-nox-white-muted leading-relaxed mb-6">
                Name und Email sind Commodity. Kontext, Priorität und strukturierte Übergabe sind das, was Outreach skalierbar macht. Die Leadgen Engine arbeitet nicht mit Vermutungen, sondern mit strukturierter Intelligence.
              </p>

              <div className="bg-gradient-to-br from-[#EF3A4C]/10 to-transparent border-l-4 border-[#EF3A4C] p-8 rounded-r-xl">
                <p className="text-2xl text-nox-white font-light">
                  Nicht mehr sammeln – strukturiert qualifizieren.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Wie die Leadgen Engine arbeitet
              </h2>
              <div className="w-16 h-1 bg-[#EF3A4C] mb-8" />

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

              <div className="mt-8 bg-gradient-to-br from-red-900/20 to-transparent border border-red-500/30 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-nox-white-muted leading-relaxed font-medium mb-2">
                      Strukturierte Erfassung und Deduplication sind kein Modul – sie sind das Fundament des Systems.
                    </p>
                    <p className="text-sm text-nox-white-muted">
                      Ohne sie existiert keine saubere Lead-Intelligence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Modulare System-Architektur
              </h2>
              <div className="w-16 h-1 bg-[#EF3A4C] mb-8" />

              <p className="text-nox-white-muted leading-relaxed mb-8">
                Die Leadgen Engine ist modular aufgebaut. Das Core-System ist immer enthalten. Module können je nach Bedarf und Markt ergänzt werden.
              </p>

              <h3 className="text-xl font-semibold text-nox-white mb-6">
                Core System (immer enthalten)
              </h3>
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6 mb-10">
                <div className="space-y-3">
                  {coreSystem.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#EF3A4C] flex-shrink-0 mt-0.5" />
                      <span className="text-nox-white-muted">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="text-xl font-semibold text-nox-white mb-6">
                1. Geo & Market Scope
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                {geoMarketScope.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-900/30 to-gray-800/20 border border-white/10 rounded-lg p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[#EF3A4C] font-mono text-sm font-bold">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h4 className="text-nox-white font-semibold">{item.name}</h4>
                    </div>
                    <p className="text-sm text-nox-white-muted leading-relaxed">{item.effect}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-semibold text-nox-white mb-6">
                2. Lead Type Module
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {leadTypeModule.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-900/30 to-gray-800/20 border border-white/10 rounded-lg p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[#EF3A4C] font-mono text-sm font-bold">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h4 className="text-nox-white font-semibold">{item.name}</h4>
                    </div>
                    <p className="text-sm text-nox-white-muted leading-relaxed">{item.effect}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-semibold text-nox-white mb-6">
                3. Deep Lead Intelligence (Premium)
              </h3>
              <div className="space-y-4 mb-8">
                {deepIntelligence.map((item, index) => (
                  <Accordion
                    key={index}
                    title={item.title}
                    description={item.description}
                    details={item.details}
                  />
                ))}
              </div>

              <div className="border-l-4 border-[#EF3A4C] pl-6 py-4">
                <p className="text-lg text-nox-white font-light">
                  Ergebnis: Strukturierte Lead-Intelligence, nicht nur Datenpunkte
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Optionale Erweiterungen
              </h2>
              <div className="w-16 h-1 bg-[#EF3A4C] mb-8" />

              <p className="text-nox-white-muted mb-8 leading-relaxed">
                Das Core-System ist immer enthalten. Erweiterungen können je nach Bedarf ergänzt werden. Die Auswahl erfolgt im Solution Finder.
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
              <div className="w-16 h-1 bg-[#EF3A4C] mb-8" />

              <p className="text-nox-white-muted mb-8 leading-relaxed">
                Optional: Verbindung mit anderen Systemen für geschlossene Datenkreisläufe.
              </p>

              <div className="space-y-6">
                {orchestrationOptions.map((option, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <Layers className="w-5 h-5 text-[#EF3A4C] flex-shrink-0 mt-0.5" />
                      <h3 className="text-nox-white font-semibold">{option.title}</h3>
                    </div>
                    <ul className="space-y-2 ml-8">
                      {option.points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-nox-white-muted">
                          <span className="text-[#EF3A4C] mt-1">•</span>
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
                Betrieb & Continuous Delivery
              </h2>
              <div className="w-16 h-1 bg-[#EF3A4C] mb-8" />

              <div className="border-l-4 border-[#EF3A4C] pl-6 py-4 bg-gradient-to-r from-[#EF3A4C]/10 to-transparent rounded-r-xl mb-8">
                <p className="text-xl text-nox-white font-light leading-relaxed">
                  Die Leadgen Engine ist kein einmaliges Setup. Das System wird betrieben, überwacht und kontinuierlich erweitert.
                </p>
              </div>

              <p className="text-nox-white-muted leading-relaxed mb-6">
                Datenquellen verändern sich. Märkte entwickeln sich. Neue Recherche-Strategien entstehen. Ein statisches System veraltet. Ein betriebenes System lernt.
              </p>

              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6">
                <div className="space-y-4 text-nox-white-muted">
                  <div className="flex items-start gap-3">
                    <span className="text-[#EF3A4C] mt-1">•</span>
                    <div>
                      <strong className="text-nox-white">Klare Volumensteuerung:</strong>
                      <span className="text-sm text-nox-white-muted block mt-1">
                        Transparente Limits, skalierbare Infrastruktur
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#EF3A4C] mt-1">•</span>
                    <div>
                      <strong className="text-nox-white">Skalierbare Infrastruktur:</strong>
                      <span className="text-sm text-nox-white-muted block mt-1">
                        Von Einzelstadt bis Multi-Country ohne Qualitätsverlust
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[#EF3A4C] mt-1">•</span>
                    <div>
                      <strong className="text-nox-white">Transparente Grenzen bei sehr hohem Volumen:</strong>
                      <span className="text-sm text-nox-white-muted block mt-1">
                        Kein unbegrenztes Versprechen. Klare Kommunikation bei Skalierungsgrenzen.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#EF3A4C]/20 to-[#FF4D5E]/20 rounded-2xl blur-xl" />
              <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-[#EF3A4C]/30 rounded-2xl p-10 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-nox-white mb-4">
                  Bereit für strukturierte Lead-Intelligence?
                </h2>
                <p className="text-nox-white-muted mb-6 max-w-2xl mx-auto">
                  Lass uns prüfen, ob die Leadgen Engine dein Hauptsystem oder Teil einer Kombination ist.
                </p>
                <Link to="/solution-finder">
                  <Button variant="primary" className="text-lg px-8 py-4">
                    Setup-Vorschlag anfragen
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
