# Project X — Workflow-Fabrik

> Spezifikation. Nicht Implementation. Keine Backend-Verdrahtung in dieser
> Runde. Keine echten n8n-Writes, keine Workflow-Aktivierungen, keine
> Agent-Executes. Dient als gemeinsame Wahrheit zwischen Operator,
> Andromeda und allen Workern (OpenCode, Codex, AntiGravity, Noxreel,
> Claude), damit kuenftige Build-Quests nicht erneut "Was ist Project X?"
> diskutieren muessen.

---

## 1. Abgrenzung

| Begriff       | Rolle                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| **APP-X**     | Cockpit (UI). Zeigt Projekte, Quests, Freigaben, Live-Notion-Kontext, Operator-Aktionen.               |
| **Andromeda** | Orchestrator/Gehirn. Zerlegt Ziele in Quests, verteilt an Worker, prueft Grenzen + Freigaben.          |
| **Project X** | **Workflow-Fabrik**. Inventarisiert, modularisiert, testet, verbessert n8n-Workflows und Produktmodule. |
| **Leadgen**   | Erstes Produkt-/Use-Case-Modul, das ueber Project X gebaut wird.                                       |
| **n8n**       | Runtime (`n8n.getvoidra.com`). Hostet Workflows. Wird von Project X *gepflegt*, nicht *bedient*.       |
| **Notion**    | Kontext-/Quest-/Inventory-Layer. Master Tasks DB, Projects DB, kuenftig Workflow-Catalog-DB.            |

**Wichtig fuer Konsistenz mit dem Bestandscode:**

- Project X ist *kein* eigener Sidebar-Menupunkt mehr (siehe APP-X-UI-01).
- Project X erscheint im APP-X-Cockpit als **Projekt im Projektpicker** und
  bekommt ueber kuenftige UI-Quests dedizierte Sections im Projektkontext.
- Die existierende `ProjectXSummary` / `CommandCard` aus dem Cockpit
  Mock zeigt nur den Handoff-Aspekt — die Workflow-Fabrik-Sicht ist
  Scope dieser Spec.

---

## 2. Kernziel

> **Project X verwandelt vorhandene Workflows und neue Kundenanforderungen
> in konfigurierbare, testbare, verbesserbare Automation-Produkte.**

Konkret: aus

- einem bestehenden n8n-Workflow,
- einer Kundenanforderung ("ich brauche Leadgen fuer meine Branche X"),
- oder einer analysierten Webseite,

entsteht eine versionierte, mit Setup-Feldern parametrisierte, dry-run-
geprufte und freigabepflichtige Workflow-Instanz, die *erst nach explizitem
Operator-Approval* aktiviert wird.

Project X liefert dabei *Bausteine*, nicht Einzelloesungen:

- Templates (versioniert)
- Module (kombinierbar)
- Setup-Felder (parametrisierbar)
- Dry-Run-Reports (read-only)
- Approval-Gates (operator-gebunden)
- Evolution Signals (A/B + Metriken)

---

## 3. Hauptmodule

### A — Workflow Catalog

Inventar aller n8n-Workflows, die das System kennt.

| Feld              | Typ              | Quelle                                            |
| ----------------- | ---------------- | ------------------------------------------------- |
| `workflowId`      | string           | n8n REST `/workflows`                              |
| `name`            | string           | n8n                                                |
| `active`          | boolean          | n8n                                                |
| `nodeCount`       | number           | n8n                                                |
| `productModule`   | string           | Notion-Tagging / manuell                          |
| `riskLevel`       | "Niedrig" \| "Mittel" \| "Hoch" | Heuristik (HTTP/Code/Schreib-Nodes) |
| `driftStatus`     | "in-sync" \| "out-of-sync" \| "unknown" | Vergleich Template-Version |
| `lastEditedAt`    | ISO date         | n8n                                                |
| `notes`           | rich_text        | Notion                                             |

Read-only Quelle in Phase 1: existierende Workflow-Berichte (lokale
Reports oder eine Notion-DB), keine direkten n8n-API-Calls aus dem
Browser. Phase 2+: server-seitig kuratierte Sync.

### B — Node Inspector

Per Workflow eine Liste der Nodes mit klassifizierten Eigenschaften:

- Trigger-Nodes (Cron, Webhook, manual)
- HTTP-Request-Nodes (externe Calls)
- Code-Nodes (eigener JS)
- Credential-Bindings (nur *Name* der Credential, **nie** der Wert)
- Inputs/Outputs (Field-Map)
- Testbarkeitsindikator (kann Mock-Input gefuettert werden?)

Project X liest, schreibt nicht. Aenderungen passieren immer ueber den
*Template Builder*, nicht ueber den Inspector.

### C — Template Builder

Aus einem inspizierten Workflow wird ein wiederverwendbares Template:

