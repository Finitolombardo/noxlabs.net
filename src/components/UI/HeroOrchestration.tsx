import { motion } from 'framer-motion';

const VB_W = 1200;
const VB_H = 800;
const CX = VB_W / 2;
const CY = VB_H / 2;

const primaryNodes = [
  { x: 240, y: 180, r: 3.5, delay: 0 },
  { x: 960, y: 180, r: 3.5, delay: 0.15 },
  { x: 140, y: 420, r: 4, delay: 0.3 },
  { x: 1060, y: 420, r: 4, delay: 0.45 },
  { x: 300, y: 640, r: 3.5, delay: 0.6 },
  { x: 900, y: 640, r: 3.5, delay: 0.75 },
];

const secondaryNodes = [
  { x: 470, y: 240, r: 2 },
  { x: 730, y: 240, r: 2 },
  { x: 420, y: 560, r: 2 },
  { x: 780, y: 560, r: 2 },
  { x: 220, y: 300, r: 1.8 },
  { x: 980, y: 300, r: 1.8 },
  { x: 220, y: 520, r: 1.8 },
  { x: 980, y: 520, r: 1.8 },
];

const chaosDots = Array.from({ length: 55 }, (_, i) => {
  const x = ((i * 137) % VB_W + (i * 47) % 60) % VB_W;
  const y = ((i * 211) % VB_H + (i * 67) % 40) % VB_H;
  return { x, y, r: 0.6 + (i % 4) * 0.25, delay: (i % 12) * 0.05 };
});

export default function HeroOrchestration() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(232, 64, 64, 0.55)" />
            <stop offset="40%" stopColor="rgba(201, 48, 48, 0.2)" />
            <stop offset="100%" stopColor="rgba(201, 48, 48, 0)" />
          </radialGradient>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(201, 48, 48, 0.7)" />
            <stop offset="100%" stopColor="rgba(201, 48, 48, 0.02)" />
          </linearGradient>
          <linearGradient id="signalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 180, 180, 0)" />
            <stop offset="50%" stopColor="rgba(255, 120, 120, 0.9)" />
            <stop offset="100%" stopColor="rgba(255, 180, 180, 0)" />
          </linearGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
          <pattern id="gridDots" width="44" height="44" patternUnits="userSpaceOnUse">
            <circle cx="22" cy="22" r="0.6" fill="rgba(255,255,255,0.06)" />
          </pattern>
        </defs>

        {/* Base grid */}
        <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#gridDots)" />

        {/* Chaos dots — fragmented signals */}
        {chaosDots.map((d, i) => (
          <motion.circle
            key={`chaos-${i}`}
            cx={d.x}
            cy={d.y}
            r={d.r}
            fill="rgba(255,255,255,0.35)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.35, 0.12] }}
            transition={{ duration: 2.5, delay: d.delay, ease: 'easeOut' }}
          />
        ))}

        {/* Connection lines from center to primary nodes */}
        {primaryNodes.map((n, i) => {
          const pathId = `path-${i}`;
          const d = `M ${CX} ${CY} L ${n.x} ${n.y}`;
          return (
            <g key={`line-${i}`}>
              <motion.path
                id={pathId}
                d={d}
                stroke="rgba(201, 48, 48, 0.35)"
                strokeWidth="1"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.4, delay: 1 + n.delay, ease: 'easeInOut' }}
              />
              {/* Signal pulse travelling along the line */}
              <motion.circle
                r="2.5"
                fill="rgba(255, 120, 120, 0.9)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  duration: 2,
                  delay: 2.8 + n.delay,
                  repeat: Infinity,
                  repeatDelay: 3 + (i % 3),
                  ease: 'easeInOut',
                }}
              >
                <animateMotion
                  dur="2s"
                  begin={`${2.8 + n.delay}s`}
                  repeatCount="indefinite"
                  keyPoints="0;1"
                  keyTimes="0;1"
                >
                  <mpath href={`#${pathId}`} />
                </animateMotion>
              </motion.circle>
            </g>
          );
        })}

        {/* Satellite connections — structured web */}
        {primaryNodes.map((n, i) => {
          const next = primaryNodes[(i + 1) % primaryNodes.length];
          return (
            <motion.path
              key={`ring-${i}`}
              d={`M ${n.x} ${n.y} Q ${CX} ${CY + (i % 2 === 0 ? -80 : 80)} ${next.x} ${next.y}`}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.2, delay: 2 + i * 0.1, ease: 'easeInOut' }}
            />
          );
        })}

        {/* Secondary nodes (dim) */}
        {secondaryNodes.map((n, i) => (
          <motion.circle
            key={`sec-${i}`}
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill="rgba(255,255,255,0.35)"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.5, scale: 1 }}
            transition={{ duration: 0.6, delay: 1.6 + i * 0.08 }}
          />
        ))}

        {/* Primary nodes — structured endpoints */}
        {primaryNodes.map((n, i) => (
          <g key={`pnode-${i}`}>
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={n.r + 6}
              fill="rgba(201, 48, 48, 0.15)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.6, 0.35],
                scale: [0, 1.2, 1],
              }}
              transition={{
                duration: 1.2,
                delay: 2 + n.delay,
                ease: 'easeOut',
              }}
              filter="url(#softGlow)"
            />
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill="#D43131"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 2.2 + n.delay }}
            />
          </g>
        ))}

        {/* Central hub core */}
        <motion.circle
          cx={CX}
          cy={CY}
          r="120"
          fill="url(#coreGlow)"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.8, 0.55], scale: [0.5, 1.1, 1] }}
          transition={{ duration: 2, delay: 0.5, ease: 'easeOut' }}
        />
        <motion.circle
          cx={CX}
          cy={CY}
          r="60"
          fill="rgba(201, 48, 48, 0.25)"
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [0.95, 1.08, 0.95],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </svg>

      {/* Horizontal scanning light */}
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-nox-red/40 to-transparent pointer-events-none"
        initial={{ top: '-5%', opacity: 0 }}
        animate={{ top: '105%', opacity: [0, 0.6, 0] }}
        transition={{
          duration: 6,
          delay: 3,
          repeat: Infinity,
          repeatDelay: 4,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
