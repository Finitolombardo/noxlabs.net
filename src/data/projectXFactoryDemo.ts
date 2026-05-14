// PROJECT-X-UI-02 — Mock data for the Workflow-Fabrik demo sections.
//
// Demo only. No real Notion / n8n / Drive references, no real workflow IDs,
// no credentials, no real pricing, no real customer data. The frontend
// never reads or writes these values to any external system — they exist
// purely so the operator can visualise what Project X will look like
// once each phase from the spec ships.
//
// All identifiers begin with `demo-` to prevent accidental confusion with
// production data on `n8n.getvoidra.com`.

export type FactoryRiskLevel = 'Niedrig' | 'Mittel' | 'Hoch';

// ---- A) Workflow Catalog ----------------------------------------------------

export type FactoryWorkflowStatus = 'synced' | 'needs-review' | 'draft';
export type FactoryWorkflowActivity = 'active' | 'inactive' | 'mock';

export interface FactoryWorkflowEntry {
  workflowId: string;
  name: string;
  productModule: string;
  activity: FactoryWorkflowActivity;
  nodeCount: number;
  riskLevel: FactoryRiskLevel;
  driftStatus: FactoryWorkflowStatus;
  lastCheckedLabel: string;
}

export const FACTORY_WORKFLOWS: FactoryWorkflowEntry[] = [
  {
    workflowId: 'demo-leadgen-v1',
    name: 'Leadgen Outreach',
    productModule: 'Leadgen Engine',
    activity: 'mock',
    nodeCount: 18,
    riskLevel: 'Mittel',
    driftStatus: 'synced',
    lastCheckedLabel: 'heute',
  },
  {
    workflowId: 'demo-followup-v1',
    name: 'Follow-up Sequenz',
    productModule: 'Follow-up Engine',
    activity: 'mock',
    nodeCount: 12,
    riskLevel: 'Niedrig',
    driftStatus: 'needs-review',
    lastCheckedLabel: 'gestern',
  },
  {
    workflowId: 'demo-website-audit-v1',
    name: 'Website Audit Intake',
    productModule: 'Website + Lead Funnel',
    activity: 'mock',
    nodeCount: 9,
    riskLevel: 'Niedrig',
    driftStatus: 'synced',
    lastCheckedLabel: 'vor 3 Tagen',
  },
  {
    workflowId: 'demo-support-agent-v1',
    name: 'Support Agent Triage',
    productModule: 'Support Agent',
    activity: 'inactive',
    nodeCount: 22,
    riskLevel: 'Hoch',
    driftStatus: 'draft',
    lastCheckedLabel: 'vor 1 Woche',
  },
  {
    workflowId: 'demo-document-intake-v1',
    name: 'Document Intake',
    productModule: 'Document Intake',
    activity: 'mock',
    nodeCount: 7,
    riskLevel: 'Niedrig',
    driftStatus: 'synced',
    lastCheckedLabel: 'heute',
  },
];

// ---- B) Product Modules / AI-Systeme ---------------------------------------

export type FactoryModuleStatus = 'idea' | 'prototype' | 'validated' | 'sellable';

export interface FactoryModuleEntry {
  moduleId: string;
  name: string;
  status: FactoryModuleStatus;
  valueProposition: string;
  requiredInputsCount: number;
  setupFieldsCount: number;
  linkedTemplatesCount: number;
  riskLevel: FactoryRiskLevel;
}

