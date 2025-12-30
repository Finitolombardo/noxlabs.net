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
    name: 'Leadforge',
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
    slug: 'pitch-evolution-system',
    name: 'Pitch-Evolutionssystem',
    oneLiner: 'Lernendes Outreach-System, das sich durch jede Antwort verbessert',
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
    slug: 'content-repurposing-system',
    name: 'Content-Repurposing-System',
    oneLiner: 'Verwandelt Antworten, Einwände und Trigger in skalierbare Content-Assets',
    description: 'Verwandelt Antworten, Einwände und Trigger aus Outreach in skalierbare Content-Assets.',
    properties: [
      'Content aus realen Marktreaktionen',
      'Nutzung von Einwänden & Triggern',
      'Langfristiger Content-Hebel'
    ],
    category: ['Leadgen', 'Ops'],
    channel: ['Mixed'],
    integrations: ['n8n', 'Notion', 'CRM', 'Google Sheets'],
    problem: 'Deine wertvollsten Insights stecken in Kundenantworten und Einwänden – aber du nutzt sie nicht systematisch. Content-Produktion ist reaktiv statt datengetrieben.',
    solutionBullets: [
      'Extrahiert wiederkehrende Einwände, Fragen und Trigger aus Antworten',
      'Clustert Themen und erstellt Content-Briefings',
      'Generiert mehrsprachige Assets (Posts, Scripts, Mail-Sequenzen)',
      'Verknüpft Content mit ursprünglichen Antworten für Kontext',
      'Liefert priorisierte Content-Roadmap basierend auf Volumen'
    ],
    inputBullets: [
      'E-Mail-Antworten, CRM-Notizen oder Chat-Logs',
      'Zielsprachen und Formate',
      'Content-Tonalität und Marke',
      'Optional: Bestehende Content-Library zum Abgleich'
    ],
    outputBullets: [
      'Themen-Cluster mit Häufigkeit und Priorität',
      'Content-Briefings mit Kontext aus echten Antworten',
      'Mehrsprachige Content-Assets (Social, Mail, Landing Pages)',
      'Dashboard: Was triggert positive vs. negative Reaktionen',
      'Automatische Updates bei neuen Mustern'
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
