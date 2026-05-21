// NOX Event Horizon Core
//
// Zentraler Visual-Core der NOX-Operator-UI. Ersetzt die alten
// SVG-/Orb-Darstellungen (`NoxCommandCore`, `NoxSystemCore`) als
// Premium-Hero-Element.
//
// SCOPE
// =====
//   - Rendert ein loopendes, stummes, inline-playendes <video> aus
//     /nox-assets/nox-event-horizon-core.mp4.
//   - Subtile Overlay-Layer (Vignette, Ruby/Gold-Glow, optionaler
//     Agent-Color-Glow), kein UI-Chrome.
//   - `prefers-reduced-motion` respektiert: Video wird pausiert,
//     Poster bleibt sichtbar.
//   - Keine Browser-Controls. Kein Audio. Endlos-Loop.
//
// SICHERHEIT
// ==========
//   - Reine Client-Komponente. Kein externer Call, keine Tokens.

import { useEffect, useRef } from 'react';

export type NoxCoreState = 'bereit' | 'hoert_zu' | 'denkt' | 'spricht' | 'warnung';

export type NoxActiveAgent =
  | 'nox'
  | 'lead_claude'
  | 'hermes'
  | 'codex'
  | 'security'
  | 'quest'
  | 'n8n'
  | 'mcp'
  | 'bridge';

/** Agent-Farben für den optionalen Outer-Glow (deutsche Operator-Palette). */
const AGENT_GLOW: Record<NoxActiveAgent, string> = {
  nox: 'rgba(232,64,64,0.55)', // NOX-Ruby (Default)
  lead_claude: 'rgba(244,180,90,0.55)', // Gold
  hermes: 'rgba(190,120,255,0.55)', // Magenta-Violett
  codex: 'rgba(120,200,255,0.55)', // Cyan
  security: 'rgba(255,80,80,0.65)', // Red, kräftiger
  quest: 'rgba(120,160,255,0.55)', // Blau
  n8n: 'rgba(120,255,180,0.45)', // Mint
  mcp: 'rgba(255,200,120,0.50)', // Amber
  bridge: 'rgba(200,200,200,0.45)', // Neutralgrau
};

/** State → Glow-Intensität-Multiplikator + Aria-Label-Hinweis. */
const STATE_META: Record<NoxCoreState, { aria: string; intensity: number }> = {
  bereit: { aria: 'bereit', intensity: 1.0 },
  hoert_zu: { aria: 'hört zu', intensity: 1.15 },
  denkt: { aria: 'denkt', intensity: 0.85 },
  spricht: { aria: 'spricht', intensity: 1.3 },
  warnung: { aria: 'Warnung', intensity: 1.5 },
};

export interface NoxEventHorizonCoreProps {
  /** Aktueller Core-Zustand. Steuert subtile Glow-Intensität + ARIA. */
  state?: NoxCoreState;
  /** Aktiver Agent — färbt den äußeren Glow. */
  activeAgent?: NoxActiveAgent;
  /** Optional zusätzliche Tailwind-Klassen für den Außen-Container. */
  className?: string;
  /** object-fit Modus für das <video>. Default: cover. */
  fit?: 'cover' | 'contain';
}

/**
 * Zentraler Event-Horizon-Visual-Core.
 *
 * Verwendung minimal:
 *   <NoxEventHorizonCore />
 *
 * Mit Zustand / Agent-Farbe:
 *   <NoxEventHorizonCore state="spricht" activeAgent="hermes" />
 */
export default function NoxEventHorizonCore({
  state = 'bereit',
  activeAgent = 'nox',
  className = '',
  fit = 'cover',
}: NoxEventHorizonCoreProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const meta = STATE_META[state];
  const glow = AGENT_GLOW[activeAgent];

  // prefers-reduced-motion: Video pausieren, Poster bleibt.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      const v = videoRef.current;
      if (!v) return;
      if (mq.matches) {
        try {
          v.pause();
        } catch {
          /* noop */
        }
      } else {
        // Best-effort autoplay — Browser können trotz muted blockieren.
        v.play().catch(() => {
          /* User-Geste evtl. nötig */
        });
      }
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-full bg-black select-none ${className}`}
      role="img"
      aria-label={`NOX Ereignishorizont Core — ${meta.aria}`}
      style={{ aspectRatio: '1 / 1' }}
    >
      {/* Video-Ebene */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full"
        style={{ objectFit: fit }}
        src="/nox-assets/nox-event-horizon-core.mp4"
        poster="/nox-assets/nox-event-horizon-core-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        // controls bewusst nicht setzen — keine Browser-Chrome
        // Fallback-Text für sehr alte Engines / fehlende Codecs
      >
        <span className="sr-only">NOX Ereignishorizont lädt…</span>
      </video>

      {/* Fallback-Text, sichtbar nur falls Video-Element nicht rendert */}
      <noscript>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[#9f8d95]">
          NOX Ereignishorizont lädt…
        </div>
      </noscript>

      {/* Vignette — dezenter Schwarzring nach außen */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(closest-side, transparent 55%, rgba(0,0,0,0.35) 85%, rgba(0,0,0,0.7) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Agent-Color-Glow — Außenring, multipliziert mit State-Intensität */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(closest-side, transparent 62%, ${glow} 92%, transparent 100%)`,
          opacity: 0.55 * meta.intensity,
          mixBlendMode: 'screen',
        }}
        aria-hidden="true"
      />

      {/* Sehr dezenter Ruby/Gold-Innen-Glow, der das schwarze Loch nicht clippt */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(closest-side, rgba(255,90,90,0.06) 30%, transparent 70%)',
          mixBlendMode: 'screen',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
