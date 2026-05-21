// NOX Integration Center — TypeScript-Datenmodell
//
// SCOPE
// =====
// Reine Typdefinitionen + ein konservativer Default-Katalog. KEIN
// Netzwerk-Code, KEIN Secret-Handling, KEIN OAuth-Flow. Wird in einer
// Folge-PR von der Operator-Seite `/operator/integrations`
// konsumiert.
//
// SICHERHEIT
// ==========
//   - Keine API-Keys, Tokens oder Refresh-Tokens leben in dieser
//     Datei oder im Default-Katalog. Status-Felder sind
//     ausschließlich abgeleitete Anzeige-Werte.
//   - `customerConnectable: true` markiert nur, *ob* ein Endkunde den
//     Connector verbinden darf. Die tatsächliche Pro-User-Connection
//     liegt in einer separaten Connection-Row in der Datenbank (siehe
//     `docs/nox-integration-center-plan.md`, Phase 3).

export type ConnectorId =
  | 'claude_code'
  | 'nox_mcp'
  | 'notion'
  | 'github'
  | 'google_drive'
  | 'onedrive'
  | 'slack'
  | 'gmail'
  | 'google_calendar'
  | 'n8n'
  | 'telegram'
  | 'sentry'
  | 'stripe'
  | 'youtube'
  | 'meta_whatsapp';

export type ConnectorStatus =
  | 'not_configured'
  | 'connected'
  | 'read_only'
  | 'write_enabled'
  | 'error'
  | 'disabled';

export type ConnectorAuthType =
  | 'oauth'
  | 'api_key'
  | 'bot_token'
  | 'local_bridge'
  | 'mcp'
  | 'manual';

export type ConnectorRisk =
  | 'low'
  | 'medium'
  | 'high'
  | 'forbidden';

export type ConnectorConsumer =
  | 'claude'
  | 'nox_app'
  | 'codex'
  | 'n8n'
  | 'hermes'
  | 'customer';

export interface IntegrationConnector {
  /** Kanonischer slug. Stabil über Versionen, in URLs verwendbar. */
  id: ConnectorId;
  /** UI-Beschriftung, kurz. */
  label: string;
  /** 1–2 Sätze, neutral. Kein Marketing-Sprech. */
  description: string;
  /** Wie wird authentifiziert? */
  authType: ConnectorAuthType;
  /** Aktueller, abgeleiteter Status (nicht der Default-Persistenz-Wert). */
  status: ConnectorStatus;
  /** Risiko-Klasse für die Permission-Logik. */
  risk: ConnectorRisk;
  /** Welche Komponenten zugreifen werden, sobald aktiv. */
  usedBy: ConnectorConsumer[];
  /** Connector erlaubt Lese-Pfad. */
  supportsRead: boolean;
  /** Connector erlaubt Write-Pfad. */
  supportsWrite: boolean;
  /** Darf ein Endkunde diesen Connector in seiner Org verbinden? */
  customerConnectable: boolean;
  /** Braucht ein OAuth-Flow. Implizit auch wenn authType='oauth'. */
  requiresOAuth: boolean;
  /** Braucht einen lokalen Prozess beim User (z. B. Bridge/MCP-Server). */
  requiresLocalProcess: boolean;
  /** Phase im Roadmap-Plan (siehe docs/nox-integration-center-plan.md). */
  recommendedPhase: 1 | 2 | 3 | 4;
  /** Minimale Scopes für OAuth-/Token-Setups (UI-Anzeige). */
  minimalScopes?: string[];
  /** ISO-Timestamp des letzten Health-Checks. */
  lastCheckedAt?: string;
  /** Kurzer Fehlerklartext (kein Token, keine Stacktraces). */
  lastError?: string;
}

/* ============================================================================
 * Default-Katalog
 * ============================================================================
 *
 * Initialer, konservativer Set. UI rendert genau diesen Katalog, bis
 * eine echte Connector-Konfiguration vom Server eintrifft. Alle Werte
 * sind Anzeige-Defaults, **keine** Auth-Werte.
 *
 * Trading-/Broker-Live-Pfade sind **bewusst nicht** im Katalog. Sie
 * sind in der Bridge-Forbidden-Liste und bleiben dort.
 */

