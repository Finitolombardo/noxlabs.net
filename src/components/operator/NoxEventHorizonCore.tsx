// NOX Event Horizon Core
//
// Zentraler Visual-Core der NOX-Operator-UI. Wirkt wie ein Fenster
// in den Ereignishorizont — kein HUD-Ring, keine sichtbare runde
// UI-Hülle. Subtile Vignette + sehr dezenter Ruby/Gold-Outer-Glow
// rahmen das Video, ohne den schwarzen Kern zu übermalen.
//
// SCOPE
// =====
//   - Rendert ein loopendes, stummes, inline-playendes <video>.
//     Quelle ist ein Ping-Pong-Loop (forward+reverse), damit der
//     Browser-Loop nicht sichtbar springt.
//   - `prefers-reduced-motion` respektiert: Video wird pausiert,
//     Poster bleibt sichtbar.
//   - Keine Browser-Controls. Kein Audio.
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
  nox: 'rgba(232,64,64,0.45)', // NOX-Ruby (Default)
  lead_claude: 'rgba(244,180,90,0.45)', // Gold
  hermes: 'rgba(190,120,255,0.45)', // Magenta-Violett
  codex: 'rgba(120,200,255,0.45)', // Cyan
  security: 'rgba(255,80,80,0.55)', // Red, kräftiger
  quest: 'rgba(120,160,255,0.45)', // Blau
  n8n: 'rgba(120,255,180,0.40)', // Mint
  mcp: 'rgba(255,200,120,0.40)', // Amber
  bridge: 'rgba(200,200,200,0.35)', // Neutralgrau
};

/** State → Glow-Intensität-Multiplikator + ARIA-Hinweis. */
const STATE_META: Record<NoxCoreState, { aria: string; intensity: number }> = {
  bereit: { aria: 'bereit', intensity: 1.0 },
  hoert_zu: { aria: 'hört zu', intensity: 1.15 },
  denkt: { aria: 'denkt', intensity: 0.85 },
  spricht: { aria: 'spricht', intensity: 1.3 },
  warnung: { aria: 'Warnung', intensity: 1.5 },
};

export interface NoxEventHorizonCoreProps {
  /** Aktueller Core-Zustand. Steuert Glow-Intensität + ARIA. */
  state?: NoxCoreState;
  /** Aktiver Agent — färbt den äußeren Glow. */
  activeAgent?: NoxActiveAgent;
  /** Optional zusätzliche Tailwind-Klassen für den Außen-Container. */
  className?: string;
  /** object-fit Modus für das <video>. Default: cover. */
  fit?: 'cover' | 'contain';
  /** Aspect-Ratio des Cinematic-Fensters. Default: 16/9. */
  aspectRatio?: string;
}

/**
 * Zentraler Event-Horizon-Visual-Core (cinematic).
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
  aspectRatio = '16 / 9',
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
      className={`relative overflow-hidden bg-black select-none ${className}`}
      role="img"
      aria-label={`NOX Ereignishorizont Core — ${meta.aria}`}
      style={{
        aspectRatio,
        // Sehr weicher Außen-Glow als Shadow, kein sichtbarer Rand
        boxShadow: `0 0 80px 8px ${glow.replace(/[\d.]+\)$/, `${0.35 * meta.intensity})`)}`,
      }}
    >
      {/* Video-Ebene — füllt den Container komplett, ohne Maske/Ring */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full"
        style={{ objectFit: fit }}
        src="/nox-assets/nox-event-horizon-core-loop.mp4"
        poster="/nox-assets/nox-event-horizon-core-loop-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <span className="sr-only">NOX Ereignishorizont lädt…</span>
      </video>

      {/* Fallback-Text, sichtbar nur falls Video-Element gar nicht rendert */}
      <noscript>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[#9f8d95]">
          NOX Ereignishorizont lädt…
        </div>
      </noscript>

      {/*
        Vignette — sehr dezent, nur Ecken-Verdunkelung.
        Cinematic-Fenster-Effekt, KEIN sichtbarer Kreis-Ring.
      */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.45) 100%)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
