import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertTriangle, Layers, CheckCircle2, Repeat } from 'lucide-react';
import Button from '../components/UI/Button';
import Accordion from '../components/UI/Accordion';

export default function YouTubeEngineDetail() {
  const stats = [
    {
      label: 'Research-getriebene Themenwahl',
      description: 'Kein Raten, keine Trend-Kopie – strukturierte Nachfrage-Signale'
    },
    {
      label: 'Hook- und Title-Architektur',
      description: 'Systematische Varianten statt Gefuehlsentscheidung'
    },
    {
      label: 'Learning Loop aus realen Performance-Daten',
      description: 'Jede Episode schaerft die naechste Runde'
    }
  ];

  const problems = [
    {
      title: 'Content wird geraten',
      description: 'Themen werden aus Bauchgefuehl oder Trend-Impuls gewaehlt, nicht aus Nachfrage-Struktur.'
    },
    {
      title: 'Hooks und Titel sind improvisiert',
      description: 'Kein systematisches Varianten-System, keine Retention-Logik, keine reproduzierbare Qualitaet.'
    },
    {
      title: 'Performance-Daten bleiben Insel',
      description: 'Views, Retention, Comments werden angeschaut, aber nicht systematisch zurueck in die Research-Runde gespielt.'
    },
    {
      title: 'Kein Authority-Aufbau, nur Posting',
      description: 'Einzelne Videos statt eines Systems, das kumulativ Vertrauen und Nachfrage erzeugt.'
    }
  ];

  const architectureLayers = [
    {
      title: '01 — Research Layer',
      description: 'Strukturierte Erfassung von Audience-Pains, Competitor-Performance und Topic-Clustern.',
      details: [
        'Was passiert: Systematisches Sammeln von Audience-Fragen, Competitor-Videos und existierenden Format-Mustern.',
        'Warum relevant: Ohne Research-Basis ist Ideation Glueckssache. Erfolg ist nicht reproduzierbar.',
        'Dein Vorteil: Du startest jede Themenrunde mit echter Signal-Grundlage, nicht mit einem leeren Blatt.',
        'Modular: Von leichter Audience-Recherche bis zu Deep Competitor-Teardowns skalierbar.'
      ]
    },
    {
      title: '02 — Topic Intelligence Layer',
      description: 'Bewertung jedes Themas nach Nachfrage, Wettbewerb und Authority-Fit.',
      details: [
        'Was passiert: Jedes Kandidaten-Thema wird auf Demand, Sattelung und Fit zur Positionierung geprueft.',
        'Warum relevant: Nicht jedes recherchierte Thema verdient Produktionszeit. Priorisierung schlaegt Volumen.',
        'Dein Vorteil: Du produzierst nur Videos, die Authority UND Reichweite gleichzeitig aufbauen koennen.',
        'Output: Priorisierte Topic-Pipeline statt loser Ideensammlung.'
      ]
    },
    {
      title: '03 — Format Layer',
      description: 'Klare Format-Architektur: Deep Dive, Framework, System-Breakdown, Case Study.',
      details: [
        'Was passiert: Jedes Thema wird bewusst einem Format zugeordnet, das zum Thema und zur Authority-Strategie passt.',
        'Warum relevant: Formate haben unterschiedliche Retention-Kurven und Authority-Signale.',
        'Dein Vorteil: Wiedererkennbare Format-Sprache, die das Publikum trainiert, was es erwarten kann.',
        'Konsistenz: Keine Format-Willkuer, keine verwaesserte Kanal-Identitaet.'
      ]
    },
    {
      title: '04 — Hook- und Title-Engine',
      description: 'Strukturierte Varianten-Generierung statt Gefuehlsentscheidung.',
      details: [
        'Was passiert: Pro Video werden mehrere Hook- und Title-Varianten nach klaren Mustern generiert und bewertet.',
        'Warum relevant: Hook und Title entscheiden ueber den Klick. Ohne Systematik bleibt das Zufall.',
        'Dein Vorteil: Jedes Video startet mit der staerksten verfuegbaren Einstiegskombination, nicht der erstbesten.',
        'Datenbasis: Varianten werden nach Release anhand realer CTR-Daten bewertet und zurueckgespielt.'
      ]
    },
    {
      title: '05 — Script / Outline Layer',
      description: 'Modulare Skript-Struktur mit klarer Retention-Logik.',
      details: [
        'Was passiert: Outlines werden in modulare Blocks zerlegt (Hook, Promise, Proof, Payoff, Bridge).',
        'Warum relevant: Retention ist das staerkste Ranking-Signal. Ohne strukturelle Logik verliert jedes Video Zuschauer.',
        'Dein Vorteil: Konsistente Retention ueber mehrere Episoden, nicht Einzel-Glueckstreffer.',
        'Lernbar: Blocks werden ueber Zeit verfeinert – das Skript-System wird kausal besser.'
      ]
    },
    {
      title: '06 — Publishing Layer',
      description: 'Konsistente Release-Kadenz, Thumbnail- und Metadata-Standards.',
      details: [
        'Was passiert: Fester Release-Rhythmus, Thumbnail-Leitlinien, Metadata-Templates, Title-Strategie pro Slot.',
        'Warum relevant: Die Plattform belohnt Konsistenz. Unregelmaessige Releases brechen Momentum.',
        'Dein Vorteil: Das System laeuft auch, wenn einzelne Episoden nicht einschlagen.',
        'Keine Magie: Klare Standards statt Vibe-Publishing.'
      ]
    },
    {
      title: '07 — Learning Layer',
      description: 'Rueckfluss aus Views, Retention und Comments in die naechste Research-Runde.',
      details: [
        'Was passiert: Performance-Daten pro Episode werden strukturiert ausgewertet und als Input in Research und Topic Intelligence zurueckgespielt.',
        'Warum relevant: Ohne Lernschleife ist YouTube nur Posting. Mit Lernschleife ist es ein kompoundierendes System.',
        'Dein Vorteil: Die 20. Episode ist systematisch besser als die 1., nicht zufaellig.',
        'Output: Wochen- und Monats-Learnings in Form von konkreten Research- und Skript-Anpassungen.'
      ]
    }
  ];

  const outputs = [
    'Strukturierte Topic-Pipeline mit Prioritaet statt loser Einzelideen',
    'Recherchierte Hooks, Titel und Thumbnail-Leitlinien pro Video',
    'Modulare Skript-Outlines mit Retention-Logik',
    'Publishing-Kalender mit systematischer Kadenz',
    'Performance-Learnings im Wochenrhythmus als Input fuer die naechste Runde'
  ];

  const mvpScope = [
    {
      name: 'Research Layer',
      effect: 'Audience- und Competitor-Signal-Erfassung aktiv'
    },
    {
      name: 'Topic Intelligence',
      effect: 'Priorisierte Topic-Pipeline statt Ideensammlung'
    },
    {
      name: 'Hook- und Title-Engine',
      effect: 'Strukturierte Varianten pro Video'
    },
    {
      name: 'Script / Outline Layer',
      effect: 'Modulare Outlines mit Retention-Blocks'
    },
    {
      name: 'Publishing Layer',
      effect: 'Fester Rhythmus, Thumbnail- und Metadata-Standard'
    },
    {
      name: 'Basis-Learning Loop',
      effect: 'Manueller Rueckfluss aus Top- und Flop-Episoden'
    }
  ];

  const laterExpansions = [
    {
      name: 'Deep Competitor Intelligence',
      effect: 'Automatisierte Teardowns ganzer Konkurrenz-Kanaele'
    },
    {
      name: 'Hook-/Title-A-B-Automation',
      effect: 'Systematische CTR-Optimierung mit kausaler Bewertung'
    },
    {
      name: 'Community / Skool-Koppelung',
      effect: 'Zuschauer-Pipeline in strukturierte Community-Naehe'
    },
    {
      name: 'Demand-Engine-Koppelung',
      effect: 'Direkter Rueckfluss aus Zuschauerdaten in Lead- und Pitch-Systeme'
    }
  ];

  const ecosystemRole = [
    {
      title: 'Koppelung mit Leadgen Engine',
      points: [
        'YouTube erzeugt Authority-Kontext – die Leadgen Engine wandelt ihn in qualifizierte Leads',
        'Kommentare und DMs werden als Signal-Quelle fuer ICP-Scharfstellung genutzt',
        'Audience-Fragen fliessen als Research-Input in Outreach-Pitches'
      ]
    },
    {
      title: 'Koppelung mit Pitch Mutation Engine',
      points: [
        'Im Research Layer identifizierte Objections werden in Outreach-Varianten ueberfuehrt',
        'High-performing Hooks werden als Pitch-Bausteine getestet',
        'Learnings aus Pitch-Antworten fliessen zurueck in Script- und Topic-Entscheidungen'
      ]
    },
    {
      title: 'Authority- und Nachfragelogik',
      points: [
        'Die YouTube Engine ist kein Posting-Tool, sondern der Authority-Layer des NOX-Systems',
        'Sie verknuepft Reichweite mit strukturierter Nachfrageerzeugung',
        'Endziel: Kompoundierendes Vertrauen statt Einzel-Videos'
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
            Zurueck zu Systemen
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
                Content
              </span>
              <span className="text-xs px-3 py-1 bg-white/10 text-nox-white-muted rounded-full border border-white/10">
                Authority
              </span>
              <span className="text-xs px-3 py-1 bg-white/10 text-nox-white-muted rounded-full border border-white/10">
                YouTube
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-nox-white mb-4">
              YouTube Engine – Authority- und Nachfragesystem via YouTube
            </h1>

            <p className="text-xl text-nox-white-muted mb-8 leading-relaxed">
              Ein Research-, Script- und Publishing-System fuer Reichweite, Autoritaet und Nachfrage – statt Zufallsposting.
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
          {/* Why this engine exists */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Warum dieses System existiert
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
                  Das eigentliche Problem ist nicht fehlende Kreativitaet – es ist fehlende Systematik.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Positioning */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Authority entsteht nicht durch Posting – sondern durch Struktur
              </h2>
              <div className="w-16 h-1 bg-[#EF3A4C] mb-8" />

              <p className="text-nox-white-muted leading-relaxed mb-6">
                Einzelvideos sind keine Strategie. Content ohne Research-Basis ist Glueckssache. Erst ein System,
                das Research, Ideation, Produktion und Rueckkopplung verbindet, erzeugt kompoundierendes Vertrauen
                und echte Nachfrage.
              </p>

              <div className="bg-gradient-to-br from-[#EF3A4C]/10 to-transparent border-l-4 border-[#EF3A4C] p-8 rounded-r-xl">
                <p className="text-2xl text-nox-white font-light">
                  Nicht mehr produzieren – systematisch aufbauen.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Core architecture - 7 layers */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Kernarchitektur: 7 Schichten
              </h2>
              <div className="w-16 h-1 bg-[#EF3A4C] mb-8" />

              <p className="text-nox-white-muted leading-relaxed mb-8">
                Die YouTube Engine ist in sieben klar getrennte Schichten zerlegt. Jede Schicht hat einen
                definierten Input, einen definierten Output und eine klare Rolle im Gesamtsystem. Keine
                Schicht ist optional.
              </p>

              <div className="space-y-4">
                {architectureLayers.map((layer, index) => (
                  <Accordion
                    key={index}
                    title={layer.title}
                    description={layer.description}
                    details={layer.details}
                  />
                ))}
              </div>

              <div className="mt-8 bg-gradient-to-br from-red-900/20 to-transparent border border-red-500/30 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-nox-white-muted leading-relaxed font-medium mb-2">
                      Ohne Learning Layer ist das System kein System – sondern eine Produktionslinie.
                    </p>
                    <p className="text-sm text-nox-white-muted">
                      Die Rueckkopplung ist keine Erweiterung. Sie ist der Grund, warum Episode 20 besser ist als Episode 1.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Outputs */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Outputs
              </h2>
              <div className="w-16 h-1 bg-[#EF3A4C] mb-8" />

              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-xl p-6">
                <div className="space-y-3">
                  {outputs.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#EF3A4C] flex-shrink-0 mt-0.5" />
                      <span className="text-nox-white-muted">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Learning Loop */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Learning Loop
              </h2>
              <div className="w-16 h-1 bg-[#EF3A4C] mb-8" />

              <p className="text-nox-white-muted leading-relaxed mb-8">
                Nach jedem Release laeuft eine strukturierte Auswertung: Retention-Kurven, CTR, Comments,
                Abo-Wachstum, Kommentar-Sentiment. Die Learnings gehen nicht in einen Report – sie gehen
                zurueck in den Research Layer und die Topic Intelligence der naechsten Runde.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/20 border border-white/10 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Repeat className="w-5 h-5 text-[#EF3A4C]" />
                    <h4 className="text-nox-white font-semibold">Publish</h4>
                  </div>
                  <p className="text-sm text-nox-white-muted leading-relaxed">
                    Episode geht live nach Publishing-Standard (Titel, Thumbnail, Metadata).
                  </p>
                </div>
                <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/20 border border-white/10 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Repeat className="w-5 h-5 text-[#EF3A4C]" />
                    <h4 className="text-nox-white font-semibold">Measure</h4>
                  </div>
                  <p className="text-sm text-nox-white-muted leading-relaxed">
                    Retention, CTR, Comments und Abo-Wachstum werden strukturiert erfasst.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/20 border border-white/10 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Repeat className="w-5 h-5 text-[#EF3A4C]" />
                    <h4 className="text-nox-white font-semibold">Feed Back</h4>
                  </div>
                  <p className="text-sm text-nox-white-muted leading-relaxed">
                    Befunde fliessen direkt in Research Layer und Topic Intelligence der naechsten Runde.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* MVP vs Later Expansions */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                MVP vs. spaetere Erweiterungen
              </h2>
              <div className="w-16 h-1 bg-[#EF3A4C] mb-8" />

              <p className="text-nox-white-muted leading-relaxed mb-8">
                Die MVP-Stufe deckt alle sieben Schichten funktional ab – sauber, ohne Over-Engineering.
                Spaetere Erweiterungen vertiefen einzelne Schichten, ersetzen sie aber nicht.
              </p>

              <h3 className="text-xl font-semibold text-nox-white mb-6">
                MVP-Scope (V1)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                {mvpScope.map((item, index) => (
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
                Spaetere Erweiterungen
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {laterExpansions.map((item, index) => (
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
            </div>
          </motion.div>

          {/* Ecosystem role */}
          <motion.div variants={itemVariants}>
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-white/10 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-nox-white mb-6">
                Rolle im NOX-System
              </h2>
              <div className="w-16 h-1 bg-[#EF3A4C] mb-8" />

              <p className="text-nox-white-muted mb-8 leading-relaxed">
                Die YouTube Engine steht nicht allein. Sie ist der Authority-Layer, der die Leadgen Engine und das
                Pitch Mutation Engine mit Reichweite, Vertrauen und Nachfrage versorgt.
              </p>

              <div className="space-y-6">
                {ecosystemRole.map((option, index) => (
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

          {/* CTA */}
          <motion.div variants={itemVariants}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#EF3A4C]/20 to-[#FF4D5E]/20 rounded-2xl blur-xl" />
              <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/50 border border-[#EF3A4C]/30 rounded-2xl p-10 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-nox-white mb-4">
                  Authority ist ein System, kein Zufall.
                </h2>
                <p className="text-nox-white-muted mb-6 max-w-2xl mx-auto">
                  Lass uns pruefen, ob die YouTube Engine dein Hauptsystem oder Teil einer Kombination ist.
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