export const FACTORY_MODULES: FactoryModuleEntry[] = [
  {
    moduleId: 'leadgen-engine',
    name: 'Leadgen Engine',
    status: 'validated',
    valueProposition: 'Roh-Quellen → qualifizierte Leads im CRM, mit Approval-Gate vor jedem Outreach.',
    requiredInputsCount: 3,
    setupFieldsCount: 9,
    linkedTemplatesCount: 2,
    riskLevel: 'Mittel',
  },
  {
    moduleId: 'website-funnel',
    name: 'Website + Lead Funnel',
    status: 'prototype',
    valueProposition: 'Webformulare + Tracking → strukturierter Funnel mit Routing-Regeln.',
    requiredInputsCount: 4,
    setupFieldsCount: 7,
    linkedTemplatesCount: 1,
    riskLevel: 'Niedrig',
  },
  {
    moduleId: 'support-agent',
    name: 'Support Agent',
    status: 'idea',
    valueProposition: 'Kundenanfrage → Triage → Antwortvorschlag (Operator-bestätigt).',
    requiredInputsCount: 2,
    setupFieldsCount: 6,
    linkedTemplatesCount: 0,
    riskLevel: 'Hoch',
  },
  {
    moduleId: 'document-intake',
    name: 'Document Intake',
    status: 'prototype',
    valueProposition: 'PDF/Doc/CSV → strukturierte Felder, klassifizierte Prozesse.',
    requiredInputsCount: 1,
    setupFieldsCount: 4,
    linkedTemplatesCount: 1,
    riskLevel: 'Niedrig',
  },
  {
    moduleId: 'crm-writer',
    name: 'CRM Writer',
    status: 'sellable',
    valueProposition: 'Freigegebene Items → Ziel-CRM/Notion/Sheet, idempotent + audit.',
    requiredInputsCount: 2,
    setupFieldsCount: 5,
    linkedTemplatesCount: 3,
    riskLevel: 'Mittel',
  },
  {
    moduleId: 'follow-up-engine',
    name: 'Follow-up Engine',
    status: 'validated',
    valueProposition: 'Sequenz-State + Reminder, Operator-Eingriffspfad jederzeit moeglich.',
    requiredInputsCount: 2,
    setupFieldsCount: 6,
    linkedTemplatesCount: 2,
    riskLevel: 'Mittel',
  },
  {
    moduleId: 'social-analyzer',
    name: 'Social Analyzer',
    status: 'idea',
    valueProposition: 'Social-Posts/Captions → Hooks/Pattern-Library fuer PitchMutation.',
    requiredInputsCount: 2,
    setupFieldsCount: 3,
    linkedTemplatesCount: 0,
    riskLevel: 'Niedrig',
  },
  {
    moduleId: 'pitchmutation',
    name: 'PitchMutation',
    status: 'sellable',
    valueProposition: 'A/B-Test-Engine fuer Coldmails, Hooks, CTAs, Follow-ups.',
    requiredInputsCount: 3,
    setupFieldsCount: 5,
    linkedTemplatesCount: 4,
    riskLevel: 'Mittel',
  },
  {
    moduleId: 'workflow-ab-tester',
    name: 'Workflow A/B Tester',
    status: 'prototype',
    valueProposition: 'Mehrere Workflow-Varianten kontrolliert parallel laufen lassen.',
    requiredInputsCount: 3,
    setupFieldsCount: 4,
    linkedTemplatesCount: 1,
    riskLevel: 'Hoch',
  },
];

// ---- C) PitchMutation Experiments ------------------------------------------

export type FactoryVariantStatus = 'running' | 'paused' | 'winner-candidate' | 'archived';

export interface FactoryPitchVariant {
  variantId: string;
  label: string;
  hookKind: string;
  sampleSize: number;
  replyRatePct: number;
  positiveReplyRatePct: number;
  bookedCalls: number;
  bounceOrSpamPct: number;
  costPerQualifiedLead: number;
  timeToFirstReplyHours: number;
  status: FactoryVariantStatus;
}

export interface FactoryPitchExperiment {
  experimentId: string;
  title: string;
  templateId: string;
  slot: string;
  primaryMetric: string;
  minimumSampleSize: number;
  startedLabel: string;
  variants: FactoryPitchVariant[];
  winnerCandidateId?: string;
}

export const FACTORY_PITCH_EXPERIMENT: FactoryPitchExperiment = {
  experimentId: 'demo-pmexp-leadgen-hook-01',
  title: 'Leadgen Coldmail Hook Test',
  templateId: 'leadgen-template@v1.0',
  slot: 'message_generator.opener',
  primaryMetric: 'positiveReplyRate',
  minimumSampleSize: 200,
  startedLabel: 'vor 8 Tagen',
  winnerCandidateId: 'variant-b',
  variants: [
    {
      variantId: 'variant-a',
      label: 'A — Direct Pain-Point Hook',
      hookKind: 'Pain-Point',
      sampleSize: 312,
      replyRatePct: 12.4,
      positiveReplyRatePct: 4.1,
      bookedCalls: 9,
      bounceOrSpamPct: 2.1,
      costPerQualifiedLead: 38,
      timeToFirstReplyHours: 6.4,
      status: 'running',
    },
    {
      variantId: 'variant-b',
      label: 'B — Case-Study Opener',
      hookKind: 'Case-Study',
      sampleSize: 308,
      replyRatePct: 17.8,
      positiveReplyRatePct: 7.5,
      bookedCalls: 18,
      bounceOrSpamPct: 1.8,
      costPerQualifiedLead: 27,
      timeToFirstReplyHours: 4.9,
      status: 'winner-candidate',
    },
    {
      variantId: 'variant-c',
      label: 'C — Local Relevance Opener',
      hookKind: 'Local',
      sampleSize: 304,
      replyRatePct: 14.2,
      positiveReplyRatePct: 5.2,
      bookedCalls: 12,
      bounceOrSpamPct: 2.4,
      costPerQualifiedLead: 33,
      timeToFirstReplyHours: 5.7,
      status: 'running',
    },
  ],
};

// ---- D) Customer Setup Wizard ----------------------------------------------

export type FactorySetupFieldKind =
  | 'text'
  | 'enum'
  | 'credential-ref'
  | 'limit'
  | 'rule';

export interface FactorySetupField {
  key: string;
  label: string;
  kind: FactorySetupFieldKind;
  placeholder: string;
  required: boolean;
  helpText?: string;
}