```
WorkflowTemplate {
  templateId
  baseWorkflowId
  version
  productModule
  variables: Array<{
    key, label, type, required, default?, helpText, validation?
  }>
  fixedNodes: ['Trigger', 'CRM Writer', ...]
  swappableNodes: [
    { slot: 'message_generator', candidates: ['claude-prompt-v3', 'openai-prompt-v1'] }
  ]
  riskAssessment
  evolutionPolicy: 'manual' | 'ab-then-manual' | 'auto-after-n-runs'
}
```

Default `evolutionPolicy` = `manual`. Kein Auto-Promotion vor Operator-
Freigabe.

### D — Customer Setup Wizard

Ein Schritt-fuer-Schritt-Flow, in dem Operator oder Kunde die fuer ein
Template noetigen Felder eingibt. Felder kommen direkt aus
`WorkflowTemplate.variables`:

| Feld-Typ              | Beispiel                                |
| --------------------- | --------------------------------------- |
| Identity              | E-Mail-Adresse, Firmenname              |
| Storage               | Ziel-CRM, Notion-DB, Google-Sheet-ID    |
| Document Target       | Drive-Ordner, Notion-Page               |
| Notification          | Telegram-Channel, E-Mail-Empfaenger     |
| API/Credentials       | nur Credential-*Referenz* (Name)        |
| Limits                | Tageskontingent, Budget, Rate-Limit     |
| Voice                 | Tonalitaet, Sprache                     |
| Approval Rules        | "automatisch bei Score >= X", sonst Operator |

Credentials/Secrets werden **nie** im Frontend eingegeben. Operator
verweist auf einen in n8n bereits gepflegten Credential-Namen, oder das
Cockpit oeffnet (Phase 6+) einen serverseitigen Setup-Pfad.

### E — Automation Potential Analyzer

Eingang: Webseite / Firmenbeschreibung / hochgeladene Prozessdokumente.

Output (read-only Report):

```
AutomationOpportunity {
  source: 'website' | 'document' | 'manual'
  industryHints: string[]
  detectedProcesses: string[]
  suggestedModules: Array<{
    moduleId, fitScore, expectedROIHint
  }>
  missingSignals: string[]
  nextRecommendation: string
}
```

Phase 1: rein deskriptiv (Operator entscheidet). Spaeter koennen
Andromeda-Sub-Quests automatisch Suggested-Module zur Pruefung anlegen.

### F — Workflow Lab / A-B-Testing

Zwei oder mehr Varianten desselben Templates laufen kontrolliert
parallel. Metriken pro Variante:

- Erfolgsquote (Conversion, Antwortquote, Open-Rate, je nach Modul)
- Fehlerquote
- Durchschnittliche Laufzeit
- Kosten pro Run
- Operator-Eingriffsquote

**Winner Detection** ist *Vorschlag*, nicht *Automatik*:
- System markiert Gewinner ueber p-value/Effekt + minimum sample size
- Operator klickt **"Als neue Default-Version uebernehmen"**
- Alte Varianten werden archiviert (nicht geloescht)

A/B-Tests sind in Phase 1 reine *measurement & planning*, kein autonomer
Live-Rollout.

### G — Product Module Builder

Project X publiziert wiederverwendbare Module:

| Modul                  | Aufgabe                                         |
| ---------------------- | ----------------------------------------------- |
| Lead Scraper           | Quelle -> Roh-Leads                              |
| Enrichment             | Roh-Leads -> angereicherte Datensaetze           |
| Fit Scoring            | angereicherte Leads -> Score + Kategorie         |
| Message Generator      | gescorter Lead -> Outreach-Entwurf (Tonalitaet)  |
| Follow-up Engine       | Outreach -> Sequenz-State / Reminder-Trigger     |
| Approval Gate          | Output -> Operator-Freigabe (manuell o. Regel)   |
| CRM Writer             | freigegebenes Item -> Ziel-DB                    |
| Telegram/Email Notify  | Status-Updates an Operator/Kunde                 |
| Document Intake        | Datei -> strukturierte Inputs                    |

Module sind:
- versioniert (`module:lead-scraper@v0.3`)
- kombinierbar als ge­richteter Graph
- in Phase 1 *deklariert*, in Phase 3+ aus echten n8n-Workflows
  abgeleitet
- nie autonom verbunden — Operator setzt die Komposition zusammen

### H — Dry-Run & Approval Gate

Vor jedem echten Deploy/Aktivierung:

```
DryRunResult {
  templateId, version
  customerSetupId
  testInputSample
  expectedOutputSummary
  detectedRisks: string[]
  detectedMissingSetupFields: string[]
  estimatedRunCost: { currency, value }
  estimatedRuntime: ms
  passed: boolean
  diagnostic?: string  // sanitised, no secrets
}
```