export const INTEGRATION_CONNECTORS_DEFAULT: ReadonlyArray<IntegrationConnector> = [
  // ── Claude / NOX-eigene Pfade ──────────────────────────────────────
  {
    id: 'claude_code',
    label: 'Claude Code (lokale Bridge)',
    description:
      'Claude Code läuft beim Operator lokal über das eigene Abo/Login. NOX spricht über die Loopback-Bridge mit ihm.',
    authType: 'local_bridge',
    status: 'not_configured',
    risk: 'low',
    usedBy: ['claude', 'nox_app'],
    supportsRead: true,
    supportsWrite: true,
    customerConnectable: false,
    requiresOAuth: false,
    requiresLocalProcess: true,
    recommendedPhase: 1,
  },
  {
    id: 'nox_mcp',
    label: 'NOX MCP Server',
    description:
      'NOX exposed seine Cockpit-Tools als MCP-Server. Claude Desktop/Code kann ihn ohne Bridge nutzen.',
    authType: 'mcp',
    status: 'not_configured',
    risk: 'low',
    usedBy: ['claude', 'nox_app'],
    supportsRead: true,
    supportsWrite: true,
    customerConnectable: false,
    requiresOAuth: false,
    requiresLocalProcess: true,
    recommendedPhase: 1,
  },

  // ── Knowledge / Work-OS ────────────────────────────────────────────
  {
    id: 'notion',
    label: 'Notion',
    description:
      'Master-Tasks-DB, Projektkontext, Audit-Spiegel. Aktuell API-Key, Phase 2 wechselt auf Notion-OAuth.',
    authType: 'api_key',
    status: 'not_configured',
    risk: 'medium',
    usedBy: ['claude', 'nox_app', 'n8n'],
    supportsRead: true,
    supportsWrite: true,
    customerConnectable: false,
    requiresOAuth: false,
    requiresLocalProcess: false,
    recommendedPhase: 1,
    minimalScopes: ['read_content', 'update_content'],
  },
  {
    id: 'github',
    label: 'GitHub',
    description:
      'Code-Hosting, PR-Pflege, Codex-Dispatch. Read-only zuerst, Write nach OAuth-Flow Phase 2.',
    authType: 'oauth',
    status: 'not_configured',
    risk: 'medium',
    usedBy: ['claude', 'codex', 'n8n'],
    supportsRead: true,
    supportsWrite: true,
    customerConnectable: true,
    requiresOAuth: true,
    requiresLocalProcess: false,
    recommendedPhase: 2,
    minimalScopes: ['repo:read', 'repo:write', 'pull_request:write'],
  },

  // ── Files / Drive ──────────────────────────────────────────────────
  {
    id: 'google_drive',
    label: 'Google Drive',
    description:
      'Dokumenten-Zugriff für Claude/Endkunden. OAuth pro User-Org, Scopes minimal.',
    authType: 'oauth',
    status: 'not_configured',
    risk: 'medium',
    usedBy: ['claude', 'customer'],
    supportsRead: true,
    supportsWrite: false,
    customerConnectable: true,
    requiresOAuth: true,
    requiresLocalProcess: false,
    recommendedPhase: 2,
    minimalScopes: ['drive.readonly'],
  },
  {
    id: 'onedrive',
    label: 'OneDrive / Microsoft 365',
    description:
      'Dokumenten-/Mail-Zugriff für Microsoft-Nutzer. OAuth, Tenant-Aware.',
    authType: 'oauth',
    status: 'not_configured',
    risk: 'medium',
    usedBy: ['customer'],
    supportsRead: true,
    supportsWrite: false,
    customerConnectable: true,
    requiresOAuth: true,
    requiresLocalProcess: false,
    recommendedPhase: 2,
    minimalScopes: ['Files.Read.All'],
  },

  // ── Messaging ──────────────────────────────────────────────────────
  {
    id: 'slack',
    label: 'Slack',
    description:
      'Bot-Adapter für Updates + Befehle. Read-/Write-Trennung pro Channel.',
    authType: 'oauth',
    status: 'not_configured',
    risk: 'medium',
    usedBy: ['claude', 'hermes'],
    supportsRead: true,
    supportsWrite: true,
    customerConnectable: true,
    requiresOAuth: true,
    requiresLocalProcess: false,
    recommendedPhase: 2,
    minimalScopes: ['channels:read', 'chat:write', 'commands'],
  },
  {
    id: 'gmail',
    label: 'Gmail',
    description:
      'Mail-Lese-Zugriff für Endkunden-Anwendungen. Hohe Sensitivität — Phase 3.',
    authType: 'oauth',
    status: 'not_configured',
    risk: 'high',
    usedBy: ['customer'],
    supportsRead: true,
    supportsWrite: false,
    customerConnectable: true,
    requiresOAuth: true,
    requiresLocalProcess: false,
    recommendedPhase: 3,
    minimalScopes: ['gmail.readonly'],
  },
  {
    id: 'google_calendar',
    label: 'Google Calendar',
    description:
      'Termin-Reads für Hermes-Voice-Workflows; Endkunde verbindet seinen Kalender.',
    authType: 'oauth',
    status: 'not_configured',
    risk: 'medium',
    usedBy: ['hermes', 'customer'],
    supportsRead: true,
    supportsWrite: false,
    customerConnectable: true,
    requiresOAuth: true,
    requiresLocalProcess: false,
    recommendedPhase: 3,
    minimalScopes: ['calendar.readonly'],
  },

  // ── Automation ─────────────────────────────────────────────────────
  {
    id: 'n8n',
    label: 'n8n (getvoidra.com)',
    description:
      'Dispatcher, Scheduler, Webhooks. Aktuell API-Key auf Operator-Seite; nie kundenseitig verbunden.',
    authType: 'api_key',
    status: 'not_configured',
    risk: 'medium',
    usedBy: ['nox_app', 'hermes'],
    supportsRead: true,
    supportsWrite: true,
    customerConnectable: false,
    requiresOAuth: false,
    requiresLocalProcess: false,
    recommendedPhase: 1,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    description:
      'Bot-Adapter für Voice/Push-Nachrichten an Operator. Bot-Token im Server-Env.',
    authType: 'bot_token',
    status: 'not_configured',
    risk: 'medium',
    usedBy: ['hermes'],
    supportsRead: true,
    supportsWrite: true,
    customerConnectable: false,
    requiresOAuth: false,
    requiresLocalProcess: false,
    recommendedPhase: 2,
  },

  // ── Monitoring / Commerce / Media ──────────────────────────────────
  {
    id: 'sentry',
    label: 'Sentry',
    description:
      'Error-Monitoring für NOX/Worker. Read-only-Token genügt für Cockpit-Anzeige.',
    authType: 'api_key',
    status: 'not_configured',
    risk: 'low',
    usedBy: ['claude', 'n8n'],
    supportsRead: true,
    supportsWrite: false,
    customerConnectable: false,
    requiresOAuth: false,
    requiresLocalProcess: false,
    recommendedPhase: 2,
  },
  {
    id: 'stripe',
    label: 'Stripe',
    description:
      'Optional: Abrechnung für customer-facing NOX. Hohe Sensitivität — Phase 3.',
    authType: 'api_key',
    status: 'not_configured',
    risk: 'high',
    usedBy: ['customer'],
    supportsRead: true,
    supportsWrite: true,
    customerConnectable: true,
    requiresOAuth: false,
    requiresLocalProcess: false,
    recommendedPhase: 3,
  },
  {
    id: 'youtube',
    label: 'YouTube',
    description:
      'Optional: Noxreel-Upload-Pipeline. OAuth pro Channel.',
    authType: 'oauth',
    status: 'not_configured',
    risk: 'medium',
    usedBy: ['claude', 'customer'],
    supportsRead: true,
    supportsWrite: true,
    customerConnectable: true,
    requiresOAuth: true,
    requiresLocalProcess: false,
    recommendedPhase: 3,
    minimalScopes: ['youtube.upload'],
  },
  {
    id: 'meta_whatsapp',
    label: 'Meta / WhatsApp',
    description:
      'Optional: Customer-Messaging. OAuth/Business-App. Hohe Sensitivität — Phase 4.',
    authType: 'oauth',
    status: 'not_configured',
    risk: 'high',
    usedBy: ['customer'],
    supportsRead: true,
    supportsWrite: true,
    customerConnectable: true,
    requiresOAuth: true,
    requiresLocalProcess: false,
    recommendedPhase: 4,
  },
];