export const FACTORY_LEADGEN_SETUP_FIELDS: FactorySetupField[] = [
  {
    key: 'customerName',
    label: 'Kundenname',
    kind: 'text',
    placeholder: 'z.B. Demo GmbH',
    required: true,
  },
  {
    key: 'industry',
    label: 'Zielbranche',
    kind: 'text',
    placeholder: 'z.B. Handwerk, SaaS, ...',
    required: true,
  },
  {
    key: 'region',
    label: 'Zielregion',
    kind: 'text',
    placeholder: 'z.B. DACH, München, ...',
    required: false,
  },
  {
    key: 'targetSink',
    label: 'Ziel-CRM / Notion / Sheet',
    kind: 'credential-ref',
    placeholder: 'Credential-Referenz auswählen',
    required: true,
    helpText: 'Nur Credential-Name, nie Wert.',
  },
  {
    key: 'notificationChannel',
    label: 'Benachrichtigungskanal',
    kind: 'enum',
    placeholder: 'Telegram / E-Mail / kein',
    required: false,
  },
  {
    key: 'documentTarget',
    label: 'Dokumenten-Ziel',
    kind: 'credential-ref',
    placeholder: 'Drive-Ordner / Notion-Page',
    required: false,
  },
  {
    key: 'voice',
    label: 'Tonalität',
    kind: 'enum',
    placeholder: 'professional / locker / direkt',
    required: true,
  },
  {
    key: 'dailyLimit',
    label: 'Tageslimit',
    kind: 'limit',
    placeholder: 'z.B. 50 Outreach / Tag',
    required: true,
  },
  {
    key: 'approvalRule',
    label: 'Approval-Regel',
    kind: 'rule',
    placeholder: 'z.B. "auto-approve wenn fitScore >= 70"',
    required: true,
  },
];

// ---- E) Drive / ReferenceArtifact Intake -----------------------------------

export type FactoryDriveStatus = 'queued' | 'extracted' | 'skipped' | 'failed';

export interface FactoryDriveFile {
  refName: string;
  kind: 'pdf' | 'image' | 'doc' | 'csv';
  status: FactoryDriveStatus;
  summaryHint?: string;
}

export const FACTORY_DRIVE_FILES: FactoryDriveFile[] = [
  {
    refName: 'company-briefing.pdf',
    kind: 'pdf',
    status: 'extracted',
    summaryHint: '4 Prozesse erkannt, 2 manuelle Tasks markiert',
  },
  {
    refName: 'old-website-screenshot.png',
    kind: 'image',
    status: 'queued',
  },
  {
    refName: 'process-notes.docx',
    kind: 'doc',
    status: 'extracted',
    summaryHint: '3 Dokumentenflüsse, 1 Approval-Punkt',
  },
  {
    refName: 'lead-export-sample.csv',
    kind: 'csv',
    status: 'skipped',
    summaryHint: 'Schema unklar, Operator-Review nötig',
  },
];

// ---- F) Dry Runs ------------------------------------------------------------

export interface FactoryDryRun {
  draftId: string;
  templateLabel: string;
  customerLabel: string;
  passed: boolean;
  testInputSampleCount: number;
  expectedOutputSummary: string;
  detectedRisks: string[];
  detectedMissingSetupFields: string[];
  estimatedRunCost?: string;
  estimatedRuntimeLabel?: string;
}

export const FACTORY_DRY_RUNS: FactoryDryRun[] = [
  {
    draftId: 'demo-dryrun-leadgen-01',
    templateLabel: 'leadgen-template@v1.0',
    customerLabel: 'Demo GmbH',
    passed: true,
    testInputSampleCount: 3,
    expectedOutputSummary: '3 Outreach-Drafts, je 1 CRM-Eintrag, 0 Auto-Sends.',
    detectedRisks: ['Outreach-Tonalität nicht gesetzt'],
    detectedMissingSetupFields: [],
    estimatedRunCost: '~0,12 € / Run',
    estimatedRuntimeLabel: '~4,3 s',
  },
  {
    draftId: 'demo-dryrun-support-01',
    templateLabel: 'support-template@v0.2',
    customerLabel: 'Demo GmbH',
    passed: false,
    testInputSampleCount: 2,
    expectedOutputSummary: 'Triage-Vorschlag erstellt, aber CRM-Writer Mock fehlt.',
    detectedRisks: ['CRM-Writer Credential-Ref nicht gesetzt', 'Approval-Regel fehlt'],
    detectedMissingSetupFields: ['targetSink', 'approvalRule'],
    estimatedRunCost: '~0,07 € / Run',
    estimatedRuntimeLabel: '~2,1 s',
  },
];

// ---- G) Approval Gate -------------------------------------------------------

export interface FactoryApprovalCard {
  approvalId: string;
  action: string;
  templateId: string;
  risk: FactoryRiskLevel;
  requiredApprover: string;
  rationale: string;
}

export const FACTORY_APPROVAL: FactoryApprovalCard = {
  approvalId: 'demo-apr-leadgen-promote-01',
  action: 'Promote PitchMutation Variant B to template v1.1',
  templateId: 'leadgen-template',
  risk: 'Mittel',
  requiredApprover: 'Operator',
  rationale:
    'Variant B zeigt +83 % positive Reply Rate und niedrigere CPL bei vergleichbarer Sample-Size. Promotion ersetzt v1.0 als Default.',
};
