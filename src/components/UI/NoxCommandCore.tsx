import { motion, useReducedMotion } from 'framer-motion';
import NoxBolt from './NoxBolt';

/**
 * NoxCommandCore
 *
 * Premium hero visual replacing the generic node-graph core.
 * A single central NOX reactor: concentric architectural rings, layered red
 * glow, a slow scanner sweep, a few horizontal trace lines, and discreet
 * status markers on the rim. No hub-and-spoke diagram. No labeled outer nodes.
 */
export default function NoxCommandCore() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="relative w-full mx-auto select-none"
      style={{ maxWidth: 880, aspectRatio: '16 / 10' }}
      aria-hidden="true"
    >
      {/* Deep ambient glow behind the core */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[62%] h-[62%] rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, rgba(232,64,64,0.32), rgba(201,48,48,0.12) 55%, transparent 72%)',
            filter: 'blur(30px)',
          }}
        />
      </div>

      {/* SVG — desktop detailed version */}
      <svg
        viewBox="0 0 880 550"
        className="relative w-full h-full hidden sm:block"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="ncc-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF6464" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#C93030" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#4A0A0D" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="ncc-core-hot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE3E3" stopOpacity="1" />
            <stop offset="30%" stopColor="#FF5A5A" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#C93030" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#C93030" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="ncc-trace" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(232,64,64,0)" />
            <stop offset="50%" stopColor="rgba(232,64,64,0.55)" />
            <stop offset="100%" stopColor="rgba(232,64,64,0)" />
          </linearGradient>

          <linearGradient id="ncc-scan" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,120,120,0)" />
            <stop offset="50%" stopColor="rgba(255,120,120,0.5)" />
            <stop offset="100%" stopColor="rgba(255,120,120,0)" />
          </linearGradient>

          <mask id="ncc-ring-mask">
            <rect width="880" height="550" fill="white" />
            <rect x="0" y="0" width="880" height="80" fill="url(#ncc-fade-top)" />
            <rect x="0" y="470" width="880" height="80" fill="url(#ncc-fade-top)" />
          </mask>

          <linearGradient id="ncc-fade-top" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="black" />
            <stop offset="100%" stopColor="white" />
          </linearGradient>

          <filter id="ncc-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>

        {/* Horizontal trace lines — controlled, few */}
        <g opacity="0.55">
          <line x1="0" y1="140" x2="880" y2="140" stroke="url(#ncc-trace)" strokeWidth="1" />
          <line x1="0" y1="275" x2="880" y2="275" stroke="url(#ncc-trace)" strokeWidth="1" strokeOpacity="0.9" />
          <line x1="0" y1="410" x2="880" y2="410" stroke="url(#ncc-trace)" strokeWidth="1" />
        </g>

        {/* Diagonal reference trace */}
        <line
          x1="40"
          y1="500"
          x2="840"
          y2="60"
          stroke="rgba(232,64,64,0.10)"
          strokeWidth="1"
          strokeDasharray="2 6"
        />

        {/* Concentric architectural rings, masked to fade top/bottom */}
        <g mask="url(#ncc-ring-mask)" transform="translate(440 275)">
          {/* Outer rim */}
          <circle r="248" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <circle r="248" fill="none" stroke="rgba(201,48,48,0.18)" strokeWidth="1" strokeDasharray="1 9" />

          {/* Mid ring */}
          <circle r="188" fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="1" />

          {/* Rotating dashed structure ring */}
          <motion.g
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '0 0' }}
          >
            <circle r="148" fill="none" stroke="rgba(232,64,64,0.28)" strokeWidth="1" strokeDasharray="3 18" />
          </motion.g>

          {/* Inner engineered ring — counter-rotating, slower */}
          <motion.g
            animate={reduceMotion ? undefined : { rotate: -360 }}
            transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '0 0' }}
          >
            <circle r="108" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="1 3" />
          </motion.g>

          {/* Tick marks at cardinal points on outer rim */}
          {[0, 90, 180, 270].map((deg) => (
            <g key={deg} transform={`rotate(${deg})`}>
              <line x1="248" y1="0" x2="258" y2="0" stroke="rgba(232,64,64,0.55)" strokeWidth="1.25" />
            </g>
          ))}

          {/* Subtle quadrant hairlines */}
          {[45, 135, 225, 315].map((deg) => (
            <g key={deg} transform={`rotate(${deg})`}>
              <line x1="188" y1="0" x2="244" y2="0" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            </g>
          ))}

          {/* Core glow halo */}
          <circle r="150" fill="url(#ncc-core)" opacity="0.9" />
          {/* Breathing hot core */}
          <motion.circle
            r="72"
            fill="url(#ncc-core-hot)"
            animate={reduceMotion ? undefined : { scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Inner pressure ring */}
          <circle r="58" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" filter="url(#ncc-soft)" />
          <circle r="44" fill="none" stroke="rgba(255,200,200,0.45)" strokeWidth="0.75" />
        </g>

        {/* Slow vertical scanner sweep */}
        {!reduceMotion && (
          <motion.rect
            x="0"
            width="880"
            height="140"
            fill="url(#ncc-scan)"
            initial={{ y: -140 }}
            animate={{ y: 550 }}
            transition={{ duration: 9, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
            opacity="0.55"
          />
        )}

        {/* Rim status markers — tiny, no labels in SVG */}
        {[
          { x: 440 - 248, y: 275 },
          { x: 440 + 248, y: 275 },
          { x: 440, y: 275 - 248 },
          { x: 440, y: 275 + 248 },
        ].map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#FF5A5A" />
            <motion.circle
              cx={p.x}
              cy={p.y}
              r="3"
              fill="none"
              stroke="#FF5A5A"
              strokeWidth="1"
              animate={reduceMotion ? undefined : { r: [3, 10], opacity: [0.8, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
            />
          </g>
        ))}
      </svg>

      {/* Mobile simplified version */}
      <svg
        viewBox="0 0 400 260"
        className="relative w-full h-full block sm:hidden"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="ncc-core-m" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF6464" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#C93030" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ncc-core-hot-m" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE3E3" stopOpacity="1" />
            <stop offset="40%" stopColor="#FF5A5A" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#C93030" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ncc-trace-m" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(232,64,64,0)" />
            <stop offset="50%" stopColor="rgba(232,64,64,0.55)" />
            <stop offset="100%" stopColor="rgba(232,64,64,0)" />
          </linearGradient>
        </defs>

        <line x1="0" y1="80" x2="400" y2="80" stroke="url(#ncc-trace-m)" strokeWidth="1" />
        <line x1="0" y1="180" x2="400" y2="180" stroke="url(#ncc-trace-m)" strokeWidth="1" />

        <g transform="translate(200 130)">
          <circle r="112" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <circle r="112" fill="none" stroke="rgba(201,48,48,0.2)" strokeWidth="1" strokeDasharray="1 8" />
          <circle r="82" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <circle r="60" fill="none" stroke="rgba(232,64,64,0.28)" strokeWidth="1" strokeDasharray="3 14" />
          <circle r="88" fill="url(#ncc-core-m)" />
          <motion.circle
            r="44"
            fill="url(#ncc-core-hot-m)"
            animate={reduceMotion ? undefined : { scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <circle r="32" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        </g>
      </svg>

      {/* Center bolt — sharp, premium focal point */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={reduceMotion ? undefined : { scale: [1, 1.03, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 0 22px rgba(255,90,90,0.55))' }}
        >
          <NoxBolt className="w-[44px] h-[66px] sm:w-[58px] sm:h-[88px]" />
        </motion.div>
      </div>

      {/* Rim status pills — minimal, not labeled nodes */}
      <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
        <div className="relative w-full h-full">
          <RimTag label="Lead Intake" className="top-[18%] left-[8%]" dotDelay={0} />
          <RimTag label="Qualification" className="top-[18%] right-[8%]" dotDelay={0.6} align="right" />
          <RimTag label="Workflow" className="bottom-[18%] left-[8%]" dotDelay={1.2} />
          <RimTag label="Output" className="bottom-[18%] right-[8%]" dotDelay={1.8} align="right" />
        </div>
      </div>

      {/* Bottom baseline status row — compact for mobile */}
      <div className="md:hidden absolute left-0 right-0 -bottom-2 flex items-center justify-center gap-4 text-[10px] font-mono tracking-[0.24em] uppercase text-white/55">
        <BaselineStatus label="Intake" />
        <span className="w-3 h-px bg-white/15" />
        <BaselineStatus label="Qualify" />
        <span className="w-3 h-px bg-white/15" />
        <BaselineStatus label="Workflow" />
      </div>
    </div>
  );
}

function RimTag({
  label,
  className = '',
  dotDelay = 0,
  align = 'left',
}: {
  label: string;
  className?: string;
  dotDelay?: number;
  align?: 'left' | 'right';
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div className={`absolute ${className}`}>
      <div
        className={`flex items-center gap-2 text-[10px] font-mono font-semibold tracking-[0.28em] uppercase text-white/65 ${
          align === 'right' ? 'flex-row-reverse' : ''
        }`}
      >
        <span className="relative w-1.5 h-1.5">
          <span className="absolute inset-0 rounded-full bg-[#FF5A5A]" />
          {!reduceMotion && (
            <motion.span
              className="absolute inset-0 rounded-full border border-[#FF5A5A]"
              animate={{ scale: [1, 3], opacity: [0.7, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, delay: dotDelay, ease: 'easeOut' }}
            />
          )}
        </span>
        <span>{label}</span>
      </div>
    </div>
  );
}

function BaselineStatus({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-1 h-1 rounded-full bg-[#FF5A5A]" />
      {label}
    </span>
  );
}
