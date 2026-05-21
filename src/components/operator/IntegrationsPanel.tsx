// NOX Integration Center — statische UI (Phase 1)
//
// SCOPE
// =====
// Rendert den Default-Connector-Katalog aus `src/types/integrations.ts`.
// Keine externen Calls, keine OAuth-Flows, keine Token-Speicherung.
// Buttons sind bewusst deaktiviert und tragen `aria-disabled` —
// echte Connect-/Prüf-/Detail-Flows kommen in späteren PRs.
//
// SICHERHEIT
// ==========
//   - Keine API-Keys, kein Secret-Handling.
//   - Keine Notion-/GitHub-/n8n-/Hermes-Writes.
//   - Status-Werte stammen 1:1 aus dem Default-Katalog (UI-Demo).

import { useMemo, useState } from 'react';
import {
  INTEGRATION_CONNECTORS_DEFAULT,
  connectorRiskTone,
  connectorStatusLabel,
} from '../../types/integrations';
import type {
  ConnectorAuthType,
  ConnectorConsumer,
  ConnectorRisk,
  ConnectorStatus,
  IntegrationConnector,
} from '../../types/integrations';

type PhaseFilter = 'all' | 1 | 2 | 3 | 4;

const CONSUMER_LABEL: Record<ConnectorConsumer, string> = {
  claude: 'Claude',
  nox_app: 'NOX-App',
  codex: 'Codex',
  n8n: 'n8n',
  hermes: 'Hermes',
  customer: 'Kunde',
};

const AUTH_LABEL: Record<ConnectorAuthType, string> = {
  oauth: 'OAuth',
  api_key: 'API-Key',
  bot_token: 'Bot-Token',
  local_bridge: 'Lokale Bridge',
  mcp: 'MCP',
  manual: 'Manuell',
};

const STATUS_TONE: Record<ConnectorStatus, string> = {
  not_configured: 'border-[#4a101b]/60 bg-[#120609]/70 text-[#9f8d95]',
  connected: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100',
  read_only: 'border-sky-400/40 bg-sky-500/10 text-sky-100',
  write_enabled: 'border-amber-300/45 bg-amber-300/10 text-amber-100',
  error: 'border-red-500/40 bg-red-500/10 text-red-100',
  disabled: 'border-[#4a101b]/60 bg-black/40 text-[#6c5d63]',
};

const RISK_TONE: Record<ConnectorRisk, string> = {
  low: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100',
  medium: 'border-amber-300/45 bg-amber-300/10 text-amber-100',
  high: 'border-red-500/40 bg-red-500/10 text-red-100',
  forbidden: 'border-red-500/60 bg-red-500/20 text-red-100',
};

const RISK_LABEL: Record<ConnectorRisk, string> = {
  low: 'Risiko: niedrig',
  medium: 'Risiko: mittel',
  high: 'Risiko: hoch',
  forbidden: 'Risiko: verboten',
};

function readWriteLabel(c: IntegrationConnector): string {
  if (c.supportsRead && c.supportsWrite) return 'Read + Write';
  if (c.supportsRead) return 'Nur Read';
  if (c.supportsWrite) return 'Nur Write';
  return 'Keine Pfade';
}

interface PanelProps {
  /** Optional: vorgefilterten Katalog übergeben. Default = voller Default-Katalog. */
  connectors?: ReadonlyArray<IntegrationConnector>;
  /** Begleitfußnote unter dem Panel anzeigen. */
  showFootnote?: boolean;
}