Approval-Gate ist immer **Operator-bound**. Kein Worker, kein Agent, kein
Andromeda-Sub-Quest darf das Gate selbst durchschalten. Phase 1: nur
Anzeige, kein Deploy. Phase 8+: kontrollierter n8n-Import nach Freigabe.

### I — Evolution Engine

Verlinkt A/B-Test-Ergebnisse zurueck in Templates:

- Erfolgreiche Varianten -> neue Template-Version (Operator akzeptiert)
- Schlechte Varianten -> archiviert + Begruendung
- Modul-Kombinationen, die haeufig gewinnen, werden Default-Vorschlag
  fuer aehnliche Kunden
- Schwarze Liste: Module/Kombinationen, die mehrfach versagt haben,
  werden als "nicht vorschlagen" markiert

Die Engine schlaegt vor. Sie *deployt* nicht.

---

## 4. Erster Produktpfad: Lead Generation

Konkreter Flow fuer den Leadgen-Use-Case:

```
1. Eingang
   - Operator gibt Firma / Webseite ein
   - Optional: Branche, Zielgruppe, Region
2. Analyze (Modul E)
   - Webseite, Industrie-Hints, vorhandene Channels
   - Output: AutomationOpportunity mit Leadgen-Modulen
3. Template Choice (Modul C)
   - Vorschlag: leadgen-template@v1
   - Module: Scraper -> Enrichment -> Fit Scoring
            -> Message Generator -> Approval Gate -> CRM Writer
            -> Notification
4. Setup Wizard (Modul D)
   - E-Mail-Postfach (Outreach-Absender)
   - CRM/Sheet-Ziel
   - Tonalitaet (de-DE, bro-mode optional)
   - Tageslimit
   - Approval-Regel (z.B. nur Score >= 70 ohne Operator)
5. Workflow Instance Draft
   - server-side (Phase 4+) erzeugt WorkflowInstanceDraft
   - in Phase 1: nur ein JSON-Preview im Cockpit
6. Dry-Run (Modul H)
   - 3 Test-Leads, kein echter Send
   - Erwartetes Output-Beispiel + Risiken
7. Approval (Operator)
   - kein execute, bis Operator explizit freigibt
8. Deploy / Aktivierung
   - erst Phase 8+: kontrollierter n8n-Import
   - vorher: Operator macht Aktivierung manuell in n8n auf Basis der
     vorbereiteten Spec
9. Monitoring + Evolution (Modul F + I)
   - A/B Varianten der Message-Generator-Slots, des Fit-Scoring-Slots
   - Winner-Detection nach >= 200 Outreach-Versuchen
```

Das Leadgen-Modul setzt damit den Massstab fuer alle weiteren
Produktmodule (Follow-up, Document Intake, etc.).

---

## 5. UI-Informationsarchitektur

Project X bekommt im Cockpit eine eigene Sub-Struktur, eingebettet im
APP-X-Projektpicker. Sections (Phase 1 als reine Anzeigen, Phase 2+
mit echten Daten):

| Section            | Daten                                                       | Read-only? | Spaetere Aktion                                  |
| ------------------ | ----------------------------------------------------------- | ---------- | ------------------------------------------------ |
| Uebersicht         | KPI-Row: aktive Workflows, Templates, Experimente, offene Approvals | ja  | —                                                |
| Workflow Catalog   | Tabelle aller n8n-Workflows (Modul A)                       | ja         | Workflow zu Template promoten (Phase 3)          |
| Analyzer           | Form Webseite / Dokument + Report (Modul E)                 | ja         | Quest "Module pruefen" anlegen (Phase 4)         |
| Templates          | Liste WorkflowTemplate inkl. Version, Status, Risk          | ja         | Neue Version erzeugen, Variablen editieren (P3+) |
| Experimente        | A/B-Tests, Metriken, Sample-Size, Winner-Indicator (Modul F) | ja         | Variante zur Default-Version promoten (P6+)      |
| Kunden-Setup       | Liste CustomerSetup pro Template                            | ja         | Setup Wizard starten (P4)                        |
| Dry-runs           | DryRunResult-Historie, expandable                            | ja         | Erneut Dry-runnen (P5)                           |
| Produktmodule      | Module-Inventar mit Version + Tag                           | ja         | Modul in Template einsetzen (P3+)                |
| Agent Tasks        | offene Andromeda-Sub-Quests zu Project X                    | ja         | —                                                |

Designprinzipien (kompatibel zu APP-X-UI-01):
- Eine Section pro Card, mehrere Cards untereinander
- Keine 5000px-Scroll-Wall — pro Section max ~600px ohne Expand
- "Show more" optional, kein zwingender komplexer State
- Approval-Bedarf > 0 wird oben als roter Warn-Block sichtbar (gleiche
  Sprache wie Live-Projektkontext-Approvals)

---

## 6. Data Model Draft (Pseudocode)

