// /operator/integrations — Phase-1-Seite für den Connector-Katalog.
//
// Standalone-Seite analog zu OperatorCockpit (kein öffentliches
// Layout). Rendert nur statische UI; keine externen Calls.

import { Link } from 'react-router-dom';
import IntegrationsPanel from '../components/operator/IntegrationsPanel';
import NoxEventHorizonCore from '../components/operator/NoxEventHorizonCore';

export default function OperatorIntegrations() {
  return (
    <div className="min-h-screen bg-[#0a0407] px-5 pb-24 pt-10 text-[#fff7fb] md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <nav className="flex flex-wrap items-center gap-3 text-xs font-extrabold uppercase tracking-[0.24em] text-[#9f8d95]">
          <Link to="/operator-cockpit" className="hover:text-amber-200/80">
            ← Operator Cockpit
          </Link>
          <span className="text-[#4a101b]">/</span>
          <span className="text-amber-200/80">Integrationen</span>
        </nav>

        <header className="grid items-center gap-8 md:grid-cols-[1fr_320px] md:gap-12">
          <div className="space-y-3">
            <div className="text-[12px] font-extrabold uppercase tracking-[0.28em] text-amber-200/80">
              NOX Integration Center
            </div>
            <h1 className="text-4xl font-black leading-tight md:text-5xl">Integrationen</h1>
            <p className="max-w-3xl text-base font-semibold leading-7 text-[#eadbe2]">
              Welche Connectoren existieren, wofür sie da sind und wer sie nutzen wird. Die Ansicht
              ist Phase-1-statisch — echte Connect-Flows folgen nach OAuth-Endpoints und
              verschlüsselter Token-Storage.
            </p>
          </div>
          <div className="justify-self-center md:justify-self-end">
            <NoxEventHorizonCore
              state="bereit"
              activeAgent="nox"
              className="w-56 md:w-72"
            />
          </div>
        </header>

        <IntegrationsPanel />
      </div>
    </div>
  );
}
