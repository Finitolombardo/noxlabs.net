export interface System {
  slug: string;
  name: string;
  oneLiner: string;
  description: string;
  properties: string[];
  category: string[];
  channel: string[];
  integrations: string[];
  problem: string;
  solutionBullets: string[];
  inputBullets: string[];
  outputBullets: string[];
  modules?: string[];
  isCustom?: boolean;
  deliveryTime?: string;
  isMainSystem?: boolean;
  isConfigurable?: boolean;
}

export const systems: System[] = [
  {
    slug: 'leadforge',
    name: 'Leadgen Engine',
    oneLiner: 'Automatisierte Lead-Recherche + Ansprache für Recruiting & Agenturen',
    description: 'Automatisierte Lead-Recherche, Anreicherung und strukturierte Übergabe für Outreach-Systeme.',
    properties: [
      'Kontinuierliche Lead-Generierung',
      'Kontextbasierte Daten statt Rohlisten',
      'Grundlage für skalierbaren Outreach'
    ],
    category: ['Leadgen', 'Outreach'],
    channel: ['Email', 'Mixed'],
    integrations: ['n8n', 'Notion', 'CRM', 'Google Sheets'],
    problem: 'Manuelle Lead-Recherche frisst Zeit. Kalte Mails ohne Personalisierung landen im Spam. Du brauchst einen Flow, der qualifizierte Leads findet UND anspricht.',
    solutionBullets: [
      'Automatische Recherche via LinkedIn, Apollo, Hunter etc.',
      'Anreicherung mit Firmendaten, Technologie-Stack, Job-Posts',
      'KI-generierte Personalisierung (Hook basierend auf LinkedIn Activity)',
      'Mehrstufige Mail-Sequenz mit A/B-Testing',
      'CRM-Sync + Lead-Scoring'
    ],
    inputBullets: [
      'Zielgruppe (Job Title, Branche, Region, Firmengröße)',
      'Dein Angebot / Value Proposition',
      'Mail-Templates oder Tonalität',
      'Gewünschte Integrationen (CRM, Notion, Sheets)'
    ],
    outputBullets: [
      'Liste qualifizierter Leads mit Kontaktdaten',
      'Personalisierte Erstansprache (automatisch versendet oder zur Review)',
      'Follow-Up-Sequenz bei Nicht-Antwort',
      'Dashboard mit Open Rate, Reply Rate, Meetings',
      'Warm Leads direkt in dein CRM'
    ],
    modules: [],
    isMainSystem: true,
    isConfigurable: true
  },
  {
    slug: 'pitch-mutation-engine',
    name: 'Pitch Mutation Engine',
    oneLiner: 'Lernendes Outreach-System mit kausaler Mutation aus realen Antworten',
    description: 'Lernendes Outreach-System, das aus echten Antworten lernt und Texte kausal verbessert.',
    properties: [
      'Antwortbasierte Lernlogik',
      'Gezielte Mutationen statt blindem A/B-Testing',
      'Laufender Betrieb (Retainer)'
    ],
    category: ['Leadgen', 'Outreach'],
    channel: ['Email', 'Mixed'],
    integrations: ['n8n', 'CRM', 'Notion', 'Google Sheets'],
    problem: 'Deine Cold Mails performen schlecht, aber du weißt nicht warum. A/B-Tests sind zeitaufwendig und geben dir keine echten Insights. Du brauchst ein System, das aus jeder Antwort lernt und sich automatisch verbessert.',
    solutionBullets: [
      'KI analysiert alle Antworten und extrahiert Objections, Fragen, Pain Points',
      'Automatische Klassifizierung von Antworten (Interesse, Einwände, Bounce)',
      'Automatische Optimierung von Subject Lines, Hooks, CTAs',
      'Kausal lernende Mutation: Nur eine Variable pro Pfad',
      'Sentiment-Analyse: Was triggert positive vs. negative Antworten?',
      'Dashboard mit Insights + Handlungsempfehlungen'
    ],
    inputBullets: [
      'Deine bisherigen Mail-Templates',
      'Zielgruppe + CRM/Liste',
      'Gewünschte KPIs (Reply Rate, Meeting Rate, etc.)',
      'E-Mail-Postfach für Antworten'
    ],
    outputBullets: [
      'Kontinuierlich optimierte Pitches',
      'Wöchentliche Reports mit Learnings',
      'Automatische Anpassung bei sinkender Performance',
      'Best-Practice-Library aus erfolgreichen Formulierungen',
      'ROI: Höhere Reply Rates durch lernende Optimierung'
    ],
    modules: [],
    isMainSystem: true,
    isConfigurable: true
  },
  {
    slug: 'youtube-engine',
    name: 'YouTube Engine',
    oneLiner: 'Authority-, Reichweiten- und Vertrauenssystem via YouTube',
    description: 'Ein durchgehendes Research-, Ideation-, Script- und Publishing-System fuer den Aufbau echter Autoritaet, Reichweite und Nachfrage – statt Zufallsposting.',
    properties: [
      'Research-getriebene Themenwahl statt Guessing',
      'Systematische Hook- und Title-Architektur',
      'Learning Loop aus realen Performance-Daten'
    ],
    category: ['Content', 'Authority'],
    channel: ['YouTube'],
    integrations: ['n8n', 'Notion', 'Google Sheets', 'YouTube Analytics'],
    problem: 'Content wird geraten statt recherchiert. Hooks und Titel werden improvisiert. Performance-Daten fliessen nicht zurueck ins System. Ergebnis: kein konsistenter Authority-Aufbau, keine kausalen Learnings, keine skalierbare Reichweite.',
    solutionBullets: [
      'Research Layer: systematische Erfassung von Audience-Pains, Competitor-Performance und Topic-Clustern',
      'Topic Intelligence: Bewertung von Nachfrage, Wettbewerb und Authority-Fit pro Thema',
      'Format Layer: klare Format-Architektur (Deep Dive, Framework, System-Breakdown, Case Study)',
      'Hook- und Title-Engine: strukturierte Varianten-Generierung statt Gefuehlsentscheidung',
      'Script / Outline Layer: modulare Skript-Struktur mit klarer Retention-Logik',
      'Publishing Layer: konsistente Release-Kadenz, Thumbnail- und Metadata-Standards',
      'Learning Layer: Rueckfluss aus Views, Retention und Comments in die naechste Research-Runde'
    ],
    inputBullets: [
      'Positionierung, Zielgruppe und Authority-Themen',
      'Bestehende Kanalhistorie (falls vorhanden)',
      'Produktions-Setup (Solo, Team, Ausruestung)',
      'Release-Kadenz und Ziel-Horizont'
    ],
    outputBullets: [
      'Strukturierte Topic-Pipeline mit Prioritaet statt Einzel-Ideen',
      'Recherchierte Hooks, Titel und Thumbnail-Leitlinien pro Video',
      'Modulare Skript-Outlines mit Retention-Logik',
      'Publishing-Kalender mit systematischer Kadenz',
      'Performance-Learnings im Wochenrhythmus als Input fuer die naechste Runde'
    ],
    modules: [],
    isMainSystem: true,
    isConfigurable: true
  },
  {
    slug: 'whatsapp-booking-bot',
    name: 'WhatsApp Booking Bot',
    oneLiner: 'Termine direkt via WhatsApp buchen – mit Cal.com Sync',
    description: 'Automatisierte Terminbuchung direkt über WhatsApp – inkl. Kalender-Sync.',
    properties: [],
    category: ['Booking', 'Ops'],
    channel: ['WhatsApp'],
    integrations: ['Cal.com', 'n8n', 'WhatsApp'],
    problem: 'Kunden wollen per WhatsApp buchen, aber manuelle Koordination ist chaotisch. Du brauchst einen Bot, der Termine vorschlägt, bucht und bestätigt – ohne dass du eingreifen musst.',
    solutionBullets: [
      'WhatsApp-Bot erkennt Buchungsanfragen automatisch',
      'Sync mit deinem Cal.com Kalender (freie Slots)',
      'Interaktive Terminauswahl per WhatsApp',
      'Automatische Bestätigung + Reminder 24h vorher',
      'Absagen oder Umbuchen möglich'
    ],
    inputBullets: [
      'Cal.com Account + API-Key',
      'WhatsApp Business Nummer (oder wir richten sie ein)',
      'Buchungsregeln (Vorlaufzeit, Dauer, Verfügbarkeit)',
      'Optional: Fragen, die vor der Buchung gestellt werden sollen'
    ],
    outputBullets: [
      'Vollautomatische Terminbuchung via WhatsApp',
      'Echtzeit-Sync mit Cal.com',
      'Reminder + Follow-Up Messages',
      'Reporting: Gebuchte Termine, No-Shows, Conversion Rate'
    ],
    isConfigurable: true
  },
  {
    slug: 'seo-quick-wins-audit',
    name: 'SEO Quick Wins Audit',
    oneLiner: 'Finde die schnellsten SEO-Hebel für mehr organischen Traffic',
    description: 'Identifiziert schnelle SEO-Hebel mit direkter Wirkung – ohne langfristige Bindung.',
    properties: [],
    category: ['Ops'],
    channel: ['Website'],
    integrations: ['n8n', 'Google Sheets'],
    problem: 'SEO-Audits sind zeitaufwendig und liefern oft zu viele Insights auf einmal. Du brauchst schnelle Wins, die sofort Traffic bringen.',
    solutionBullets: [
      'Automatisierter Crawl deiner Website + Konkurrenz-Analyse',
      'Priorisierung nach Quick-Win-Potenzial (Traffic × Aufwand)',
      'Wöchentliches Update mit neuen Chancen',
      'Export als übersichtliche To-Do-Liste in Google Sheets'
    ],
    inputBullets: [
      'Domain(s) zum Tracken',
      'Google Search Console Zugang',
      'Keywords oder Themenfelder (optional)'
    ],
    outputBullets: [
      'Priorisierte Liste mit Quick Wins',
      'Keyword-Lücken vs. Konkurrenz',
      'Technical SEO Issues mit Impact-Score',
      'Wöchentliche Updates per Sheets oder Slack'
    ],
    isConfigurable: false
  },
  {
    slug: 'content-parasite-scanner',
    name: 'Content Parasite Scanner',
    oneLiner: 'Entdecke, wo dein Content geklaut oder neu verwendet wird',
    description: 'Findet, wo Inhalte kopiert, gespiegelt oder neu verwertet werden.',
    properties: [],
    category: ['Ops'],
    channel: ['Website', 'Mixed'],
    integrations: ['n8n', 'Notion', 'Google Sheets'],
    problem: 'Deine Inhalte werden kopiert, neu verpackt oder auf anderen Seiten verwendet – ohne dass du es merkst. Potenzial für Backlinks oder rechtliche Schritte bleibt ungenutzt.',
    solutionBullets: [
      'Automatische Erkennung von duplizierten oder abgewandelten Inhalten',
      'Tracking von Brand Mentions und unvollständigen Zitaten',
      'Alerts bei neuen Treffern mit Domain Authority Score',
      'Dashboard in Notion oder Sheets mit Handlungsempfehlungen'
    ],
    inputBullets: [
      'URLs deiner wichtigsten Inhalte',
      'Brand-Namen / Keywords zum Tracken',
      'Optional: RSS-Feeds von relevanten Seiten'
    ],
    outputBullets: [
      'Liste mit Websites, die deinen Content nutzen',
      'Bewertung: Backlink-Chance vs. Copyright-Problem',
      'Kontaktdaten oder LinkedIn-Profile der Betreiber',
      'Alert per Mail oder Slack bei neuen Funden'
    ],
    isConfigurable: false
  }
];