```ts
// Type-Skizzen — kein Backend-Code, kein Schema-Lock.

export interface WorkflowTemplate {
  templateId: string;            // "leadgen-template"
  version: string;               // "v1.2.0"
  baseWorkflowId?: string;        // n8n source id (optional)
  productModule: string;          // "leadgen"
  variables: TemplateVariable[];
  modules: ModuleSlotBinding[];
  riskLevel: 'Niedrig' | 'Mittel' | 'Hoch';
  evolutionPolicy: 'manual' | 'ab-then-manual' | 'auto-after-n-runs';
  archivedAt?: string;
}

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'string' | 'number' | 'enum' | 'credential-ref' | 'email' | 'url' | 'json';
  required: boolean;
  default?: string | number;
  helpText?: string;
  enumValues?: string[];
}

export interface ModuleSlotBinding {
  slot: string;                   // "message_generator"
  moduleVersion: string;          // "module:message-claude@v3"
  config?: Record<string, unknown>;
}

export interface WorkflowVariant {
  variantId: string;
  templateId: string;
  parentVersion: string;
  delta: Partial<WorkflowTemplate>;
  status: 'draft' | 'running' | 'archived' | 'promoted';
}

export interface WorkflowExperiment {
  experimentId: string;
  templateId: string;
  variants: string[];             // variantIds
  primaryMetric: 'conversion' | 'response_rate' | 'error_rate' | 'cost' | 'runtime';
  minimumSampleSize: number;
  startedAt: string;
  endedAt?: string;
  winnerVariantId?: string;
  winnerAcknowledgedByOperator: boolean;
}

export interface ProductModule {
  moduleId: string;
  version: string;
  inputSchema: unknown;           // JSON-Schema-lite, kein zod-lock hier
  outputSchema: unknown;
  notes?: string;
  archivedAt?: string;
}

export interface CustomerSetup {
  setupId: string;
  customerRef: string;            // logical id, no PII in this layer
  templateId: string;
  values: Record<string, string | number | boolean>;
  approvalRules?: ApprovalRule[];
  createdAt: string;
}

export interface ApprovalRule {
  when: string;                   // e.g. "fitScore >= 70"
  effect: 'auto-approve' | 'operator-approval';
}

export interface AutomationOpportunity {
  source: 'website' | 'document' | 'manual';
  signal: string;                 // raw url or doc ref
  industryHints: string[];
  detectedProcesses: string[];
  suggestedModules: Array<{ moduleId: string; fitScore: number; expectedROIHint?: string }>;
  missingSignals: string[];
  nextRecommendation: string;
  createdAt: string;
}

export interface WorkflowInstanceDraft {
  draftId: string;
  templateId: string;
  customerSetupId: string;
  preparedAt: string;
  status: 'draft' | 'dry-run' | 'approved' | 'rejected' | 'deployed';
  // No secrets, no credentials, no n8n raw export here.
}

export interface DryRunResult {
  draftId: string;
  passed: boolean;
  testInputSampleCount: number;
  expectedOutputSummary: string;
  detectedRisks: string[];
  detectedMissingSetupFields: string[];
  estimatedRunCost?: { currency: string; value: number };
  estimatedRuntimeMs?: number;
  sanitisedDiagnostic?: string;   // no tokens, no credential values
}

export interface ApprovalGate {
  draftId: string;
  required: boolean;
  approver?: string;              // operator label, never email/PII
  approvedAt?: string;
  rejectedAt?: string;
  reason?: string;
}
```

Diese Types sind *bewusst* nicht im Bundle gesperrt. Phase 1 nimmt
Demo-Daten direkt in der React-View. Phase 2+ ziehen sie aus Notion
oder einem dedizierten Workflow-Catalog-Endpoint.

---

## 7. PitchMutation — Experiment Engine

Das bestehende **PitchMutation-System** ist der A/B-Test-Motor fuer alle
text- und sequenzbasierten Bausteine, die Project X durch das System
schickt: Coldmails, Hooks, Betreffzeilen, Outreach-Variants, CTAs,
Follow-up-Sequenzen, Voice-Variationen. Project X delegiert
Varianten-Erzeugung und -Bewertung **nicht selbst** an einen LLM ad hoc,
sondern an PitchMutation als kanonische Engine. Das gilt insbesondere
fuer **Leadgen als ersten Produktmodul**: Pitch-Optimierung ist der
Hebel, an dem das erste Produktmodul reift.

### 7.1 Rolle in der Workflow-Fabrik

- PitchMutation **erzeugt** Varianten eines Templates-Slots
  (`message_generator`, `subject_line`, `follow_up_3d`, ...).
- PitchMutation **misst** Performance pro Variante mit operativen
  Metriken (siehe 7.2).
- Project X **uebernimmt Gewinner** als neue Template-Version
  (`leadgen-template@v1.3`), nicht als Live-Auto-Rollout.
