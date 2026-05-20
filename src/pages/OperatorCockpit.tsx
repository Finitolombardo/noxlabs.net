import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { fetchOperatorProjectContext } from '../lib/operatorContextClient';
import {
  fetchPlanCommit,
  fetchPlanPreview,
  fetchPlanValidate,
  generatePreviewIdempotencyKey,
} from '../lib/projectPlannerClient';
import type {
  NotionUpstreamDiagnostic,
  ProjectContextResponse,
} from '../types/operatorContext';
import type {
  PlanCommitRequestWire,
  PlanCommitResponseWire,
  PlanPreviewResponseWire,
  PlanStepWire,
  PlanValidationReportWire,
} from '../types/projectPlanner';
import {
  FACTORY_APPROVAL,
  FACTORY_DRIVE_FILES,
  FACTORY_DRY_RUNS,
  FACTORY_LEADGEN_SETUP_FIELDS,
  FACTORY_MODULES,
  FACTORY_PITCH_EXPERIMENT,
  FACTORY_WORKFLOWS,
} from '../data/projectXFactoryDemo';
import type {
  FactoryDriveFile,
  FactoryDryRun,
  FactoryModuleEntry,
  FactoryPitchVariant,
  FactorySetupField,
  FactoryWorkflowEntry,
} from '../data/projectXFactoryDemo';
import SkillbookPanel from '../components/skillbook/SkillbookPanel';

type Project = {
  id: string;
  code: string;
  name: string;
  type: string;
  owner: string;
  status: string;
  progress: number;
  vision: string;
  stand: string;
  nextAction: string;
  lastMilestone: string;
  blockers: Array<{
    id: string;
    title: string;
    why: string;
    nextStep: string;
    status: string;
  }>;
};

type Quest = {
  id: string;
  code: string;
  title: string;
  project: string;
  status: string;
  active: boolean;
  priority: string;
  agent: string;
  goal: string;
  notes: string;
  acceptanceCriteria: string[];
  requiresApproval: boolean;
  lastMovement: string;
  history: string[];
};

type OutputArtifact = {
  id: string;
  title: string;
  project: string;
  outputType: string;
  storage: string;
  status: string;
  version: string;
  description: string;
};

type Approval = {
  id: string;
  title: string;
  project: string;
  questId?: string;
  commandId?: string;
  status: string;
  risk: string;
  agent: string;
  description: string;
};

type AndromedaCommandType =
  | 'PREPARE_PROJECT_X_HANDOFF'
  | 'RUN_PROJECT_X_DRY_RUN'
  | 'REQUEST_APPROVAL'
  | 'MARK_READY_FOR_EXECUTION'
  | 'GENERATE_HANDOFF_SPEC'
  | 'GENERATE_OUTPUT_MAP';

type AndromedaCommandStatus = 'Draft' | 'Dry-Run bereit' | 'Freigabe noetig' | 'Freigegeben' | 'Gesperrt' | 'Erledigt';

type RiskLevel = 'Niedrig' | 'Mittel' | 'Hoch';

type DryRunResult = {
  summary: string;
  estimatedImpact: string;
  requiredInputs: string[];
  missingArtifacts: string[];
  recommendedNextAction: string;
};

type AndromedaCommand = {
  id: string;
  commandType: AndromedaCommandType;
  projectId: string;
  questId?: string;
  title: string;
  intent: string;
  payloadSummary: string;
  requestedBy: string;
  status: AndromedaCommandStatus;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  createdAt: string;
  dryRunResult?: DryRunResult;
  history: string[];
};

type Milestone = {
  id: string;
  project: string;
  dateLabel: string;
  type: string;
  title: string;
  description: string;
};

type QuestDraft = {
  id: string;
  title: string;
  project: string;
  agent: string;
  prio: string;
  summary: string;
};

const pageMotion = {
  initial: { opacity: 0, y: 14, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.99 },
  transition: { duration: 0.24, ease: 'easeOut' },
} as const;

const projects: Project[] = [
  {
    id: 'APP-X',
    code: 'APP-X',
    name: 'NOX Labs Cockpit',
    type: 'Kommandozentrale',
    owner: 'NOX',
    status: 'Entwurf',
    progress: 35,
    vision: 'Zentrale Steuerzentrale für Projekte, Quests, Agenten, Freigaben und Outputs.',
    stand: 'Canvas-Design laeuft. Lokaler Prototyp.',
    nextAction: 'Projects-Deep-Dive finalisieren und Output-System als Demo-State anbinden.',
    lastMilestone: 'v0.2 - Projekt-Zentrale aufgebaut',
    blockers: [],
  },
  {
    id: 'ANDROMEDA',
    code: 'ANDROMEDA',
    name: 'NOX Agent',
    type: 'Quest-Orchestrator',
    owner: 'NOX Agent',
    status: 'Stage 11B',
    progress: 72,
    vision: 'Aufgaben strukturieren, Quests vorbereiten, Worker vorschlagen und Übergaben koordinieren.',
    stand: 'Project-aware Patch ist vorbereitet.',
    nextAction: 'Soft Launch vorbereiten und Backfill-Liste schaerfen.',
    lastMilestone: 'Stage 11B - Project-aware Patch vorbereitet',
    blockers: [
      {
        id: 'B-AND-1',
        title: 'Restart noch nicht freigegeben',
        why: 'Der Projektkontext soll stabil bleiben, bis die Cockpit-UI sauber ist.',
        nextStep: 'Nach UI-Freigabe Backfill-Pfad entscheiden.',
        status: 'Pruefen',
      },
    ],
  },
  {
    id: 'PROJECT-X',
    code: 'PROJECT-X',
    name: 'Project X',
    type: 'Workflowfabrik',
    owner: 'NOX',
    status: 'Werkstatt',
    progress: 18,
    vision: 'Workflows, Automationen, Tools und produktive Systeme bauen und betreiben.',
    stand: 'Konzeptphase der Workflow-Engines.',
    nextAction: 'Uebergabe-Spezifikationen nach UI-Freigabe bauen.',
    lastMilestone: 'Workflow-Zonen grob sortiert',
    blockers: [
      {
        id: 'B-PX-1',
        title: 'Output-Vertrag fehlt',
        why: 'Project X braucht klare Inputs, bevor Worker konkrete Umsetzungen starten.',
        nextStep: 'Uebergabe-Spec als Output-Draft erzeugen.',
        status: 'Fehlt',
      },
    ],
  },
  {
    id: 'LEADGEN',
    code: 'LEADGEN',
    name: 'Leadgen',
    type: 'Cashflow',
    owner: 'Sarah',
    status: 'Demo',
    progress: 45,
    vision: 'Leads zu verwertbaren Sales-Aktionen machen und Pipeline fuellen.',
    stand: 'Demo-Daten aktiv. Pitch-Generator laeuft.',
    nextAction: 'Lead-Datenvertrag und echte Pitch-Queue schaerfen.',
    lastMilestone: 'Lead-Radar Demo-Daten verbunden',
    blockers: [
      {
        id: 'B-LG-1',
        title: 'Datenvertrag nicht final',
        why: 'Ohne Datenvertrag bleibt jeder Write in externe Systeme gesperrt.',
        nextStep: 'Felder, Gate und Review-Regeln definieren.',
        status: 'Pruefen',
      },
    ],
  },
  {
    id: 'YOUTUBE-INTEL',
    code: 'YOUTUBE-INTEL',
    name: 'YouTube Intelligence',
    type: 'Wissen',
    owner: 'NOX Agent',
    status: 'Geplant',
    progress: 12,
    vision: 'NOX lernt aus Top-Creator-Videos und erzeugt daraus Content-Playbooks und Quests.',
    stand: 'Spezifikationen werden gesammelt.',
    nextAction: 'Transkript zu Insights zu Quest-Drafts definieren.',
    lastMilestone: 'Worker-Idee aufgenommen',
    blockers: [],
  },
  {
    id: 'TEAM-OS',
    code: 'TEAM-OS',
    name: 'Team / Benutzer',
    type: 'Zugriff',
    owner: 'Admin',
    status: 'Demo',
    progress: 80,
    vision: 'Mitarbeiter sehen nur eigene Arbeitsbereiche. Owner sieht alles.',
    stand: 'Rollenmodell skizziert.',
    nextAction: 'Owner, Sales Partner, Operator, Viewer und Agent finalisieren.',
    lastMilestone: 'Rollenmodell skizziert',
    blockers: [],
  },
  {
    id: 'VOICE-OWNER',
    code: 'VOICE-OWNER',
    name: 'Owner Voice Control',
    type: 'Sprachsteuerung',
    owner: 'Owner',
    status: 'Demo',
    progress: 5,
    vision: 'Nur der Owner spricht mit NOX und startet Aktionen erst nach Freigabe.',
    stand: 'Push-to-Talk Simulation aktiv.',
    nextAction: 'Push-to-talk, STT, NOX, Approval und Tool-Call spezifizieren.',
    lastMilestone: 'Owner-only Sicherheitsrahmen gesetzt',
    blockers: [
      {
        id: 'B-VOICE-1',
        title: 'Freigabe-Gate noch nicht spezifiziert',
        why: 'Sprachsteuerung darf keine Systemwirkung ohne explizite Owner-Freigabe haben.',
        nextStep: 'Approval-Flow als Entscheidungsnotiz vorbereiten.',
        status: 'Fehlt',
      },
    ],
  },
];

const leads = [
  { id: 'L-1', company: 'Schneider Beauty Group', score: 88, value: 1800, next: '15-Minuten-Anruf vorschlagen', status: 'Call zuerst', reason: 'Hoechster Score und direkter Call-Hebel' },
  { id: 'L-2', company: 'Mueller Sanitaer und Heizung', score: 82, value: 1400, next: 'Personalisierte Erstnachricht', status: 'Ready to Pitch', reason: 'Guter Fit und konkreter Webseitenbedarf' },
  { id: 'L-3', company: 'Arslan Gebaeudereinigung', score: 72, value: 1200, next: 'Nachfass-Mail', status: 'Nachfassen', reason: 'Follow-up offen' },
  { id: 'L-4', company: 'Weber Coaching', score: 66, value: 950, next: 'Produktfit pruefen', status: 'Pruefen', reason: 'Noch kein klares Paket' },
];

const workflowItems = [
  { id: 'WF-YT', title: 'YouTube Intelligence Worker', risk: 'Mittel', text: 'URL zu Transkript zu Analyse zu Insights zu Quest-Entwürfen.' },
  { id: 'WF-OG', title: 'OG-Scraper zu Google Sheets', risk: 'Hoch', text: 'Website-Daten extrahieren. Echter Sheet-Write nur mit Datenvertrag und Gate.' },
];

const initialQuests: Quest[] = [
  {
    id: 'APP-X-01',
    code: 'APP-X-01',
    title: 'Canvas-App Zentrale härten',
    project: 'APP-X',
    status: 'Pruefung noetig',
    active: false,
    priority: 'Hoch',
    agent: 'NOX',
    goal: 'Die Cockpit-Zentrale bleibt stabil, klar scanbar und ohne innere Content-Scrollbars.',
    notes: 'Projects-Deep-Dive ist stabilisiert. Jetzt muss die globale Quest-Ebene sauber anschließen.',
    acceptanceCriteria: ['Start und Projects bleiben erreichbar', 'Keine inneren Content-Scrollbars', 'Operator-Hierarchie bleibt klar'],
    requiresApproval: false,
    lastMovement: 'Projects-Deep-Dive stabilisiert',
    history: ['Quest APP-X-01 vorbereitet.', 'Projects-Deep-Dive stabilisiert.'],
  },
  {
    id: 'APP-X-02',
    code: 'APP-X-02',
    title: 'Quest-Detailansicht bauen',
    project: 'APP-X',
    status: 'Offen',
    active: false,
    priority: 'Normal',
    agent: 'NOX',
    goal: 'Eine einzelne Quest kann im Detail geprüft, aktiviert, umgehängt und mit Outputs verbunden werden.',
    notes: 'Detailscreen soll aus derselben lokalen Quest-Datenquelle lesen wie Quest-Zentrale und Projects.',
    acceptanceCriteria: ['Quest-Code sichtbar', 'Historie sichtbar', 'Ruecknavigation funktioniert'],
    requiresApproval: false,
    lastMovement: 'In Backlog aufgenommen',
    history: ['Quest APP-X-02 erstellt.'],
  },
  {
    id: 'APP-X-03',
    code: 'APP-X-03',
    title: 'Output-System vorbereiten',
    project: 'APP-X',
    status: 'Offen',
    active: false,
    priority: 'Hoch',
    agent: 'NOX',
    goal: 'Outputs und Artefakte können aus Projekt- und Quest-Kontext als lokale Drafts entstehen.',
    notes: 'Output-Typen bleiben Demo-State: keine API, keine Downloads, keine externen Writes.',
    acceptanceCriteria: ['Output-Typen vorhanden', 'Draft wird lokal gespeichert', 'Projektbezug bleibt erhalten'],
    requiresApproval: false,
    lastMovement: 'Output-Modul vorbereitet',
    history: ['Quest APP-X-03 erstellt.'],
  },
  {
    id: 'PX-01',
    code: 'PX-01',
    title: 'Workflowfabrik Uebergabe-Spec bauen',
    project: 'PROJECT-X',
    status: 'Offen',
    active: false,
    priority: 'Hoch',
    agent: 'Project X',
    goal: 'Project X bekommt eine klare Uebergabe-Spec mit Ziel, Kontext, Grenzen und nächster Implementierungsaufgabe.',
    notes: 'Die Workflowfabrik braucht verwertbare Outputs statt lose Chat-Ideen.',
    acceptanceCriteria: ['Ziel beschrieben', 'Kontext enthalten', 'Nächste Aufgabe ableitbar'],
    requiresApproval: false,
    lastMovement: 'Bereit für Spezifikation',
    history: ['Quest PX-01 erstellt.'],
  },
  {
    id: 'PX-02',
    code: 'PX-02',
    title: 'App-Zugriff für NOX vorbereiten',
    project: 'PROJECT-X',
    status: 'Blockiert',
    active: false,
    priority: 'Hoch',
    agent: 'Project X',
    goal: 'Klaeren, welche lokalen App-Flaechen NOX im Demo-Modus bedienen darf.',
    notes: 'Blockiert, bis Freigabe-Gate und erlaubte Aktionen beschrieben sind.',
    acceptanceCriteria: ['Erlaubte Aktionen definiert', 'Verbotene Aktionen definiert', 'Freigabe-Gate notiert'],
    requiresApproval: true,
    lastMovement: 'Blockiert durch fehlendes Gate',
    history: ['Quest PX-02 erstellt.', 'Blocker: Freigabe-Gate fehlt.'],
  },
  {
    id: 'AND-01',
    code: 'AND-01',
    title: 'Quest-Orchestrierung schaerfen',
    project: 'ANDROMEDA',
    status: 'In Arbeit',
    active: false,
    priority: 'Hoch',
    agent: 'NOX Agent',
    goal: 'NOX Agent strukturiert Aufgaben als Unter-Orchestrator, ohne NOX als sichtbares Gehirn zu verdrängen.',
    notes: 'Project-aware Kontext, Backfill und Aktivierungslogik müssen zusammenpassen.',
    acceptanceCriteria: ['NOX bleibt primaerer Ansprechpartner', 'Projektkontext wird erkannt', 'Übergaben sind nachvollziehbar'],
    requiresApproval: false,
    lastMovement: 'Orchestrierungslogik in Arbeit',
    history: ['Quest AND-01 erstellt.', 'Orchestrierung in Arbeit.'],
  },
  {
    id: 'AND-02',
    code: 'AND-02',
    title: 'Freigabe-Logik definieren',
    project: 'ANDROMEDA',
    status: 'Offen',
    active: false,
    priority: 'Normal',
    agent: 'NOX Agent',
    goal: 'Freigaben werden als Review-Gate vorbereitet, nicht als automatische Ausführung.',
    notes: 'Telegram ist später Approval-/Alarm-Kanal, nicht Hauptsteuerzentrale.',
    acceptanceCriteria: ['Freigabearten beschrieben', 'Risiko sichtbar', 'Keine echten Sends'],
    requiresApproval: true,
    lastMovement: 'Offen',
    history: ['Quest AND-02 erstellt.'],
  },
  {
    id: 'LG-01',
    code: 'LG-01',
    title: 'Lead-Datenvertrag finalisieren',
    project: 'LEADGEN',
    status: 'Offen',
    active: false,
    priority: 'Hoch',
    agent: 'NOX',
    goal: 'Lead-Felder, Statuslogik und sichere Write-Gates werden als Datenvertrag beschrieben.',
    notes: 'Ohne Datenvertrag bleiben externe Writes gesperrt.',
    acceptanceCriteria: ['Pflichtfelder beschrieben', 'Statuswerte definiert', 'Write-Gate gesetzt'],
    requiresApproval: true,
    lastMovement: 'Datenvertrag offen',
    history: ['Quest LG-01 erstellt.'],
  },
  {
    id: 'LG-02',
    code: 'LG-02',
    title: 'Pitch-Queue vorbereiten',
    project: 'LEADGEN',
    status: 'Offen',
    active: false,
    priority: 'Normal',
    agent: 'Claude',
    goal: 'Lead-Pitches werden nach Priorität und nächstem Schritt als lokale Queue vorbereitet.',
    notes: 'Demo-Pitches bleiben lokal und werden nicht gesendet.',
    acceptanceCriteria: ['Lead-Auswahl vorhanden', 'Pitch-Text editierbar', 'Kein echter Send'],
    requiresApproval: false,
    lastMovement: 'Offen',
    history: ['Quest LG-02 erstellt.'],
  },
  {
    id: 'TEAM-01',
    code: 'TEAM-01',
    title: 'Rollenmodell finalisieren',
    project: 'TEAM-OS',
    status: 'Aktiv',
    active: true,
    priority: 'Normal',
    agent: 'NOX',
    goal: 'Owner, Sales Partner, Operator, Viewer und Agent werden als lokale Rollenlogik greifbar.',
    notes: 'Keine Auth bauen. Nur Demo-Struktur und Sichtbarkeitsmodell.',
    acceptanceCriteria: ['Rollen benannt', 'Owner-Rechte klar', 'Keine echte Auth'],
    requiresApproval: false,
    lastMovement: 'Zur Bearbeitung aktiviert',
    history: ['Quest TEAM-01 erstellt.', 'Quest TEAM-01 zur Bearbeitung aktiviert.'],
  },
];

const initialOutputs: OutputArtifact[] = [
  {
    id: 'ART-APPX-1',
    title: 'NOX Labs Canvas',
    project: 'APP-X',
    outputType: 'Miro-Systemkarte',
    storage: 'Lokal / Canvas-Demo',
    status: 'Active',
    version: 'v0.2',
    description: 'Systemkarte für Projekt, Quest, Output und Freigabe-Zonen.',
  },
  {
    id: 'ART-APPX-2',
    title: 'APP-X Implementierungs-Prompt',
    project: 'APP-X',
    outputType: 'Implementierungs-Prompt',
    storage: 'Lokaler Entwurf',
    status: 'Draft',
    version: 'v0.1',
    description: 'Prompt für den Projects-Deep-Dive und die vorbereitete Quest-Zentrale.',
  },
  {
    id: 'ART-AND-1',
    title: 'Project-aware Patch-Plan',
    project: 'ANDROMEDA',
    outputType: 'Review-Report',
    storage: 'Notion-Kontext / Demo',
    status: 'Review',
    version: 'v0.3',
    description: 'Entscheidungsvorlage für Backfill oder Aktivierung.',
  },
  {
    id: 'ART-LEAD-1',
    title: 'Leadmap / Radar',
    project: 'LEADGEN',
    outputType: 'Kunden-/Sales-Asset',
    storage: 'https://radar.getvoidra.com',
    status: 'Active',
    version: 'v0.1',
    description: 'Demo-Radar für Lead-Priorisierung und Pipeline-Sicht.',
  },
];

const initialApprovals: Approval[] = [
  {
    id: 'A-1',
    title: 'YouTube Intelligence Worker als Spec vorbereiten?',
    project: 'YOUTUBE-INTEL',
    questId: 'AND-02',
    status: 'Wartet',
    risk: 'Mittel',
    agent: 'NOX',
    description: 'Soll der Worker später an die Workflowfabrik übergeben werden?',
  },
  {
    id: 'A-2',
    title: 'OG-Scraper später an Google Sheets anbinden?',
    project: 'LEADGEN',
    questId: 'LG-01',
    status: 'Blockiert',
    risk: 'Hoch',
    agent: 'Project X',
    description: 'Wir brauchen erst das Freigabe-Gate für jeden Write.',
  },
  {
    id: 'A-3',
    title: 'APP-X Canvas v0.2 als Project-X-Spec exportieren?',
    project: 'APP-X',
    questId: 'APP-X-03',
    status: 'Pruefung',
    risk: 'Niedrig',
    agent: 'NOX',
    description: 'Das aktuelle Layout als Blueprint speichern.',
  },
];

const initialAndromedaCommands: AndromedaCommand[] = [
  {
    id: 'CMD-PX-01',
    commandType: 'PREPARE_PROJECT_X_HANDOFF',
    projectId: 'PROJECT-X',
    questId: 'PX-01',
    title: 'Project-X-Handoff für Workflowfabrik',
    intent: 'Project X soll eine saubere Uebergabe-Spec für die Workflowfabrik vorbereiten.',
    payloadSummary: 'Lokaler Demo-Command für Uebergabe, Dry-Run und Freigabe-Gate.',
    requestedBy: 'NOX Operator',
    status: 'Freigabe noetig',
    riskLevel: 'Mittel',
    requiresApproval: true,
    createdAt: 'Heute',
    history: ['Command lokal initialisiert.', 'Live-Ausführung bleibt gesperrt.'],
  },
];

const initialMilestones: Milestone[] = [
  {
    id: 'M-APPX-1',
    project: 'APP-X',
    dateLabel: 'v0.1',
    type: 'Layout',
    title: 'Grundlayout erstellt',
    description: 'Sidebar, Startbereich und lokale Demo-Daten für das Operator-Cockpit angelegt.',
  },
  {
    id: 'M-APPX-2',
    project: 'APP-X',
    dateLabel: 'v0.2',
    type: 'Projects',
    title: 'Projekt-Zentrale aufgebaut',
    description: 'Projekte, Quests, Freigaben und Artefakte wurden in einer Deep-Dive-Struktur gebuendelt.',
  },
  {
    id: 'M-APPX-3',
    project: 'APP-X',
    dateLabel: 'Heute',
    type: 'UI',
    title: 'UI-Struktur optimiert',
    description: 'Die Projects-Seite startet direkt im Deep-Dive und nutzt nur eine Projekt-Auswahl.',
  },
  {
    id: 'M-APPX-4',
    project: 'APP-X',
    dateLabel: 'Heute',
    type: 'Output',
    title: 'Output-System vorbereitet',
    description: 'Outputs und Artefakte können lokal als Demo-Drafts erzeugt werden.',
  },
  {
    id: 'M-APPX-5',
    project: 'APP-X',
    dateLabel: 'Heute',
    type: 'Quest',
    title: 'Quest-System vorbereitet',
    description: 'Verknüpfte Quests bleiben klickbar vorbereitet, ohne die globale Quest-Zentrale neu zu bauen.',
  },
  {
    id: 'M-AND-1',
    project: 'ANDROMEDA',
    dateLabel: 'Gestern',
    type: 'Stage 11B',
    title: 'Project-aware Patch vorbereitet',
    description: 'NOX Agent kann für den Backfill vorbereitet werden, sobald der UI-Stand freigegeben ist.',
  },
  {
    id: 'M-LG-1',
    project: 'LEADGEN',
    dateLabel: 'Diese Woche',
    type: 'Cashflow',
    title: 'Lead-Radar Demo-Daten verbunden',
    description: 'Lead-Priorisierung, Pipeline-Wert und Pitch-Queue sind als Demo-Fluss sichtbar.',
  },
];

const outputTypes = [
  'Uebergabe-Spec',
  'Miro-Systemkarte',
  'Excalidraw-Skizze',
  'Implementierungs-Prompt',
  'Review-Report',
  'Entscheidungsnotiz',
  'Projekt-Briefing',
  'Kunden-/Sales-Asset',
];

// APP-X-UI-01 — Cockpit Information Architecture.
//
// The sidebar shows a small, focused set of top-level entries. Each entry
// maps a display label to an internal route key. Legacy route keys
// (`Quest-Zentrale`, `Lead-Eingang`, `Projekt X`, `Outputs`, etc.) are
// still reachable as `active` values from inside child views, but they
// are no longer first-class menu items. `Project X` becomes a project
// inside Projekte (selected via the project picker), not a separate
// top-level destination.
type SidebarItem = { label: string; route: string };
type SidebarGroup = { title: string; items: SidebarItem[] };

const sidebarGroups: SidebarGroup[] = [
  {
    title: 'Zentrale',
    items: [
      { label: 'Start', route: 'Start' },
      { label: 'Projekte', route: 'Projekte' },
      { label: 'Quests', route: 'Quest-Zentrale' },
    ],
  },
  {
    title: 'Cashflow',
    items: [
      { label: 'Leads', route: 'Lead-Eingang' },
      { label: 'Pitch-Zentrale', route: 'Pitch-Zentrale' },
    ],
  },
  {
    title: 'Agenten',
    items: [
      { label: 'Agenten-Chat', route: 'Agenten-Chat' },
      { label: 'Faehigkeiten', route: 'Faehigkeiten' },
      { label: 'Whiteboard', route: 'Whiteboard' },
      { label: 'Workflow-Zonen', route: 'Workflow-Zonen' },
      { label: 'Intelligence', route: 'Intelligence' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Status', route: 'Status' },
      { label: 'Einstellungen', route: 'Einstellungen' },
    ],
  },
];

// Map a possibly-legacy active route to the sidebar entry that should
// be highlighted. Routes not in this map fall back to direct match.
// Freigaben is intentionally not a main sidebar entry any more; it
// remains reachable as a contextual view from Projekte / Quests, and
// gets highlight-aliased to the related main entry so the sidebar
// stays focused.
const routeAliasForSidebar: Record<string, string> = {
  'Quest-Detail': 'Quest-Zentrale',
  'Projekt X': 'Projekte',
  Outputs: 'Projekte',
  Freigaben: 'Quest-Zentrale',
  Team: 'Start',
  Sprachsteuerung: 'Start',
  'Quest-Generator': 'Start',
  'Lead Map': 'Lead-Eingang',
  'YouTube-Analyse': 'Intelligence',
  'OG-Scraper': 'Intelligence',
  Skillbook: 'Faehigkeiten',
  Canvas: 'Faehigkeiten',
};

const agentOptions = ['NOX', 'NOX Agent', 'Claude', 'Project X', 'Owner'];
const statusFilterOptions = ['Alle', 'Offen', 'Aktiv', 'In Arbeit', 'Pruefung noetig', 'Blockiert', 'Erledigt'];
const priorityOptions = ['Hoch', 'Normal', 'Niedrig'];

function projectName(projectId: string) {
  return projects.find((project) => project.id === projectId)?.name ?? projectId;
}

function questStatus(quest: Quest) {
  return quest.active || quest.status === 'Aktiv' ? 'Aktiv' : quest.status;
}

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function money(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'gold' | 'red' }) {
  const className =
    tone === 'red'
      ? 'border-red-500/40 bg-red-500/12 text-red-100'
      : tone === 'gold'
        ? 'border-amber-300/40 bg-amber-300/12 text-amber-50'
        : 'border-[#4a101b]/80 bg-[#14080c] text-[#f1e3ea]';

  return <span className={cx('inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-extrabold', className)}>{children}</span>;
}