export function IntegrationsPanel({
  connectors = INTEGRATION_CONNECTORS_DEFAULT,
  showFootnote = true,
}: PanelProps) {
  const [phase, setPhase] = useState<PhaseFilter>('all');
  const [showCustomerOnly, setShowCustomerOnly] = useState(false);

  const filtered = useMemo(() => {
    return connectors.filter((c) => {
      if (phase !== 'all' && c.recommendedPhase !== phase) return false;
      if (showCustomerOnly && !c.customerConnectable) return false;
      return true;
    });
  }, [connectors, phase, showCustomerOnly]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[12px] font-extrabold uppercase tracking-[0.28em] text-amber-200/80">
            Integrationen
          </div>
          <h2 className="mt-2 text-3xl font-black text-[#fff7fb]">Connector-Katalog</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#eadbe2]">
            Statische Phase-1-Ansicht. Verbindungen sind noch nicht aktiv — alle Buttons sind
            deaktiviert. Inhalte stammen aus dem Default-Katalog in
            <code className="mx-1 rounded bg-black/40 px-1.5 py-0.5 text-xs text-amber-100">
              src/types/integrations.ts
            </code>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-bold text-[#9f8d95]">
            Phase
            <select
              value={phase}
              onChange={(e) =>
                setPhase(e.target.value === 'all' ? 'all' : (Number(e.target.value) as 1 | 2 | 3 | 4))
              }
              className="ml-2 rounded-lg border border-[#4a101b]/60 bg-[#120609] px-2 py-1.5 text-sm font-bold text-[#fff7fb] focus:outline-none"
            >
              <option value="all">Alle</option>
              <option value={1}>Phase 1</option>
              <option value={2}>Phase 2</option>
              <option value={3}>Phase 3</option>
              <option value={4}>Phase 4</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-[#4a101b]/60 bg-[#120609] px-3 py-2 text-xs font-bold text-[#eadbe2]">
            <input
              type="checkbox"
              checked={showCustomerOnly}
              onChange={(e) => setShowCustomerOnly(e.target.checked)}
              className="h-3.5 w-3.5 accent-amber-300"
            />
            nur kunden-verbindbar
          </label>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-[#4a101b]/60 bg-[#120609]/70 p-6 text-sm font-bold text-[#9f8d95]">
            Keine Connectoren in dieser Auswahl.
          </div>
        ) : (
          filtered.map((c) => <ConnectorCard key={c.id} connector={c} />)
        )}
      </div>

      {showFootnote ? (
        <footer className="rounded-2xl border border-[#4a101b]/60 bg-[#120609]/60 p-5 text-xs font-bold leading-6 text-[#9f8d95]">
          <div className="mb-2 text-amber-200/80">Sicherheits-Hinweis</div>
          <p>
            Diese Seite ist eine reine UI-Vorschau. Es werden keine Tokens gespeichert, keine
            Anbieter-APIs aufgerufen, kein OAuth-Flow gestartet. Buttons sind disabled. Echte
            Connect-Flows folgen erst nach OAuth-Endpoints + verschlüsselter Connection-Storage
            (siehe <code className="rounded bg-black/40 px-1.5 py-0.5 text-amber-100">
              docs/nox-integration-center-plan.md
            </code>, Phase 2+).
          </p>
        </footer>
      ) : null}
    </section>
  );
}

function ConnectorCard({ connector }: { connector: IntegrationConnector }) {
  const consumers = connector.usedBy.map((c) => CONSUMER_LABEL[c]).join(', ');
  const riskTone = connectorRiskTone(connector.risk);

  return (
    <article
      className={`flex h-full flex-col gap-4 rounded-2xl border bg-[#120609]/70 p-5 transition ${
        riskTone === 'red'
          ? 'border-red-500/30'
          : riskTone === 'amber'
          ? 'border-amber-300/30'
          : 'border-[#4a101b]/60'
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black leading-tight text-[#fff7fb]">{connector.label}</h3>
          <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#9f8d95]">
            {connector.id} · Phase {connector.recommendedPhase}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${STATUS_TONE[connector.status]}`}
        >
          {connectorStatusLabel(connector.status)}
        </span>
      </header>

      <p className="text-sm font-semibold leading-6 text-[#eadbe2]">{connector.description}</p>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs font-bold text-[#9f8d95]">
        <Field label="Auth" value={AUTH_LABEL[connector.authType]} />
        <Field label="Pfade" value={readWriteLabel(connector)} />
        <Field label="Genutzt von" value={consumers} fullWidth />
        <Field label="Kunden-verbindbar" value={connector.customerConnectable ? 'ja' : 'nein'} />
        <Field
          label="Lokal nötig"
          value={connector.requiresLocalProcess ? 'ja' : 'nein'}
        />
        {connector.minimalScopes && connector.minimalScopes.length > 0 ? (
          <Field label="Scopes" value={connector.minimalScopes.join(', ')} fullWidth />
        ) : null}
        {connector.lastCheckedAt ? (
          <Field label="Letzter Check" value={connector.lastCheckedAt} fullWidth />
        ) : null}
        {connector.lastError ? (
          <Field label="Letzter Fehler" value={connector.lastError} fullWidth />
        ) : null}
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${RISK_TONE[connector.risk]}`}
        >
          {RISK_LABEL[connector.risk]}
        </span>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <DisabledButton title="Phase 1: Connect-Flow noch nicht implementiert.">
          Verbinden
        </DisabledButton>
        <DisabledButton title="Phase 2+: Health-Check kommt mit erstem echten Connector.">
          Prüfen
        </DisabledButton>
        <DisabledButton title="Detail-Drawer folgt in einer späteren PR.">Details</DisabledButton>
      </div>
    </article>
  );
}

function Field({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <dt className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#6c5d63]">
        {label}
      </dt>
      <dd className="mt-0.5 text-xs font-bold text-[#eadbe2]">{value}</dd>
    </div>
  );
}

function DisabledButton({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title={title}
      className="cursor-not-allowed rounded-full border border-[#4a101b]/60 bg-black/30 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#6c5d63]"
    >
      {children}
    </button>
  );
}

export default IntegrationsPanel;