- Schlechte Varianten werden **archiviert**, nicht geloescht — die
  PitchMutation-Datenbank bleibt vollstaendig, damit Evolution Engine
  (Modul I) lernen kann.

### 7.2 Metriken (Phase-1 read-only Display)

| Metrik                      | Bedeutung                                         |
| --------------------------- | ------------------------------------------------- |
| `replyRate`                 | Antworten / versendete Nachrichten                |
| `positiveReplyRate`         | sinngemaess positive Antworten / Antworten        |
| `bookedCalls`               | konvertierte Termine                              |
| `bounceOrSpamRate`          | Hard-Bounces + Spam-Klassifizierungen             |
| `costPerQualifiedLead`      | Aggregat-Kosten / qualifizierte Leads             |
| `timeToFirstReply`          | Median-Reaktionszeit                              |
| `operatorEingriffsquote`    | Wie oft Operator manuell eingreifen musste        |

Phase 1–2 zeigt die UI diese Felder rein **read-only** aus dem
PitchMutation-Datenmodell. Es gibt keinen Live-Send, keinen
Inbox-Zugriff, keinen Schreibzugriff.

### 7.3 Winner Detection

- Project X markiert eine Variante intern als *Gewinner-Kandidat*,
  wenn `replyRate` und/oder `positiveReplyRate` ueber einer
  Mindeststichprobe und einem Schwellenwert liegen
  (z.B. `n >= 200`, `delta >= +30%`).
- Die Markierung ist nur ein **Vorschlag**. Promotion zur
  neuen Default-Variante passiert ausschliesslich nach
  expliziter Operator-Freigabe (Approval-Gate, siehe Section 10).
- Die akzeptierte Variante wird als neue Template-Version
  versioniert; die vorherige Variante landet im Archiv mit Status
  `archived-by-promotion`.

### 7.4 Type-Skizze

```ts
export interface PitchMutationVariant {
  variantId: string;
  templateId: string;          // z.B. "leadgen-template"
  slot: string;                 // z.B. "message_generator"
  payloadKind: 'subject' | 'body' | 'cta' | 'sequence';
  authoringSource: 'human' | 'pitchmutation-llm' | 'imported';
  metrics: {
    replyRate?: number;
    positiveReplyRate?: number;
    bookedCalls?: number;
    bounceOrSpamRate?: number;
    costPerQualifiedLead?: number;
    timeToFirstReplyMs?: number;
    operatorInterventionRate?: number;
    sampleSize?: number;
  };
  status: 'draft' | 'running' | 'paused' | 'winner-candidate' | 'promoted' | 'archived';
  archivedReason?: string;
  promotedToVersion?: string;
}
```

### 7.5 Verbindung zu Modul F + I

- **Modul F (Workflow Lab)** kapselt mehrere `PitchMutationVariant` zu
  einem `WorkflowExperiment` und bewertet ueber den `primaryMetric`.