function Button({
  children,
  onClick,
  tone = 'gold',
  type = 'button',
  className,
  disabled,
  title,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: 'gold' | 'ghost' | 'red' | 'secondary';
  type?: 'button' | 'submit';
  className?: string;
  disabled?: boolean;
  /** Native browser tooltip text — surfaces helper copy without a custom tooltip layer. */
  title?: string;
  /** Optional aria-label override when `children` is not plain text. */
  ariaLabel?: string;
}) {
  const classNameByTone =
    tone === 'red'
      ? 'border-red-500/40 bg-red-500/15 text-red-100 hover:bg-red-500/25'
      : tone === 'ghost'
        ? 'border-[#4a101b]/80 bg-[#16080c] text-[#fff7fb] hover:bg-[#2a0b12]'
        : tone === 'secondary'
          ? 'border-[#4a101b]/60 bg-black/40 text-[#eadbe2] hover:border-[#7a1526]/80 hover:bg-[#120609]'
          : 'border-amber-300/45 bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 text-[#090704] shadow-[0_0_28px_rgba(245,158,11,0.16)]';

  return (
    <motion.button
      type={type}
      whileHover={disabled ? undefined : { y: -2, scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={cx(
        'rounded-2xl border px-5 py-3 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50',
        classNameByTone,
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cx(
        'rounded-[1.4rem] border border-[#4a101b]/55 bg-[#080304]/88 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.54)] backdrop-blur-xl',
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div>
      <div className="text-[12px] font-extrabold uppercase tracking-[0.28em] text-amber-200/80">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-black leading-tight tracking-tight text-[#fff7fb] md:text-5xl">{title}</h2>
      {subtitle ? <p className="mt-4 max-w-4xl text-base font-semibold leading-7 text-[#eadbe2] md:text-lg">{subtitle}</p> : null}
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-3 block text-[12px] font-extrabold uppercase tracking-[0.24em] text-[#9f8d95]">{children}</label>;
}

export default function OperatorCockpit() {
  const [active, setActive] = useState('Start');
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0].id);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [outputs, setOutputs] = useState(initialOutputs);
  const [approvals, setApprovals] = useState(initialApprovals);
  const [milestones, setMilestones] = useState(initialMilestones);
  const [quests, setQuests] = useState(initialQuests);
  const [andromedaCommands, setAndromedaCommands] = useState(initialAndromedaCommands);
  const [notice, setNotice] = useState('');
  const [voiceMode, setVoiceMode] = useState('Bereit');
  const [projectDrafts, setProjectDrafts] = useState<QuestDraft[]>([]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0];
  const pipeline = useMemo(() => leads.reduce((sum, lead) => sum + lead.value, 0), []);

  function addMilestone(project: string, type: string, title: string, description: string) {
    const nextMilestone: Milestone = {
      id: `M-${Date.now()}`,
      project,
      dateLabel: 'Heute',
      type,
      title,
      description,
    };
    setMilestones((current) => [nextMilestone, ...current]);
  }

  function registerDemoAction(project: string, title: string) {
    setNotice(`${title} wurde lokal vorgemerkt. Demo-Modus: keine API, kein Download, kein externer Write.`);
    addMilestone(project, 'Demo', title, 'NOX hat die Aktion lokal als Meilenstein im Projekt vermerkt.');
  }

  function updateQuest(questId: string, updater: (quest: Quest) => Quest) {
    setQuests((current) => current.map((quest) => (quest.id === questId ? updater(quest) : quest)));
  }

  function activateQuest(questId: string) {
    updateQuest(questId, (quest) => ({
      ...quest,
      active: true,
      status: 'Aktiv',
      lastMovement: 'Zur Bearbeitung aktiviert',
      history: [`Quest ${quest.code} zur Bearbeitung aktiviert.`, ...quest.history],
    }));
  }

  function deactivateQuest(questId: string) {
    updateQuest(questId, (quest) => ({
      ...quest,
      active: false,
      status: quest.status === 'Aktiv' ? 'Offen' : quest.status,
      lastMovement: 'Deaktiviert',
      history: [`Quest ${quest.code} deaktiviert.`, ...quest.history],
    }));
  }

  function assignQuestProject(questId: string, projectId: string) {
    updateQuest(questId, (quest) => ({
      ...quest,
      project: projectId,
      lastMovement: `Projekt ${projectName(projectId)} zugewiesen`,
      history: [`Quest ${quest.code} wurde Projekt ${projectName(projectId)} zugewiesen.`, ...quest.history],
    }));
  }

  function assignQuestAgent(questId: string, agent: string) {
    updateQuest(questId, (quest) => ({
      ...quest,
      agent,
      lastMovement: `An ${agent} zugewiesen`,
      history: [`Quest ${quest.code} an ${agent} zugewiesen.`, ...quest.history],
    }));
  }

  function createQuestDraft(input: { text: string; project: string; priority: string; agent: string }) {
    const count = quests.filter((quest) => quest.code.startsWith('Q-NEW-')).length + 1;
    const code = `Q-NEW-${String(count).padStart(2, '0')}`;
    const text = input.text.trim() || 'Neue lokale Quest vormerken.';
    const newQuest: Quest = {
      id: code,
      code,
      title: text.length > 72 ? `${text.slice(0, 69)}...` : text,
      project: input.project,
      status: 'Offen',
      active: false,
      priority: input.priority,
      agent: input.agent,
      goal: text,
      notes: text,
      acceptanceCriteria: ['Ziel ist beschrieben', 'Projektbezug ist gesetzt', 'Nächste Aktion ist ableitbar'],
      requiresApproval: false,
      lastMovement: 'Quest-Draft lokal erstellt',
      history: [`Quest ${code} lokal vorgemerkt.`],
    };
    setQuests((current) => [newQuest, ...current]);
    setSelectedQuestId(newQuest.id);
    setNotice(`Quest ${code} wurde lokal vorgemerkt.`);
  }

  function addCommandHistory(commandId: string, entry: string, patch: Partial<AndromedaCommand> = {}) {
    setAndromedaCommands((current) =>
      current.map((command) =>
        command.id === commandId
          ? {
              ...command,
              ...patch,
              history: [entry, ...command.history],
            }
          : command,
      ),
    );
  }

  function createProjectXHandoff(quest: Quest, switchToProjectX = false) {
    const commandId = `CMD-${Date.now()}`;
    const riskLevel: RiskLevel = quest.requiresApproval || quest.status === 'Blockiert' ? 'Hoch' : 'Mittel';
    const createdAt = new Date().toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const command: AndromedaCommand = {
      id: commandId,
      commandType: 'PREPARE_PROJECT_X_HANDOFF',
      projectId: quest.project,
      questId: quest.id,
      title: `Project-X-Handoff: ${quest.code}`,
      intent: `Project X soll die nächste Umsetzung für "${quest.title}" trocken vorbereiten.`,
      payloadSummary: `${quest.goal} Kontext: ${quest.notes}`,
      requestedBy: 'NOX Operator',
      status: 'Freigabe noetig',
      riskLevel,
      requiresApproval: true,
      createdAt,
      history: [`Quest ${quest.code} für Project X vorbereitet.`, 'Keine Live-Ausführung gestartet.'],
    };
    setAndromedaCommands((current) => [command, ...current]);
    updateQuest(quest.id, (current) => ({
      ...current,
      lastMovement: 'Uebergabe an Project X vorbereitet',
      history: ['Uebergabe an Project X vorbereitet.', ...current.history],
    }));
    setNotice(`Project-X-Uebergabe für ${quest.code} lokal vorbereitet. Keine API, kein Runner-Call.`);
    if (switchToProjectX) {
      setActive('Projekt X');
    }
  }

  function runProjectXDryRun(commandId: string) {
    const command = andromedaCommands.find((item) => item.id === commandId);
    if (!command) return;

    const quest = command.questId ? quests.find((item) => item.id === command.questId) : undefined;
    const project = projects.find((item) => item.id === command.projectId);
    const result: DryRunResult = {
      summary: `Project X kann die Uebergabe für ${quest?.code ?? command.title} vorbereiten.`,
      estimatedImpact: `Projekt ${project?.name ?? command.projectId}: lokale Spec, Freigabe-Gate und Output-Draft werden vorbereitet.`,
      requiredInputs: ['finale Operator-Freigabe', 'Ziel-Repo oder Zielpfad', 'gewollter Output-Typ'],
      missingArtifacts: command.riskLevel === 'Hoch' ? ['explizite Freigabe', 'technischer Zielpfad'] : ['finale UI-Freigabe'],
      recommendedNextAction: 'Freigabe anfordern und danach eine Uebergabe-Spec als lokalen Output-Draft erzeugen.',
    };
    addCommandHistory(commandId, 'Dry-Run lokal simuliert. Keine externe Ausführung.', {
      dryRunResult: result,
      status: command.requiresApproval ? 'Freigabe noetig' : 'Dry-Run bereit',
    });
    setNotice(`Dry-Run für ${command.title} lokal erzeugt.`);
  }

  function requestCommandApproval(commandId: string) {
    const command = andromedaCommands.find((item) => item.id === commandId);
    if (!command) return;
    setApprovals((current) => [
      {
        id: `A-CMD-${Date.now()}`,
        title: `Command freigeben: ${command.title}`,
        project: command.projectId,
        questId: command.questId,
        commandId: command.id,
        status: 'Wartet',
        risk: command.riskLevel,
        agent: 'NOX',
        description: `Demo-Freigabe für ${command.commandType}. Live-Ausführung bleibt gesperrt.`,
      },
      ...current,
    ]);
    addCommandHistory(commandId, 'Freigabe lokal angefordert.', { status: 'Freigabe noetig' });
    setNotice(`Freigabe für ${command.title} lokal angefordert.`);
  }

  function approveCommand(commandId: string) {
    addCommandHistory(commandId, 'Command lokal freigegeben. Live-Ausführung bleibt weiterhin gesperrt.', {
      status: 'Freigegeben',
    });
  }

  function rejectCommand(commandId: string) {
    addCommandHistory(commandId, 'Command lokal abgelehnt und gesperrt.', {
      status: 'Gesperrt',
    });
  }

  function createProjectXHandoffSpec(commandId?: string) {
    const command = andromedaCommands.find((item) => item.id === commandId);
    const quest = command?.questId ? quests.find((item) => item.id === command.questId) : undefined;
    const projectId = command?.projectId ?? 'PROJECT-X';
    const project = projects.find((item) => item.id === projectId);
    const description = quest
      ? `Uebergabe-Spec für ${quest.code}: ${quest.goal} Blocker/Freigaben müssen vor Live-Ausführung geprüft werden.`
      : 'Uebergabe-Spec für Project X aus lokalem Demo-Kontext, offenen Commands und Freigaben.';

    setOutputs((current) => [
      {
        id: `ART-PX-${Date.now()}`,
        title: command ? `Project-X Uebergabe-Spec: ${command.title}` : 'Project-X Uebergabe-Spec',
        project: projectId,
        outputType: 'Uebergabe-Spec',
        storage: 'Lokal / Demo-State',
        status: 'Entwurf',
        version: 'v1',
        description,
      },
      ...current,
    ]);
    addMilestone(projectId, 'Project X', 'Project-X-Uebergabe-Spec vorbereitet', description);
    if (command) {
      addCommandHistory(command.id, `Uebergabe-Spec für ${project?.name ?? projectId} lokal erzeugt.`);
    }
    setNotice('Uebergabe-Spec lokal als Output-Draft erzeugt. Keine Datei, kein Download, kein externer Write.');
  }

  return (
    <div className="min-h-screen bg-[#030101] text-[#fff7fb]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-12%] top-[-10%] h-[520px] w-[520px] rounded-full bg-[#7a1526]/18 blur-[120px]" />
        <div className="absolute right-[-10%] top-[14%] h-[460px] w-[460px] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(246,238,242,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(246,238,242,0.022)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
      </div>

      <div className="relative mx-auto flex max-w-[1600px] gap-6 px-4 py-6 md:px-8">
        <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] w-72 shrink-0 self-start overflow-y-auto rounded-[1.6rem] border border-[#4a101b]/60 bg-[#070203]/95 p-4 shadow-[18px_0_80px_rgba(0,0,0,0.5)] [scrollbar-width:none] lg:block [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActive('Projekte')}
            className="mb-4 flex w-full items-center gap-4 rounded-2xl border border-[#7a1526]/45 bg-[#2a0b12]/65 p-4 text-left"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#7a1526]/45 bg-[#120609] text-xl font-black">N</span>
            <span>
              <span className="block text-sm font-black uppercase tracking-[0.22em] text-[#fff7fb]">NOX Labs</span>
              <span className="block text-xs font-semibold text-[#9f8d95]">Operator Cockpit</span>
            </span>
          </button>

          <div className="space-y-3">
            {sidebarGroups.map((group) => {
              const activeForHighlight = routeAliasForSidebar[active] ?? active;
              return (
                <div key={group.title}>
                  <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#7f6b73]">{group.title}</div>
                  <div className="space-y-1.5">
                    {group.items.map((item) => (
                      <button
                        key={item.route}
                        type="button"
                        onClick={() => setActive(item.route)}
                        className={cx(
                          'w-full rounded-2xl border px-4 py-2.5 text-left text-sm font-bold transition',
                          activeForHighlight === item.route
                            ? 'border-[#7a1526]/55 bg-[#2a0b12]/80 text-[#fff7fb]'
                            : 'border-transparent text-[#cbbbc3] hover:border-[#7a1526]/45 hover:bg-[#14070a] hover:text-[#fff7fb]',
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-8 pb-10">
          {active === 'Start' ? (
            <HomeHeader pipeline={pipeline} voiceMode={voiceMode} draftsVisible={projectDrafts.length > 0} navigate={setActive} />
          ) : null}

          {notice ? (
            <button
              type="button"
              onClick={() => setNotice('')}
              className="w-full rounded-2xl border border-amber-300/35 bg-amber-300/10 px-5 py-4 text-left text-sm font-bold text-amber-50"
            >
              {notice}
            </button>
          ) : null}

          <AnimatePresence mode="wait">
            <motion.div key={active} {...pageMotion}>
              {active === 'Projekte' ? (
                <ProjectsDeepDive
                  project={selectedProject}
                  selectedProjectId={selectedProjectId}
                  setSelectedProjectId={setSelectedProjectId}
                  outputs={outputs}
                  setOutputs={setOutputs}
                  approvals={approvals}
                  setApprovals={setApprovals}
                  quests={quests}
                  milestones={milestones}
                  andromedaCommands={andromedaCommands}
                  addMilestone={addMilestone}
                  registerDemoAction={registerDemoAction}
                  openQuest={(questId) => {
                    setSelectedQuestId(questId);
                    setActive('Quest-Detail');
                  }}
                />
              ) : null}

              {active === 'Start' ? (
                <Home
                  navigate={setActive}
                  quests={quests}
                  openQuest={(questId) => {
                    setSelectedQuestId(questId);
                    setActive('Quest-Detail');
                  }}
                  approvals={approvals}
                  milestones={milestones}
                />
              ) : null}

              {active === 'Team' ? (
                <SimplePage eyebrow="Team / Benutzer" title="Rollen und Arbeitsbereiche" text="Mitarbeiter sehen später nur eigene Leads, Quests und Reports. Owner bleibt einzige Kommando-Rolle." />
              ) : null}

              {active === 'Sprachsteuerung' ? (
                <OwnerVoice
                  setVoiceMode={setVoiceMode}
                  navigate={setActive}
                  registerDemoAction={(title) => registerDemoAction('VOICE-OWNER', title)}
                />
              ) : null}

              {active === 'Quest-Generator' ? (
                <QuestGenerator
                  selectedProjectId={selectedProjectId}
                  setSelectedProjectId={setSelectedProjectId}
                  projectDrafts={projectDrafts}
                  setProjectDrafts={setProjectDrafts}
                  addMilestone={addMilestone}
                />
              ) : null}

              {active === 'Lead Map' ? (
                <SimplePage eyebrow="Lead Map" title="Demo-Map mit Dummy-Pins" text="Pins, Filter, Lead-Seitenleiste und Aktionen. Die finale Map wird später integriert." />
              ) : null}

              {active === 'Lead-Eingang' ? (
                <LeadsInbox navigate={setActive} />
              ) : null}

              {active === 'Pitch-Zentrale' ? (
                <PitchCenter registerDemoAction={(title) => registerDemoAction('LEADGEN', title)} />
              ) : null}

              {active === 'YouTube-Analyse' ? (
                <SimplePage eyebrow="YouTube-Analyse" title="Video zu Transkript zu Insights" text="YouTube-Links werden später transkribiert, analysiert und in Quests oder Entwürfe verwandelt." />
              ) : null}

              {active === 'OG-Scraper' ? (
                <SimplePage eyebrow="OG-Scraper" title="Website zu Lead-Daten" text="OpenGraph und Website-Daten extrahieren und später per Datenvertrag in Sheets aktualisieren." />
              ) : null}

              {active === 'Agenten-Chat' ? (
                <SimplePage eyebrow="Agenten-Chat" title="Projektbewusst besprechen" text="Der Chat laedt Quest, Projekt, erlaubte und verbotene Aktionen, Artefakte und den Verlauf, bevor delegiert wird." />
              ) : null}

              {active === 'Faehigkeiten' || active === 'Canvas' || active === 'Skillbook' ? (
                <SkillbookPanel mode="faehigkeiten" />
              ) : null}
              {active === 'Whiteboard' ? <SkillbookPanel mode="whiteboard" /> : null}

              {active === 'Projekt X' ? (
                <ProjectX
                  quests={quests}
                  outputs={outputs}
                  approvals={approvals}
                  commands={andromedaCommands}
                  runDryRun={runProjectXDryRun}
                  requestApproval={requestCommandApproval}
                  approveCommand={approveCommand}
                  rejectCommand={rejectCommand}
                  createHandoffSpec={createProjectXHandoffSpec}
                  openQuest={(questId) => {
                    setSelectedQuestId(questId);
                    setActive('Quest-Detail');
                  }}
                />
              ) : null}

              {active === 'Quest-Zentrale' ? (
                <QuestCenter
                  quests={quests}
                  approvals={approvals}
                  activateQuest={activateQuest}
                  deactivateQuest={deactivateQuest}
                  assignQuestProject={assignQuestProject}
                  assignQuestAgent={assignQuestAgent}
                  createQuestDraft={createQuestDraft}
                  openQuest={(questId) => {
                    setSelectedQuestId(questId);
                    setActive('Quest-Detail');
                  }}
                  openProject={(projectId) => {
                    setSelectedProjectId(projectId);
                    setActive('Projekte');
                  }}
                />
              ) : null}

              {active === 'Quest-Detail' ? (
                <QuestDetail
                  quest={quests.find((quest) => quest.id === selectedQuestId) ?? quests[0]}
                  outputs={outputs}
                  approvals={approvals}
                  activateQuest={activateQuest}
                  deactivateQuest={deactivateQuest}
                  assignQuestProject={assignQuestProject}
                  assignQuestAgent={assignQuestAgent}
                  backToQuests={() => setActive('Quest-Zentrale')}
                  openProject={(projectId) => {
                    setSelectedProjectId(projectId);
                    setActive('Projekte');
                  }}
                  openTalk={() => registerDemoAction(quests.find((quest) => quest.id === selectedQuestId)?.project ?? 'APP-X', 'Quest mit NOX besprochen')}
                  createProjectXHandoff={(quest) => createProjectXHandoff(quest, true)}
                  createOutput={(quest) => {
                    setOutputs((current) => [
                      {
                        id: `ART-${Date.now()}`,
                        title: `Output für ${quest.code}`,
                        project: quest.project,
                        outputType: 'Implementierungs-Prompt',
                        storage: 'Lokal / Demo-State',
                        status: 'Draft',
                        version: 'v0.1',
                        description: `Aus Quest ${quest.code}: ${quest.goal}`,
                      },
                      ...current,
                    ]);
                    addMilestone(quest.project, 'Output', `Output für ${quest.code} erstellt`, quest.goal);
                  }}
                />
              ) : null}

              {active === 'Outputs' ? <GlobalOutputs outputs={outputs} registerDemoAction={registerDemoAction} /> : null}
              {active === 'Freigaben' ? <GlobalApprovals approvals={approvals} registerDemoAction={registerDemoAction} /> : null}

              {/* APP-X-UI-01 — new sidebar destinations. Lightweight stubs that
                  point at the existing concepts without duplicating the deep
                  workflows; reduces top-level noise while preserving access. */}
              {active === 'Workflow-Zonen' ? (
                <SimplePage
                  eyebrow="Workflow-Zonen"
                  title="Handoff-, Dry-Run- und Approval-Zonen"
                  text="Project-X-Handoffs, NOX-Agent-Commands und Quest-Generator leben jetzt im jeweiligen Projektkontext. Öffne ein Projekt, um die Commands, Dry-Runs und Outputs an dieser Stelle zu sehen."
                />
              ) : null}

              {active === 'Intelligence' ? (
                <SimplePage
                  eyebrow="Intelligence"
                  title="Quellen, Signale und Auswertung"
                  text="YouTube-Analyse, OG-Scraper und Lead-Map sammeln Rohsignale. Die Auswertungen landen kuenftig hier als verdichtete Insight-Strecke. Bis dahin Demo-Stubs."
                />
              ) : null}

              {active === 'Status' ? (
                <SimplePage
                  eyebrow="System"
                  title="Cockpit Status"
                  text="API live, Notion read-only adapter aktiv, execute weiterhin gesperrt. Detaillierte Health-Checks folgen mit Audit-Persistenz."
                />
              ) : null}

              {active === 'Einstellungen' ? (
                <SimplePage
                  eyebrow="System"
                  title="Einstellungen"
                  text="Operator-Praeferenzen, Notion-Konfiguration und Audit-Optionen werden hier sichtbar, sobald sie ein Persistenz-Layer haben. Aktuell rein lokal/Demo."
                />
              ) : null}
            </motion.div>
          </AnimatePresence>

          <footer className="rounded-[1.4rem] border border-[#4a101b]/55 bg-black/35 p-5 text-center text-sm font-semibold text-[#9f8d95]">
            NOX Labs Operator-Prototyp: Rein lokaler Zustand. Keine API-Verbindung, kein Backend.
          </footer>
        </main>
      </div>
    </div>
  );
}

function NoxWordmark() {
  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <motion.div
          animate={{ textShadow: ['0 0 0 rgba(255,255,255,0)', '0 0 38px rgba(253,230,138,0.55)', '0 0 0 rgba(255,255,255,0)'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="select-none text-6xl font-black leading-none tracking-tight text-[#fff7fb] md:text-7xl"
        >
          NOX
        </motion.div>
        <div className="absolute -bottom-2 left-1 h-px w-24 bg-gradient-to-r from-amber-300 via-[#7a1526] to-transparent" />
      </div>
      <div className="hidden h-16 w-px bg-[#4a101b]/70 sm:block" />
      <div className="hidden sm:block">
        <div className="text-sm font-black uppercase tracking-[0.24em] text-amber-200">Operator Cockpit</div>
        <div className="mt-2 text-sm font-semibold text-[#9f8d95]">Local Growth Dashboard MVP</div>
      </div>
    </div>
  );
}

function HomeHeader({
  pipeline,
  voiceMode,
  draftsVisible,
  navigate,
}: {
  pipeline: number;
  voiceMode: string;
  draftsVisible: boolean;
  navigate: (next: string) => void;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[2rem] border border-[#4a101b]/55 bg-[#080304]/92 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.72)] backdrop-blur-xl md:p-8"
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(380px,0.9fr)_minmax(560px,1.1fr)] xl:items-start">
        <div>
          <NoxWordmark />
          <p className="mt-6 max-w-4xl text-base font-semibold leading-8 text-[#eadbe2] md:text-lg">
            Operator-Kommandozentrale: Projekte verwalten, Agenten steuern, Cashflow ueberwachen und Quests orchestrieren.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <MiniStat label="Fokus" value="Cashflow zuerst" />
            <MiniStat label="Aktives Projekt" value="APP-X" />
            <MiniStat label="Systemstatus" value="Lokaler Prototyp" />
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-[#4a101b]/55 bg-[#0a0405]/70 p-5 shadow-[inset_0_0_45px_rgba(122,21,38,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-[13px] font-extrabold uppercase tracking-[0.28em] text-amber-200/70">Schnellzugriff</div>
            <Pill tone="gold">Operator</Pill>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Heute" value="7" hint="Priorisierte Quests" featured onClick={() => navigate('Quest-Zentrale')} />
            <Kpi label="Pipeline" value={money(pipeline)} hint="Lead-Werte" featured onClick={() => navigate('Lead-Eingang')} />
            <Kpi label="Projekte" value={projects.length} hint="Uebersicht" onClick={() => navigate('Projekte')} />
            <Kpi label="Team" value="4" hint="Zugriff" onClick={() => navigate('Team')} />
            <Kpi label="Voice" value={voiceMode} hint="Sprach-Agent" onClick={() => navigate('Sprachsteuerung')} />
            <Kpi label="Entwürfe" value={draftsVisible ? 'Neu' : '0'} hint="Generiert" onClick={() => navigate('Quest-Generator')} />
            <Kpi label="Freigaben" value={initialApprovals.length} hint="Review noetig" danger onClick={() => navigate('Freigaben')} />
            <Kpi label="Pins" value="4" hint="Karte" onClick={() => navigate('Lead Map')} />
          </div>
        </div>
      </div>
    </motion.header>
  );
}

function Kpi({
  label,
  value,
  hint,
  onClick,
  danger,
  featured,
}: {
  label: string;
  value: string | number;
  hint: string;
  onClick: () => void;
  danger?: boolean;
  featured?: boolean;
}) {
  const cardClass = danger
    ? 'border-red-500/35 bg-red-500/10 hover:border-red-400/55'
    : featured
      ? 'border-amber-300/35 bg-gradient-to-br from-amber-300/14 via-black/40 to-[#2a0b12]/55 hover:border-amber-200/55'
      : 'border-[#4a101b]/55 bg-[#120609]/60 hover:border-[#7a1526]/65';
  const valueColor = danger ? 'text-red-200' : featured ? 'text-[#fff7fb]' : 'text-amber-100';

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.018 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cx('group rounded-2xl border p-4 text-left transition', cardClass)}
    >
      <div className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#9f8d95]">{label}</div>
      <div className={cx('mt-2 text-2xl font-black', valueColor)}>{value}</div>
      <div className="mt-3 text-sm font-semibold leading-5 text-[#eadbe2]">{hint}</div>
      <div className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#7f6b73] group-hover:text-amber-100">Oeffnen</div>
    </motion.button>
  );
}

function Home({
  navigate,
  quests,
  openQuest,
  approvals,
  milestones,
}: {
  navigate: (next: string) => void;
  quests: Quest[];
  openQuest: (questId: string) => void;
  approvals: Approval[];
  milestones: Milestone[];
}) {
  return (
    <main className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_430px]">
      <div className="space-y-8">
        <Card>
          <SectionTitle eyebrow="Start / Kommandozentrale" title="Nächste beste Aktion" />
          <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[1.4rem] border border-amber-300/30 bg-gradient-to-br from-amber-300/15 via-black/40 to-[#2a0b12]/40 p-6">
              <div className="text-[13px] font-extrabold uppercase tracking-[0.24em] text-amber-100/80">Heute zuerst</div>
              <div className="mt-4 text-3xl font-black leading-tight text-[#fff7fb]">Schneider Beauty Group anrufen</div>
              <p className="mt-4 text-base font-semibold leading-7 text-[#eadbe2]">Warum Nummer 1: Score 88, 1.800 Euro Pipeline, Status Call zuerst und klarer nächster Schritt.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => navigate('Lead-Eingang')}>Lead oeffnen</Button>
                <Button tone="ghost" onClick={() => navigate('Pitch-Zentrale')}>Pitch vorbereiten</Button>
              </div>
            </div>
            <div className="rounded-[1.4rem] border border-[#7a1526]/40 bg-[#2a0b12]/40 p-6">
              <div className="text-[13px] font-extrabold uppercase tracking-[0.24em] text-amber-100/80">NOX Vorschlag</div>
              <div className="mt-4 text-3xl font-black leading-tight text-[#fff7fb]">Nicht noch ein Modul bauen.</div>
              <p className="mt-4 text-base font-semibold leading-7 text-[#eadbe2]">Erst Projects-Deep-Dive stabilisieren, Output-System vorbereiten, dann Quest-Zentrale global ausbauen.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button tone="ghost" onClick={() => navigate('Projekt X')}>System pruefen</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle eyebrow="Cashflow" title="Leads nach Wichtigkeit" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {leads.map((lead, index) => (
              <motion.button key={lead.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('Lead-Eingang')} className="rounded-2xl border border-[#4a101b]/60 bg-black/40 p-5 text-left hover:border-[#7a1526]/80">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-black text-amber-200">#{index + 1}</div>
                  <Pill tone={lead.score >= 80 ? 'gold' : 'default'}>{lead.score}/100</Pill>
                </div>
                <div className="mt-4 text-lg font-black text-[#fff7fb]">{lead.company}</div>
                <div className="mt-1 text-sm font-bold text-amber-100">{money(lead.value)}</div>
                <div className="mt-3 text-sm font-semibold leading-6 text-[#eadbe2]">{lead.next}</div>
              </motion.button>
            ))}
          </div>
        </Card>

        <QuestQueue quests={quests.slice(0, 3)} openQuest={openQuest} />
      </div>

      <div className="space-y-8">
        <Card>
          <div className="mb-5 flex items-start justify-between gap-4">
            <SectionTitle eyebrow="Blocker" title="Was stoppt das System?" />
            <Pill tone="red">{approvals.length}</Pill>
          </div>
          <div className="space-y-4">
            {approvals.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#4a101b]/60 bg-black/40 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-base font-black leading-tight text-[#fff7fb]">{item.title}</div>
                  <Pill tone={item.risk === 'Hoch' ? 'red' : 'gold'}>{item.status}</Pill>
                </div>
                <div className="mt-3 text-sm font-semibold leading-6 text-[#eadbe2]">Risiko: {item.risk}. Demo-Modus.</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle eyebrow="Verlauf" title="Letzte Systemspur" />
          <MilestonesSection milestones={milestones.slice(0, 5)} />
        </Card>
      </div>
    </main>
  );
}

function QuestQueue({ quests, openQuest }: { quests: Quest[]; openQuest: (questId: string) => void }) {
  return (
    <Card>
      <div className="mb-5 flex items-start justify-between gap-4">
        <SectionTitle eyebrow="Quest Queue" title="Fokus Quests" />
        <Pill tone="gold">Top {quests.length}</Pill>
      </div>
      <div className="space-y-5">
        {quests.map((quest, index) => (
          <div key={quest.id} className="rounded-[1.4rem] border border-[#4a101b]/60 bg-[#0a0405]/60 p-6 transition hover:border-[#7a1526]/80 hover:bg-[#120609]/90">
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className="text-sm font-black tracking-[0.08em] text-[#c9aeb8]">#{index + 1} - {quest.project}</span>
              <Pill tone={quest.priority === 'Hoch' ? 'red' : 'gold'}>{quest.status}</Pill>
            </div>
            <h3 className="text-2xl font-black text-[#fff7fb]">{quest.title}</h3>
            <p className="mt-3 text-base font-semibold leading-7 text-[#eadbe2]">{quest.goal}</p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm font-bold text-[#9f8d95]">Agent: <span className="text-[#fff7fb]">{quest.agent}</span></div>
              <Button tone="ghost" onClick={() => openQuest(quest.id)}>Details oeffnen</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SimplePage({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <Card>
      <SectionTitle eyebrow={eyebrow} title={title} subtitle={text} />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <MiniStat label="Sichtbar" value="Lokale Demo-Daten und Gate-Status." />
        <MiniStat label="Aktion" value="Besprechen, pruefen, delegieren, freigeben." />
        <MiniStat label="System" value="Kein Backend. Kein Deployment." />
      </div>
    </Card>
  );
}

function OwnerVoice({
  setVoiceMode,
  navigate,
  registerDemoAction,
}: {
  setVoiceMode: (mode: string) => void;
  navigate: (next: string) => void;
  registerDemoAction: (title: string) => void;
}) {
  return (
    <main className="grid gap-6 xl:grid-cols-[1fr_520px]">
      <Card>
        <SectionTitle eyebrow="Sprachsteuerung" title="Mit NOX sprechen" subtitle="Push-to-talk, Transkript, Projekt-Kontext, Entwürfe, Freigabe-Gate, Ausführung." />
        <div className="mt-8 flex flex-wrap gap-4">
          <Button onClick={() => { setVoiceMode('Demo aktiv'); registerDemoAction('Sprach-Demo gestartet'); }}>Push-to-talk simulieren</Button>
          <Button tone="ghost" onClick={() => navigate('Quest-Generator')}>Quest-Generator oeffnen</Button>
          <Button tone="red" onClick={() => registerDemoAction('Owner Voice bleibt im Demo-Modus')}>Demo-Modus bestätigen</Button>
        </div>
      </Card>
      <Card>
        <SectionTitle eyebrow="Sicherheit" title="Kein Blindflug" />
        <div className="mt-6 space-y-4">
          <MiniStat label="Verantwortung" value="Nur der Owner darf Kern-Agenten per Sprache steuern." />
          <MiniStat label="Gate" value="Keine System-Auswirkungen ohne Freigabe." />
          <MiniStat label="Infrastruktur" value="WLAN, STT, TTS und LLM später als isolierter MVP." />
        </div>
      </Card>
    </main>
  );
}

function QuestGenerator({
  selectedProjectId,
  setSelectedProjectId,
  projectDrafts,
  setProjectDrafts,
  addMilestone,
}: {
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  projectDrafts: QuestDraft[];
  setProjectDrafts: Dispatch<SetStateAction<QuestDraft[]>>;
  addMilestone: (project: string, type: string, title: string, description: string) => void;
}) {
  const [input, setInput] = useState('Ich will YouTube-Videos transkribieren, Creator-Muster analysieren und daraus Content-Playbooks plus Quests erzeugen.');
  const [loading, setLoading] = useState(false);
  const draftsForProject = projectDrafts.filter((draft) => draft.project === selectedProjectId);

  async function handleGenerate() {
    if (!input.trim()) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const generated: QuestDraft[] = [
      { id: `DRAFT-${Date.now()}-1`, title: 'Transkriptions-Pipeline aufsetzen', project: selectedProjectId, agent: 'Project X', prio: 'Hoch', summary: 'Workflow-Draft für YouTube-Link zu Transkript zu Insight vorbereiten.' },
      { id: `DRAFT-${Date.now()}-2`, title: 'Creator-Muster Analyse', project: selectedProjectId, agent: 'NOX', prio: 'Normal', summary: 'Prompt-Template für Hooks, Patterns und Content-Playbooks erstellen.' },
      { id: `DRAFT-${Date.now()}-3`, title: 'Quest-Erstellung vorbereiten', project: selectedProjectId, agent: 'NOX Agent', prio: 'Kritisch', summary: 'Erkannte Playbooks in strukturierte Quest-Drafts umwandeln.' },
    ];
    setProjectDrafts((current) => [...generated, ...current]);
    addMilestone(selectedProjectId, 'Quest', '3 Quest-Entwürfe generiert', input);
    setLoading(false);
  }

  return (
    <main className="grid gap-8 xl:grid-cols-[1fr_520px]">
      <Card>
        <SectionTitle eyebrow="Idee zu Quests" title="Quest-Generator" />
        <div className="mb-6 mt-6">
          <FieldLabel>Ziel-Projekt auswählen</FieldLabel>
          <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} className="w-full rounded-2xl border border-[#4a101b]/60 bg-[#120609] p-4 text-base font-bold text-[#fff7fb] outline-none focus:border-[#7a1526]/80">
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.id} - {project.name}</option>
            ))}
          </select>
        </div>
        <textarea value={input} onChange={(event) => setInput(event.target.value)} className="min-h-[180px] w-full resize-none rounded-2xl border border-[#4a101b]/60 bg-[#120609] p-5 text-base font-semibold leading-8 text-[#fff7fb] outline-none focus:border-[#7a1526]" placeholder="Beschreibe deine Idee oder das Problem..." />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={handleGenerate} disabled={loading}>{loading ? 'Strukturiere...' : 'Entwürfe erzeugen'}</Button>
        </div>
      </Card>
      <Card>
        <SectionTitle eyebrow="Entwürfe" title="Generiert" />
        <div className="mt-6 space-y-4">
          {draftsForProject.length > 0 ? draftsForProject.map((draft) => (
            <div key={draft.id} className="rounded-2xl border border-[#4a101b]/60 bg-black/40 p-5">
              <div className="text-lg font-black text-[#fff7fb]">{draft.title}</div>
              <div className="mt-2 text-sm font-bold text-[#eadbe2]">Agent: {draft.agent} - Prio: {draft.prio}</div>
              <div className="mt-3 text-sm font-semibold leading-6 text-[#9f8d95]">{draft.summary}</div>
            </div>
          )) : <div className="rounded-2xl border border-[#4a101b]/40 bg-[#120609]/40 p-5 text-center text-sm font-semibold text-[#9f8d95]">Noch keine Entwürfe für dieses Projekt generiert.</div>}
        </div>
      </Card>
    </main>
  );
}

function LeadsInbox({ navigate }: { navigate: (next: string) => void }) {
  return (
    <Card>
      <SectionTitle eyebrow="Lead-Eingang" title="Leads nach Status" subtitle="Kanban und Tabelle: Pruefung noetig, Produktfit klären, Pitch bereit, Anruf zuerst." />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {leads.map((lead) => (
          <div key={lead.id} className="rounded-2xl border border-[#4a101b]/60 bg-black/40 p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-black text-[#fff7fb]">{lead.company}</h3>
              <Pill tone={lead.score >= 80 ? 'gold' : 'default'}>{lead.score}</Pill>
            </div>
            <div className="mt-2 text-sm font-bold text-amber-100">{money(lead.value)}</div>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#eadbe2]">{lead.reason}</p>
            <div className="mt-5">
              <Button tone="ghost" onClick={() => navigate('Pitch-Zentrale')}>Pitch vorbereiten</Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PitchCenter({ registerDemoAction }: { registerDemoAction: (title: string) => void }) {
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0].id);
  const [pitch, setPitch] = useState('');
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];

  function generatePitch() {
    const text = `Hallo Team von ${selectedLead.company},\\n\\nwir haben euer Setup geprüft. Der klare Hebel ist: ${selectedLead.reason}.\\n\\nNOX Labs baut daraus eine fokussierte Operator-Struktur statt einer Standard-Lösung. Nächster Schritt: ${selectedLead.next}.\\n\\nBeste Grüße\\nNOX Labs Operator`;
    setPitch(text);
    registerDemoAction(`Pitch für ${selectedLead.company} vorbereitet`);
  }

  return (
    <main className="grid gap-6 xl:grid-cols-[1fr_520px]">
      <Card>
        <SectionTitle eyebrow="Pitch-Zentrale" title="Lead-Engager" />
        <div className="mb-6 mt-6">
          <FieldLabel>Lead auswählen</FieldLabel>
          <select value={selectedLeadId} onChange={(event) => setSelectedLeadId(event.target.value)} className="w-full rounded-2xl border border-[#4a101b]/60 bg-[#120609] p-4 text-base font-bold text-[#fff7fb] outline-none focus:border-[#7a1526]/80">
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>{lead.company} - Score: {lead.score} - {money(lead.value)}</option>
            ))}
          </select>
        </div>
        <Button onClick={generatePitch}>Pitch entwerfen</Button>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <MiniStat label="Grund für Kontakt" value={selectedLead.reason} />
          <MiniStat label="Nächster Schritt" value={selectedLead.next} />
        </div>
      </Card>
      <Card>
        <SectionTitle eyebrow="Entwurf" title="Generierter Text" />
        <textarea value={pitch} onChange={(event) => setPitch(event.target.value)} placeholder="Waehle links einen Lead aus und starte die Generierung..." className="mt-6 min-h-[320px] w-full resize-none rounded-2xl border border-[#4a101b]/60 bg-[#120609] p-5 text-base font-semibold leading-8 text-[#fff7fb] outline-none focus:border-[#7a1526]" />
      </Card>
    </main>
  );
}

// Collapsible wrapper that hides the technical Notion/Auth surface
// from the primary work flow. Operators who want it can expand it on
// demand. Defaults to closed so the project page reads as work-first.
function ExtendedContextSection({ projectCode }: { projectCode: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="!p-5 md:!p-6">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-[#9f8d95]">Erweiterter Kontext</div>
          <div className="mt-1 text-sm font-bold text-[#eadbe2]">
            Projektkontext wird später aus Notion geladen. Phase 1: Demo-Kontext lokal.
          </div>
        </div>
        <span className="text-xs font-black text-amber-200/80">{open ? 'Einklappen ▲' : 'Aufklappen ▼'}</span>
      </button>
      {open ? (
        <div className="mt-5">
          <LiveProjectContext projectId={projectCode} />
        </div>
      ) : null}
    </Card>
  );
}

// APP-X-BRIDGE-05a — Live Projektkontext loader card.
//
// Read-only consumer of GET /api/operator/projects/:projectId/context.
// The operator API key lives ONLY in this component's React state for
// the current page-session. There is no persistence (no localStorage,
// no sessionStorage, no cookie, no env-baked key). Reload empties the
// state. The key never lands in console.log nor in any rendered surface.
//
// No auto-fetch on mount — the operator must click "Kontext laden".
// All UI labels stay in German per the cockpit's existing copy.
type LiveContextStateData = {
  loadedAt: string;
  data: ProjectContextResponse;
};

type LiveContextStateError = {
  status: number;
  errorCode?: string;
  errorMessage?: string;
  diagnostic?: NotionUpstreamDiagnostic;
  loadedAt: string;
};

// APP-X-UI-01 — Compact loader: collapsible auth, controlled projectId.
// The project id flows in from the parent Projekte page's project picker
// so the operator does not retype it. Auth remains entirely in component
// state for the page-session (no persistence).
function LiveProjectContext({ projectId }: { projectId: string }) {
  const [apiKey, setApiKey] = useState<string>('');
  const [authOpen, setAuthOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultData, setResultData] = useState<LiveContextStateData | null>(null);
  const [resultError, setResultError] = useState<LiveContextStateError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasKey = apiKey.trim().length > 0;
  const hasResult = resultData !== null || resultError !== null;
  const canLoad = hasKey && projectId.trim().length > 0 && !isLoading;

  const handleLoad = async () => {
    if (!hasKey || projectId.trim().length === 0) {
      setAuthOpen(true);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setResultData(null);
    setResultError(null);
    const result = await fetchOperatorProjectContext({
      projectId,
      apiKey,
      signal: controller.signal,
    });
    if (abortRef.current !== controller) return;
    abortRef.current = null;
    const stamp = new Date().toISOString();
    if (result.ok) {
      setResultData({ loadedAt: stamp, data: result.data });
    } else {
      setResultError({
        status: result.status,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        diagnostic: result.diagnostic,
        loadedAt: stamp,
      });
    }
    setIsLoading(false);
  };

  const handleClearKey = () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = null;
    setApiKey('');
  };

  return (
    <div className="rounded-2xl border border-[#3a0c14]/60 bg-[#0c0506]/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-[#9f8d95]">Projekt-Kontext (Entwickler)</div>
          <h3 className="mt-1 text-base font-black leading-tight text-[#fff7fb]">Demo-Kontext lokal · Phase 1</h3>
          <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f6f76]">
            Projekt-ID <span className="text-[#eadbe2]">{projectId || '—'}</span>
          </div>
        </div>
        {resultData ? <Pill>Geladen {new Date(resultData.loadedAt).toLocaleTimeString('de-DE')}</Pill> : null}
      </div>

      {/* Primary actions row: load + reload + auth toggle. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={handleLoad} disabled={!canLoad}>
          {isLoading ? 'Lädt…' : hasResult ? 'Neu laden' : 'Kontext laden'}
        </Button>
        <Button
          tone="secondary"
          onClick={() => setAuthOpen((open) => !open)}
        >
          {authOpen ? 'Entwickler-Auth ausblenden' : hasKey ? 'Entwickler-Auth (Key gesetzt)' : 'Entwickler-Auth einblenden'}
        </Button>
        {hasKey ? (
          <Button tone="ghost" onClick={handleClearKey} disabled={isLoading}>
            Key löschen
          </Button>
        ) : null}
      </div>

      {/* Collapsible auth panel. Closed by default to save vertical space. */}
      {authOpen ? (
        <div className="mt-4 rounded-2xl border border-[#4a101b]/55 bg-[#0c0507]/65 p-4">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#9f8d95]">
            Operator-Auth (nur Page-Session)
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-[#9f8d95]">
            Key landet nur im React-State. Kein Storage, kein Cookie, kein Env-Bake. Beim Reload ist er weg.
          </p>
          <div className="mt-3">
            <FieldLabel>Operator API Key</FieldLabel>
            <input
              type="password"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="x-nox-operator-key"
              className="w-full rounded-2xl border border-[#4a101b]/60 bg-[#120609]/70 px-4 py-2.5 text-sm font-extrabold tracking-wide text-[#fff7fb] outline-none transition focus:border-amber-300/60"
            />
          </div>
        </div>
      ) : null}

      {/* Body: state-driven, compact spacing. */}
      <div className="mt-5">
        {isLoading ? (
          <div className="rounded-2xl border border-[#4a101b]/55 bg-[#120609]/60 p-4 text-sm font-bold text-[#eadbe2]">
            Lade Projektkontext (read-only)…
          </div>
        ) : null}

        {resultError ? <LiveContextErrorView error={resultError} /> : null}
        {resultData ? <LiveContextDataView data={resultData.data} /> : null}

        {!isLoading && !resultData && !resultError ? (
          <div className="rounded-2xl border border-[#4a101b]/35 bg-[#0c0507]/55 p-4 text-[13px] font-semibold leading-6 text-[#9f8d95]">
            {hasKey ? (
              <>Noch nichts geladen. <b className="text-[#eadbe2]">Kontext laden</b> klicken.</>
            ) : (
              <>Noch nichts geladen. Erst <b className="text-[#eadbe2]">Entwickler-Auth einblenden</b>, Key einsetzen, dann <b className="text-[#eadbe2]">Kontext laden</b>.</>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LiveContextErrorView({ error }: { error: LiveContextStateError }) {
  const isUnauthorized = error.status === 401;
  const isNotionNotConfigured = error.status === 503 && error.errorCode === 'notion_not_configured';
  const isMappingNotConfigured = error.status === 503 && error.errorCode === 'project_mapping_not_configured';
  const isProjectNotFound = error.status === 404 && error.errorCode === 'project_not_found';
  const isUpstream = error.status === 502 && error.errorCode === 'notion_upstream_error';

  let headline = `HTTP ${error.status}${error.errorCode ? ` · ${error.errorCode}` : ''}`;
  let description = error.errorMessage ?? 'Unbekannter Fehler.';
  if (isUnauthorized) {
    headline = 'Unauthorized';
    description = 'Operator Key fehlt oder ist falsch.';
  } else if (isNotionNotConfigured) {
    headline = 'Notion Adapter nicht konfiguriert';
    description = error.errorMessage ?? 'Server-Env fehlt — siehe Operator-Dokumentation.';
  } else if (isMappingNotConfigured) {
    headline = 'Project Mapping nicht konfiguriert';
    description = error.errorMessage ?? 'Server-Env NOX_PROJECTS_DB_ID fehlt.';
  } else if (isProjectNotFound) {
    headline = 'Project ID nicht gefunden';
    description = error.errorMessage ?? 'Kein Notion-Eintrag mit dieser Project ID.';
  }

  return (
    <div className="rounded-2xl border border-red-500/35 bg-red-500/8 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[12px] font-extrabold uppercase tracking-[0.24em] text-red-200/80">Fehler</div>
        <Pill tone="red">{`HTTP ${error.status || '?'}`}</Pill>
      </div>
      <h4 className="mt-3 text-lg font-black text-red-100">{headline}</h4>
      <p className="mt-2 text-sm font-semibold leading-6 text-red-100/85">{description}</p>

      {isUpstream && error.diagnostic ? (
        <div className="mt-4 rounded-2xl border border-red-500/25 bg-[#120609]/70 p-4">
          <div className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-red-200/75">Notion Upstream Diagnostic</div>
          <dl className="mt-3 grid gap-3 text-sm font-semibold leading-6 text-[#eadbe2] md:grid-cols-2">
            <div>
              <dt className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#9f8d95]">step</dt>
              <dd className="mt-1 text-[#fff7fb]">{error.diagnostic.step}</dd>
            </div>
            {typeof error.diagnostic.upstreamStatus === 'number' ? (
              <div>
                <dt className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#9f8d95]">upstreamStatus</dt>
                <dd className="mt-1 text-[#fff7fb]">{error.diagnostic.upstreamStatus}</dd>
              </div>
            ) : null}
            {error.diagnostic.upstreamCode ? (
              <div>
                <dt className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#9f8d95]">upstreamCode</dt>
                <dd className="mt-1 text-[#fff7fb]">{error.diagnostic.upstreamCode}</dd>
              </div>
            ) : null}
            {error.diagnostic.upstreamMessage ? (
              <div className="md:col-span-2">
                <dt className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#9f8d95]">upstreamMessage</dt>
                <dd className="mt-1 text-[#fff7fb]">{error.diagnostic.upstreamMessage}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </div>
  );
}

function LiveContextField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#9f8d95]">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#fff7fb]">{value}</dd>
    </div>
  );
}

function LiveContextDataView({ data }: { data: ProjectContextResponse }) {
  const meta = data.meta ?? {};
  const project = data.project;
  const questCount = data.quests?.length ?? 0;
  const approvalCount = data.openApprovals?.length ?? 0;
  const blockerCount = data.blockers?.length ?? 0;
  const eventCount = data.recentEvents?.length ?? 0;
  const artifactCount = data.artifacts?.length ?? 0;

  return (
    <div className="space-y-5">
      {/* A — Command summary row: 6 compact stats. */}
      <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3 lg:grid-cols-6">
        <LiveStatTile label="Status" value={project.status ?? '—'} tone={project.status ? 'gold' : 'default'} />
        <LiveStatTile label="Typ" value={project.typ ?? '—'} />
        <LiveStatTile label="Priority" value={project.priority ?? '—'} />
        <LiveStatTile label="Quests" value={String(questCount)} tone="gold" />
        <LiveStatTile label="Freigaben" value={String(approvalCount)} tone={approvalCount > 0 ? 'red' : 'default'} />
        <LiveStatTile label="execute" value={meta.liveExecution ?? '?'} tone={meta.liveExecution === 'locked' ? 'red' : 'default'} />
      </div>

      {data.contextSummary ? (
        <p className="text-sm font-semibold leading-6 text-[#eadbe2]">{data.contextSummary}</p>
      ) : null}

      {/* E — Open approvals first when >0: red warning band before everything else. */}
      {approvalCount > 0 ? (
        <div className="rounded-2xl border border-red-500/35 bg-red-500/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-red-200/85">Entscheidung nötig</div>
              <div className="mt-1 text-sm font-black text-red-100">
                {approvalCount} {approvalCount === 1 ? 'Freigabe braucht Entscheidung' : 'Freigaben brauchen Entscheidung'}
              </div>
            </div>
            <Pill tone="red">{approvalCount}</Pill>
          </div>
          <ul className="mt-3 space-y-2">
            {data.openApprovals.map((approval) => (
              <li key={`apr-${approval.questId}`} className="rounded-xl border border-red-500/25 bg-[#120609]/70 p-3">
                <div className="text-[13px] font-black leading-snug text-[#fff7fb]">{approval.title}</div>
                <p className="mt-1 text-[12px] font-semibold leading-5 text-red-100/85">
                  {approval.reason.slice(0, 160)}{approval.reason.length > 160 ? '…' : ''}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* B — Next Action Panel: nextAction + currentState + allowed/forbidden cols. */}
      {(project.nextAction || project.currentState || project.allowedActions || project.forbiddenActions || project.vision || project.andromedaContext) ? (
        <div className="rounded-2xl border border-amber-300/25 bg-[#120609]/65 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-amber-200/85">Projekt</div>
              <h3 className="mt-1 text-lg font-black leading-tight text-[#fff7fb]">{project.title}</h3>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9f8d95]">{project.projectId}</div>
            </div>
            {project.primaryUrl ? (
              <a
                href={project.primaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber-200 hover:underline"
              >
                In Notion öffnen
              </a>
            ) : null}
          </div>
          <dl className="mt-4 grid gap-4 lg:grid-cols-2">
            <LiveContextField label="Nächste Aktion" value={project.nextAction} />
            <LiveContextField label="Aktueller Stand" value={project.currentState} />
            <LiveContextField label="Vision" value={project.vision} />
            <LiveContextField label="NOX-Agent-Kontext" value={project.andromedaContext} />
          </dl>
          {(project.allowedActions || project.forbiddenActions) ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {project.allowedActions ? (
                <div className="rounded-xl border border-amber-300/25 bg-[#0c0507]/60 p-3">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-200/75">Erlaubt</div>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] font-semibold leading-6 text-[#fff7fb]">{project.allowedActions}</p>
                </div>
              ) : null}
              {project.forbiddenActions ? (
                <div className="rounded-xl border border-red-500/30 bg-[#0c0507]/60 p-3">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-red-200/80">Verboten</div>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] font-semibold leading-6 text-[#fff7fb]">{project.forbiddenActions}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* D — Quests as a compact list/table hybrid. */}
      <div className="rounded-2xl border border-[#4a101b]/55 bg-[#0c0507]/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9f8d95]">Quests · {questCount}</div>
          {blockerCount > 0 ? <Pill tone="red">{`${blockerCount} Blocker`}</Pill> : null}
        </div>
        {questCount === 0 ? (
          <p className="mt-3 text-[13px] font-semibold leading-6 text-[#9f8d95]">Keine Quests verknüpft.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#4a101b]/35">
            {data.quests.map((quest) => (
              <li key={quest.questId} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-black leading-snug text-[#fff7fb]">{quest.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9f8d95]">
                      {quest.agent ? <span>{quest.agent}</span> : null}
                      {quest.lastEditedAt ? <span>{quest.lastEditedAt.slice(0, 10)}</span> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {quest.status ? <Pill>{quest.status}</Pill> : null}
                    {quest.approvalNeeded ? <Pill tone="red">Freigabe</Pill> : null}
                    {quest.approved ? <Pill tone="gold">freigegeben</Pill> : null}
                    {quest.questAbgeschlossen ? <Pill>abgeschlossen</Pill> : null}
                    {quest.url ? (
                      <a
                        href={quest.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-amber-300/30 bg-amber-300/8 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-100 hover:bg-amber-300/15"
                      >
                        Notion
                      </a>
                    ) : null}
                  </div>
                </div>
                {quest.blocker ? (
                  <div className="mt-2 text-[12px] font-semibold leading-5 text-red-100/85">
                    <b className="mr-1 text-red-200">Blocker:</b>
                    {quest.blocker.slice(0, 160)}{quest.blocker.length > 160 ? '…' : ''}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* F — Events: lean timeline. */}
      <div className="rounded-2xl border border-[#4a101b]/45 bg-[#0c0507]/55 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9f8d95]">Events · {eventCount}</div>
        </div>
        {eventCount === 0 ? (
          <p className="mt-2 text-[13px] font-semibold leading-6 text-[#9f8d95]">Keine Events erfasst.</p>
        ) : (
          <ol className="mt-2 space-y-1.5 border-l border-[#4a101b]/50 pl-3">
            {data.recentEvents.slice(0, 8).map((event, idx) => (
              <li key={`evt-${event.questId ?? 'x'}-${idx}`} className="text-[12px] font-semibold leading-5 text-[#eadbe2]">
                <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9f8d95]">
                  {event.at.slice(0, 16).replace('T', ' ')}
                </span>
                {event.summary}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* G — Artifacts empty-state. */}
      <div className="rounded-2xl border border-[#4a101b]/35 bg-[#0c0507]/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9f8d95]">Artefakte · {artifactCount}</div>
        </div>
        <p className="mt-2 text-[13px] font-semibold leading-6 text-[#9f8d95]">
          Noch keine Referenzdateien. Später: Designbilder, Screenshots, Specs, Drive/Miro Links.
        </p>
      </div>
    </div>
  );
}

function LiveStatTile({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'gold' | 'red' }) {
  const ring =
    tone === 'red'
      ? 'border-red-500/35 bg-red-500/8 text-red-100'
      : tone === 'gold'
        ? 'border-amber-300/30 bg-amber-300/8 text-amber-50'
        : 'border-[#4a101b]/55 bg-[#0c0507]/55 text-[#eadbe2]';
  return (
    <div className={cx('rounded-xl border px-3 py-2.5', ring)}>
      <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] opacity-80">{label}</div>
      <div className="mt-0.5 truncate text-[13px] font-black leading-tight">{value}</div>
    </div>
  );
}

function ProjectX({
  quests,
  outputs,
  approvals,
  commands,
  runDryRun,
  requestApproval,
  approveCommand,
  rejectCommand,
  createHandoffSpec,
  openQuest,
}: {
  quests: Quest[];
  outputs: OutputArtifact[];
  approvals: Approval[];
  commands: AndromedaCommand[];
  runDryRun: (commandId: string) => void;
  requestApproval: (commandId: string) => void;
  approveCommand: (commandId: string) => void;
  rejectCommand: (commandId: string) => void;
  createHandoffSpec: (commandId?: string) => void;
  openQuest: (questId: string) => void;
}) {
  const [selectedCommandId, setSelectedCommandId] = useState<string | null>(null);
  const selectedCommand = commands.find((command) => command.id === selectedCommandId);
  const projectXQuests = quests.filter((quest) => quest.project === 'PROJECT-X' || quest.agent === 'Project X');
  const readyQuests = projectXQuests.filter((quest) => quest.status !== 'Erledigt' && quest.status !== 'Blockiert');
  const approvalsNeeded = commands.filter((command) => command.requiresApproval && command.status !== 'Freigegeben' && command.status !== 'Gesperrt').length;
  const openHandoffs = commands.filter((command) => command.status !== 'Erledigt' && command.status !== 'Gesperrt').length;
  const latestDryRun = commands.find((command) => command.dryRunResult);
  const handoffOutputs = outputs.filter((output) => output.outputType === 'Uebergabe-Spec' || output.project === 'PROJECT-X');

  return (
    <main className="space-y-8">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <SectionTitle
          eyebrow="Interne Steuerung"
          title="Project X · Workflowfabrik"
          subtitle="Übergaben, Dry-Runs, Freigaben und Ausführungsplanung für Project X."
        />
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => createHandoffSpec()}>Uebergabe-Spec erzeugen</Button>
          <span title="Gesperrt: echte Ausführung benoetigt Backend-Proxy, Secret-Schutz und explizite Operator-Freigabe.">
            <Button tone="red" disabled>Live-Ausführung starten</Button>
          </span>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <ProjectXStatusCard label="Modus" value="Demo / Dry-Run" tone="gold" />
        <ProjectXStatusCard label="Live-Ausführung" value="Gesperrt" tone="red" note="Backend-Proxy + Freigabe noetig." />
        <ProjectXStatusCard label="Offene Übergaben" value={String(openHandoffs)} />
        <ProjectXStatusCard label="Freigaben noetig" value={String(approvalsNeeded)} tone={approvalsNeeded > 0 ? 'red' : 'gold'} />
        <ProjectXStatusCard label="Bereite Quests" value={String(readyQuests.length)} />
        <ProjectXStatusCard label="Letzter Dry-Run" value={latestDryRun ? latestDryRun.status : 'Noch keiner'} />
      </div>

      <Card className="!border-red-500/30 !bg-red-500/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[12px] font-extrabold uppercase tracking-[0.24em] text-red-200/80">Sicherheitszustand</div>
            <p className="mt-3 text-base font-bold leading-7 text-red-100">
              Live-Ausführung ist gesperrt. Echte Jobs brauchen Backend-Proxy, Secret-Schutz und explizite Operator-Freigabe.
            </p>
          </div>
          <Pill tone="red">Keine Browser-Calls</Pill>
        </div>
      </Card>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-8">
          <Card>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <SectionTitle eyebrow="NOX Agent" title="Command Queue" />
              <Pill tone="gold">{commands.length}</Pill>
            </div>

            <div className="space-y-4">
              {commands.map((command) => (
                <CommandCard
                  key={command.id}
                  command={command}
                  quest={command.questId ? quests.find((quest) => quest.id === command.questId) : undefined}
                  runDryRun={runDryRun}
                  requestApproval={requestApproval}
                  approveCommand={approveCommand}
                  rejectCommand={rejectCommand}
                  createHandoffSpec={createHandoffSpec}
                  inspect={() => setSelectedCommandId(command.id)}
                />
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <SectionTitle eyebrow="Bereitstellung" title="Bereitstehende Quests" />
              <Pill tone="gold">{readyQuests.length}</Pill>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {readyQuests.map((quest) => (
                <button
                  key={quest.id}
                  type="button"
                  onClick={() => openQuest(quest.id)}
                  className="rounded-2xl border border-[#4a101b]/60 bg-[#120609]/70 p-5 text-left transition hover:border-amber-300/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-200/75">{quest.code}</div>
                      <h3 className="mt-2 text-lg font-black text-[#fff7fb]">{quest.title}</h3>
                    </div>
                    <Pill tone={quest.active ? 'gold' : 'default'}>{questStatus(quest)}</Pill>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#eadbe2]">{quest.goal}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <IntegrationStatus />

          <Card>
            <SectionTitle eyebrow="Freigabe-Gate" title="Offene Freigaben" />
            <div className="mt-5 space-y-3">
              {approvals.filter((approval) => approval.project === 'PROJECT-X' || approval.commandId).length > 0 ? (
                approvals.filter((approval) => approval.project === 'PROJECT-X' || approval.commandId).map((approval) => (
                  <div key={approval.id} className="rounded-2xl border border-red-500/25 bg-[#120609]/70 p-4">
                    <div className="text-sm font-black text-red-100">{approval.title}</div>
                    <div className="mt-2 text-xs font-bold text-[#eadbe2]">{approval.status} - Risiko: {approval.risk}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm font-bold text-amber-50">
                  Keine offenen Project-X-Freigaben.
                </div>
              )}
            </div>
          </Card>

          <Card>
            <SectionTitle eyebrow="Outputs" title="Uebergabe-Specs" />
            <div className="mt-5 space-y-3">
              {handoffOutputs.slice(0, 5).map((output) => (
                <div key={output.id} className="rounded-2xl border border-[#4a101b]/60 bg-[#120609]/70 p-4">
                  <div className="text-sm font-black text-[#fff7fb]">{output.title}</div>
                  <div className="mt-1 text-xs font-bold text-[#9f8d95]">{output.outputType} - {output.version}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle eyebrow="Dry-Runs" title="Letzte Ergebnisse" />
            <div className="mt-5 space-y-3">
              {commands.filter((command) => command.dryRunResult).slice(0, 3).map((command) => (
                <div key={command.id} className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <div className="text-sm font-black text-amber-50">{command.title}</div>
                  <p className="mt-2 text-xs font-bold leading-5 text-[#eadbe2]">{command.dryRunResult?.recommendedNextAction}</p>
                </div>
              ))}
              {!commands.some((command) => command.dryRunResult) ? (
                <div className="text-sm font-bold text-[#9f8d95]">Noch kein Dry-Run erzeugt.</div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <SectionTitle eyebrow="Workflowfabrik" title="Vorbereitete Workflow-Zonen" />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {workflowItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[#4a101b]/60 bg-[#120609]/70 p-5">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-black text-[#fff7fb]">{item.title}</h3>
                <Pill tone={item.risk === 'Hoch' ? 'red' : 'gold'}>{item.risk}</Pill>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#eadbe2]">{item.text}</p>
            </div>
          ))}
        </div>
      </Card>

      <AnimatePresence>
        {selectedCommand ? (
          <Modal onClose={() => setSelectedCommandId(null)}>
            <SectionTitle eyebrow="Command Detail" title={selectedCommand.title} subtitle={selectedCommand.intent} />
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <MiniStat label="Command Type" value={selectedCommand.commandType} />
              <MiniStat label="Status" value={selectedCommand.status} />
              <MiniStat label="Projekt" value={projectName(selectedCommand.projectId)} />
              <MiniStat label="Risiko" value={selectedCommand.riskLevel} />
            </div>
            <div className="mt-6 rounded-2xl border border-[#4a101b]/60 bg-[#120609]/70 p-5">
              <div className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#9f8d95]">Payload Summary</div>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#eadbe2]">{selectedCommand.payloadSummary}</p>
            </div>
            {selectedCommand.dryRunResult ? <DryRunResultPanel result={selectedCommand.dryRunResult} /> : null}
            <div className="mt-6 space-y-3">
              {selectedCommand.history.map((entry, index) => (
                <div key={`${entry}-${index}`} className="rounded-2xl border border-[#4a101b]/60 bg-black/35 p-4 text-sm font-semibold text-[#eadbe2]">{entry}</div>
              ))}
            </div>
            <div className="mt-7 flex justify-end">
              <Button onClick={() => setSelectedCommandId(null)}>Schließen</Button>
            </div>
          </Modal>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function ProjectXStatusCard({
  label,
  value,
  tone = 'default',
  note,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'gold' | 'red';
  note?: string;
}) {
  const className =
    tone === 'red'
      ? 'border-red-500/35 bg-red-500/10 text-red-100'
      : tone === 'gold'
        ? 'border-amber-300/35 bg-amber-300/10 text-amber-50'
        : 'border-[#4a101b]/60 bg-[#120609]/70 text-[#fff7fb]';

  return (
    <div className={cx('rounded-2xl border p-4', className)}>
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9f8d95]">{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
      {note ? <p className="mt-2 text-xs font-bold leading-5 text-[#eadbe2]">{note}</p> : null}
    </div>
  );
}

function CommandCard({
  command,
  quest,
  runDryRun,
  requestApproval,
  approveCommand,
  rejectCommand,
  createHandoffSpec,
  inspect,
}: {
  command: AndromedaCommand;
  quest?: Quest;
  runDryRun: (commandId: string) => void;
  requestApproval: (commandId: string) => void;
  approveCommand: (commandId: string) => void;
  rejectCommand: (commandId: string) => void;
  createHandoffSpec: (commandId?: string) => void;
  inspect: () => void;
}) {
  const locked = command.status === 'Gesperrt';

  return (
    <div className={cx('rounded-2xl border bg-[#120609]/72 p-5', command.status === 'Freigegeben' ? 'border-amber-300/45 shadow-[0_0_34px_rgba(245,158,11,0.12)]' : locked ? 'border-red-500/35' : 'border-[#4a101b]/60')}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Pill tone={command.status === 'Gesperrt' ? 'red' : command.status === 'Freigegeben' ? 'gold' : 'default'}>{command.status}</Pill>
            <Pill tone={command.riskLevel === 'Hoch' ? 'red' : 'gold'}>{command.riskLevel}</Pill>
            {command.requiresApproval ? <Pill tone="red">Freigabe noetig</Pill> : null}
          </div>
          <h3 className="mt-4 text-xl font-black text-[#fff7fb]">{command.title}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#eadbe2]">{command.intent}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniStat label="Projekt" value={projectName(command.projectId)} />
            <MiniStat label="Quest" value={quest?.code ?? 'Optional'} />
            <MiniStat label="Erstellt" value={command.createdAt} />
          </div>
        </div>
        <div className="flex min-w-[220px] flex-col gap-2">
          <Button onClick={() => runDryRun(command.id)}>Dry-Run starten</Button>
          <Button tone="secondary" onClick={() => createHandoffSpec(command.id)}>Uebergabe-Spec erzeugen</Button>
          <Button tone="ghost" onClick={() => requestApproval(command.id)}>Freigabe anfordern</Button>
          <div className="grid grid-cols-2 gap-2">
            <Button className="!px-3 !py-2 !text-xs" onClick={() => approveCommand(command.id)}>Freigeben</Button>
            <Button tone="red" className="!px-3 !py-2 !text-xs" onClick={() => rejectCommand(command.id)}>Ablehnen</Button>
          </div>
          <Button tone="ghost" onClick={inspect}>Details pruefen</Button>
        </div>
      </div>

      {command.dryRunResult ? <DryRunResultPanel result={command.dryRunResult} compact /> : null}
    </div>
  );
}

function DryRunResultPanel({ result, compact = false }: { result: DryRunResult; compact?: boolean }) {
  return (
    <div className={cx('rounded-2xl border border-amber-300/25 bg-amber-300/10 p-5', compact ? 'mt-5' : 'mt-6')}>
      <div className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-amber-200/80">Dry-Run Ergebnis</div>
      <p className="mt-3 text-sm font-bold leading-6 text-amber-50">{result.summary}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#eadbe2]">{result.estimatedImpact}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <MiniStat label="Inputs" value={result.requiredInputs.join(', ')} />
        <MiniStat label="Fehlende Artefakte" value={result.missingArtifacts.join(', ')} />
      </div>
      <div className="mt-4 rounded-xl border border-[#4a101b]/60 bg-black/35 p-4 text-sm font-bold leading-6 text-[#fff7fb]">
        {result.recommendedNextAction}
      </div>
    </div>
  );
}

function IntegrationStatus() {
  const rows = [
    ['Frontend Demo-State', 'Aktiv'],
    ['NOX-Agent-API', 'Nicht verbunden'],
    ['Backend-Proxy', 'Fehlt'],
    ['Secret-Schutz', 'Fehlt'],
    ['Live-Ausführung', 'Gesperrt'],
    ['Backend-Spec', 'docs/operator-cockpit-andromeda-bridge-spec.md'],
  ];

  return (
    <Card>
      <SectionTitle eyebrow="Sicherheit" title="Integrationsstatus" />
      <p className="mt-5 text-sm font-semibold leading-6 text-[#eadbe2]">
        Direkte Browser-Verbindung zum NOX Agent ist absichtlich deaktiviert. Der echte Anschluss muss über einen serverseitigen Proxy mit HMAC/Secret-Schutz erfolgen.
      </p>
      <div className="mt-5 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-[#4a101b]/60 bg-[#120609]/70 p-4">
            <span className="text-sm font-bold text-[#eadbe2]">{label}</span>
            <Pill tone={value === 'Aktiv' ? 'gold' : 'red'}>{value}</Pill>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProjectXSummary({ commands }: { commands: AndromedaCommand[] }) {
  const openCommands = commands.filter((command) => command.status !== 'Erledigt' && command.status !== 'Gesperrt');
  const dryRuns = commands.filter((command) => command.dryRunResult).length;
  const approvalsNeeded = commands.filter((command) => command.requiresApproval && command.status !== 'Freigegeben').length;

  return (
    <Card className="!border-amber-300/30 !bg-amber-300/10">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <SectionTitle eyebrow="Project X" title="Workflowfabrik-Steuerung" subtitle="Kurzstatus für Project-X-Commands. Hauptsteuerung bleibt im Project-X-Screen." />
        <Pill tone="gold">Dry-Run only</Pill>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat label="Offene Commands" value={String(openCommands.length)} />
        <MiniStat label="Dry-Runs" value={String(dryRuns)} />
        <MiniStat label="Freigabe-Gate" value={approvalsNeeded > 0 ? `${approvalsNeeded} offen` : 'OK'} />
      </div>
    </Card>
  );
}

// PROJECT-X-UI-02 — Workflow-Fabrik demo section.
//
// Mounted from `ProjectsDeepDive` only when the picked project is
// PROJECT-X. All data is mock (from `src/data/projectXFactoryDemo.ts`).
// No fetches, no Notion/Drive/n8n calls, no mutation handlers.
// Operator-facing buttons (approve / promote / save setup) are `disabled`
// so the section visually communicates Phase 1 ("UI/IA only") without
// allowing accidental writes.
function WorkflowFactorySection() {
  const totalWorkflows = FACTORY_WORKFLOWS.length;
  const totalModules = FACTORY_MODULES.length;
  const runningExperiments = 1; // single demo experiment in Phase 1
  const lockedApprovals = 1;    // single demo approval card

  return (
    <div className="space-y-5">
      {/* Section header */}
      <Card className="!p-5 md:!p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-amber-200/85">Project X</div>
            <h2 className="mt-1 text-2xl font-black leading-tight text-[#fff7fb] md:text-3xl">Workflow-Fabrik</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#eadbe2]">
              Workflows analysieren, modularisieren, testen und als verkaufbare Automation-Produkte weiterentwickeln.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="gold">Demo / read-only</Pill>
            <Pill tone="red">execute locked</Pill>
            <Pill>Phase 1</Pill>
          </div>
        </div>

        {/* KPI tiles row. */}
        <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <FactoryKpiTile label="Demo Workflows" value={String(totalWorkflows)} tone="gold" />
          <FactoryKpiTile label="Product Modules" value={String(totalModules)} />
          <FactoryKpiTile label="Running Experiments" value={String(runningExperiments)} tone="gold" />
          <FactoryKpiTile label="Locked Approvals" value={String(lockedApprovals)} tone="red" />
        </div>
      </Card>

      {/* A — Workflow Catalog */}
      <FactoryWorkflowCatalog />

      {/* B — Product Modules / AI-Systeme */}
      <FactoryModuleRegistry />

      {/* C — PitchMutation Experiments */}
      <FactoryPitchExperimentCard />

      {/* D — Customer Setup Wizard */}
      <FactoryCustomerSetupWizard />

      {/* E — Drive / ReferenceArtifact Intake */}
      <FactoryDriveIntake />

      {/* F — Dry Runs */}
      <FactoryDryRuns />

      {/* G — Approval Gate */}
      <FactoryApprovalGate />
    </div>
  );
}

function FactoryKpiTile({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'gold' | 'red' }) {
  const ring =
    tone === 'red'
      ? 'border-red-500/35 bg-red-500/8 text-red-100'
      : tone === 'gold'
        ? 'border-amber-300/30 bg-amber-300/8 text-amber-50'
        : 'border-[#4a101b]/55 bg-[#0c0507]/55 text-[#eadbe2]';
  return (
    <div className={cx('rounded-xl border px-3 py-2.5', ring)}>
      <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] opacity-80">{label}</div>
      <div className="mt-0.5 text-xl font-black leading-tight">{value}</div>
    </div>
  );
}

// ---- A) Workflow Catalog -----------------------------------------------------

function FactoryWorkflowCatalog() {
  return (
    <div className="rounded-2xl border border-[#4a101b]/55 bg-[#0c0507]/65 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9f8d95]">Workflow Catalog</div>
          <div className="mt-0.5 text-[13px] font-bold text-[#eadbe2]">
            Inventar der n8n-Workflows · {FACTORY_WORKFLOWS.length} Demo-Einträge
          </div>
        </div>
        <Pill tone="gold">read-only</Pill>
      </div>
      <ul className="mt-3 divide-y divide-[#4a101b]/35">
        {FACTORY_WORKFLOWS.map((wf) => (
          <FactoryWorkflowRow key={wf.workflowId} wf={wf} />
        ))}
      </ul>
    </div>
  );
}

function FactoryWorkflowRow({ wf }: { wf: FactoryWorkflowEntry }) {
  const driftTone: 'default' | 'gold' | 'red' =
    wf.driftStatus === 'synced' ? 'gold' : wf.driftStatus === 'needs-review' ? 'red' : 'default';
  const activityLabel = wf.activity === 'active' ? 'active' : wf.activity === 'inactive' ? 'inactive' : 'mock';
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-black leading-snug text-[#fff7fb]">{wf.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9f8d95]">
            <span>{wf.workflowId}</span>
            <span>{wf.productModule}</span>
            <span>{wf.nodeCount} Nodes</span>
            <span>{wf.lastCheckedLabel}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill>{activityLabel}</Pill>
          <Pill tone={wf.riskLevel === 'Hoch' ? 'red' : wf.riskLevel === 'Mittel' ? 'gold' : 'default'}>
            risk: {wf.riskLevel.toLowerCase()}
          </Pill>
          <Pill tone={driftTone}>{wf.driftStatus}</Pill>
        </div>
      </div>
    </li>
  );
}

// ---- B) Product Modules / AI-Systeme -----------------------------------------

function FactoryModuleRegistry() {
  return (
    <div className="rounded-2xl border border-amber-300/22 bg-[#120609]/55 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-200/80">AI-Systeme · Product Modules</div>
          <div className="mt-0.5 text-[13px] font-bold text-[#eadbe2]">
            Module-Registry · {FACTORY_MODULES.length} Demo-Einträge
          </div>
        </div>
        <Pill tone="gold">read-only</Pill>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {FACTORY_MODULES.map((mod) => (
          <FactoryModuleCard key={mod.moduleId} mod={mod} />
        ))}
      </div>
    </div>
  );
}

function FactoryModuleCard({ mod }: { mod: FactoryModuleEntry }) {
  const statusTone: 'default' | 'gold' | 'red' =
    mod.status === 'sellable' ? 'gold' : mod.status === 'validated' ? 'gold' : mod.status === 'prototype' ? 'default' : 'default';
  return (
    <div className="rounded-2xl border border-[#4a101b]/45 bg-[#0c0507]/60 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-black text-[#fff7fb]">{mod.name}</div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9f8d95]">{mod.moduleId}</div>
        </div>
        <Pill tone={statusTone}>{mod.status}</Pill>
      </div>
      <p className="mt-2 text-[12px] font-semibold leading-5 text-[#eadbe2]">{mod.valueProposition}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9f8d95]">
        <span>Inputs {mod.requiredInputsCount}</span>
        <span>Setup {mod.setupFieldsCount}</span>
        <span>Templates {mod.linkedTemplatesCount}</span>
        <span>risk: {mod.riskLevel.toLowerCase()}</span>
      </div>
    </div>
  );
}

// ---- C) PitchMutation Experiments --------------------------------------------

function FactoryPitchExperimentCard() {
  const exp = FACTORY_PITCH_EXPERIMENT;
  const winner = exp.variants.find((v) => v.variantId === exp.winnerCandidateId);
  return (
    <div className="rounded-2xl border border-amber-300/25 bg-[#120609]/65 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-200/85">PitchMutation Experiment</div>
          <h3 className="mt-1 text-lg font-black leading-tight text-[#fff7fb]">{exp.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9f8d95]">
            <span>{exp.templateId}</span>
            <span>slot: {exp.slot}</span>
            <span>primary: {exp.primaryMetric}</span>
            <span>min n: {exp.minimumSampleSize}</span>
            <span>{exp.startedLabel}</span>
          </div>
        </div>
        {winner ? <Pill tone="gold">Winner-Candidate: {winner.label.split(' — ')[0]}</Pill> : null}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {exp.variants.map((variant) => (
          <FactoryPitchVariantCard
            key={variant.variantId}
            variant={variant}
            isWinnerCandidate={variant.variantId === exp.winnerCandidateId}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/25 bg-[#0c0507]/60 p-3">
        <p className="text-[12px] font-semibold leading-5 text-[#eadbe2]">
          Promotion zur neuen Default-Variante nur mit Operator-Freigabe.
        </p>
        <Button tone="gold" disabled>
          Als Gewinner übernehmen — locked
        </Button>
      </div>
    </div>
  );
}

function FactoryPitchVariantCard({ variant, isWinnerCandidate }: { variant: FactoryPitchVariant; isWinnerCandidate: boolean }) {
  const border = isWinnerCandidate ? 'border-amber-300/55 bg-amber-300/8' : 'border-[#4a101b]/55 bg-[#0c0507]/60';
  return (
    <div className={cx('rounded-2xl border p-3', border)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-black leading-snug text-[#fff7fb]">{variant.label}</div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9f8d95]">{variant.hookKind}</div>
        </div>
        <Pill tone={variant.status === 'winner-candidate' ? 'gold' : 'default'}>{variant.status}</Pill>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-semibold leading-5 text-[#eadbe2]">
        <dt className="text-[#9f8d95]">sample</dt><dd className="text-right">{variant.sampleSize}</dd>
        <dt className="text-[#9f8d95]">reply %</dt><dd className="text-right">{variant.replyRatePct.toFixed(1)}</dd>
        <dt className="text-[#9f8d95]">pos. reply %</dt><dd className="text-right">{variant.positiveReplyRatePct.toFixed(1)}</dd>
        <dt className="text-[#9f8d95]">booked calls</dt><dd className="text-right">{variant.bookedCalls}</dd>
        <dt className="text-[#9f8d95]">bounce/spam %</dt><dd className="text-right">{variant.bounceOrSpamPct.toFixed(1)}</dd>
        <dt className="text-[#9f8d95]">CPL €</dt><dd className="text-right">{variant.costPerQualifiedLead}</dd>
        <dt className="text-[#9f8d95]">time-to-reply h</dt><dd className="text-right">{variant.timeToFirstReplyHours.toFixed(1)}</dd>
      </dl>
    </div>
  );
}

// ---- D) Customer Setup Wizard ------------------------------------------------

function FactoryCustomerSetupWizard() {
  return (
    <div className="rounded-2xl border border-[#4a101b]/55 bg-[#0c0507]/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9f8d95]">Customer Setup Wizard</div>
          <div className="mt-0.5 text-[13px] font-bold text-[#eadbe2]">Demo: Leadgen Template</div>
        </div>
        <Pill>Demo / disabled</Pill>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {FACTORY_LEADGEN_SETUP_FIELDS.map((field) => (
          <FactorySetupFieldRow key={field.key} field={field} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#4a101b]/55 bg-[#120609]/60 p-3">
        <p className="text-[12px] font-semibold leading-5 text-[#9f8d95]">
          Setup-Felder sind read-only Demo. Credentials werden später als Server-Refs aufgelöst, nie im Frontend.
        </p>
        <Button tone="gold" disabled>
          Workflow-Instanz vorbereiten — locked
        </Button>
      </div>
    </div>
  );
}

function FactorySetupFieldRow({ field }: { field: FactorySetupField }) {
  return (
    <div>
      <FieldLabel>
        {field.label}
        {field.required ? <span className="ml-1 text-red-300">*</span> : null}
        <span className="ml-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#9f8d95]">{field.kind}</span>
      </FieldLabel>
      <input
        type="text"
        value=""
        readOnly
        disabled
        placeholder={field.placeholder}
        className="w-full cursor-not-allowed rounded-2xl border border-[#4a101b]/45 bg-[#0a0405]/70 px-4 py-2.5 text-sm font-bold tracking-wide text-[#9f8d95] opacity-70 outline-none"
      />
      {field.helpText ? (
        <p className="mt-1 text-[10px] font-semibold leading-4 text-[#9f8d95]/80">{field.helpText}</p>
      ) : null}
    </div>
  );
}

// ---- E) Drive / ReferenceArtifact Intake ------------------------------------

function FactoryDriveIntake() {
  return (
    <div className="rounded-2xl border border-[#4a101b]/55 bg-[#0c0507]/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9f8d95]">Drive / ReferenceArtifact Intake</div>
          <div className="mt-0.5 text-[13px] font-bold text-[#eadbe2]">{FACTORY_DRIVE_FILES.length} Demo-Dateien</div>
        </div>
        <Pill>Phase ≥ 7</Pill>
      </div>
      <ul className="mt-3 divide-y divide-[#4a101b]/35">
        {FACTORY_DRIVE_FILES.map((file) => (
          <FactoryDriveRow key={file.refName} file={file} />
        ))}
      </ul>
      <p className="mt-3 text-[12px] font-semibold leading-5 text-[#9f8d95]">
        Drive/ReferenceArtifact Intake ist später server-side. Keine Browser-OAuth, keine Secrets im Frontend.
      </p>
    </div>
  );
}

function FactoryDriveRow({ file }: { file: FactoryDriveFile }) {
  const statusTone: 'default' | 'gold' | 'red' =
    file.status === 'extracted' ? 'gold' : file.status === 'failed' ? 'red' : 'default';
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-black leading-snug text-[#fff7fb]">{file.refName}</div>
          {file.summaryHint ? (
            <div className="mt-1 text-[11px] font-semibold leading-5 text-[#eadbe2]">{file.summaryHint}</div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill>{file.kind}</Pill>
          <Pill tone={statusTone}>{file.status}</Pill>
        </div>
      </div>
    </li>
  );
}

// ---- F) Dry Runs -------------------------------------------------------------

function FactoryDryRuns() {
  return (
    <div className="rounded-2xl border border-[#4a101b]/55 bg-[#0c0507]/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9f8d95]">Dry Runs</div>
          <div className="mt-0.5 text-[13px] font-bold text-[#eadbe2]">{FACTORY_DRY_RUNS.length} Demo-Ergebnisse</div>
        </div>
        <Pill>read-only</Pill>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {FACTORY_DRY_RUNS.map((dr) => (
          <FactoryDryRunCard key={dr.draftId} dr={dr} />
        ))}
      </div>
    </div>
  );
}

function FactoryDryRunCard({ dr }: { dr: FactoryDryRun }) {
  const tone: 'gold' | 'red' = dr.passed ? 'gold' : 'red';
  return (
    <div className={cx(
      'rounded-2xl border p-3',
      dr.passed ? 'border-amber-300/30 bg-[#120609]/55' : 'border-red-500/35 bg-red-500/8',
    )}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13px] font-black text-[#fff7fb]">{dr.templateLabel}</div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9f8d95]">
            {dr.draftId} · Kunde: {dr.customerLabel} · sample {dr.testInputSampleCount}
          </div>
        </div>
        <Pill tone={tone}>{dr.passed ? 'passed' : 'failed'}</Pill>
      </div>
      <p className="mt-2 text-[12px] font-semibold leading-5 text-[#eadbe2]">{dr.expectedOutputSummary}</p>
      {dr.detectedRisks.length > 0 ? (
        <div className="mt-2 rounded-xl border border-red-500/25 bg-red-500/8 p-2.5">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-red-200/80">detected risks</div>
          <ul className="mt-1 space-y-0.5">
            {dr.detectedRisks.map((risk) => (
              <li key={risk} className="text-[12px] font-semibold leading-5 text-red-100/90">• {risk}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {dr.detectedMissingSetupFields.length > 0 ? (
        <div className="mt-2 text-[11px] font-semibold leading-5 text-[#9f8d95]">
          fehlende Setup-Felder: {dr.detectedMissingSetupFields.join(', ')}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9f8d95]">
        {dr.estimatedRunCost ? <span>{dr.estimatedRunCost}</span> : null}
        {dr.estimatedRuntimeLabel ? <span>{dr.estimatedRuntimeLabel}</span> : null}
      </div>
      <div className="mt-3">
        <Button tone="ghost" disabled>
          Erneut dry-runnen — locked
        </Button>
      </div>
    </div>
  );
}

// ---- G) Approval Gate --------------------------------------------------------

function FactoryApprovalGate() {
  const apr = FACTORY_APPROVAL;
  return (
    <div className="rounded-2xl border border-red-500/35 bg-red-500/8 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-red-200/80">Approval Gate</div>
          <h3 className="mt-1 text-lg font-black leading-tight text-[#fff7fb]">{apr.action}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9f8d95]">
            <span>{apr.approvalId}</span>
            <span>{apr.templateId}</span>
            <span>required: {apr.requiredApprover}</span>
          </div>
        </div>
        <Pill tone={apr.risk === 'Hoch' ? 'red' : apr.risk === 'Mittel' ? 'gold' : 'default'}>
          risk: {apr.risk.toLowerCase()}
        </Pill>
      </div>
      <p className="mt-2 text-[13px] font-semibold leading-6 text-red-100/90">{apr.rationale}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button tone="gold" disabled>Approve — locked</Button>
        <Button tone="red" disabled>Reject — locked</Button>
        <Button tone="ghost" disabled>Request changes — locked</Button>
      </div>
      <p className="mt-3 text-[11px] font-semibold leading-5 text-[#9f8d95]">
        Approval persistence kommt später. execute bleibt locked.
      </p>
    </div>
  );
}

// Local quest-series plan step. Editable in the React state of the
// Project Auto Planner panel. Phase 1: persisted only to localStorage,
// never to Notion or any backend.
type AgentOption = 'NOX Agent' | 'Claude' | 'Codex' | 'Manuell';
type PlanStepRating = 'gut' | 'unklar' | 'aendern';

type PlanStep = {
  id: string;
  step: number;
  title: string;
  ziel: string;
  agent: AgentOption;
  output: string;
  risk: 'Niedrig' | 'Mittel' | 'Hoch';
  gate: string;
  reason: string;
  feedback: string;
  rating: PlanStepRating | null;
};

const AGENT_OPTIONS: AgentOption[] = ['NOX Agent', 'Claude', 'Codex', 'Manuell'];

// =============================================================================
// Stateflow-Digest-Fix — pure client-side plan fingerprint.
//
// The Project Auto Planner sends `wireSteps` built from `planSteps` to the
// preview / validate / commit endpoints. The server normalises the payload
// (trim strings, renumber `step` 1..N) and computes a non-cryptographic
// digest. The browser does NOT recompute that exact digest — keeping the
// server as the single source of truth for the on-wire digest — but it DOES
// need its own change-detector so cached preview/validate results can be
// invalidated the instant the operator mutates the local draft.
//
// `computePlanFingerprint` is intentionally simple and pure:
//   - Trim/normalise strings the same way `planDraft.ts:validatePlanDraftPayload`
//     does on the server, so semantically-equivalent edits (e.g. trailing
//     whitespace) don't produce false-positive stale states.
//   - Renumber `step` to 1..N to match server's `renumbered` step.
//   - JSON.stringify a canonical shape so deep equality maps to string
//     equality.
//
// It is NEVER sent over the wire and NEVER used in lieu of the server's
// digest. Its only job is "did the local plan diverge from the last
// validated snapshot?".
// =============================================================================
function computePlanFingerprint(
  projectId: string,
  projectGoal: string,
  planSteps: PlanStep[],
): string {
  const canonical = {
    projectId: projectId.trim(),
    projectGoal: projectGoal.trim(),
    planSteps: planSteps.map((s, idx) => ({
      id: s.id,
      step: idx + 1,
      title: s.title.trim(),
      ziel: s.ziel.trim(),
      agent: s.agent,
      output: s.output.trim(),
      risk: s.risk,
      gate: s.gate.trim(),
      reason: s.reason.trim(),
      feedback: s.feedback.trim(),
      rating: s.rating,
    })),
  };
  return JSON.stringify(canonical);
}

// Pure, rule-based generator. No AI, no API. Picks a small set of
// keyword cues from the operator's goal text and uses them to colour
// the seven base steps. If the goal text is empty we fall back to a
// neutral demo prompt so the UI never shows an empty plan.
function generateLocalPlan(goalRaw: string): PlanStep[] {
  const goal =
    goalRaw.trim().length > 0
      ? goalRaw.trim()
      : 'Demo-Projektziel — Beispiel für lokalen Plan-Entwurf';
  const lower = goal.toLowerCase();
  const mentionsLead = /(lead|sales|outreach|pitch|kund|akquise)/.test(lower);
  const mentionsAgent = /(nox agent|agent|automat|workflow|n8n)/.test(lower);
  const mentionsContent = /(youtube|video|content|creator|hook)/.test(lower);
  const mentionsTest = /(dropshipping|test|experiment|mvp|prototyp)/.test(lower);

  const stamp = Date.now();
  const sid = (n: number) => `step-${stamp}-${n}`;

  const base: Omit<PlanStep, 'feedback' | 'rating'>[] = [
    {
      id: sid(1),
      step: 1,
      title: 'Ziel klären',
      ziel: `Schärfen: „${goal.length > 80 ? goal.slice(0, 77) + '…' : goal}"`,
      agent: 'NOX Agent',
      output: 'Ziel-Kurzformel (1 Satz)',
      risk: 'Niedrig',
      gate: '',
      reason: 'Ohne klares Ziel verzettelt sich jede Quest-Reihe. Schritt 1 macht das Ziel präzise und überprüfbar.',
    },
    {
      id: sid(2),
      step: 2,
      title: 'Kontext sammeln',
      ziel: mentionsContent
        ? 'Relevante Creator/Quellen, Hooks und bestehende Notion-Notizen einsammeln.'
        : 'Bestehende Notion-Kontexte, Outputs und Quests für dieses Ziel zusammenfassen.',
      agent: mentionsContent ? 'Claude' : 'NOX Agent',
      output: 'Kontext-Zusammenfassung',
      risk: 'Niedrig',
      gate: '',
      reason: mentionsContent
        ? 'Content-Themen brauchen reale Creator-/Hook-Referenzen vor jeder Strategie.'
        : 'Vorhandene Notion-Notizen verhindern Doppelarbeit und falsche Annahmen.',
    },
    {
      id: sid(3),
      step: 3,
      title: 'Risiken & Blocker prüfen',
      ziel: mentionsTest
        ? 'Hypothesen-Risiken, Kostenrisiko und Stopp-Kriterien für den Test definieren.'
        : 'Bekannte Blocker, offene Entscheidungen und Risiken priorisieren.',
      agent: 'NOX Agent',
      output: 'Risiko-/Blockerliste',
      risk: 'Mittel',
      gate: 'Operator-Check vor Umsetzung',
      reason: mentionsTest
        ? 'Test-Projekte ohne Stopp-Kriterien laufen länger, als sie sollten.'
        : 'Risiken früh sichtbar machen ist günstiger als Blocker mitten in der Umsetzung.',
    },
    {
      id: sid(4),
      step: 4,
      title: 'Quest-Reihe definieren',
      ziel: mentionsLead
        ? 'Quests für Lead-Erfassung, Qualifikation, Pitch und Conversion abstecken.'
        : 'Konkrete Quest-Folge mit klaren Endzuständen je Schritt abstecken.',
      agent: 'NOX Agent',
      output: 'Quest-Entwurfsliste',
      risk: 'Niedrig',
      gate: 'Operator-Check',
      reason: 'Quests mit klarem Endzustand sind delegierbar; Wischiwaschi-Quests blockieren Agenten.',
    },
    {
      id: sid(5),
      step: 5,
      title: 'Agenten zuweisen',
      ziel: mentionsAgent
        ? 'NOX Agent steuert, Codex implementiert, Claude prüft Sprache/Strategie.'
        : 'Pro Quest verantwortlichen Agent setzen (NOX Agent / Codex / Claude / Manuell).',
      agent: 'NOX Agent',
      output: 'Quest-zu-Agent-Mapping',
      risk: 'Niedrig',
      gate: '',
      reason: 'Klar zugeordnete Bearbeiter verkürzen Übergaben und vermeiden Pingpong.',
    },
    {
      id: sid(6),
      step: 6,
      title: 'Output-Artefakte planen',
      ziel: 'Pro Quest erwartetes Artefakt (Plan, Report, Spec, Code-Änderung) + Speicherort planen.',
      agent: 'NOX Agent',
      output: 'Artefakt-Liste mit Speicherort-Vorschlag',
      risk: 'Niedrig',
      gate: '',
      reason: 'Definierte Artefakte machen Fortschritt sichtbar und verhindern lose Endpunkte.',
    },
    {
      id: sid(7),
      step: 7,
      title: 'Review & Freigabe vorbereiten',
      ziel: 'Übergabe-Spec, offene Freigaben und Reihenfolge der Operator-Klicks vorbereiten.',
      agent: 'NOX Agent',
      output: 'Übergabe-Spec v0.x (Entwurf)',
      risk: 'Mittel',
      gate: 'Operator-Check vor Live-Run',
      reason: 'Vor jedem Live-Run muss der Operator wissen, was er freigibt und mit welchem Risiko.',
    },
  ];
  return base.map((s) => ({ ...s, feedback: '', rating: null }));
}

// Phase-1 local persistence for the Project Auto Planner draft.
// Lives in localStorage under a versioned key so future schemas can
// ignore old drafts cleanly. No API, no Notion, no backend.
const PLAN_DRAFT_KEY = 'nox.projectPlanner.localDraft.v2';

type PlanDraft = {
  projectId: string;
  projectGoal: string;
  planSteps: PlanStep[];
  selectedStepId: string | null;
  updatedAt: string;
};

function isPlanStep(value: unknown): value is PlanStep {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const agentOk = AGENT_OPTIONS.includes(v.agent as AgentOption);
  const ratingOk =
    v.rating === null || v.rating === 'gut' || v.rating === 'unklar' || v.rating === 'aendern';
  return (
    typeof v.id === 'string' &&
    typeof v.step === 'number' &&
    typeof v.title === 'string' &&
    typeof v.ziel === 'string' &&
    agentOk &&
    typeof v.output === 'string' &&
    (v.risk === 'Niedrig' || v.risk === 'Mittel' || v.risk === 'Hoch') &&
    typeof v.gate === 'string' &&
    typeof v.reason === 'string' &&
    typeof v.feedback === 'string' &&
    ratingOk
  );
}

function loadPlanDraftSafely(projectId: string): PlanDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PLAN_DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const p = parsed as Record<string, unknown>;
    if (typeof p.projectId !== 'string' || p.projectId !== projectId) return null;
    if (typeof p.projectGoal !== 'string') return null;
    if (!Array.isArray(p.planSteps) || !p.planSteps.every(isPlanStep)) return null;
    const selected = typeof p.selectedStepId === 'string' ? p.selectedStepId : null;
    const updatedAt = typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString();
    return {
      projectId: p.projectId,
      projectGoal: p.projectGoal,
      planSteps: p.planSteps,
      selectedStepId: selected,
      updatedAt,
    };
  } catch {
    return null;
  }
}

function savePlanDraftSafely(draft: PlanDraft) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PLAN_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Quota/serialization errors are ignored — Phase-1 persistence is
    // best-effort and must never break the cockpit UI.
  }
}

function clearPlanDraftSafely() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PLAN_DRAFT_KEY);
  } catch {
    // ignore — see savePlanDraftSafely
  }
}

function ProjectsDeepDive({
  project,
  selectedProjectId,
  setSelectedProjectId,
  outputs,
  setOutputs,
  approvals,
  setApprovals,
  quests,
  milestones,
  andromedaCommands,
  addMilestone,
  registerDemoAction,
  openQuest,
}: {
  project: Project;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  outputs: OutputArtifact[];
  approvals: Approval[];
  quests: Quest[];
  milestones: Milestone[];
  andromedaCommands: AndromedaCommand[];
  setOutputs: Dispatch<SetStateAction<OutputArtifact[]>>;
  setApprovals: Dispatch<SetStateAction<Approval[]>>;
  addMilestone: (project: string, type: string, title: string, description: string) => void;
  registerDemoAction: (project: string, title: string) => void;
  openQuest: (questId: string) => void;
}) {
  // Phase-1 modal slots for the Operator-Cockpit Projekt-Zentrale. All
  // modals are local-only; none triggers an API call, Notion write,
  // Telegram dispatch, or backend run. `planner` builds a local
  // Quest-Reihen-Entwurf, `approvals` shows a Freigabe-Gate-Vorschau,
  // `outputsViewer` is a read-only categorized list of existing outputs.
  const [modal, setModal] = useState<
    'talk' | 'audit' | 'output' | 'planner' | 'approvals' | 'outputsViewer' | 'apiPreview' | null
  >(null);
  // Phase 2A — local Project Auto Planner API-preview state. The
  // operator API key lives only in this component's memory for the
  // current page session: no localStorage, no cookie, no env bake.
  //
  // Phase 2A/2B Private-Cockpit-Mode: the key field is collapsed by
  // default. When the server returns `meta.authMode === 'private_cockpit_readonly'`
  // the operator never needs to expose the field. The field stays available
  // for installations where the env flag is off.
  const [apiPreviewKey, setApiPreviewKey] = useState<string>('');
  const [apiPreviewKeyVisible, setApiPreviewKeyVisible] = useState<boolean>(false);
  // Phase 2A/2B — technical details are collapsed by default so the modal
  // reads as a status check, not a developer debug screen. The toggle
  // reveals planned mutations, property checks, missing/unsafe lists,
  // issues and warnings together.
  const [technicalDetailsVisible, setTechnicalDetailsVisible] = useState<boolean>(false);
  const [apiPreviewLoading, setApiPreviewLoading] = useState<boolean>(false);
  const [apiPreviewData, setApiPreviewData] = useState<PlanPreviewResponseWire | null>(null);
  const [apiPreviewError, setApiPreviewError] = useState<{
    status: number;
    errorCode?: string;
    errorMessage?: string;
  } | null>(null);
  const apiPreviewAbortRef = useRef<AbortController | null>(null);
  // Phase 2B — schema validation state. Lives inside the same modal so
  // the operator can compare preview vs validate side-by-side. No
  // separate api key — the same `apiPreviewKey` is reused (page-session,
  // never persisted).
  const [apiValidateLoading, setApiValidateLoading] = useState<boolean>(false);
  const [apiValidateData, setApiValidateData] = useState<PlanValidationReportWire | null>(null);
  const [apiValidateError, setApiValidateError] = useState<{
    status: number;
    errorCode?: string;
    errorMessage?: string;
  } | null>(null);
  const apiValidateAbortRef = useRef<AbortController | null>(null);

  // Phase 2D-UI — Commit state. The commit endpoint is hard-locked behind
  // server-side flags (NOX_NOTION_WRITE_ENABLED + NOX_NOTION_WRITE_TOKEN +
  // private-write-mode auth + digest/schema/idempotency). The cockpit UI
  // is intentionally one-click: no confirm-phrase field, no operator-key
  // input. The conscious deliberation lives server-side in the flag(s)
  // the operator has to flip outside the browser session.
  const [commitLoading, setCommitLoading] = useState<boolean>(false);
  const [commitData, setCommitData] = useState<PlanCommitResponseWire | null>(null);
  const [commitError, setCommitError] = useState<{
    status: number;
    errorCode?: string;
    errorMessage?: string;
  } | null>(null);
  const commitAbortRef = useRef<AbortController | null>(null);
  // Phase 2D-UI — Sentinel that fires the background Preview+Validate
  // chain once after `regeneratePlan(...)` produced a new plan. We can't
  // call `handleApiPreview()` inline inside onPlan because the new
  // `planSteps` aren't visible to its closure until the next render. The
  // effect below picks them up and clears the sentinel atomically.
  const [autoTechCheckPending, setAutoTechCheckPending] = useState<boolean>(false);

  // Stateflow-Digest-Fix — snapshot fingerprint that was current at the
  // moment the last successful /plan/validate response landed. Tracks the
  // exact payload the server validated, so subsequent local edits to the
  // plan are detectable on the next render via fingerprint comparison.
  //
  // Used to:
  //   - invalidate apiPreviewData / apiValidateData / commitData /
  //     commitError as soon as the operator mutates the plan
  //   - hard-block the commit button when the local plan no longer
  //     matches the validated snapshot
  //   - surface an explicit "plan changed since last tech-check" warning
  //     in the UI instead of letting the operator hit the server-side
  //     `plan_digest_mismatch` 409
  const [lastValidatedFingerprint, setLastValidatedFingerprint] = useState<string | null>(null);
  // Count of plan steps that were sent in the last successful validate.
  // Used by the UI banner to show "Validate sah X Quests, lokal sind Y"
  // when those diverge between validate and commit click.
  const [lastValidatedStepCount, setLastValidatedStepCount] = useState<number | null>(null);
  const [talkText, setTalkText] = useState('');
  const [outputType, setOutputType] = useState(outputTypes[0]);
  const [outputPrompt, setOutputPrompt] = useState('');
  const [outputDetail, setOutputDetail] = useState<OutputArtifact | null>(null);
  // Project-goal text and editable plan steps live in this component.
  // Persisted to localStorage under `nox.projectPlanner.localDraft.v1`,
  // scoped per project id. Still no API, no Notion, no backend.
  const [projektZiel, setProjektZiel] = useState<string>('');
  const [planSteps, setPlanSteps] = useState<PlanStep[]>(() => generateLocalPlan(''));
  const [plannerSelectedStepId, setPlannerSelectedStepId] = useState<string | null>(null);
  const [restoredAt, setRestoredAt] = useState<string | null>(null);
  const [emptyGoalHint, setEmptyGoalHint] = useState<boolean>(false);
  const [noxTalkInput, setNoxTalkInput] = useState<string>('');
  // Last demo answer — kept so the "Antwort als Anpassungsnotiz übernehmen"
  // action has something to merge into the selected plan step.
  const [noxTalkAnswer, setNoxTalkAnswer] = useState<string>('');
  // Phase 1 UX — scrollable chat history of the local NOX-Demo dialog. Pure
  // local state, no persistence, no API. Resets on modal close.
  const [noxTalkHistory, setNoxTalkHistory] = useState<
    Array<{ role: 'user' | 'demo'; text: string; at: number }>
  >([]);
  // Tracks whether the current state was already hydrated for this
  // project id. We delay persistence until after hydration so the
  // first auto-save does not overwrite the stored draft with a fresh
  // generator output.
  const hydrationProjectIdRef = useRef<string | null>(null);

  // Hydrate from localStorage whenever the active project changes.
  // Falls back to the default generator output when no draft is
  // stored for this project id, or when the stored payload is
  // structurally broken.
  useEffect(() => {
    const draft = loadPlanDraftSafely(project.id);
    if (draft) {
      setProjektZiel(draft.projectGoal);
      setPlanSteps(draft.planSteps);
      setPlannerSelectedStepId(draft.selectedStepId);
      setRestoredAt(draft.updatedAt);
    } else {
      setProjektZiel('');
      setPlanSteps(generateLocalPlan(''));
      setPlannerSelectedStepId(null);
      setRestoredAt(null);
    }
    hydrationProjectIdRef.current = project.id;
  }, [project.id]);

  // Auto-persist on every relevant change, but only after the project
  // has been hydrated to avoid clobbering an existing stored draft
  // with the default generator output during the first render pass.
  useEffect(() => {
    if (hydrationProjectIdRef.current !== project.id) return;
    savePlanDraftSafely({
      projectId: project.id,
      projectGoal: projektZiel,
      planSteps,
      selectedStepId: plannerSelectedStepId,
      updatedAt: new Date().toISOString(),
    });
  }, [project.id, projektZiel, planSteps, plannerSelectedStepId]);

  function deleteLocalDraft() {
    clearPlanDraftSafely();
    setProjektZiel('');
    setPlanSteps(generateLocalPlan(''));
    setPlannerSelectedStepId(null);
    setRestoredAt(null);
  }

  function regeneratePlan(goal: string) {
    const next = generateLocalPlan(goal);
    setPlanSteps(next);
    setPlannerSelectedStepId(next[0]?.id ?? null);
  }

  function resetPlan() {
    setProjektZiel('');
    const next = generateLocalPlan('');
    setPlanSteps(next);
    setPlannerSelectedStepId(null);
  }

  function updateStep(id: string, patch: Partial<PlanStep>) {
    setPlanSteps((curr) => curr.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeStep(id: string) {
    setPlanSteps((curr) => curr.filter((s) => s.id !== id).map((s, idx) => ({ ...s, step: idx + 1 })));
    setPlannerSelectedStepId((sel) => (sel === id ? null : sel));
  }

  function addStep() {
    const id = `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setPlanSteps((curr) => [
      ...curr,
      {
        id,
        step: curr.length + 1,
        title: 'Neuer Schritt',
        ziel: 'Ziel beschreiben…',
        agent: 'NOX Agent',
        output: 'Output beschreiben…',
        risk: 'Niedrig',
        gate: '',
        reason: 'Manuell hinzugefügt — Begründung ergänzen.',
        feedback: '',
        rating: null,
      },
    ]);
    setPlannerSelectedStepId(id);
  }

  function moveStep(id: string, direction: -1 | 1) {
    setPlanSteps((curr) => {
      const idx = curr.findIndex((s) => s.id === id);
      if (idx < 0) return curr;
      const target = idx + direction;
      if (target < 0 || target >= curr.length) return curr;
      const next = curr.slice();
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next.map((s, i) => ({ ...s, step: i + 1 }));
    });
  }

  function copyPlanToClipboard() {
    const text = planSteps
      .map(
        (s) =>
          `${s.step}. ${s.title}\n   Ziel: ${s.ziel}\n   Agent: ${s.agent}\n   Output: ${s.output}\n   Risiko: ${s.risk}\n   Freigabe-Gate: ${s.gate}\n   Status: Entwurf`,
      )
      .join('\n\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(`Projektziel: ${projektZiel || '(Demo)'}\n\n${text}`);
    }
  }

  const projectQuests = useMemo(() => quests.filter((quest) => quest.project === project.id), [quests, project.id]);
  const projectOutputs = useMemo(() => outputs.filter((output) => output.project === project.id), [outputs, project.id]);
  const projectApprovals = useMemo(() => approvals.filter((approval) => approval.project === project.id), [approvals, project.id]);
  const projectMilestones = useMemo(() => milestones.filter((milestone) => milestone.project === project.id), [milestones, project.id]);
  const projectCommands = useMemo(() => andromedaCommands.filter((command) => command.projectId === project.id), [andromedaCommands, project.id]);
  const completedQuests = projectQuests.filter((quest) => quest.status === 'Erledigt').length;

  function closeModal() {
    setModal(null);
    setTalkText('');
  }

  function createTalkEntry(kind: 'Quest-Draft' | 'Output-Draft' | 'Freigabe') {
    const text = talkText.trim() || 'Projektgespräch ohne Detailtext';
    if (kind === 'Output-Draft') {
      setOutputs((current) => [
        {
          id: `ART-${Date.now()}`,
          title: `NOX Output-Draft: ${project.code}`,
          project: project.id,
          outputType: 'Projekt-Briefing',
          storage: 'Lokal / Demo-State',
          status: 'Draft',
          version: 'v0.1',
          description: text,
        },
        ...current,
      ]);
    }

    if (kind === 'Freigabe') {
      setApprovals((current) => [
        {
          id: `A-${Date.now()}`,
          title: `Freigabe vormerken: ${project.code}`,
          project: project.id,
          status: 'Pruefung',
          risk: 'Mittel',
          agent: 'NOX',
          description: text,
        },
        ...current,
      ]);
    }

    addMilestone(project.id, kind, `${kind} vorgemerkt`, text);
    closeModal();
  }

  function createOutputDraft() {
    const description =
      outputPrompt.trim() ||
      'NOX erzeugt aus Projektkontext, Quests und Meilensteinen einen verwertbaren Output-Draft.';
    setOutputs((current) => [
      {
        id: `ART-${Date.now()}`,
        title: `${outputType} für ${project.code}`,
        project: project.id,
        outputType,
        storage: 'Lokal / Demo-State',
        status: 'Draft',
        version: 'v0.1',
        description,
      },
      ...current,
    ]);
    addMilestone(project.id, 'Output', `${outputType} erzeugt`, description);
    setOutputPrompt('');
    setModal(null);
  }

  const auditItems = [
    { label: 'Vision vorhanden', status: project.vision ? 'OK' : 'Fehlt' },
    { label: 'Fortschritt plausibel', status: project.progress > 0 && project.progress <= 100 ? 'OK' : 'Pruefen' },
    { label: 'Quests vorhanden', status: projectQuests.length > 0 ? 'OK' : 'Fehlt' },
    { label: 'Outputs vorhanden', status: projectOutputs.length > 0 ? 'OK' : 'Fehlt' },
    { label: 'Freigaben geprüft', status: projectApprovals.length > 0 ? 'Pruefen' : 'OK' },
    { label: 'Blocker erklaert', status: project.blockers.length > 0 ? 'Pruefen' : 'OK' },
    { label: 'Nächster Schritt klar', status: project.nextAction ? 'OK' : 'Fehlt' },
    { label: 'Uebergabe-Spec vorhanden', status: projectOutputs.some((output) => output.outputType === 'Uebergabe-Spec') ? 'OK' : 'Fehlt' },
  ];

  function approvalRecommendation(approval: Approval): string {
    if (approval.risk === 'Hoch') return 'Vor Freigabe: Rückfrage stellen und Risiko klein schneiden.';
    if (approval.status === 'Blockiert') return 'Blocker zuerst auflösen, danach Freigabe pruefen.';
    if (approval.status === 'Pruefung') return 'Prüfen und sofort Freigabe oder Rückfrage wählen.';
    return 'Plausibel — Freigabe kann nach kurzer Pruefung erfolgen.';
  }

  // Local "Plan-Output vormerken" — turns the current Quest-Reihen-Entwurf
  // into a new local OutputArtifact draft. No backend, no Notion write.
  function vormerkenAlsPlanOutput() {
    const planText = planSteps
      .map(
        (s) =>
          `${s.step}. ${s.title}\n   Ziel: ${s.ziel}\n   Agent: ${s.agent}\n   Output: ${s.output}\n   Risiko: ${s.risk}\n   Freigabe-Gate: ${s.gate}\n   Status: Entwurf`,
      )
      .join('\n\n');
    const goalLine = `Projektziel: ${projektZiel.trim() || '(Demo-Projektziel)'}`;
    setOutputs((current) => [
      {
        id: `ART-${Date.now()}`,
        title: `Quest-Reihen-Entwurf: ${project.code}`,
        project: project.id,
        outputType: 'Plan',
        storage: 'Lokal / Demo-State',
        status: 'Draft',
        version: 'v0.1',
        description: `Lokaler Quest-Reihen-Entwurf für ${project.name} (NOX Agent / Project Auto Planner).\n\n${goalLine}\n\n${planText}`,
      },
      ...current,
    ]);
    addMilestone(project.id, 'Plan', `Quest-Reihen-Entwurf vorgemerkt`, `${goalLine}\n\n${planText}`);
    setModal(null);
  }

  // Phase 2A — call the read-only Project Auto Planner preview endpoint.
  // No Notion writes happen here: the backend echoes + validates + emits
  // a digest. The handler is locked to read-only by design. The operator
  // API key is read from `apiPreviewKey` (in-memory only) and never
  // persisted. The current local planSteps are mapped to the wire format
  // before sending.
  async function handleApiPreview() {
    setApiPreviewError(null);
    setApiPreviewData(null);
    const trimmedGoal = projektZiel.trim();
    if (!trimmedGoal) {
      setApiPreviewError({
        status: 0,
        errorCode: 'client_validation',
        errorMessage: 'Bitte erst ein Projektziel eingeben.',
      });
      return;
    }
    if (planSteps.length === 0) {
      setApiPreviewError({
        status: 0,
        errorCode: 'client_validation',
        errorMessage: 'Plan-Reihe ist leer.',
      });
      return;
    }
    if (apiPreviewAbortRef.current) apiPreviewAbortRef.current.abort();
    const controller = new AbortController();
    apiPreviewAbortRef.current = controller;
    setApiPreviewLoading(true);
    // Map local PlanStep[] -> PlanStepWire[]. The shapes already match;
    // we copy defensively so future schema drift on the frontend cannot
    // leak into the wire format.
    const wireSteps: PlanStepWire[] = planSteps.map((s) => ({
      id: s.id,
      step: s.step,
      title: s.title,
      ziel: s.ziel,
      agent: s.agent,
      output: s.output,
      risk: s.risk,
      gate: s.gate,
      reason: s.reason,
      feedback: s.feedback,
      rating: s.rating,
    }));
    const result = await fetchPlanPreview({
      projectId: project.id,
      apiKey: apiPreviewKey,
      signal: controller.signal,
      draft: {
        projectId: project.id,
        projectGoal: trimmedGoal,
        planSteps: wireSteps,
        idempotencyKey: generatePreviewIdempotencyKey(),
      },
    });
    if (apiPreviewAbortRef.current !== controller) return;
    apiPreviewAbortRef.current = null;
    setApiPreviewLoading(false);
    if (result.ok) {
      setApiPreviewData(result.data);
      // Auto-chain Phase 2B schema-validation directly after a successful
      // Phase 2A preview so the operator sees both reports without a second
      // click. handleApiValidate() owns its own AbortController, error
      // state, and loading flag — preview state stays untouched if validate
      // fails. The chain runs only on preview success; preview errors do
      // NOT cascade into a validate attempt.
      void handleApiValidate();
    } else {
      setApiPreviewError({
        status: result.status,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      });
    }
  }

  // Phase 2B — call the read-only schema-validation endpoint. Same
  // payload as preview, but the server additionally reads the live
  // Notion schema (read-only) and reports per-property safety.
  async function handleApiValidate() {
    setApiValidateError(null);
    setApiValidateData(null);
    const trimmedGoal = projektZiel.trim();
    if (!trimmedGoal) {
      setApiValidateError({
        status: 0,
        errorCode: 'client_validation',
        errorMessage: 'Bitte erst ein Projektziel eingeben.',
      });
      return;
    }
    if (planSteps.length === 0) {
      setApiValidateError({
        status: 0,
        errorCode: 'client_validation',
        errorMessage: 'Plan-Reihe ist leer.',
      });
      return;
    }
    if (apiValidateAbortRef.current) apiValidateAbortRef.current.abort();
    const controller = new AbortController();
    apiValidateAbortRef.current = controller;
    setApiValidateLoading(true);
    const wireSteps: PlanStepWire[] = planSteps.map((s) => ({
      id: s.id,
      step: s.step,
      title: s.title,
      ziel: s.ziel,
      agent: s.agent,
      output: s.output,
      risk: s.risk,
      gate: s.gate,
      reason: s.reason,
      feedback: s.feedback,
      rating: s.rating,
    }));
    // Stateflow-Digest-Fix — snapshot the fingerprint of the exact payload
    // we're about to validate BEFORE the await. If the operator mutates
    // planSteps during the round-trip, the snapshot still reflects what
    // the server validated, and the invalidation effect catches the
    // divergence on the next render.
    const sentFingerprint = computePlanFingerprint(project.id, trimmedGoal, planSteps);
    const sentStepCount = wireSteps.length;
    const result = await fetchPlanValidate({
      projectId: project.id,
      apiKey: apiPreviewKey,
      signal: controller.signal,
      draft: {
        projectId: project.id,
        projectGoal: trimmedGoal,
        planSteps: wireSteps,
        idempotencyKey: generatePreviewIdempotencyKey('plan-validate'),
      },
    });
    if (apiValidateAbortRef.current !== controller) return;
    apiValidateAbortRef.current = null;
    setApiValidateLoading(false);
    if (result.ok) {
      setApiValidateData(result.data);
      // Lock the validated snapshot. Any subsequent plan mutation will
      // diverge from this fingerprint and trigger the invalidation effect.
      setLastValidatedFingerprint(sentFingerprint);
      setLastValidatedStepCount(sentStepCount);
    } else {
      setApiValidateError({
        status: result.status,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      });
    }
  }

  // Phase 2D-UI — Background tech-check after "Quest-Reihe entwerfen".
  // The sentinel `autoTechCheckPending` is set by onPlan/onUseDemoGoal
  // *before* the new planSteps land in state. The effect picks them up on
  // the next render, fires Preview+Validate (chained inside handleApiPreview)
  // and clears the sentinel. NO modal is opened — the cockpit stays on the
  // primary planner card and renders a compact status banner instead.
  useEffect(() => {
    if (!autoTechCheckPending) return;
    if (planSteps.length === 0) return;
    if (!projektZiel.trim()) return;
    setAutoTechCheckPending(false);
    void handleApiPreview();
    // We intentionally don't depend on `handleApiPreview` — it's a stable
    // local function recreated each render; chaining it via dependency
    // would re-fire on unrelated re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTechCheckPending, planSteps, projektZiel]);

  // Stateflow-Digest-Fix — derive current plan fingerprint + stale flag.
  // `currentPlanFingerprint` is a pure function of (projectId, projektZiel,
  // planSteps); React will recompute it only when one of those changes,
  // which is precisely when we need to re-check staleness.
  const currentPlanFingerprint = useMemo(
    () => computePlanFingerprint(project.id, projektZiel, planSteps),
    [project.id, projektZiel, planSteps],
  );
  // The local plan diverges from what was last validated if we have a
  // snapshot AND the fingerprint moved. Pre-validate / first-render the
  // flag is false (no snapshot to diverge from).
  const isPlanStaleAgainstValidate =
    lastValidatedFingerprint !== null && lastValidatedFingerprint !== currentPlanFingerprint;

  // Stateflow-Digest-Fix — invalidation effect. Whenever the operator
  // mutates the local plan after a validate result landed, blow away the
  // cached preview/validate/commit responses so the UI cannot present a
  // stale "Quests bereit / Digest XYZ" state. The next commit attempt is
  // forced to go back through tech-check.
  useEffect(() => {
    if (!isPlanStaleAgainstValidate) return;
    // Abort any in-flight tech-check from a previous plan snapshot.
    if (apiPreviewAbortRef.current) {
      apiPreviewAbortRef.current.abort();
      apiPreviewAbortRef.current = null;
    }
    if (apiValidateAbortRef.current) {
      apiValidateAbortRef.current.abort();
      apiValidateAbortRef.current = null;
    }
    setApiPreviewData(null);
    setApiPreviewError(null);
    setApiValidateData(null);
    setApiValidateError(null);
    setCommitData(null);
    setCommitError(null);
    setLastValidatedFingerprint(null);
    setLastValidatedStepCount(null);
    // We deliberately depend only on the staleness flag — the setters are
    // stable across renders, so omitting them is safe and the effect
    // re-runs purely when the flag transitions to true.
  }, [isPlanStaleAgainstValidate]);

  // Phase 2D-UI — Derived tech-check status for the inline planner banner.
  //   - 'idle'          : nothing has run yet
  //   - 'running'       : preview or validate is in flight
  //   - 'ready'         : both responded, schemaOk: true
  //   - 'not-ready'     : validate responded, schemaOk: false
  //   - 'auth-blocked'  : 401 on either call — private mode off or key wrong
  //   - 'error'         : any other error path
  type TechCheckStatus = 'idle' | 'running' | 'ready' | 'not-ready' | 'auth-blocked' | 'error';
  const techCheckStatus: TechCheckStatus = (() => {
    if (apiPreviewLoading || apiValidateLoading) return 'running';
    if (apiPreviewError?.status === 401 || apiValidateError?.status === 401) return 'auth-blocked';
    if (apiPreviewError || apiValidateError) return 'error';
    if (apiValidateData) return apiValidateData.schemaOk ? 'ready' : 'not-ready';
    if (apiPreviewData) return 'running'; // preview done, validate in chain
    return 'idle';
  })();

  // Phase 2D-UI — One-click commit handler. The browser sends only the
  // structural payload (plan + digest + idempotency + clientPlanId) and
  // NO secret material:
  //   - No confirm phrase. Server-side `private_write_mode` flag IS the
  //     conscious confirmation in the privately-hosted cockpit.
  //   - No operator-key input. The cockpit relies on the same server-side
  //     auth path used by /plan/preview + /plan/validate (extended with
  //     `NOX_OPERATOR_COCKPIT_PRIVATE_WRITE_MODE` for the write side).
  //   - 401 means private-write-mode is off and no Operator-Key on the
  //     wire. The UI surfaces that as "write-auth not yet active".
  //   - 423 writes_locked means the server flag is still down. UI says so.
  // The handler never touches localStorage / sessionStorage / cookies.
  async function handleApiCommit() {
    setCommitError(null);
    setCommitData(null);
    if (!apiValidateData || !apiValidateData.schemaOk) {
      setCommitError({
        status: 0,
        errorCode: 'client_validation',
        errorMessage: 'Schema ist nicht bereit. Erst „Technisch prüfen" laufen lassen.',
      });
      return;
    }
    if (!apiPreviewData) {
      setCommitError({
        status: 0,
        errorCode: 'client_validation',
        errorMessage: 'Preview-Digest fehlt. Erst „Technisch prüfen" laufen lassen.',
      });
      return;
    }
    // Stateflow-Digest-Fix — synchronous stale-guard. The invalidation
    // useEffect normally clears apiPreviewData/apiValidateData the instant
    // the plan mutates, but a click in the same task-cycle as a mutation
    // could still reach here before the effect runs. This block catches
    // that race and replaces the cryptic server-side
    // `plan_digest_mismatch` 409 with a user-readable instruction.
    const stalenessCheck = computePlanFingerprint(project.id, projektZiel, planSteps);
    if (lastValidatedFingerprint !== null && stalenessCheck !== lastValidatedFingerprint) {
      setCommitError({
        status: 0,
        errorCode: 'client_plan_stale',
        errorMessage:
          'Plan wurde lokal geändert. Bitte erneut „Technisch prüfen" laufen lassen, bevor du committest.',
      });
      return;
    }
    // Defensive cross-check — local plan-step count must match what
    // validate saw. Should already be guaranteed by the fingerprint check
    // above; keep the explicit count diff as a belt-and-suspenders so the
    // UI can still surface a precise message if the plan was edited in a
    // way that left the fingerprint somehow stable (it shouldn't, but).
    if (lastValidatedStepCount !== null && lastValidatedStepCount !== planSteps.length) {
      setCommitError({
        status: 0,
        errorCode: 'client_plan_step_count_mismatch',
        errorMessage: `Plan hat lokal ${planSteps.length} Schritt(e), validiert wurden ${lastValidatedStepCount}. Bitte erneut „Technisch prüfen" laufen lassen.`,
      });
      return;
    }
    if (commitAbortRef.current) commitAbortRef.current.abort();
    const controller = new AbortController();
    commitAbortRef.current = controller;
    setCommitLoading(true);

    const wireSteps: PlanStepWire[] = planSteps.map((s) => ({
      id: s.id,
      step: s.step,
      title: s.title,
      ziel: s.ziel,
      agent: s.agent,
      output: s.output,
      risk: s.risk,
      gate: s.gate,
      reason: s.reason,
      feedback: s.feedback,
      rating: s.rating,
    }));

    // clientPlanId is a per-click rich-id, slug-safe under the server-side
    // PLAN_STEP_ID_RE (^[A-Za-z0-9_-]{4,80}$). Project id + base36 stamp
    // keeps it correlatable to the local plan draft without persisting
    // anything.
    const clientPlanId = `plan-${project.id.replace(/[^A-Za-z0-9_-]/g, '-')}-${Date.now().toString(36)}`.slice(0, 80);
    const request: PlanCommitRequestWire = {
      projectId: project.id,
      clientPlanId,
      projectGoal: projektZiel.trim(),
      planSteps: wireSteps,
      idempotencyKey: generatePreviewIdempotencyKey('plan-commit'),
      planDigest: apiPreviewData.echoedDigest,
      // commitToken / explicitConfirmPhrase are intentionally omitted —
      // server gates accept that when authMode='private_write_mode'.
    };

    const result = await fetchPlanCommit({
      projectId: project.id,
      // No operator key on the wire. Private-write mode is the auth path.
      signal: controller.signal,
      request,
    });

    if (commitAbortRef.current !== controller) return;
    commitAbortRef.current = null;
    setCommitLoading(false);
    if (result.ok) {
      setCommitData(result.data);
    } else {
      setCommitError({
        status: result.status,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Top workspace card — minimal, work-first. Project picker is part
          of the header; identity snapshot stays compact. No technical
          read-only / execute / Auth pills. Progress and next action are
          the visual anchors. */}
      <Card className="!p-5 md:!p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-amber-200/80">Projekt-Zentrale</div>
            <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight text-[#fff7fb] md:text-3xl">{project.name}</h1>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7f6f76]">{project.code}</p>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#eadbe2]">{project.vision}</p>
          </div>
          <div className="w-full lg:w-80">
            <label className="block text-[10px] font-extrabold uppercase tracking-[0.24em] text-amber-200/90">Projekt wählen</label>
            <div className="relative mt-2">
              <select
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                style={{ colorScheme: 'dark' }}
                className="cockpit-select w-full appearance-none rounded-2xl border border-amber-300/30 bg-gradient-to-br from-[#1a0a0d] to-[#0c0506] px-4 py-3 pr-10 text-base font-black tracking-tight text-amber-50 outline-none transition hover:border-amber-300/60 focus:border-amber-300/80"
              >
                {projects.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    style={{ backgroundColor: '#160709', color: '#fff7fb' }}
                  >
                    {item.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-amber-200">▾</span>
            </div>
          </div>
        </div>

        {/* Big progress + compact next step / status. Phase-1 demo. */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-[#3a0c14]/70 bg-[#0c0506]/60 p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#9f8d95]">Projektfortschritt</div>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-5xl font-black leading-none text-amber-300">{project.progress}</span>
                  <span className="pb-1 text-xl font-black text-amber-100/80">%</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9f8d95]">Status</div>
                <div className="mt-1 text-sm font-black text-[#fff7fb]">{project.status}</div>
                <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f6f76]">Phase 1 · Demo</div>
              </div>
            </div>
            <div className="mt-4 h-3 w-full overflow-hidden rounded-full border border-[#3a0c14]/60 bg-[#0a0405]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.4)]"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-semibold text-[#9f8d95]">
              <span>{completedQuests} / {projectQuests.length} Quests erledigt</span>
              <span>{projectOutputs.length} Outputs · {projectApprovals.length} offene Freigaben</span>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-amber-300/25 bg-amber-300/8 p-4">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200/80">Nächste Aktion</div>
              <div className="mt-2 text-base font-black leading-6 text-amber-50">{project.nextAction || '—'}</div>
            </div>
            <div className="rounded-2xl border border-[#3a0c14]/55 bg-black/30 p-4">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9f8d95]">Letzter Meilenstein</div>
              <div className="mt-2 text-sm font-bold leading-5 text-[#fff7fb]">{project.lastMilestone || '—'}</div>
            </div>
          </div>
        </div>
      </Card>

      <UnifiedAutoPlanner
        value={projektZiel}
        onChange={(next) => { setProjektZiel(next); if (emptyGoalHint) setEmptyGoalHint(false); }}
        onTalk={() => setModal('talk')}
        onPlan={() => {
          if (!projektZiel.trim()) {
            setEmptyGoalHint(true);
            return;
          }
          setEmptyGoalHint(false);
          regeneratePlan(projektZiel);
          setRestoredAt(null);
          // Auto-fire Preview+Validate chain in the background (no modal).
          // The effect below picks up the new planSteps on the next render.
          setAutoTechCheckPending(true);
          setModal('planner');
        }}
        onUseDemoGoal={() => {
          const demo = 'Demo-Ziel: NOX Agent so weit bringen, dass aus einem Projektziel lokal eine sinnvolle Quest-Reihe entsteht.';
          setProjektZiel(demo);
          setEmptyGoalHint(false);
          regeneratePlan(demo);
          setRestoredAt(null);
          setAutoTechCheckPending(true);
          setModal('planner');
        }}
        onApiPreview={() => {
          if (!projektZiel.trim()) {
            setEmptyGoalHint(true);
            return;
          }
          setEmptyGoalHint(false);
          setModal('apiPreview');
        }}
        onOutputsViewer={() => setModal('outputsViewer')}
        onReset={resetPlan}
        onDeleteDraft={deleteLocalDraft}
        onAudit={() => setModal('audit')}
        onOutputCreate={() => setModal('output')}
        stepCount={planSteps.length}
        approvalsCount={projectApprovals.length}
        outputsCount={projectOutputs.length}
        questsCount={projectQuests.length}
        restoredAt={restoredAt}
        onDismissRestoreNotice={() => setRestoredAt(null)}
        techCheckStatus={techCheckStatus}
        techCheckSummary={(() => {
          if (isPlanStaleAgainstValidate) {
            // Stateflow-Digest-Fix — never show a "Quests bereit"-style
            // count when the local plan diverges from the validated
            // snapshot. The dedicated banner explains what to do.
            return typeof lastValidatedStepCount === 'number'
              ? `Letzte Prüfung: ${lastValidatedStepCount} Quest${lastValidatedStepCount === 1 ? '' : 's'} · lokal jetzt: ${planSteps.length}`
              : 'Plan wurde lokal geändert.';
          }
          if (techCheckStatus === 'not-ready' && apiValidateData) {
            const parts: string[] = [];
            if (apiValidateData.missingProperties.length > 0)
              parts.push(`${apiValidateData.missingProperties.length} fehlende Properties`);
            if (apiValidateData.typeMismatches.length > 0)
              parts.push(`${apiValidateData.typeMismatches.length} Type-Mismatches`);
            if (apiValidateData.unsafeProperties.length > 0)
              parts.push(`${apiValidateData.unsafeProperties.length} unsafe`);
            return parts.join(' · ') || undefined;
          }
          if (techCheckStatus === 'ready' && apiValidateData) {
            return `${apiValidateData.wouldCreateNTasks} Quests bereit · Digest ${apiValidateData.echoedDigest}`;
          }
          if (techCheckStatus === 'auth-blocked') {
            return 'Private Cockpit Mode nicht aktiv oder Operator-Key fehlt.';
          }
          if (techCheckStatus === 'error') {
            return apiValidateError?.errorMessage || apiPreviewError?.errorMessage || undefined;
          }
          return undefined;
        })()}
        onCommitOpen={() => {
          setCommitError(null);
          setCommitData(null);
          void handleApiCommit();
        }}
        commitStatus={(() => {
          if (commitLoading) return 'running' as const;
          if (commitError?.status === 401) return 'auth-blocked' as const;
          if (commitError) return 'error' as const;
          if (commitData?.code === 'committed') return 'committed' as const;
          if (commitData?.code === 'writes_locked') return 'writes_locked' as const;
          if (commitData?.code === 'duplicate_risk') return 'duplicate' as const;
          if (commitData) return 'error' as const;
          return 'idle' as const;
        })()}
        commitMessage={(() => {
          if (commitLoading) return 'Commit läuft …';
          if (commitError?.status === 401) {
            return 'Schreibzugriff nicht autorisiert. Private App/Auth für Writes noch nicht aktiv.';
          }
          if (commitError) {
            return commitError.errorMessage || `Fehler (HTTP ${commitError.status}).`;
          }
          if (commitData?.code === 'committed') {
            const n = commitData.pageResults.filter((p) => p.ok).length;
            return `Quests erzeugt: ${n}`;
          }
          if (commitData?.code === 'writes_locked') {
            return 'Writes sind serverseitig gesperrt. Aktiviere Write-Flag nur für kontrollierten Test.';
          }
          if (commitData?.code === 'duplicate_risk') {
            return 'Dieser Plan wurde bereits erzeugt. Keine Duplikate erstellt.';
          }
          if (commitData?.code === 'partial_failure') {
            const ok = commitData.pageResults.filter((p) => p.ok).length;
            const failed = commitData.pageResults.length - ok;
            return `Teilweise erzeugt: ${ok} OK, ${failed} fehlgeschlagen.`;
          }
          if (commitData) {
            return commitData.diagnostics[0] ?? 'Commit nicht ausgeführt.';
          }
          return undefined;
        })()}
        writeEnabledHint={commitData?.writeEnabled ? 'enabled' : commitData ? 'locked' : 'unknown'}
        emptyGoalHint={emptyGoalHint}
        // UX-safety: prefer the validated server count, fall back to the
        // local draft length so the CTA never lies about "1 Quest" when the
        // user is actually staring at a 7-step plan. When the plan is stale
        // we deliberately ignore the validated count and surface the local
        // count, since the validated number no longer reflects what would
        // actually be committed.
        wouldCreateNTasks={
          isPlanStaleAgainstValidate
            ? planSteps.length
            : apiValidateData?.wouldCreateNTasks ?? planSteps.length
        }
        // Smoke-Test affordance: reduce the local draft to a single step.
        // Pure local-state change — no Notion / no backend. Renumbers the
        // step to 1 so the UI stays consistent. The fingerprint-invalidation
        // effect catches the resulting plan change and clears the stale
        // preview/validate snapshots automatically.
        onReduceToOne={() => {
          setPlanSteps((prev) => (prev.length === 0 ? prev : prev.slice(0, 1).map((s) => ({ ...s, step: 1 }))));
        }}
        // Stateflow-Digest-Fix — wire the staleness flag, the validated
        // step count, and a re-trigger so the UI can show / dismiss the
        // "Plan changed since last validate" warning.
        isPlanStale={isPlanStaleAgainstValidate}
        validatedStepCount={lastValidatedStepCount}
        onRevalidate={() => {
          // Same entry point as the auto-chain after regeneratePlan —
          // preview success auto-chains validate, so a single call here
          // refreshes both snapshots.
          void handleApiPreview();
        }}
      />

      <DecisionBlockers project={project} approvals={projectApprovals} recommend={approvalRecommendation} />

      {project.id === 'PROJECT-X' ? <ProjectXSummary commands={projectCommands} /> : null}

      {/* PROJECT-X-UI-02 — Workflow-Fabrik demo, only for the Project X project. */}
      {project.id === 'PROJECT-X' ? <WorkflowFactorySection /> : null}

      <LinkedQuests quests={projectQuests} openQuest={openQuest} />

      <OutputsSection
        outputs={projectOutputs}
        project={project}
        registerDemoAction={registerDemoAction}
        onOpenDetail={(output) => setOutputDetail(output)}
      />

      <MilestonesSection milestones={projectMilestones} />

      {/* Erweiterter Kontext — collapsed by default. The technical
          Notion / Auth surface is kept available for operators who want
          it but no longer dominates the top of the project page. */}
      <ExtendedContextSection projectCode={project.code} />

      <AnimatePresence>
        {modal === 'talk' ? (
          (() => {
            // Pure helper — same regex logic as the previous inline handler,
            // extracted so both Enter-to-send and the explicit submit button
            // can share it without duplicating the if-cascade.
            function generateDemoAnswer(rawInput: string): string {
              const input = rawInput.trim();
              const lower = input.toLowerCase();
              if (/kuerzer|kürzer|kompakt/.test(lower)) {
                return 'Demo-Vorschlag: Schritte 1, 3 und 7 kombinieren. Schritt 2 + 5 entfallen, wenn Kontext bereits klar ist.';
              }
              if (/business|sales|vertrieb|lead/.test(lower)) {
                return 'Demo-Vorschlag: zusätzlich „Hypothese und Zielgruppe schärfen" vor Schritt 3 und „Pitch-Test mit 5 Leads" als Schritt 6 einbauen.';
              }
              if (/technisch|implement|code/.test(lower)) {
                return 'Demo-Vorschlag: Schritt 5 in „Code-/Workflow-Skeleton bauen" umbenennen und Schritt 6 als „Dry-Run + Logging" konkretisieren.';
              }
              if (/warum/.test(lower)) {
                return 'Demo-Vorschlag: Diese Reihe folgt der Logik Ziel → Kontext → Risiko → Lösung → Bearbeiter → Artefakt → Freigabe. Sie minimiert Rückfragen während der Umsetzung.';
              }
              if (input.length > 0) {
                return `Demo-Vorschlag basierend auf „${input.slice(0, 80)}": Pass den selektierten Schritt im Detailpanel an (Titel, Ziel, Risiko, Bearbeiter) und nutze „Feedback an NOX", damit später echtes NOX-Lernen darauf aufbauen kann.`;
              }
              return 'Demo-Vorschlag: Diese Quest-Reihe folgt der Logik Ziel → Kontext → Risiko → Lösung → Bearbeiter → Artefakt → Freigabe.';
            }

            function resetTalkState() {
              setNoxTalkInput('');
              setNoxTalkAnswer('');
              setNoxTalkHistory([]);
            }

            function submitTalk() {
              const input = noxTalkInput.trim();
              if (!input) return;
              const answer = generateDemoAnswer(input);
              const now = Date.now();
              setNoxTalkHistory((prev) => [
                ...prev,
                { role: 'user', text: input, at: now },
                { role: 'demo', text: answer, at: now + 1 },
              ]);
              setNoxTalkAnswer(answer);
              setNoxTalkInput('');
            }

            // Dismiss-guard — if the user has unsent text or a history they
            // probably didn't mean to nuke, ESC / backdrop just keeps the
            // modal open. The explicit "Schließen" button bypasses this.
            const hasUnsavedTalk =
              noxTalkInput.trim().length > 0 || noxTalkHistory.length > 0;

            return (
              <Modal
                size="chat"
                closeGuard={() => !hasUnsavedTalk}
                onClose={() => { closeModal(); resetTalkState(); }}
              >
                <SectionTitle
                  eyebrow="NOX Agent · LOKALE DEMO"
                  title="Mit NOX besprechen"
                  subtitle="Lokale NOX-Demo · kein echter Agent · kein API-Call · keine Notion-Speicherung"
                />

                {/* Loud honesty banner — the previous yellow blurb was easy to
                    miss. This makes the demo nature unmissable before the
                    user types. */}
                <div className="mt-4 rounded-2xl border border-rose-300/40 bg-rose-400/10 px-4 py-3 text-[12px] font-bold leading-5 text-rose-50">
                  <span className="text-rose-100">Hinweis:</span> Dies ist ein lokaler Demo-Dialog.
                  Antworten sind regelbasiert und entstehen ausschließlich im Browser. Es findet
                  <span className="font-extrabold"> kein API-Call </span>statt, es spricht
                  <span className="font-extrabold"> kein echter Claude-/NOX-Agent </span>mit, und es wird
                  <span className="font-extrabold"> nichts in Notion gespeichert</span>. Drafts „vormerken"
                  legt nur einen lokalen Eintrag in deinem Browser an.
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200">Projektziel</div>
                      <p className="mt-2 text-sm font-bold leading-6 text-amber-50">
                        {projektZiel.trim() || 'Noch kein Projektziel gesetzt.'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#4a101b]/60 bg-[#0c0506]/70 p-4">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200/80">Aktuelle Quest-Reihe ({planSteps.length} Schritte)</div>
                      <ul className="mt-2 space-y-1 text-sm font-semibold text-amber-50/90">
                        {planSteps.map((s) => (
                          <li key={s.id} className="flex gap-2">
                            <span className="font-black text-amber-200">{s.step}.</span>
                            <span className="leading-5">{s.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-col gap-3">
                    {/* Chat history — scrollable column. Empty state shows a
                        hint instead of leaving the area blank. */}
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200">Verlauf (lokal, nicht gespeichert)</div>
                    <div className="max-h-[42vh] min-h-[180px] overflow-y-auto rounded-2xl border border-[#4a101b]/60 bg-[#0c0506]/70 p-3">
                      {noxTalkHistory.length === 0 ? (
                        <div className="px-1 py-6 text-center text-[12px] font-semibold leading-5 text-[#bda0a8]">
                          Noch keine Demo-Nachrichten. Tipp eine Frage unten ein und drücke{' '}
                          <kbd className="rounded border border-amber-300/40 bg-[#1a0b10] px-1.5 py-0.5 font-mono text-[11px] text-amber-100">Enter</kbd>{' '}
                          zum Senden. <kbd className="rounded border border-amber-300/40 bg-[#1a0b10] px-1.5 py-0.5 font-mono text-[11px] text-amber-100">Shift</kbd>+<kbd className="rounded border border-amber-300/40 bg-[#1a0b10] px-1.5 py-0.5 font-mono text-[11px] text-amber-100">Enter</kbd> macht einen Zeilenumbruch.
                        </div>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {noxTalkHistory.map((entry, idx) => (
                            <li
                              key={`${entry.at}-${idx}`}
                              className={
                                entry.role === 'user'
                                  ? 'self-end max-w-[85%] rounded-2xl border border-amber-300/40 bg-amber-300/15 px-3 py-2 text-sm font-semibold leading-5 text-amber-50'
                                  : 'self-start max-w-[85%] rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-semibold leading-5 text-cyan-50'
                              }
                            >
                              <div className={`text-[9px] font-extrabold uppercase tracking-[0.18em] ${entry.role === 'user' ? 'text-amber-200' : 'text-cyan-200'}`}>
                                {entry.role === 'user' ? 'Du' : 'Demo-Antwort (lokal)'}
                              </div>
                              <p className="mt-1 whitespace-pre-wrap break-words">{entry.text}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200">
                        Eingabe · Enter sendet · Shift+Enter neue Zeile
                      </div>
                      <textarea
                        value={noxTalkInput}
                        onChange={(event) => setNoxTalkInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey) {
                            event.preventDefault();
                            submitTalk();
                          }
                        }}
                        rows={6}
                        placeholder="Beispiele: Warum schlägst du diese Reihe vor? Mach es kürzer. Mach es business-lastiger. Welcher Schritt fehlt für Vertrieb?"
                        className="mt-2 w-full min-h-[140px] resize-y rounded-2xl border border-amber-300/25 bg-[#120609]/80 px-3 py-2 text-sm font-semibold text-amber-50 outline-none placeholder:text-[#9f8588] focus:border-amber-300/70"
                      />
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9f8588]">
                          {noxTalkHistory.length > 0 ? `${noxTalkHistory.length / 2 | 0} Demo-Runden` : 'Noch keine Runde'}
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            tone="ghost"
                            className="!px-3 !py-1.5 !text-[12px]"
                            onClick={() => { setNoxTalkHistory([]); setNoxTalkAnswer(''); }}
                            title="Leert den lokalen Demo-Verlauf. Greift nicht auf Notion zu."
                          >
                            Verlauf leeren
                          </Button>
                          <Button
                            className="!px-3 !py-1.5 !text-[12px]"
                            onClick={submitTalk}
                            disabled={noxTalkInput.trim().length === 0}
                            title="Erzeugt regelbasiert eine Demo-Antwort. Kein API-Call, kein echter Agent."
                          >
                            Demo-Antwort erzeugen
                          </Button>
                        </div>
                      </div>
                    </div>

                    {noxTalkAnswer ? (
                      <div className="rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200">Letzte Demo-Antwort in lokalen Entwurf übernehmen</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            tone="secondary"
                            className="!px-3 !py-1.5 !text-[12px]"
                            title="Übernimmt die letzte Demo-Antwort in das Feedback-Feld des aktuell ausgewählten Plan-Schritts (oder in das Projektziel). Kein Notion-Write."
                            onClick={() => {
                              if (plannerSelectedStepId) {
                                const sel = planSteps.find((s) => s.id === plannerSelectedStepId);
                                const merged = sel?.feedback ? `${sel.feedback}\n${noxTalkAnswer}` : noxTalkAnswer;
                                updateStep(plannerSelectedStepId, { feedback: merged });
                              } else {
                                setProjektZiel((prev) => `${prev}${prev ? '\n' : ''}// NOX-Notiz: ${noxTalkAnswer}`);
                              }
                              closeModal();
                              resetTalkState();
                            }}
                          >
                            Antwort als Anpassungsnotiz übernehmen
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#4a101b]/60 bg-[#080304]/95 px-5 py-4 md:-mx-9 md:-mb-9 md:px-9 md:py-5">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-rose-200/90">
                    Lokale Demo · keine Notion-Speicherung
                  </div>
                  <div className="flex flex-wrap justify-end gap-3">
                    <Button
                      tone="ghost"
                      onClick={() => createTalkEntry('Quest-Draft')}
                      title="Speichert diese Idee nur lokal als Quest-Entwurf. Kein Notion-Write."
                    >
                      Als Quest-Draft vormerken (lokal)
                    </Button>
                    <Button
                      tone="ghost"
                      onClick={() => createTalkEntry('Output-Draft')}
                      title="Speichert diese Idee nur lokal als Output-/Artefakt-Entwurf. Kein Notion-Write."
                    >
                      Als Output-Draft vormerken (lokal)
                    </Button>
                    <Button
                      onClick={() => { closeModal(); resetTalkState(); }}
                      title="Schließt den Demo-Dialog. Lokaler Verlauf wird verworfen."
                    >
                      Schließen
                    </Button>
                  </div>
                </div>
              </Modal>
            );
          })()
        ) : null}

        {modal === 'audit' ? (
          <Modal onClose={() => setModal(null)}>
            <SectionTitle eyebrow="Health-Check" title="Projektkontext-Pruefung" />
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {auditItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-[#4a101b]/60 bg-[#120609] p-4">
                  <span className="text-sm font-bold text-[#eadbe2]">{item.label}</span>
                  <Pill tone={item.status === 'OK' ? 'gold' : item.status === 'Fehlt' ? 'red' : 'default'}>{item.status}</Pill>
                </div>
              ))}
            </div>
            <div className="mt-7 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5">
              <div className="text-[12px] font-extrabold uppercase tracking-[0.24em] text-amber-200/80">Empfehlung von NOX</div>
              <p className="mt-3 text-base font-semibold leading-7 text-amber-50">
                {projectOutputs.some((output) => output.outputType === 'Uebergabe-Spec')
                  ? 'Projektkontext ist arbeitsfähig. Nächste Aktion ausführen und offene Freigaben klein halten.'
                  : 'Erzeuge als nächsten Output eine Uebergabe-Spec, damit Project X ohne Kontextverlust weiterarbeiten kann.'}
              </p>
            </div>
            <div className="mt-7 flex justify-end">
              <Button onClick={() => setModal(null)}>Schließen</Button>
            </div>
          </Modal>
        ) : null}

        {modal === 'output' ? (
          <Modal onClose={() => setModal(null)}>
            <SectionTitle
              eyebrow="Output"
              title="Projekt-Output erstellen"
              subtitle="NOX erzeugt aus Projektkontext, Quests und Meilensteinen einen verwertbaren Output."
            />
            <div className="mt-7 space-y-5">
              <div>
                <FieldLabel>Output-Typ auswählen</FieldLabel>
                <select
                  value={outputType}
                  onChange={(event) => setOutputType(event.target.value)}
                  className="w-full appearance-none rounded-2xl border border-[#4a101b]/70 bg-[#120609] p-4 text-base font-bold text-[#fff7fb] outline-none focus:border-amber-300/70"
                >
                  {outputTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                value={outputPrompt}
                onChange={(event) => setOutputPrompt(event.target.value)}
                className="min-h-[180px] w-full resize-none rounded-2xl border border-[#4a101b]/70 bg-[#120609] p-5 text-base font-semibold leading-8 text-[#fff7fb] outline-none focus:border-amber-300/70"
                placeholder="Was soll NOX daraus machen? Beispiel: Erstelle eine Uebergabe-Spec für Project X mit Ziel, Kontext, offenen Freigaben und nächster Implementierungsaufgabe."
              />
              <div className="flex justify-end gap-3 border-t border-[#4a101b]/50 pt-6">
                <Button tone="ghost" onClick={() => setModal(null)}>Schließen</Button>
                <Button onClick={createOutputDraft}>Output-Draft erzeugen</Button>
              </div>
            </div>
          </Modal>
        ) : null}

        {modal === 'apiPreview' ? (
          <Modal
            size="wide"
            onClose={() => {
              if (apiPreviewAbortRef.current) apiPreviewAbortRef.current.abort();
              if (apiValidateAbortRef.current) apiValidateAbortRef.current.abort();
              apiPreviewAbortRef.current = null;
              apiValidateAbortRef.current = null;
              setApiPreviewLoading(false);
              setApiValidateLoading(false);
              setModal(null);
            }}
          >
            <SectionTitle
              eyebrow="NOX Agent · Phase 2A/2B"
              title="Project Auto Planner · Technische Prüfung"
              subtitle="Server validiert Payload, liest Notion-Schema read-only und gibt Status zurück. Kein Notion-Write. Kein Dispatcher."
            />

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-200">Projektziel</div>
                  <p className="mt-2 text-sm font-bold leading-6 text-amber-50">
                    {projektZiel.trim() || 'Kein Projektziel gesetzt.'}
                  </p>
                  <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9f8d95]">
                    Projekt-ID <span className="text-amber-100">{project.id}</span> · {planSteps.length} Schritte
                  </div>
                </div>

                {/* The operator-key CTA only renders when the last response
                    indicated `operator_key` mode or a 401, or when no response
                    is in yet. In Private-Cockpit mode the operator never
                    needs to see this — the fallback stays one fold away. */}
                {(() => {
                  const lastAuthMode =
                    apiPreviewData?.meta?.authMode || apiValidateData?.meta?.authMode || null;
                  const had401 =
                    apiPreviewError?.status === 401 || apiValidateError?.status === 401;
                  const inPrivateMode = lastAuthMode === 'private_cockpit_readonly';
                  const keyCtaVisible = !inPrivateMode || had401;
                  return (
                <div className="rounded-2xl border border-[#4a101b]/55 bg-[#0c0507]/65 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber-200">
                        Aufruf
                      </div>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[#bfa9b3]">
                        {inPrivateMode
                          ? 'Private Cockpit Mode aktiv. Keine Notion-Writes. Kein Operator-Key nötig.'
                          : 'Phase 2A/2B sind read-only. Keine Notion-Writes. Wenn der Server im Private-Cockpit-Mode läuft, ist kein Operator-Key nötig.'}
                      </p>
                    </div>
                    {keyCtaVisible ? (
                      <button
                        type="button"
                        onClick={() => setApiPreviewKeyVisible((v) => !v)}
                        className="shrink-0 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-100 hover:bg-amber-300/20 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                        aria-expanded={apiPreviewKeyVisible}
                      >
                        {apiPreviewKeyVisible ? 'Key ausblenden' : 'Operator-Key eingeben'}
                      </button>
                    ) : null}
                  </div>

                  {keyCtaVisible && apiPreviewKeyVisible ? (
                    <div className="mt-3 rounded-xl border border-[#4a101b]/60 bg-[#120609]/70 p-3">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9f8d95]">
                        Operator-API-Key (nur Page-Session)
                      </div>
                      <p className="mt-2 text-[11px] font-semibold leading-5 text-[#9f8d95]">
                        Optional. Nur nötig, wenn der Server NICHT im Private-Cockpit-Mode läuft.
                        Key bleibt im React-State. Kein Storage, kein Cookie, kein Env-Bake. Beim Reload ist er weg.
                      </p>
                      <input
                        type="password"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        value={apiPreviewKey}
                        onChange={(event) => setApiPreviewKey(event.target.value)}
                        placeholder="x-nox-operator-key (optional)"
                        className="mt-3 w-full rounded-2xl border border-[#4a101b]/70 bg-[#120609] px-3 py-2 text-sm font-semibold text-[#fff7fb] outline-none placeholder:text-[#7f6f76] focus:border-amber-300/70"
                      />
                      {apiPreviewKey ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (apiPreviewAbortRef.current) apiPreviewAbortRef.current.abort();
                            if (apiValidateAbortRef.current) apiValidateAbortRef.current.abort();
                            apiPreviewAbortRef.current = null;
                            apiValidateAbortRef.current = null;
                            setApiPreviewKey('');
                          }}
                          disabled={apiPreviewLoading || apiValidateLoading}
                          className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-rose-200 hover:text-rose-100 disabled:opacity-40"
                        >
                          Key löschen
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      onClick={() => void handleApiPreview()}
                      disabled={apiPreviewLoading || apiValidateLoading || planSteps.length === 0}
                    >
                      {apiPreviewLoading
                        ? 'Preview wird geprüft …'
                        : apiValidateLoading
                          ? 'Schema wird validiert …'
                          : apiPreviewData
                            ? 'Prüfung erneut starten'
                            : 'Prüfung starten'}
                    </Button>
                    <Button
                      tone="secondary"
                      onClick={() => void handleApiValidate()}
                      disabled={apiValidateLoading || planSteps.length === 0}
                    >
                      {apiValidateLoading
                        ? 'Schema wird validiert …'
                        : apiValidateData
                          ? 'Schema erneut validieren'
                          : 'Schema validieren'}
                    </Button>
                  </div>
                </div>
                  );
                })()}

                <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-[12px] font-semibold leading-5 text-amber-50">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-200">Phase 2A + 2B · Read-only</div>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    <li><span className="font-black">Preview</span>: Backend echoed normalisierten Plan und Digest. Kein Notion-Call.</li>
                    <li><span className="font-black">Schema-Validierung</span>: Backend liest Notion-Schema read-only und prüft jede geplante Property gegen die Master-Tasks-DB. Kein Notion-Write.</li>
                    <li>Kein Dispatcher. Kein Agent-Run. Kein Write-Token. Kein Phase-2C-Commit.</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                {/* Compact summary banner. Renders as soon as preview/validate
                    has any result (success or error) so the operator sees the
                    overall state without scrolling through every detail block.
                    schemaOk drives the "next action" hint at the bottom. */}
                {apiPreviewData || apiPreviewError || apiValidateData || apiValidateError ? (
                  <div className="rounded-2xl border border-[#4a101b]/60 bg-[#0c0507]/75 p-4">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-200">
                      Zusammenfassung
                    </div>
                    <div className="mt-2 grid gap-2 text-[12px] font-semibold leading-5 text-[#eadbe2] sm:grid-cols-2">
                      <div>
                        Preview:{' '}
                        <span className={`font-black ${apiPreviewData ? 'text-emerald-200' : apiPreviewError ? 'text-rose-200' : 'text-[#9f8d95]'}`}>
                          {apiPreviewLoading ? 'läuft …' : apiPreviewData ? 'OK' : apiPreviewError ? 'Fehler' : '—'}
                        </span>
                      </div>
                      <div>
                        Schema:{' '}
                        <span className={`font-black ${apiValidateData?.schemaOk ? 'text-emerald-200' : apiValidateError ? 'text-rose-200' : apiValidateData ? 'text-amber-200' : 'text-[#9f8d95]'}`}>
                          {apiValidateLoading
                            ? 'wird validiert …'
                            : apiValidateData
                              ? apiValidateData.schemaOk
                                ? 'OK'
                                : 'Nicht bereit'
                              : apiValidateError
                                ? 'Fehler'
                                : '—'}
                        </span>
                      </div>
                      {apiValidateData ? (
                        <>
                          <div>
                            Missing: <span className="font-black text-rose-200">{apiValidateData.missingProperties.length}</span>
                          </div>
                          <div>
                            Unsafe: <span className="font-black text-amber-200">{apiValidateData.unsafeProperties.length}</span>
                          </div>
                          <div>
                            TypeMismatch: <span className="font-black text-rose-200">{apiValidateData.typeMismatches.length}</span>
                          </div>
                        </>
                      ) : null}
                      <div className="sm:col-span-2">
                        Notion-Writes:{' '}
                        <span className="font-black text-emerald-200">aus (read-only)</span>
                      </div>
                    </div>

                    {apiValidateData ? (
                      apiValidateData.schemaOk ? (
                        <div className="mt-3 rounded-md border border-emerald-300/40 bg-emerald-400/10 p-2 text-[11px] font-bold leading-5 text-emerald-100">
                          Technische Prüfung bestanden. Bereit für Phase 2C-Pre.
                          Noch keine Quests werden erzeugt.
                        </div>
                      ) : (
                        <div className="mt-3 rounded-md border border-amber-300/40 bg-amber-300/10 p-2 text-[11px] font-bold leading-5 text-amber-100">
                          Notion-Schema noch nicht bereit. Technische Details aufklappen,
                          um fehlende Properties / unsafe Felder zu sehen, und anschließend
                          in Master Tasks / Questboard anlegen oder Mapping entscheiden.
                        </div>
                      )
                    ) : null}
                  </div>
                ) : null}

                {apiPreviewError ? (
                  <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 p-4 text-sm font-semibold leading-6 text-rose-100">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-rose-200">
                      Fehler {apiPreviewError.status > 0 ? `· HTTP ${apiPreviewError.status}` : ''}
                    </div>
                    <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-rose-200/90">
                      {apiPreviewError.errorCode || '—'}
                    </div>
                    <p className="mt-2">{apiPreviewError.errorMessage || 'Unbekannter Fehler.'}</p>
                    {apiPreviewError.status === 401 ? (
                      <p className="mt-2 rounded-md border border-amber-300/40 bg-amber-300/10 p-2 text-[11px] font-bold leading-5 text-amber-100">
                        Private Cockpit Mode ist nicht aktiv oder Operator-Key fehlt. Setze auf dem Server
                        <span className="font-mono"> NOX_OPERATOR_COCKPIT_PRIVATE_MODE=true</span> oder gib oben einen Operator-Key ein.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {/* Technical-details toggle. Visible as soon as any Preview
                    or Validate result (success or error) is in. Collapses
                    plannedMutations, propertyChecks, missing/unsafe-Listen,
                    issues und warnings hinter eine Aufklapp-Schicht — der
                    Operator sieht primär die Status-Card oben und kann bei
                    Bedarf in die Tiefen schauen. */}
                {apiPreviewData || apiValidateData ? (
                  <button
                    type="button"
                    onClick={() => setTechnicalDetailsVisible((v) => !v)}
                    aria-expanded={technicalDetailsVisible}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#4a101b]/60 bg-[#120609]/60 px-4 py-3 text-left text-[12px] font-extrabold uppercase tracking-[0.18em] text-amber-200 transition hover:border-amber-300/40 hover:bg-[#1a070b]/80 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                  >
                    <span>
                      {technicalDetailsVisible
                        ? 'Technische Details ausblenden'
                        : 'Technische Details anzeigen'}
                    </span>
                    <span className="text-[#9f8d95]" aria-hidden>
                      {technicalDetailsVisible ? '−' : '+'}
                    </span>
                  </button>
                ) : null}

                {apiPreviewData && technicalDetailsVisible ? (
                  <>
                    <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-emerald-200">
                          Preview erfolgreich
                        </div>
                        {apiPreviewData.meta?.authMode === 'private_cockpit_readonly' ? (
                          <span className="rounded-full border border-amber-300/50 bg-amber-400/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-100">
                            Private Cockpit Mode
                          </span>
                        ) : apiPreviewData.meta?.authMode === 'operator_key' ? (
                          <span className="rounded-full border border-emerald-300/50 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-100">
                            Operator-Key
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 grid gap-2 text-[12px] font-semibold leading-5 text-emerald-50 sm:grid-cols-2">
                        <div>Projekt-ID: <span className="font-black">{apiPreviewData.projectId}</span></div>
                        <div>Schritte: <span className="font-black">{apiPreviewData.normalisedPlan.length}</span></div>
                        <div>Digest: <span className="font-mono text-emerald-100">{apiPreviewData.echoedDigest}</span></div>
                        <div>Phase: <span className="font-black">{apiPreviewData.meta?.phase || '—'}</span></div>
                        <div className="sm:col-span-2">
                          Notion-Writes: <span className="font-black">{apiPreviewData.meta?.notionWritesEnabled === false ? 'aus (read-only)' : '?'}</span>
                          {' · '}
                          Live-Execution: <span className="font-black">{apiPreviewData.meta?.liveExecution || '?'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#4a101b]/55 bg-[#0c0507]/70 p-4">
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber-200/90">
                        Geplante Notion-Mutationen ({apiPreviewData.plannedMutations.length})
                      </div>
                      <p className="mt-1 text-[11px] font-semibold leading-5 text-[#9f8d95]">
                        Phase 2A: nur Vorschau. Diese Mutationen werden weder validiert noch ausgeführt.
                      </p>
                      <div className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
                        {apiPreviewData.plannedMutations.map((mut) => (
                          <div key={mut.planStepId} className="rounded-xl border border-[#4a101b]/60 bg-[#120609]/70 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="text-[12px] font-black text-amber-50">
                                <span className="text-amber-200">{mut.kind}</span> · {mut.proposedTitle}
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9f8d95]">
                                {mut.planStepId}
                              </span>
                            </div>
                            <ul className="mt-2 space-y-1 text-[11px] font-semibold leading-5 text-[#d6c2cc]">
                              {mut.proposedProperties.map((prop) => (
                                <li key={`${mut.planStepId}-${prop.notionPropertyName}`}>
                                  <span className="text-amber-200/90">{prop.notionPropertyName}</span>
                                  <span className="text-[#7f6f76]"> ({prop.notionPropertyType}) ← </span>
                                  <span className="text-[#fff7fb]">
                                    {Array.isArray(prop.value)
                                      ? prop.value.join(', ')
                                      : String(prop.value).slice(0, 120)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            {mut.warnings.length > 0 ? (
                              <div className="mt-2 rounded-md border border-amber-300/30 bg-amber-300/10 p-2 text-[11px] font-bold leading-5 text-amber-100">
                                {mut.warnings.map((w, idx) => (
                                  <div key={`${mut.planStepId}-w-${idx}`}>· {w}</div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}

                {!apiPreviewData && !apiPreviewError && !apiValidateData && !apiValidateError ? (
                  <div className="rounded-2xl border border-dashed border-[#4a101b]/60 bg-[#0c0506]/50 p-5 text-sm font-semibold text-[#9f8d95]">
                    Noch keine Prüfung gelaufen. Auf „Prüfung starten" klicken — Preview und Schema-Check laufen automatisch hintereinander. Im Private-Cockpit-Mode ohne Operator-Key.
                  </div>
                ) : null}

                {/* Phase 2B — Schema validation report */}
                {apiValidateError ? (
                  <div className="rounded-2xl border border-rose-500/50 bg-rose-500/10 p-4 text-sm font-semibold leading-6 text-rose-100">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-rose-200">
                      Validate-Fehler {apiValidateError.status > 0 ? `· HTTP ${apiValidateError.status}` : ''}
                    </div>
                    <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-rose-200/90">
                      {apiValidateError.errorCode || '—'}
                    </div>
                    <p className="mt-2">{apiValidateError.errorMessage || 'Unbekannter Fehler.'}</p>
                    {apiValidateError.status === 401 ? (
                      <p className="mt-2 rounded-md border border-amber-300/40 bg-amber-300/10 p-2 text-[11px] font-bold leading-5 text-amber-100">
                        Private Cockpit Mode ist nicht aktiv oder Operator-Key fehlt. Setze auf dem Server
                        <span className="font-mono"> NOX_OPERATOR_COCKPIT_PRIVATE_MODE=true</span> oder gib oben einen Operator-Key ein.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {apiValidateData && technicalDetailsVisible ? (
                  <div className="rounded-2xl border border-cyan-400/40 bg-cyan-500/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-cyan-200">
                        <span>Phase 2B · Schema-Validierung {apiValidateData.schemaOk ? '· OK' : '· Fehler'}</span>
                        {apiValidateData.meta?.authMode === 'private_cockpit_readonly' ? (
                          <span className="rounded-full border border-amber-300/50 bg-amber-400/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-100">
                            Private Cockpit Mode
                          </span>
                        ) : apiValidateData.meta?.authMode === 'operator_key' ? (
                          <span className="rounded-full border border-emerald-300/50 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-100">
                            Operator-Key
                          </span>
                        ) : null}
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] ${apiValidateData.schemaOk ? 'border border-emerald-300/50 bg-emerald-400/15 text-emerald-100' : 'border border-rose-300/50 bg-rose-400/15 text-rose-100'}`}>
                        schemaOk: {String(apiValidateData.schemaOk)}
                      </span>
                    </div>

                    <div className="mt-2 grid gap-1 text-[12px] font-semibold leading-5 text-cyan-50 sm:grid-cols-2">
                      <div>Würde anlegen: <span className="font-black">{apiValidateData.wouldCreateNTasks}</span> Quests</div>
                      <div>Würde updaten: <span className="font-black">{apiValidateData.wouldUpdateNTasks}</span></div>
                      <div>Digest: <span className="font-mono">{apiValidateData.echoedDigest}</span></div>
                      <div>Notion-Writes: <span className="font-black">{apiValidateData.meta?.notionWritesEnabled === false ? 'aus (read-only)' : '?'}</span></div>
                    </div>

                    {/* Checked databases */}
                    <div className="mt-3 rounded-xl border border-cyan-300/30 bg-cyan-300/5 p-3">
                      <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-200/90">Geprüfte Datenbanken</div>
                      <ul className="mt-2 space-y-1 text-[11px] font-semibold leading-5 text-cyan-50/90">
                        {apiValidateData.checkedDatabases.map((db) => (
                          <li key={`${db.role}-${db.envVar}`} className="flex flex-wrap items-baseline gap-2">
                            <span className="text-cyan-200">{db.role}</span>
                            <span className="text-[#9f8d95]">({db.envVar})</span>
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.16em] ${db.ok ? 'bg-emerald-400/20 text-emerald-100' : db.status === 'skipped' ? 'bg-[#4a101b]/40 text-[#9f8d95]' : 'bg-rose-400/20 text-rose-100'}`}>
                              {db.status}
                            </span>
                            {db.summary ? <span className="text-cyan-50/70">{db.summary}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Property checks table */}
                    {apiValidateData.propertyChecks.length > 0 ? (
                      <div className="mt-3 rounded-xl border border-cyan-300/30 bg-cyan-300/5 p-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-200/90">
                          Property-Checks ({apiValidateData.propertyChecks.length})
                        </div>
                        <ul className="mt-2 space-y-1 text-[11px] font-semibold leading-5">
                          {apiValidateData.propertyChecks.map((c) => {
                            const toneClass =
                              c.status === 'safe'
                                ? 'bg-emerald-400/20 text-emerald-100'
                                : c.status === 'unsafe'
                                  ? 'bg-amber-300/25 text-amber-100'
                                  : c.status === 'skipped'
                                    ? 'bg-[#4a101b]/40 text-[#9f8d95]'
                                    : 'bg-rose-400/20 text-rose-100';
                            return (
                              <li key={c.notionPropertyName} className="flex flex-wrap items-baseline gap-2">
                                <span className="text-cyan-50">{c.notionPropertyName}</span>
                                <span className="text-[#9f8d95]">({c.expectedType}{c.actualType && c.actualType !== c.expectedType ? ` ≠ ${c.actualType}` : ''})</span>
                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.16em] ${toneClass}`}>
                                  {c.status}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}

                    {/* Missing-properties copy list — drives the manual
                        Operator-Hand-Migration in Master Tasks / Questboard.
                        Types are read from propertyChecks (status='missing')
                        so the list and types always stay in lockstep with
                        what Phase 2B actually checked. */}
                    {apiValidateData.missingProperties.length > 0 ? (
                      <div className="mt-3 rounded-xl border border-rose-400/40 bg-rose-500/10 p-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-rose-200">
                          Fehlende Properties · Master Tasks / Questboard ({apiValidateData.missingProperties.length})
                        </div>
                        <p className="mt-1 text-[11px] font-semibold leading-5 text-rose-50/90">
                          Diese Spalten muss der Operator manuell in der Notion-DB anlegen.
                          Kein Schema-Auto-Add. Reihenfolge ist egal.
                        </p>
                        <ul className="mt-2 space-y-1 text-[12px] font-mono leading-5 text-rose-50">
                          {apiValidateData.propertyChecks
                            .filter((c) => c.status === 'missing')
                            .map((c) => (
                              <li key={`missing-${c.notionPropertyName}`}>
                                <span className="font-black">{c.notionPropertyName}</span>
                                <span className="text-rose-200"> — {c.expectedType}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ) : null}

                    {/* Unsafe-properties explainer — currently 🎯/🤖-prefixed
                        operator-managed fields. Phase 2C will not touch them
                        unless the allowlist is consciously expanded later. */}
                    {apiValidateData.unsafeProperties.length > 0 ? (
                      <div className="mt-3 rounded-xl border border-amber-300/40 bg-amber-300/10 p-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200">
                          Unsafe Properties ({apiValidateData.unsafeProperties.length})
                        </div>
                        <p className="mt-1 text-[11px] font-semibold leading-5 text-amber-50/90">
                          Diese Felder sind aktuell nicht in der Phase-2C-Write-Allowlist.
                          Sie werden später nicht geschrieben, bis Mapping/Allowlist bewusst
                          entschieden wurde.
                        </p>
                        <ul className="mt-2 space-y-1 text-[12px] font-mono leading-5 text-amber-50">
                          {apiValidateData.unsafeProperties.map((name) => (
                            <li key={`unsafe-${name}`}>
                              <span className="font-black">{name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {/* Issues */}
                    {apiValidateData.issues.length > 0 ? (
                      <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-rose-200">
                          Issues ({apiValidateData.issues.length})
                        </div>
                        <ul className="mt-2 space-y-1 text-[11px] font-semibold leading-5 text-rose-50">
                          {apiValidateData.issues.map((iss, idx) => (
                            <li key={`${iss.code}-${idx}`}>
                              <span className="text-rose-200">{iss.code}</span>
                              {iss.notionPropertyName ? <span className="text-rose-100"> · {iss.notionPropertyName}</span> : null}
                              <span className="text-rose-50/90"> — {iss.message}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {/* Warnings */}
                    {apiValidateData.warnings.length > 0 ? (
                      <div className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200">
                          Warnings ({apiValidateData.warnings.length})
                        </div>
                        <ul className="mt-2 space-y-1 text-[11px] font-semibold leading-5 text-amber-50">
                          {apiValidateData.warnings.map((w, idx) => (
                            <li key={`${w.code}-${idx}`}>
                              <span className="text-amber-200">{w.code}</span>
                              <span className="text-amber-50/90"> — {w.message}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200/70">
                      Phase 2B: nur Validierung. Kein Notion-Write. Kein Commit. Kein Dispatcher.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 flex flex-wrap justify-end gap-3 border-t border-[#4a101b]/60 bg-[#080304]/95 px-5 py-4 md:-mx-9 md:-mb-9 md:px-9 md:py-5">
              <Button
                tone="ghost"
                onClick={() => {
                  if (apiPreviewAbortRef.current) apiPreviewAbortRef.current.abort();
                  if (apiValidateAbortRef.current) apiValidateAbortRef.current.abort();
                  apiPreviewAbortRef.current = null;
                  apiValidateAbortRef.current = null;
                  setApiPreviewLoading(false);
                  setApiValidateLoading(false);
                  setApiPreviewData(null);
                  setApiPreviewError(null);
                  setApiValidateData(null);
                  setApiValidateError(null);
                  setModal(null);
                }}
              >
                Schließen
              </Button>
            </div>
          </Modal>
        ) : null}


        {modal === 'planner' ? (
          <Modal size="wide" onClose={() => { setModal(null); setPlannerSelectedStepId(null); }}>
            <SectionTitle
              eyebrow="NOX Agent · Project Auto Planner"
              title="Lokaler Quest-Reihen-Entwurf"
              subtitle="Diese Quests sind lokale Entwürfe. Sie sind nicht in Notion, nicht in Master Tasks und nicht an Agenten übergeben."
            />

            <div className="mt-5 rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-200">Projektziel · lokaler Entwurf</div>
                  <p className="mt-1 text-sm font-bold leading-6 text-amber-50">
                    {projektZiel.trim() ? projektZiel : 'Kein Projektziel gesetzt — Generator hat Demo-Inhalte erzeugt.'}
                  </p>
                </div>
                <Button tone="secondary" className="!px-3 !py-1.5 !text-[11px]" onClick={() => regeneratePlan(projektZiel)}>
                  Plan neu erzeugen
                </Button>
              </div>
              <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
                Lokaler Entwurf · noch nicht erstellt · keine Notion-Speicherung
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
              <div className="overflow-hidden rounded-2xl border border-[#4a101b]/60">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#120609]/80 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200">
                    <tr>
                      <th className="w-10 px-3 py-3">#</th>
                      <th className="px-3 py-3">Schritt</th>
                      <th className="w-20 px-3 py-3">Risiko</th>
                      <th className="w-20 px-3 py-3 text-right">Order</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#eadbe2]">
                    {planSteps.map((row, idx) => {
                      const selected = plannerSelectedStepId === row.id;
                      return (
                        <tr
                          key={row.id}
                          onClick={() => setPlannerSelectedStepId(row.id)}
                          className={`cursor-pointer border-t border-[#4a101b]/40 transition ${selected ? 'bg-amber-300/10' : 'hover:bg-[#1a080d]'}`}
                        >
                          <td className="px-3 py-3 align-top font-black text-amber-200">{row.step}</td>
                          <td className="px-3 py-3 align-top">
                            <div className="font-semibold leading-5 text-amber-50">{row.title}</div>
                            <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200/80">
                              <span>Lokaler Entwurf</span>
                              {row.rating ? (
                                <span className={`rounded px-1.5 ${row.rating === 'gut' ? 'bg-emerald-400/15 text-emerald-200' : row.rating === 'unklar' ? 'bg-amber-300/15 text-amber-100' : 'bg-rose-400/15 text-rose-200'}`}>
                                  {row.rating === 'gut' ? 'Passt' : row.rating === 'unklar' ? 'Unklar' : 'Ändern'}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-3 py-3 align-top">
                            <Pill tone={row.risk === 'Hoch' ? 'red' : row.risk === 'Mittel' ? 'gold' : 'default'}>
                              {row.risk}
                            </Pill>
                          </td>
                          <td className="px-3 py-3 align-top">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                title="Nach oben"
                                disabled={idx === 0}
                                onClick={(event) => { event.stopPropagation(); moveStep(row.id, -1); }}
                                className="rounded-md border border-[#4a101b]/60 bg-[#120609]/70 px-1.5 py-0.5 text-[10px] font-black text-amber-200 disabled:cursor-not-allowed disabled:opacity-30"
                              >▲</button>
                              <button
                                type="button"
                                title="Nach unten"
                                disabled={idx === planSteps.length - 1}
                                onClick={(event) => { event.stopPropagation(); moveStep(row.id, 1); }}
                                className="rounded-md border border-[#4a101b]/60 bg-[#120609]/70 px-1.5 py-0.5 text-[10px] font-black text-amber-200 disabled:cursor-not-allowed disabled:opacity-30"
                              >▼</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#4a101b]/40 bg-[#0c0506]/60 px-3 py-2 text-[11px] font-semibold text-amber-100/80">
                  <span>{planSteps.length} Schritte · lokaler Entwurf · auto-saved</span>
                  <Button tone="ghost" className="!px-2 !py-1 !text-[11px]" onClick={addStep}>+ Schritt hinzufügen</Button>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-300/30 bg-[#0c0506]/70 p-5">
                {(() => {
                  const sel = plannerSelectedStepId ? planSteps.find((s) => s.id === plannerSelectedStepId) : null;
                  if (!sel) {
                    return (
                      <div className="text-sm font-semibold text-amber-100/70">
                        Klick auf einen Schritt links, um Titel, Ziel, Begründung, Output, Risiko und Feedback zu bearbeiten.
                      </div>
                    );
                  }
                  const inputClass =
                    'mt-1 w-full rounded-xl border border-amber-300/25 bg-[#120609]/80 px-3 py-2 text-sm font-semibold text-amber-50 outline-none transition placeholder:text-[#9f8588] focus:border-amber-300/70';
                  return (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-200">Schritt {sel.step} · Lokaler Entwurf</div>
                        <Button
                          tone="ghost"
                          className="!px-2 !py-1 !text-[11px]"
                          onClick={() => removeStep(sel.id)}
                        >
                          Schritt entfernen
                        </Button>
                      </div>

                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/90">Titel</div>
                        <input
                          value={sel.title}
                          onChange={(event) => updateStep(sel.id, { title: event.target.value })}
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/90">Ziel</div>
                        <textarea
                          value={sel.ziel}
                          rows={2}
                          onChange={(event) => updateStep(sel.id, { ziel: event.target.value })}
                          className={`${inputClass} resize-none`}
                        />
                      </div>

                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/90">Warum diese Quest?</div>
                        <textarea
                          value={sel.reason}
                          rows={2}
                          onChange={(event) => updateStep(sel.id, { reason: event.target.value })}
                          className={`${inputClass} resize-none`}
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/90">Ergebnis / Output</div>
                          <input
                            value={sel.output}
                            onChange={(event) => updateStep(sel.id, { output: event.target.value })}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/90">Risiko</div>
                          <select
                            value={sel.risk}
                            onChange={(event) => updateStep(sel.id, { risk: event.target.value as PlanStep['risk'] })}
                            style={{ colorScheme: 'dark' }}
                            className={inputClass}
                          >
                            <option value="Niedrig" style={{ backgroundColor: '#160709', color: '#fff7fb' }}>Niedrig</option>
                            <option value="Mittel" style={{ backgroundColor: '#160709', color: '#fff7fb' }}>Mittel</option>
                            <option value="Hoch" style={{ backgroundColor: '#160709', color: '#fff7fb' }}>Hoch</option>
                          </select>
                        </div>
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/90">Bearbeiter / Agent</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {AGENT_OPTIONS.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => updateStep(sel.id, { agent: opt })}
                                className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                                  sel.agent === opt
                                    ? 'border-amber-300/80 bg-amber-300/20 text-amber-50'
                                    : 'border-[#4a101b]/60 bg-[#120609]/70 text-amber-100/70 hover:border-amber-300/40'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/90">Operator-Check (optional)</div>
                          <input
                            value={sel.gate}
                            placeholder="z. B. Operator-Check vor Live-Run"
                            onChange={(event) => updateStep(sel.id, { gate: event.target.value })}
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-3">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200">Feedback an NOX</div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(['gut', 'unklar', 'aendern'] as PlanStepRating[]).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => updateStep(sel.id, { rating: sel.rating === r ? null : r })}
                              className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                                sel.rating === r
                                  ? r === 'gut'
                                    ? 'border-emerald-300/70 bg-emerald-400/20 text-emerald-100'
                                    : r === 'unklar'
                                      ? 'border-amber-300/70 bg-amber-300/20 text-amber-100'
                                      : 'border-rose-400/70 bg-rose-400/20 text-rose-100'
                                  : 'border-[#4a101b]/60 bg-[#120609]/70 text-amber-100/70 hover:border-amber-300/40'
                              }`}
                            >
                              {r === 'gut' ? 'Passt' : r === 'unklar' ? 'Unklar' : 'Ändern'}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={sel.feedback}
                          rows={2}
                          placeholder="Was soll NOX an diesem Schritt anpassen? Kürzer, technischer, business-lastiger?"
                          onChange={(event) => updateStep(sel.id, { feedback: event.target.value })}
                          className={`${inputClass} mt-2 resize-none`}
                        />
                        <div className="mt-2 text-[11px] font-semibold leading-5 text-amber-100/80">
                          Phase 1: Feedback bleibt lokal. Später nutzt NOX Agent dieses Feedback zur besseren Quest-Erzeugung.
                        </div>
                      </div>

                      <div className="rounded-xl border border-amber-300/25 bg-amber-300/5 p-3 text-[12px] font-semibold leading-5 text-amber-100">
                        Hinweis: Lokaler Entwurf · noch nicht in Notion / Master Tasks · nicht an Agenten übergeben.
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm font-semibold leading-6 text-amber-50">
              Phase 1: lokaler Entwurf. Echte Quest-Erzeugung erfolgt später über NOX Agent nach Operator-Freigabe.
              Kein Notion-Write, kein Dispatcher, kein Telegram-Trigger, kein Agent-Run.
            </div>

            <div className="sticky bottom-0 -mx-5 -mb-5 mt-6 flex flex-wrap justify-end gap-3 border-t border-[#4a101b]/60 bg-[#080304]/95 px-5 py-4 md:-mx-9 md:-mb-9 md:px-9 md:py-5">
              <Button tone="secondary" onClick={copyPlanToClipboard}>
                Entwurf kopieren
              </Button>
              <span title="Phase 2 — Quest-Erzeugung folgt später über NOX Agent.">
                <Button tone="ghost" disabled className="!cursor-not-allowed !opacity-50">
                  Später als Quest erzeugen (Phase 2)
                </Button>
              </span>
              <Button tone="ghost" onClick={() => { setModal(null); setPlannerSelectedStepId(null); }}>Schließen</Button>
              <Button onClick={vormerkenAlsPlanOutput}>Als Plan-Output vormerken</Button>
            </div>
          </Modal>
        ) : null}

        {modal === 'approvals' ? (
          <Modal onClose={() => setModal(null)}>
            <SectionTitle
              eyebrow="Freigabe-Gate"
              title={`Freigaben pruefen — ${project.code}`}
              subtitle="Projekt-/quest-bezogen. Aktionen sind in Phase 1 deaktiviert."
            />
            {projectApprovals.length > 0 ? (
              <div className="mt-6 space-y-4">
                {projectApprovals.map((approval) => (
                  <div key={approval.id} className="rounded-2xl border border-[#4a101b]/60 bg-[#120609]/70 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/80">{approval.id}</div>
                        <h3 className="mt-1 text-lg font-black leading-tight text-[#fff7fb]">{approval.title}</h3>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#eadbe2]">{approval.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Pill tone={approval.risk === 'Hoch' ? 'red' : approval.risk === 'Mittel' ? 'gold' : 'default'}>
                          Risiko: {approval.risk}
                        </Pill>
                        <Pill tone={approval.status === 'Blockiert' ? 'red' : 'default'}>{approval.status}</Pill>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/5 p-4 text-sm font-semibold leading-6 text-amber-50">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/80">Empfehlung NOX Agent:</span>{' '}
                      {approvalRecommendation(approval)}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button tone="ghost" disabled className="!cursor-not-allowed !opacity-50">
                        Freigeben (Phase 2)
                      </Button>
                      <Button tone="ghost" disabled className="!cursor-not-allowed !opacity-50">
                        Rückfrage stellen (Phase 2)
                      </Button>
                      <Button tone="ghost" disabled className="!cursor-not-allowed !opacity-50">
                        Ablehnen (Phase 2)
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-[#4a101b]/60 bg-[#120609]/35 p-6 text-center text-sm font-bold text-[#9f8d95]">
                Keine offenen Freigaben für dieses Projekt.
              </div>
            )}
            <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm font-semibold leading-6 text-amber-50">
              Phase 1: lokale Anzeige. Echte Freigaben laufen später ueber NOX Agent nach Operator-Klick mit Audit-Log
              und HMAC-geschuetztem Backend.
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setModal(null)}>Schließen</Button>
            </div>
          </Modal>
        ) : null}

        {outputDetail ? (
          <Modal onClose={() => setOutputDetail(null)}>
            <SectionTitle
              eyebrow={`${outputDetail.outputType} · Read-only`}
              title={outputDetail.title}
              subtitle="Detailansicht eines Output-Eintrags. Phase 1: rein lokal."
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <MiniStat label="Typ" value={outputDetail.outputType} />
              <MiniStat label="Version" value={outputDetail.version} />
              <MiniStat label="Status" value={outputDetail.status} />
              <MiniStat label="Speicherort" value={outputDetail.storage} />
              <MiniStat label="Projekt" value={outputDetail.project} />
            </div>
            <div className="mt-5 rounded-2xl border border-[#4a101b]/60 bg-[#120609]/70 p-4">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/80">Beschreibung</div>
              <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-[#eadbe2]">{outputDetail.description}</p>
            </div>
            <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm font-semibold leading-6 text-amber-50">
              Phase 1: read-only. Persistenz, Drive- und Notion-Sync folgen später nach Operator-Freigabe.
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-[#4a101b]/50 pt-6">
              <Button onClick={() => setOutputDetail(null)}>Schließen</Button>
            </div>
          </Modal>
        ) : null}

        {modal === 'outputsViewer' ? (
          <Modal onClose={() => setModal(null)}>
            <SectionTitle
              eyebrow="Output · Read-only"
              title={`Outputs ansehen — ${project.code}`}
              subtitle="Read-only Anzeige der lokalen Outputs/Artefakte für dieses Projekt."
            />
            {projectOutputs.length > 0 ? (
              <div className="mt-6 space-y-4">
                {projectOutputs.map((output) => (
                  <div key={output.id} className="rounded-2xl border border-[#4a101b]/60 bg-[#120609]/70 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/80">{output.outputType}</div>
                        <h3 className="mt-1 text-lg font-black leading-tight text-[#fff7fb]">{output.title}</h3>
                        <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-[#eadbe2]">{output.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Pill tone={output.status === 'Active' ? 'gold' : 'default'}>{output.status}</Pill>
                        <Pill>{output.version}</Pill>
                      </div>
                    </div>
                    <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9f8d95]">
                      Speicherort: {output.storage}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-[#4a101b]/60 bg-[#120609]/35 p-6 text-center text-sm font-bold text-[#9f8d95]">
                Noch keine Outputs für dieses Projekt. Lokal anlegen ueber das Talk-Modal oder das Output-Modal.
              </div>
            )}
            <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm font-semibold leading-6 text-amber-50">
              Phase 1: read-only. NOX Agent erzeugt später automatische Artefakte (Plan, Report, Design, Code-Änderung,
              Review-Ergebnis) nach Operator-Freigabe.
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button tone="ghost" onClick={() => setModal('output')}>Neuen Output anlegen</Button>
              <Button onClick={() => setModal(null)}>Schließen</Button>
            </div>
          </Modal>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function UnifiedAutoPlanner({
  value,
  onChange,
  onTalk,
  onPlan,
  onUseDemoGoal,
  onApiPreview,
  onOutputsViewer,
  onReset,
  onDeleteDraft,
  onAudit,
  onOutputCreate,
  stepCount,
  approvalsCount,
  outputsCount,
  questsCount,
  restoredAt,
  onDismissRestoreNotice,
  emptyGoalHint,
  techCheckStatus,
  techCheckSummary,
  onCommitOpen,
  writeEnabledHint,
  commitStatus,
  commitMessage,
  wouldCreateNTasks,
  onReduceToOne,
  isPlanStale,
  validatedStepCount,
  onRevalidate,
}: {
  value: string;
  onChange: (next: string) => void;
  onTalk: () => void;
  onPlan: () => void;
  onUseDemoGoal: () => void;
  onApiPreview: () => void;
  onOutputsViewer: () => void;
  onReset: () => void;
  onDeleteDraft: () => void;
  onAudit: () => void;
  onOutputCreate: () => void;
  stepCount: number;
  approvalsCount: number;
  outputsCount: number;
  questsCount: number;
  restoredAt: string | null;
  onDismissRestoreNotice: () => void;
  emptyGoalHint: boolean;
  // Phase 2D-UI — Background tech-check status. Drives the inline status
  // banner and conditional rendering of the commit button.
  techCheckStatus: 'idle' | 'running' | 'ready' | 'not-ready' | 'auth-blocked' | 'error';
  // Optional one-line summary the parent passes through (e.g. count of
  // missing properties, validate error code).
  techCheckSummary?: string;
  // Opens the commit confirm modal. Parent decides when this is allowed.
  onCommitOpen: () => void;
  // True if the last commit attempt returned `writes_locked` so the inline
  // banner can stay loud without spawning a separate alert.
  writeEnabledHint?: 'unknown' | 'locked' | 'enabled';
  // Phase 2D-UI — Commit attempt status, drives the second inline banner.
  commitStatus: 'idle' | 'running' | 'committed' | 'writes_locked' | 'duplicate' | 'auth-blocked' | 'error';
  commitMessage?: string;
  // UX-safety — pass the would-create count from /plan/validate (or the
  // local plan-step count as a fallback) so the commit CTA can label the
  // exact number of quests it would create. Default-undefined keeps the
  // label as the legacy "Quests erzeugen" wording.
  wouldCreateNTasks?: number;
  // Optional safety affordance: reduce the local plan draft to a single
  // step. Surfaced only when the count is >1, never auto-fires. No
  // backend or Notion call.
  onReduceToOne?: () => void;
  // Stateflow-Digest-Fix — true when the local plan has diverged from the
  // last validated snapshot. The CTA gets disabled and a re-validate
  // affordance is surfaced instead of letting the operator hit the
  // server-side digest mismatch.
  isPlanStale?: boolean;
  // Step count the server validated. When this differs from the current
  // local plan-step count, the banner spells out both numbers.
  validatedStepCount?: number | null;
  // Trigger a fresh preview+validate chain from the CTA. Wired by the
  // parent to handleApiPreview (which auto-chains to validate).
  onRevalidate?: () => void;
}) {
  // Phase-1 unified Project Auto Planner. Combines the project-goal
  // composer and the planner action buttons into one card so the user
  // doesn't see two near-identical CTA surfaces. Pure UI on top of the
  // local React state — no API, no Notion, no backend.
  const restoredAtLabel = restoredAt
    ? new Date(restoredAt).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;
  return (
    <Card className="!p-5 md:!p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-amber-200/90">NOX Agent</span>
            <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-100">
              Phase 1 · lokaler Entwurf · keine Notion-Speicherung
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-black leading-tight text-amber-50 md:text-3xl">Project Auto Planner</h2>
          <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-[#d6c2cc]">
            Schreib ein konkretes Projektziel. Der lokale, regelbasierte Generator (keine KI, keine API) macht daraus eine
            editierbare Quest-Reihe. Änderungen werden automatisch lokal in deinem Browser gespeichert.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Pill>{questsCount} Quests</Pill>
          <Pill tone={approvalsCount > 0 ? 'red' : 'gold'}>{approvalsCount} offene Freigaben</Pill>
          <Pill tone="gold">{outputsCount} Outputs</Pill>
          <Pill>{stepCount} Schritte im Entwurf</Pill>
        </div>
      </div>

      {restoredAt ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-[12px] font-semibold leading-5 text-cyan-100">
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-200/90">Lokaler Entwurf wiederhergestellt</span>
            {restoredAtLabel ? <span className="text-cyan-100/85">Stand: {restoredAtLabel}</span> : null}
          </div>
          <button
            type="button"
            onClick={onDismissRestoreNotice}
            className="rounded-md border border-cyan-300/40 bg-cyan-300/5 px-2 py-1 text-[11px] font-bold text-cyan-100 transition hover:bg-cyan-300/15"
          >
            OK
          </button>
        </div>
      ) : null}

      <div className="mt-5">
        <label className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-200/90">Projektziel</label>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          placeholder="Beschreibe ein Ziel, z. B. Dropshipping-Test in 30 Tagen starten oder NOX Agent in echte Quest-Erzeugung bringen."
          className="mt-2 w-full resize-none rounded-2xl border border-amber-300/25 bg-gradient-to-br from-[#1a0a0d] to-[#0a0405] px-4 py-3 text-sm font-semibold leading-6 text-amber-50 outline-none transition placeholder:text-[#9f8588] focus:border-amber-300/70"
        />
        {emptyGoalHint ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/50 bg-amber-300/15 px-4 py-3 text-sm font-bold leading-5 text-amber-50">
            <span>Bitte erst ein Projektziel eingeben.</span>
            <Button tone="secondary" className="!px-3 !py-1.5 !text-[12px]" onClick={onUseDemoGoal}>
              Demo-Ziel verwenden
            </Button>
          </div>
        ) : null}
      </div>

      {/* Phase 2D-UI — Compact tech-check status banner. Replaces the
          previous developer-style "Technische Prüfung jetzt starten"
          handhold. Auto-fires after `Quest-Reihe entwerfen` finishes; the
          operator only sees a single colour-coded line and (when ready)
          the conscious "Quests in Notion erzeugen" button. */}
      {stepCount > 0 ? (
        <div
          className={(() => {
            const base =
              'mt-4 flex flex-col gap-3 rounded-2xl border px-4 py-3 text-[12px] font-semibold leading-5 md:flex-row md:items-center md:justify-between';
            if (isPlanStale) {
              // Stateflow-Digest-Fix — the whole banner turns rose the
              // moment the plan diverges, so the operator cannot misread
              // a leftover "Bereit …" state.
              return `${base} border-rose-400/55 bg-rose-400/10 text-rose-50`;
            }
            switch (techCheckStatus) {
              case 'ready':
                return `${base} border-emerald-300/40 bg-emerald-400/10 text-emerald-50`;
              case 'not-ready':
                return `${base} border-amber-300/40 bg-amber-300/10 text-amber-50`;
              case 'running':
                return `${base} border-cyan-300/40 bg-cyan-300/10 text-cyan-50`;
              case 'auth-blocked':
                return `${base} border-rose-300/40 bg-rose-300/10 text-rose-50`;
              case 'error':
                return `${base} border-rose-300/40 bg-rose-300/10 text-rose-50`;
              case 'idle':
              default:
                return `${base} border-[#4a101b]/55 bg-[#0c0507]/65 text-[#bfa9b3]`;
            }
          })()}
        >
          <div className="flex min-w-0 flex-col gap-1">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.22em]">
              Technische Prüfung
            </div>
            <div className="text-[13px] font-black">
              {isPlanStale
                ? 'Plan wurde geändert — erneute Prüfung nötig'
                : techCheckStatus === 'ready'
                  ? 'Bereit für Notion-Erzeugung'
                  : techCheckStatus === 'not-ready'
                    ? 'Schema nicht bereit'
                    : techCheckStatus === 'running'
                      ? 'Prüfung läuft …'
                      : techCheckStatus === 'auth-blocked'
                        ? 'Operator-Key erforderlich'
                        : techCheckStatus === 'error'
                          ? 'Prüfung fehlgeschlagen'
                          : 'Noch nicht geprüft'}
            </div>
            {techCheckSummary ? (
              <div className="text-[11px] font-semibold opacity-80">{techCheckSummary}</div>
            ) : null}
            {writeEnabledHint === 'locked' ? (
              <div className="text-[11px] font-bold text-amber-200">
                Hinweis: Writes serverseitig gesperrt (NOX_NOTION_WRITE_ENABLED ≠ true).
              </div>
            ) : null}
            {/* Stateflow-Digest-Fix — explicit "plan changed since last
                validate" banner. Renders as soon as the operator mutates
                the plan after a validate landed. The CTA below is also
                disabled in this state. */}
            {isPlanStale ? (
              <div className="mt-2 rounded-2xl border border-rose-400/60 bg-rose-400/15 px-3 py-2 text-[12px] font-bold leading-5 text-rose-50">
                Plan wurde lokal geändert
                {typeof validatedStepCount === 'number'
                  ? ` (validiert: ${validatedStepCount}, lokal jetzt: ${stepCount})`
                  : ''}
                . Vor dem Commit bitte erneut „Technisch prüfen" laufen lassen.
                {onRevalidate ? (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={onRevalidate}
                      title="Startet einen frischen Preview+Validate-Lauf mit dem aktuellen lokalen Plan. Keine Notion-Writes."
                      className="underline decoration-rose-200/80 underline-offset-2 hover:text-rose-100"
                    >
                      Jetzt erneut prüfen
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
            {/* UX-safety — surface the exact count BEFORE the button so the
                operator can't think they're committing a single quest when
                the validate response actually said 7. The warning only
                renders for >1, and the optional reducer is offered next to
                it. No backend or Notion call. */}
            {techCheckStatus === 'ready' && !isPlanStale && (wouldCreateNTasks ?? 0) >= 2 ? (
              <div className="mt-2 rounded-2xl border border-amber-400/60 bg-amber-400/15 px-3 py-2 text-[12px] font-bold leading-5 text-amber-50">
                Achtung: Dieser Commit würde {wouldCreateNTasks} Quests erzeugen.
                {onReduceToOne ? (
                  <>
                    {' '}Für den Smoke-Test bitte zuerst{' '}
                    <button
                      type="button"
                      onClick={onReduceToOne}
                      title="Reduziert den lokalen Plan-Entwurf auf den ersten Schritt. Kein Notion-Write, kein Backend-Call."
                      className="underline decoration-amber-200/80 underline-offset-2 hover:text-amber-100"
                    >
                      auf 1 Smoke-Quest reduzieren
                    </button>
                    {' '}und danach erneut „Technisch prüfen".
                  </>
                ) : (
                  ' Für den Smoke-Test bitte vorher auf 1 Quest reduzieren und erneut prüfen.'
                )}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            {techCheckStatus === 'ready' && !isPlanStale ? (
              <Button
                onClick={onCommitOpen}
                disabled={commitStatus === 'running'}
                title={
                  commitStatus === 'running'
                    ? 'Commit läuft — bitte warten.'
                    : typeof wouldCreateNTasks === 'number'
                      ? `Erzeugt ${wouldCreateNTasks} echte Master-Tasks-Quest${wouldCreateNTasks === 1 ? '' : 's'} in Notion. Idempotenz-Check + Schema-Recheck laufen serverseitig.`
                      : 'Erzeugt echte Master-Tasks-Quests in Notion.'
                }
              >
                {commitStatus === 'running'
                  ? 'Commit läuft …'
                  : typeof wouldCreateNTasks === 'number'
                    ? `${wouldCreateNTasks} ${wouldCreateNTasks === 1 ? 'Quest' : 'Quests'} erzeugen`
                    : 'Quests erzeugen'}
              </Button>
            ) : null}
            {isPlanStale && onRevalidate ? (
              <Button
                onClick={onRevalidate}
                title="Startet einen frischen Preview+Validate-Lauf mit dem aktuellen lokalen Plan. Keine Notion-Writes."
              >
                Erneut technisch prüfen
              </Button>
            ) : null}
            {techCheckStatus !== 'idle' || isPlanStale ? (
              <Button tone="ghost" className="!px-3 !py-2 !text-xs" onClick={onApiPreview}>
                Technische Details
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Phase 2D-UI — Commit result banner. One-line status that mirrors
          the four documented outcomes (committed / writes_locked / 401 /
          duplicate / error). Stays out of the way when nothing has been
          attempted yet. */}
      {commitStatus !== 'idle' ? (
        <div
          className={(() => {
            const base =
              'mt-3 rounded-2xl border px-4 py-3 text-[12px] font-bold leading-5';
            switch (commitStatus) {
              case 'committed':
                return `${base} border-emerald-300/40 bg-emerald-400/10 text-emerald-50`;
              case 'duplicate':
                return `${base} border-cyan-300/40 bg-cyan-300/10 text-cyan-50`;
              case 'writes_locked':
                return `${base} border-amber-300/40 bg-amber-300/10 text-amber-50`;
              case 'auth-blocked':
              case 'error':
                return `${base} border-rose-300/40 bg-rose-300/10 text-rose-50`;
              case 'running':
              default:
                return `${base} border-cyan-300/40 bg-cyan-300/10 text-cyan-50`;
            }
          })()}
        >
          {commitMessage ?? '—'}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#4a101b]/40 pt-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onTalk}
            title="Öffnet einen lokalen Demo-Dialog. Kein echter Agent, kein API-Call, keine Notion-Speicherung."
          >
            Mit NOX besprechen (Demo)
          </Button>
          <Button tone="ghost" onClick={onPlan}>Quest-Reihe entwerfen</Button>
          <Button tone="ghost" onClick={onApiPreview}>Technisch prüfen</Button>
          <Button tone="ghost" onClick={onOutputsViewer}>Outputs ansehen</Button>
          <Button tone="ghost" onClick={onReset}>Zurücksetzen</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button tone="secondary" className="!px-3 !py-2 !text-xs" onClick={onAudit}>Projektkontext-Audit</Button>
          <Button tone="secondary" className="!px-3 !py-2 !text-xs" onClick={onOutputCreate}>Output anlegen</Button>
          <Button tone="secondary" className="!px-3 !py-2 !text-xs" onClick={onDeleteDraft}>Lokalen Entwurf löschen</Button>
        </div>
      </div>
    </Card>
  );
}

function DecisionBlockers({
  project,
  approvals,
  recommend,
}: {
  project: Project;
  approvals: Approval[];
  recommend: (approval: Approval) => string;
}) {
  const total = project.blockers.length + approvals.length;
  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle eyebrow="Entscheidungen" title="Offene Entscheidungen & Blocker" />
        <Pill tone={total > 0 ? 'red' : 'gold'}>{total}</Pill>
      </div>

      {project.blockers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {project.blockers.map((blocker) => (
            <div key={blocker.id} className="rounded-2xl border border-[#4a101b]/60 bg-[#120609]/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-black text-[#fff7fb]">{blocker.title}</h3>
                <Pill tone={blocker.status === 'Fehlt' ? 'red' : 'default'}>{blocker.status}</Pill>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-[#eadbe2]">{blocker.why}</p>
              <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm font-bold leading-6 text-amber-50">{blocker.nextStep}</div>
            </div>
          ))}
        </div>
      ) : null}

      {approvals.length > 0 ? (
        <div className={`${project.blockers.length > 0 ? 'mt-6' : ''} space-y-4`}>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-amber-200/80">Freigaben in diesem Projekt</div>
          {approvals.map((approval) => (
            <div key={approval.id} className="rounded-2xl border border-[#4a101b]/60 bg-[#120609]/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/80">{approval.id}</div>
                  <h3 className="mt-1 text-lg font-black leading-tight text-[#fff7fb]">{approval.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#eadbe2]">{approval.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Pill tone={approval.risk === 'Hoch' ? 'red' : approval.risk === 'Mittel' ? 'gold' : 'default'}>
                    Risiko: {approval.risk}
                  </Pill>
                  <Pill tone={approval.status === 'Blockiert' ? 'red' : 'default'}>{approval.status}</Pill>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/5 p-4 text-sm font-semibold leading-6 text-amber-50">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/80">Empfehlung NOX Agent:</span>{' '}
                {recommend(approval)}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button tone="ghost" disabled className="!cursor-not-allowed !opacity-50">
                  Freigeben (Phase 2)
                </Button>
                <Button tone="ghost" disabled className="!cursor-not-allowed !opacity-50">
                  Rückfrage stellen (Phase 2)
                </Button>
                <Button tone="ghost" disabled className="!cursor-not-allowed !opacity-50">
                  Ablehnen (Phase 2)
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {total === 0 ? (
        <div className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-5 text-base font-bold text-amber-50">
          Keine kritischen Blocker. Nächste Aktion weiter ausführbar.
        </div>
      ) : null}
    </Card>
  );
}

function LinkedQuests({ quests: projectQuests, openQuest }: { quests: Quest[]; openQuest: (questId: string) => void }) {
  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle eyebrow="Quests" title="Verknüpfte Quests" />
        <Pill tone="gold">{projectQuests.length}</Pill>
      </div>

      {projectQuests.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {projectQuests.map((quest) => (
            <button
              key={quest.id}
              type="button"
              onClick={() => openQuest(quest.id)}
              className="rounded-2xl border border-[#4a101b]/60 bg-[#120609]/80 p-5 text-left transition hover:border-[#7a1526]/80 hover:bg-[#1a080d]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-[#9f8d95]">{quest.code}</div>
                  <h3 className="mt-2 text-lg font-black text-[#fff7fb]">{quest.title}</h3>
                </div>
                <Pill tone={quest.priority === 'Hoch' ? 'red' : 'gold'}>{quest.status}</Pill>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-[#eadbe2]">{quest.goal}</p>
              <div className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-amber-100">Details vorbereitet</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#4a101b]/60 bg-[#120609]/35 p-6 text-center text-sm font-bold text-[#9f8d95]">
          Aktuell keine verknüpften Quests für dieses Projekt.
        </div>
      )}
    </Card>
  );
}

function OutputsSection({
  outputs,
  project,
  registerDemoAction,
  onOpenDetail,
}: {
  outputs: OutputArtifact[];
  project: Project;
  registerDemoAction: (project: string, title: string) => void;
  onOpenDetail: (output: OutputArtifact) => void;
}) {
  // Tabular, database-like view. Phase 1: row actions are local-only
  // demo no-ops (no Drive write, no Notion write, no real download).
  const actions = ['Öffnen', 'Aktualisieren', 'In Google Drive speichern', 'In Notion speichern', 'Herunterladen'];
  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle eyebrow="Outputs" title="Outputs & Artefakte" subtitle="Tabellarische Übersicht aller Projekt-Artefakte. Phase 1: Aktionen lokal/Demo." />
        <Pill tone="gold">{outputs.length}</Pill>
      </div>

      {outputs.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-[#4a101b]/60 bg-[#0c0506]/60">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#120609]/80 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-200/80">
              <tr>
                <th className="px-3 py-3">Typ</th>
                <th className="px-3 py-3">Titel</th>
                <th className="px-3 py-3">Version</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Speicherort</th>
                <th className="px-3 py-3">Projekt</th>
                <th className="px-3 py-3">Aktionen</th>
              </tr>
            </thead>
            <tbody className="text-[#eadbe2]">
              {outputs.map((output) => (
                <tr key={output.id} className="border-t border-[#4a101b]/40 hover:bg-[#1a080d]/60">
                  <td className="px-3 py-3 align-top">
                    <Pill>{output.outputType}</Pill>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(output)}
                      className="text-left font-bold text-[#fff7fb] underline-offset-2 hover:underline"
                    >
                      {output.title}
                    </button>
                  </td>
                  <td className="px-3 py-3 align-top text-[#cbbbc3]">{output.version}</td>
                  <td className="px-3 py-3 align-top">
                    <Pill tone={output.status === 'Active' ? 'gold' : 'default'}>{output.status}</Pill>
                  </td>
                  <td className="px-3 py-3 align-top text-[#cbbbc3]">{output.storage}</td>
                  <td className="px-3 py-3 align-top text-[#cbbbc3]">{output.project}</td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <span key={action} title="Phase 1: lokale Demo-Aktion. Persistenz folgt später.">
                          <Button
                            tone="secondary"
                            className="!px-2 !py-1 !text-[11px]"
                            onClick={() => {
                              if (action === 'Öffnen') {
                                onOpenDetail(output);
                              } else {
                                registerDemoAction(project.id, `${action}: ${output.title}`);
                              }
                            }}
                          >
                            {action}
                          </Button>
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#4a101b]/60 bg-[#120609]/35 p-6 text-center text-sm font-bold text-[#9f8d95]">
          Noch keine Outputs für dieses Projekt. Nutze "Output anlegen", um lokal einen Draft anzulegen.
        </div>
      )}
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#4a101b]/50 bg-black/35 p-3">
      <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9f8d95]">{label}</div>
      <div className="mt-1 break-words text-sm font-bold text-[#fff7fb]">{value}</div>
    </div>
  );
}

function MilestonesSection({ milestones }: { milestones: Milestone[] }) {
  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle eyebrow="Historie" title="Projekt-Meilensteine" />
        <Pill tone="gold">{milestones.length}</Pill>
      </div>

      <div className="space-y-4">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="grid gap-4 rounded-2xl border border-[#4a101b]/60 bg-black/35 p-5 md:grid-cols-[120px_1fr]">
            <div>
              <div className="text-sm font-black text-amber-200">{milestone.dateLabel}</div>
              <div className="mt-2">
                <Pill>{milestone.type}</Pill>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black text-[#fff7fb]">{milestone.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#eadbe2]">{milestone.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Modal({
  children,
  onClose,
  size = 'default',
  closeGuard,
}: {
  children: ReactNode;
  onClose: () => void;
  size?: 'default' | 'wide' | 'chat';
  /**
   * Optional gate to prevent accidental ESC / backdrop dismiss when there is
   * unsaved input in the modal. Return `true` to allow close, `false` to
   * keep the modal open. The explicit "Schließen" button bypasses this.
   */
  closeGuard?: () => boolean;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (closeGuard && !closeGuard()) return;
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, closeGuard]);

  const sizeClass =
    size === 'chat'
      ? 'w-full max-w-[min(1320px,calc(100vw-32px))] md:max-w-[min(1320px,calc(100vw-64px))]'
      : size === 'wide'
        ? 'w-full max-w-[min(1200px,calc(100vw-32px))] md:max-w-[min(1200px,calc(100vw-96px))]'
        : 'w-full max-w-4xl';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-[#030101]/86 px-3 py-6 backdrop-blur-md md:items-center md:px-6 md:py-10"
      onMouseDown={() => {
        if (closeGuard && !closeGuard()) return;
        onClose();
      }}
    >
      <motion.div
        initial={{ y: 18, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 18, scale: 0.97 }}
        className={`${sizeClass} my-auto flex max-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-[2rem] border border-[#7a1526]/70 bg-[#080304] shadow-[0_0_80px_rgba(122,21,38,0.45)] md:max-h-[calc(100vh-5rem)]`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto p-5 md:p-9">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function QuestCenter({
  quests,
  approvals,
  activateQuest,
  deactivateQuest,
  assignQuestProject,
  assignQuestAgent,
  createQuestDraft,
  openQuest,
}: {
  quests: Quest[];
  approvals: Approval[];
  activateQuest: (questId: string) => void;
  deactivateQuest: (questId: string) => void;
  assignQuestProject: (questId: string, projectId: string) => void;
  assignQuestAgent: (questId: string, agent: string) => void;
  createQuestDraft: (input: { text: string; project: string; priority: string; agent: string }) => void;
  openQuest: (questId: string) => void;
  openProject: (projectId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('Alle Projekte');
  const [statusFilter, setStatusFilter] = useState('Alle');
  const [agentFilter, setAgentFilter] = useState('Alle');
  const [priorityFilter, setPriorityFilter] = useState('Alle');
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftProject, setDraftProject] = useState(projects[0].id);
  const [draftPriority, setDraftPriority] = useState('Normal');
  const [draftAgent, setDraftAgent] = useState('NOX');

  const stats = {
    all: quests.length,
    open: quests.filter((quest) => !quest.active && quest.status === 'Offen').length,
    active: quests.filter((quest) => quest.active || quest.status === 'Aktiv').length,
    review: quests.filter((quest) => quest.status === 'Pruefung noetig' || quest.requiresApproval).length,
    done: quests.filter((quest) => quest.status === 'Erledigt').length,
    blocked: quests.filter((quest) => quest.status === 'Blockiert').length,
  };

  const filteredQuests = quests.filter((quest) => {
    const search = query.trim().toLowerCase();
    const project = projects.find((item) => item.id === quest.project);
    const haystack = [quest.code, quest.title, quest.goal, quest.notes, quest.agent, project?.name ?? quest.project].join(' ').toLowerCase();
    const matchesSearch = !search || haystack.includes(search);
    const matchesProject = projectFilter === 'Alle Projekte' || quest.project === projectFilter;
    const effectiveStatus = questStatus(quest);
    const matchesStatus = statusFilter === 'Alle' || effectiveStatus === statusFilter || quest.status === statusFilter;
    const matchesAgent = agentFilter === 'Alle' || quest.agent === agentFilter;
    const matchesPriority = priorityFilter === 'Alle' || quest.priority === priorityFilter;
    return matchesSearch && matchesProject && matchesStatus && matchesAgent && matchesPriority;
  });

  function submitDraft() {
    createQuestDraft({ text: draftText, project: draftProject, priority: draftPriority, agent: draftAgent });
    setDraftText('');
    setDraftProject(projects[0].id);
    setDraftPriority('Normal');
    setDraftAgent('NOX');
    setDraftModalOpen(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <SectionTitle
          eyebrow="Global"
          title="Quest-Zentrale"
          subtitle="Alle Aufgaben, Agenten-Übergaben, Freigaben und Projekt-Quests an einem Ort."
        />
        <Button onClick={() => setDraftModalOpen(true)}>Neue Quest vormerken</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <QuestStat label="Alle Quests" value={stats.all} tone="gold" />
        <QuestStat label="Offen" value={stats.open} />
        <QuestStat label="Aktiv" value={stats.active} tone="gold" />
        <QuestStat label="Pruefung noetig" value={stats.review} tone="red" />
        <QuestStat label="Erledigt" value={stats.done} />
        <QuestStat label="Blockiert" value={stats.blocked} tone="red" />
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,1.4fr)_repeat(4,minmax(160px,1fr))]">
          <div>
            <FieldLabel>Suche</FieldLabel>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Quest suchen..."
              className="w-full rounded-2xl border border-[#4a101b]/70 bg-[#120609] p-4 text-sm font-bold text-[#fff7fb] outline-none placeholder:text-[#7f6b73] focus:border-amber-300/70"
            />
          </div>
          <FilterSelect label="Projekt" value={projectFilter} onChange={setProjectFilter} options={['Alle Projekte', ...projects.map((project) => project.id)]} renderOption={(value) => (value === 'Alle Projekte' ? value : `${value} - ${projectName(value)}`)} />
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={statusFilterOptions} />
          <FilterSelect label="Agent" value={agentFilter} onChange={setAgentFilter} options={['Alle', ...agentOptions]} />
          <FilterSelect label="Priorität" value={priorityFilter} onChange={setPriorityFilter} options={['Alle', ...priorityOptions]} />
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        {filteredQuests.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            approvalCount={approvals.filter((approval) => approval.questId === quest.id).length}
            activateQuest={activateQuest}
            deactivateQuest={deactivateQuest}
            assignQuestProject={assignQuestProject}
            assignQuestAgent={assignQuestAgent}
            openQuest={openQuest}
          />
        ))}
      </div>

      {filteredQuests.length === 0 ? (
        <Card>
          <div className="text-center text-base font-bold text-[#9f8d95]">Keine Quests passen zu den aktuellen Filtern.</div>
        </Card>
      ) : null}

      <AnimatePresence>
        {draftModalOpen ? (
          <Modal onClose={() => setDraftModalOpen(false)}>
            <SectionTitle eyebrow="NOX" title="Neue Quest vormerken" />
            <div className="mt-7 space-y-5">
              <textarea
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                placeholder="Beschreibe die Aufgabe, Idee oder Änderung..."
                className="min-h-[180px] w-full resize-none rounded-2xl border border-[#4a101b]/70 bg-[#120609] p-5 text-base font-semibold leading-8 text-[#fff7fb] outline-none placeholder:text-[#7f6b73] focus:border-amber-300/70"
              />
              <div className="grid gap-4 md:grid-cols-3">
                <FilterSelect label="Projekt" value={draftProject} onChange={setDraftProject} options={projects.map((project) => project.id)} renderOption={(value) => `${value} - ${projectName(value)}`} />
                <FilterSelect label="Priorität" value={draftPriority} onChange={setDraftPriority} options={priorityOptions} />
                <FilterSelect label="Agent" value={draftAgent} onChange={setDraftAgent} options={agentOptions} />
              </div>
              <div className="flex flex-wrap justify-end gap-3 border-t border-[#4a101b]/50 pt-6">
                <Button tone="ghost" onClick={() => setDraftModalOpen(false)}>Schließen</Button>
                <Button onClick={submitDraft} disabled={!draftText.trim()}>Quest-Draft erzeugen</Button>
              </div>
            </div>
          </Modal>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function QuestStat({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'gold' | 'red' }) {
  const className = tone === 'red'
    ? 'border-red-500/35 bg-red-500/10 text-red-100'
    : tone === 'gold'
      ? 'border-amber-300/35 bg-amber-300/12 text-amber-50'
      : 'border-[#4a101b]/60 bg-[#120609]/70 text-[#fff7fb]';

  return (
    <div className={cx('rounded-2xl border p-5', className)}>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#9f8d95]">{label}</div>
      <div className="mt-3 text-4xl font-black">{value}</div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  renderOption,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  renderOption?: (value: string) => string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#4a101b]/70 bg-[#120609] p-4 text-sm font-bold text-[#fff7fb] outline-none focus:border-amber-300/70"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {renderOption ? renderOption(option) : option}
          </option>
        ))}
      </select>
    </div>
  );
}

function QuestCard({
  quest,
  approvalCount,
  activateQuest,
  deactivateQuest,
  assignQuestProject,
  assignQuestAgent,
  openQuest,
}: {
  quest: Quest;
  approvalCount: number;
  activateQuest: (questId: string) => void;
  deactivateQuest: (questId: string) => void;
  assignQuestProject: (questId: string, projectId: string) => void;
  assignQuestAgent: (questId: string, agent: string) => void;
  openQuest: (questId: string) => void;
}) {
  const active = quest.active || quest.status === 'Aktiv';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Quest ${quest.code} Detail oeffnen`}
      onClick={() => openQuest(quest.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') openQuest(quest.id);
      }}
      className={cx(
        'rounded-[1.45rem] border p-6 text-left shadow-[0_24px_90px_rgba(0,0,0,0.45)] transition',
        active
          ? 'border-amber-300/55 bg-gradient-to-br from-amber-300/13 via-[#120609]/92 to-[#080304] shadow-[0_0_48px_rgba(245,158,11,0.16)]'
          : 'border-[#4a101b]/60 bg-[#080304]/88 hover:border-[#7a1526]/80 hover:bg-[#120609]/88',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[12px] font-extrabold uppercase tracking-[0.24em] text-amber-200/80">{quest.code}</div>
          <h3 className="mt-2 text-2xl font-black leading-tight text-[#fff7fb]">{quest.title}</h3>
          <div className="mt-3 text-sm font-bold text-[#9f8d95]">{projectName(quest.project)}</div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Pill tone={active ? 'gold' : quest.status === 'Blockiert' ? 'red' : 'default'}>{questStatus(quest)}</Pill>
          <Pill tone={quest.priority === 'Hoch' ? 'red' : 'gold'}>{quest.priority}</Pill>
          {(quest.requiresApproval || approvalCount > 0) ? <Pill tone="red">Freigabe noetig</Pill> : null}
        </div>
      </div>

      <p className="mt-5 text-base font-semibold leading-7 text-[#eadbe2]">{quest.goal}</p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <MiniStat label="Agent / Bearbeiter" value={quest.agent} />
        <MiniStat label="Letzte Bewegung" value={quest.lastMovement} />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2" onClick={(event) => event.stopPropagation()}>
        <FilterSelect label="Projekt zuweisen" value={quest.project} onChange={(value) => assignQuestProject(quest.id, value)} options={projects.map((project) => project.id)} renderOption={(value) => `${value} - ${projectName(value)}`} />
        <FilterSelect label="Agent zuweisen" value={quest.agent} onChange={(value) => assignQuestAgent(quest.id, value)} options={agentOptions} />
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3" onClick={(event) => event.stopPropagation()}>
        <Button tone={active ? 'red' : 'gold'} onClick={() => (active ? deactivateQuest(quest.id) : activateQuest(quest.id))}>
          {active ? 'Deaktivieren' : 'Aktivieren'}
        </Button>
        <Button tone="ghost" onClick={() => openQuest(quest.id)}>Details</Button>
      </div>
    </div>
  );
}

function QuestDetail({
  quest,
  outputs,
  approvals,
  activateQuest,
  deactivateQuest,
  assignQuestProject,
  assignQuestAgent,
  backToQuests,
  openProject,
  openTalk,
  createProjectXHandoff,
  createOutput,
}: {
  quest: Quest;
  outputs: OutputArtifact[];
  approvals: Approval[];
  activateQuest: (questId: string) => void;
  deactivateQuest: (questId: string) => void;
  assignQuestProject: (questId: string, projectId: string) => void;
  assignQuestAgent: (questId: string, agent: string) => void;
  backToQuests: () => void;
  openProject: (projectId: string) => void;
  openTalk: () => void;
  createProjectXHandoff: (quest: Quest) => void;
  createOutput: (quest: Quest) => void;
}) {
  const active = quest.active || quest.status === 'Aktiv';
  const questOutputs = outputs.filter((output) => output.project === quest.project);
  const questApprovals = approvals.filter((approval) => approval.questId === quest.id || approval.project === quest.project);

  return (
    <div className="space-y-8">
      <Card className={active ? '!border-amber-300/55 !bg-amber-300/10' : ''}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-[12px] font-extrabold uppercase tracking-[0.28em] text-amber-200/80">{quest.code}</div>
            <h1 className="mt-3 text-4xl font-black leading-tight text-[#fff7fb] md:text-6xl">{quest.title}</h1>
            <div className="mt-5 flex flex-wrap gap-2">
              <Pill tone={active ? 'gold' : quest.status === 'Blockiert' ? 'red' : 'default'}>{questStatus(quest)}</Pill>
              <Pill tone={quest.priority === 'Hoch' ? 'red' : 'gold'}>{quest.priority}</Pill>
              <Pill>{projectName(quest.project)}</Pill>
              <Pill>{quest.agent}</Pill>
              {active ? <Pill tone="gold">Aktiv</Pill> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button tone={active ? 'red' : 'gold'} onClick={() => (active ? deactivateQuest(quest.id) : activateQuest(quest.id))}>
              {active ? 'Deaktivieren' : 'Aktivieren'}
            </Button>
            <Button tone="ghost" onClick={backToQuests}>Zurueck zur Quest-Zentrale</Button>
            <Button tone="ghost" onClick={() => openProject(quest.project)}>Zum Projekt oeffnen</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card>
            <SectionTitle eyebrow="Definition" title="Ziel / Definition of Done" />
            <p className="mt-5 text-base font-semibold leading-8 text-[#eadbe2]">{quest.goal}</p>
          </Card>

          <Card>
            <SectionTitle eyebrow="Kontext" title="Notizen" />
            <p className="mt-5 text-base font-semibold leading-8 text-[#eadbe2]">{quest.notes}</p>
          </Card>

          <Card>
            <SectionTitle eyebrow="Akzeptanz" title="Akzeptanzkriterien" />
            <div className="mt-5 grid gap-3">
              {quest.acceptanceCriteria.map((item) => (
                <div key={item} className="rounded-2xl border border-[#4a101b]/60 bg-[#120609]/70 p-4 text-sm font-bold text-[#eadbe2]">{item}</div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle eyebrow="Historie" title="Quest-Verlauf / Historie" />
            <div className="mt-5 space-y-3">
              {quest.history.map((entry, index) => (
                <div key={`${entry}-${index}`} className="rounded-2xl border border-[#4a101b]/60 bg-black/35 p-4 text-sm font-semibold leading-6 text-[#eadbe2]">{entry}</div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <SectionTitle eyebrow="Zuweisung" title="Projekt & Agent" />
            <div className="mt-5 space-y-4">
              <FilterSelect label="Projekt aendern" value={quest.project} onChange={(value) => assignQuestProject(quest.id, value)} options={projects.map((project) => project.id)} renderOption={(value) => `${value} - ${projectName(value)}`} />
              <FilterSelect label="Agent aendern" value={quest.agent} onChange={(value) => assignQuestAgent(quest.id, value)} options={agentOptions} />
            </div>
          </Card>

          <Card>
            <SectionTitle eyebrow="Aktionen" title="NOX Aktionen" />
            <div className="mt-5 flex flex-col gap-3">
              <Button
                tone="ghost"
                onClick={openTalk}
                title="Öffnet einen lokalen Demo-Dialog. Kein echter Agent, kein API-Call, keine Notion-Speicherung."
              >
                Mit NOX besprechen (Demo)
              </Button>
              <Button tone="ghost" onClick={() => createProjectXHandoff(quest)}>An Project X übergeben</Button>
              <Button onClick={() => createOutput(quest)}>Output erstellen</Button>
            </div>
          </Card>

          <Card>
            <SectionTitle eyebrow="Outputs" title="Verknüpfte Outputs & Artefakte" />
            <div className="mt-5 space-y-3">
              {questOutputs.length > 0 ? questOutputs.map((output) => (
                <div key={output.id} className="rounded-2xl border border-[#4a101b]/60 bg-[#120609]/70 p-4">
                  <div className="text-sm font-black text-[#fff7fb]">{output.title}</div>
                  <div className="mt-1 text-xs font-bold text-[#9f8d95]">{output.outputType} - {output.version}</div>
                </div>
              )) : <div className="text-sm font-bold text-[#9f8d95]">Noch keine Outputs verknuepft.</div>}
            </div>
          </Card>

          {(quest.requiresApproval || questApprovals.length > 0) ? (
            <Card className="!border-red-500/30 !bg-red-500/10">
              <SectionTitle eyebrow="Freigaben" title="Freigaben" />
              <div className="mt-5 space-y-3">
                {questApprovals.length > 0 ? questApprovals.map((approval) => (
                  <div key={approval.id} className="rounded-2xl border border-red-500/30 bg-[#120609] p-4">
                    <div className="text-sm font-black text-red-100">{approval.title}</div>
                    <div className="mt-2 text-xs font-bold text-[#eadbe2]">{approval.status} - Risiko: {approval.risk}</div>
                  </div>
                )) : <div className="text-sm font-bold text-red-100">Diese Quest benoetigt eine Freigabe.</div>}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GlobalOutputs({
  outputs,
  registerDemoAction,
}: {
  outputs: OutputArtifact[];
  registerDemoAction: (project: string, title: string) => void;
}) {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Global" title="Outputs & Artefakte" subtitle="Globale Sicht auf lokale Demo-Outputs." />
      <div className="grid gap-4 xl:grid-cols-2">
        {outputs.map((output) => (
          <Card key={output.id}>
            <h3 className="text-xl font-black text-[#fff7fb]">{output.title}</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#eadbe2]">{output.description}</p>
            <div className="mt-5">
              <Button tone="secondary" onClick={() => registerDemoAction(output.project, `Output global geprüft: ${output.title}`)}>Demo-Aktion vormerken</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function GlobalApprovals({
  approvals,
  registerDemoAction,
}: {
  approvals: Approval[];
  registerDemoAction: (project: string, title: string) => void;
}) {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Global" title="Freigaben" subtitle="Telegram bleibt später Alarmkanal. Diese Ansicht ist nur lokaler Demo-State." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {approvals.map((approval) => (
          <Card key={approval.id}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-black text-[#fff7fb]">{approval.title}</h3>
              <Pill tone={approval.risk === 'Hoch' ? 'red' : 'gold'}>{approval.status}</Pill>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-[#eadbe2]">{approval.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button className="!px-3 !py-2 !text-xs" onClick={() => registerDemoAction(approval.project, `Freigabe simuliert: ${approval.id}`)}>Freigeben</Button>
              <Button tone="red" className="!px-3 !py-2 !text-xs" onClick={() => registerDemoAction(approval.project, `Ablehnung simuliert: ${approval.id}`)}>Ablehnen</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