/* ============================================================================
 * Helpers
 * ============================================================================
 */

/** Erlaubt Filterung nach Phase für die UI-Sektionen. */
export function getConnectorsForPhase(phase: 1 | 2 | 3 | 4): IntegrationConnector[] {
  return INTEGRATION_CONNECTORS_DEFAULT.filter((c) => c.recommendedPhase <= phase);
}

/** Schnellzugriff per ID — Default-Katalog. */
export function findDefaultConnector(id: ConnectorId): IntegrationConnector | undefined {
  return INTEGRATION_CONNECTORS_DEFAULT.find((c) => c.id === id);
}

/**
 * Lesbares Label für einen Status, das die UI direkt rendern kann.
 * Bewusst kein i18n-System — der Cockpit ist heute deutschsprachig.
 */
export function connectorStatusLabel(status: ConnectorStatus): string {
  switch (status) {
    case 'not_configured':
      return 'Nicht eingerichtet';
    case 'connected':
      return 'Verbunden';
    case 'read_only':
      return 'Read-only';
    case 'write_enabled':
      return 'Write enabled';
    case 'error':
      return 'Fehler';
    case 'disabled':
      return 'Deaktiviert';
    default:
      return 'Unbekannt';
  }
}

/** Risiko-Tone-Hint für UI-Farben (UI mappt das auf Tailwind). */
export function connectorRiskTone(risk: ConnectorRisk): 'gray' | 'amber' | 'red' {
  switch (risk) {
    case 'low':
      return 'gray';
    case 'medium':
      return 'amber';
    case 'high':
    case 'forbidden':
      return 'red';
  }
}