- **Modul I (Evolution Engine)** liest die archivierten Varianten als
  Long-Term-Memory. Erkennt wiederkehrende Erfolgsmuster (z.B.
  „Hooks mit Frage performen besser als Statements") und schlaegt
  sie als Module-Default in PitchMutation vor.

---

## 8. AI-Systeme-Datenbank — Product / Module Registry

Die **AI-Systeme-Datenbank** ist die kanonische Registry der verkaufbaren
Automationsprodukte und ihrer wiederverwendbaren Module. Project X liest
diese DB read-only und nutzt sie:

- als **Vorschlagsquelle** im Automation Potential Analyzer
  (Modul E) — "fuer diese Branche passt Leadgen Engine + Document Intake"
- als **Komposition** im Product Module Builder (Modul G) — neue Module
  werden gegen die Registry registriert
- als **Pricing/Pakete-Quelle** fuer kuenftige Customer-Offers

### 8.1 Beispiel-Eintraege

| Name                | Kategorie       | Status        |
| ------------------- | --------------- | ------------- |
| Leadgen Engine      | Sales           | validated     |
| Website + Lead Funnel | Sales + Web    | prototype     |
| Support Agent       | Service         | idea          |
| Document Intake     | Operations      | prototype     |
| CRM Writer          | Sales / Ops     | sellable      |
| Follow-up Engine    | Sales           | validated     |
| Social Analyzer     | Marketing       | idea          |
| PitchMutation       | Sales / Lab     | sellable      |
| Workflow A/B Tester | Lab / Ops       | prototype     |

Status-Lifecycle: `idea → prototype → validated → sellable → deprecated`.
Project X greift in Phase 1 nur read-only zu. Status-Updates passieren
ueber separate Notion- oder Operator-Quests, nicht automatisch.

### 8.2 Type-Skizze

```ts
export type AiSystemStatus = 'idea' | 'prototype' | 'validated' | 'sellable' | 'deprecated';

export interface AiSystemEntry {
  systemId: string;
  name: string;
  productCategory: string;             // "Sales", "Service", "Ops", "Marketing", "Lab"
  valueProposition: string;
  targetAudience: string[];            // ["KMU 5-50", "Agenturen", ...]
  requiredInputs: string[];            // ["Firmen-URL", "Mailadresse", "Branche"]
  setupFields: TemplateVariable[];     // Mirror der Workflow-Template-Variables
  requiredCredentialRefs: string[];    // nur Namen, nie Werte
  pricingModel?: {
    type: 'one-time' | 'subscription' | 'usage';
    bullets: string[];                 // Bullet-Text, kein verbindliches Pricing in der DB
  };
  status: AiSystemStatus;
  linkedTemplates: string[];           // templateIds
  linkedModules: string[];             // moduleIds aus ProductModule
  knownRisks: string[];
  lastUpdatedAt: string;
}
```

### 8.3 Lese-Pfad und Sicherheit

- Quelle in Phase 1: lokales JSON / Mock im Frontend.
- Quelle in Phase 2+: dedizierte Notion-DB "AI-Systeme", read-only via
  den existierenden Operator-API-Adapter (siehe APP-X-BRIDGE-04c
  Project-Relation-Mapping). Kein Token im Frontend.
- Credentials/Tokens sind **niemals** Bestandteil der AI-Systeme-DB.
  Sie werden referenziert ueber `requiredCredentialRefs: string[]`
  als reine Namen, die zu Server-managed Secrets aufgeloest werden.
- **Keine automatische Produktveroeffentlichung.** Status `sellable`
  bedeutet "intern als verkaufsbereit markiert", nicht "automatisch
  als Angebot in einem Funnel veroeffentlicht".

---

## 9. Drive Context / Customer Context Sources

Project X analysiert Kundenkontext aus optionalen Quellen — primaer
**Google Drive** und perspektivisch jede `ReferenceArtifact`-Quelle
aus dem APP-X-BRIDGE-04a Vertrag. Der Zugriff ist immer
**read-only** und Phase-gestaffelt.

### 9.1 Akzeptierte Quellen

- Briefings (Doc / PDF)
- Angebote / Praesentationen (PDF / PPT-Export)
- Screenshots / Visuals (PNG / JPG / WebP)
- Prozessdokumente (Markdown / Doc)
- Exporte aus CRM/Sheets (CSV / Sheets-Read-only-Snapshot)
- Social-Media-Assets (Captions, Bilder)
- Alte Webseiteninhalte (HTML-Dump)
- Kundendatenblaetter

### 9.2 Extraction-Ziele

Aus diesen Quellen extrahiert Project X ausschliesslich:

- erkannte **Prozesse** (z.B. "Lead kommt via Webformular,
  manuelle Notion-Karte, manueller Versand")
- **manuelle Aufgaben** (Kandidaten fuer Automatisierung)
- **Automatisierungspotenzial** (Modul E)
- **noetige Setup-Felder** (welche Kundenparameter fehlen?)
- **Dokumentenfluesse** (woher → wohin → in welchem Format)
- **moegliche Workflow-Module** aus der AI-Systeme-DB

Output: ein `AutomationOpportunity` + optional ein
`WorkflowInstanceDraft` zur Operator-Sichtung.

### 9.3 Type-Skizze

```ts
export interface DriveContextSource {
  sourceId: string;
  origin: 'drive' | 'reference-artifact' | 'manual-upload';
  kind: 'doc' | 'pdf' | 'image' | 'csv' | 'markdown' | 'html' | 'other';
  refName: string;                  // human label, keine PII-Originaldatei direkt
  driveRef?: string;                // "drive:<fileId>" — Referenz, kein Inhalt
  ingestedAt?: string;
  ingestionStatus: 'queued' | 'extracted' | 'failed' | 'skipped';
  extractedSummary?: string;         // sanitised Operator-Sicht
  detectedProcesses?: string[];
  suggestedModules?: string[];       // systemIds aus AiSystemEntry
  sanitisedDiagnostic?: string;      // bei failed: human-lesbar, no secrets
}
```

### 9.4 Hard Constraints

- **Keine Secrets in Drive speichern.** Wenn ein Briefing versehentlich
  einen Token enthaelt, wird er beim Ingest serverseitig redacted —
  das Original wird *nicht* veraendert, aber das extrahierte Summary
  enthaelt nie Klartext-Tokens.
- **API Keys/Credentials** werden im UI **nicht** angezeigt. Wenn ein
  Workflow eine Credential erwartet, zeigt das UI nur einen
  Konfigurations-Status: `present` / `missing` / `expired`.
- **Drive-Zugriff in Phase 1** ist Mock-Only (lokale Datei-Liste).
  Phase 4+: Server-side OAuth gegen Drive, alle Tokens server-side,
  niemals Browser-seitig.
- **Kein Auto-Upload.** Customer/Operator entscheidet pro Datei, ob
  sie als Quelle ins System geht. Default: ausgeschlossen.

---

## 10. Hard Rails

Diese Regeln gelten ueber alle Phasen hinweg. Auch fuer spaetere
Workflow-Quests sind sie verbindlich. **Verstoesst eine Quest gegen
einen Punkt, wird sie als Protokoll 1616 markiert und nicht
ausgefuehrt.**

- **Keine echten n8n-Writes** ohne explizite Operator-Freigabe.
  Project X *schreibt* nichts in n8n.
- **Keine Workflow-Aktivierung** durch Project X oder Agenten.
  Aktivierung ist eine separat freigegebene Operator-Aktion (spaeter
  ueber einen kontrollierten Server-Pfad, niemals vom Browser aus).
- **Keine Credentials im Frontend.** Operator referenziert nur
  Credential-*Namen*, nie deren Werte. Kein localStorage, kein
  sessionStorage, kein Cookie, kein VITE-Env, kein hardcoded Key —
  wie in `APP-X-BRIDGE-05a` etabliert.
- **Keine Secrets in Logs.** Diagnostic-Felder werden serverseitig
  sanitised (siehe APP-X-BRIDGE-04e).
- **Keine Auto-Deploys.** Jeder Deploy ist Operator-Klick +
  Approval-Gate.
- **Keine Live-Execution** vor Freigabe. `execute` bleibt im
  Bridge-Layer weiterhin `HTTP 423` bis Operator-bound Approval-Gate
  live ist.
- **A/B-Tests** sind in Phase 1–5 *measurement & planning*, kein
  autonomer Rollout. Promotion zur Default-Version ist immer
  Operator-Click.
- **PitchMutation darf Varianten vorschlagen, aber Gewinner-Promotion
  nur mit Operator-Freigabe.** Auch "klare" Gewinner ueber
  Schwellenwerten brauchen einen expliziten Klick.
- **PitchMutation-Datenbank ist append-only.** Schlechte Varianten
  werden archiviert, nicht geloescht.
- **AI-Systeme-Datenbank ist Quelle fuer Produktvorschlaege**, aber
  keine automatische Produktveroeffentlichung in Funnels/Angeboten
  ohne Operator-Freigabe.
- **AI-Systeme-DB enthaelt keine Credentials**, nur Credential-*Refs*
  (Namen).
- **Drive Context ist read-only in fruehen Phasen.** Keine Drive-Writes
  in Phase 1–3. Phase 4+ nur server-side, kein Browser-Token-Handling.
- **Keine Kundendaten oder API-Keys in Logs.** Audit/Diagnostic-
  Strings sanitisen alle PII und Credential-Werte.
- **Notion read-only fuer Phase 1–3.** Schreibzugriff auf Notion
  (z.B. Workflow-Catalog-DB Updates, AI-Systeme-Status-Updates) ist
  eigene Quest mit eigenem Approval.
- **Kein Bypass ueber Andromeda.** Andromeda darf Quests anlegen, die
  Approvals *vorbereiten*, aber niemals Approvals *erteilen*.

---

## 11. MVP Roadmap

| Phase | Scope                                                                                  | Backend?              | n8n?     | Drive? |
| ----- | -------------------------------------------------------------------------------------- | --------------------- | -------- | ------ |
| 1     | UI/IA only, alle Sections als Read-only-Demo mit lokalen Mock-Daten                     | nein                  | nein     | nein   |
| 2     | Workflow Catalog liest existierende Reports / Notion-DB read-only                       | leichter Adapter      | nein     | nein   |
| 3     | **AI-Systeme-DB Read Model** — read-only-Adapter gegen Notion AI-Systeme-DB             | leichter Adapter      | nein     | nein   |
| 4     | Leadgen WorkflowTemplate-Modell + Module-Inventar (lokal, versioniert)                  | nein                  | nein     | nein   |
| 5     | **PitchMutation Integration** fuer Leadgen-Experimente (read-only Metriken aus Notion)   | Server-Adapter        | nein     | nein   |
| 6     | Customer Setup Wizard (Form-Flow, lokaler Draft, kein Persist)                          | nein                  | nein     | nein   |
| 7     | **Drive / ReferenceArtifact Context Intake** (read-only Listing, Mock-Extract)          | nein                  | nein     | read   |
| 8     | **Customer Setup Wizard mit Drive/Docs Inputs** (Drive-Listing flows in Setup-Felder)   | leichter Server-Stub  | nein     | read   |
| 9     | DryRunResult-Anzeige (Mock-Engine zeigt erwartete Outputs + Risiken)                    | leichter Server-Stub  | nein     | read   |
| 10    | A/B-Test-Tracking (Metriken-Mock + PitchMutation real, Winner-Hint, Operator-Promotion) | leichter Server       | nein     | read   |
| 11    | Template-Version-Promotion-Flow (Versionierung, Audit, Rueck-Promote)                   | Server                | nein     | read   |
| 12    | Kontrollierter n8n-Import/Deploy mit Approval-Gate                                      | Server                | **nur ja** mit Operator-Approval und Dry-Run-Pass | read |

Phasen 3, 5, 7, 8 sind die neuen Roadmap-Slots, die diese Spec-Revision
(FACTORY-01b) ergaenzt hat. Phase 1 ist weiterhin die direkte Folge
dieser Spec, jetzt mit erweitertem Scope (siehe Section 12).

---

## 12. Naechste konkrete Build-Quest

**PROJECT-X-UI-02 — Workflow-Fabrik Demo Sections**

### Scope

Nur `src/pages/OperatorCockpit.tsx` (und ggf. neue `src/components/*`
oder `src/data/projectXFactory.ts` falls Daten ausgelagert).
Kein Backend, kein API-Touch, keine n8n-Calls, keine Notion-Writes,
keine Drive-Writes.

Project-X-Bereich (innerhalb der Projekte-Seite, wenn Picker = Project X
oder als eigene Top-Section unterhalb des Live-Kontext-Loaders) bekommt
die folgenden Sections — **alle Read-only/Demo mit lokalen Mock-Daten**:

| Section                       | Demo-Inhalt (Phase 1)                                                |
| ----------------------------- | -------------------------------------------------------------------- |
| Workflow Catalog              | 3–5 Demo-Workflows (`demo-leadgen-v1`, `demo-followup-v1`, ...)       |
| **Product Modules / AI-Systeme** | 6–9 Eintraege aus der AI-Systeme-DB (Mock), Chip-Grid + Status      |
| **PitchMutation Experiments** | 1 laufendes Demo-Experiment mit 3 Varianten + Metriken-Strip          |
| Customer Setup Wizard         | 1 Demo-Setup mit Setup-Feldern aus einem Leadgen-Template             |
| **Drive / ReferenceArtifact Intake** | Mock-Datei-Liste (3 Dateien) + Empty-State + Hinweis "read-only" |
| Dry Runs                      | 1–2 Demo-DryRunResults inklusive `detectedRisks` und `missingFields`  |
| Approval Gate                 | 1 Demo-Approval-Card mit Operator-Buttons (disabled, locked)          |

### Strikte Constraints

- Kein autonomer Fetch, kein neuer fetch-Call.
- Keine Mutation der bestehenden Live-Projektkontext-Komponente.
- Keine echten Workflow-IDs aus `n8n.getvoidra.com` hardcoden —
  Demo-Namen (`demo-leadgen-v1`).
- Keine Credentials, keine Operator-Keys, keine Kundendaten in den
  Mock-Daten.
- PitchMutation-Variant-Mock zeigt nur sanitisierte Metriken
  (kein realer Reply-Inhalt).
- Drive-Intake-Mock zeigt nur Dateinamen + Status, **keinen
  Dateiinhalt**.
- AI-Systeme-Eintraege im Mock enthalten **keine echten
  Pricing-Zahlen**, nur Status + Bullet-Hinweise.
- Approval-Buttons sind sichtbar, aber `disabled` (Hint:
  "Approval-Layer erst in Phase 11/12 verdrahtet").

### Validierung

- `npm run typecheck`
- `npx tsc --noEmit -p tsconfig.api.json`
- `npm run build`
- Security-Scan wie bisher: kein Key, kein Storage, kein Notion-Write,
  kein Drive-Token, kein `console.log` neuer Daten.

### Out of Scope fuer UI-02

- Schreibzugriff auf irgendeine Datenquelle
- Echte PitchMutation-Variant-Generierung im Browser
- Echte Drive-OAuth oder Drive-Inhaltsabruf
- AI-Systeme-Status-Update
- n8n-Import oder -Aktivierung
- Andromeda-Sub-Quest-Dispatch
- Operator-Approval-Persistenz

### Erfolgskriterium

Operator oeffnet die Projekte-Seite mit Project X im Picker, sieht
unter dem Live-Kontext-Loader die sieben oben genannten Sections,
versteht in unter 60 Sekunden was Project X tut, und kann zu jeder
Section einen verbalen 1-Satz-Erklaerer geben, ohne den Code zu lesen.
Damit ist Section 1 dieser Spec im UI manifest.

---

Diese Spec macht klar: jede weitere Workflow-Quest hat einen klaren
Hard-Rails-Filter und einen klaren Phasen-Slot. Wenn eine zukuenftige
Quest gegen Section 10 verstoesst, wird sie als **Protokoll 1616**
markiert und nicht ausgefuehrt, bis sie ueberarbeitet ist.
