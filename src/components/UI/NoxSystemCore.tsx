import { motion } from 'framer-motion';
import { useState, Fragment } from 'react';

const W = 560;
const H = 420;
const CX = 280;
const CY = 205;

const NODES = [
  {
    id: '01',
    label: 'Leadgen Engine',
    x: 438,
    y: 76,
    textAnchor: 'start' as const,
    lx: 26,
    ly: -2,
    bootDelay: 1.3,
    pDelay: 1.95,
  },
  {
    id: '02',
    label: 'Pitch Mutation',
    x: 64,
    y: 200,
    textAnchor: 'end' as const,
    lx: -26,
    ly: 0,
    bootDelay: 1.55,
    pDelay: 2.15,
  },
  {
    id: '03',
    label: 'YouTube Engine',
    x: 404,
    y: 364,
    textAnchor: 'start' as const,
    lx: 26,
    ly: 4,
    bootDelay: 1.8,
    pDelay: 2.35,
  },
];

function linelen(x: number, y: number) {
  return Math.sqrt((x - CX) ** 2 + (y - CY) ** 2);
}

function Particle({ nx, ny, delay }: { nx: number; ny: number; delay: number }) {
  return (
    <motion.circle
      r={1.8}
      cx={nx}
      cy={ny}
      fill="rgba(255,90,90,0.95)"
      style={{ filter: 'drop-shadow(0 0 2.5px rgba(255,90,90,0.75))' }}
      initial={{ x: CX - nx, y: CY - ny, opacity: 0 }}
      animate={{
        x: [CX - nx, 0],
        y: [CY - ny, 0],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 2.3,
        delay,
        repeat: Infinity,
        repeatDelay: 0.9,
        ease: 'easeIn',
        times: [0, 0.7, 1],
      }}
    />
  );
}

export default function NoxSystemCore() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative w-full select-none" aria-hidden="true">

      {/* ── Desktop SVG ── */}
      <div className="hidden sm:flex justify-center">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', maxWidth: 600, overflow: 'visible', display: 'block' }}
        >
          <defs>
            {/* Core atmospheric blur */}
            <filter id="scCoreBlur" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="11" result="b1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b2" />
              <feMerge>
                <feMergeNode in="b1" />
                <feMergeNode in="b2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Node glow */}
            <filter id="scNodeBlur" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Core gradient */}
            <radialGradient id="scCore" cx="36%" cy="26%" r="70%">
              <stop offset="0%" stopColor="#FF6464" />
              <stop offset="46%" stopColor="#C93030" />
              <stop offset="100%" stopColor="#580E0E" />
            </radialGradient>
            {/* Per-line gradients */}
            {NODES.map((n, i) => (
              <linearGradient
                key={n.id}
                id={`scL${i}`}
                x1={CX} y1={CY}
                x2={n.x} y2={n.y}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="rgba(201,48,48,0.8)" />
                <stop offset="100%" stopColor="rgba(201,48,48,0.1)" />
              </linearGradient>
            ))}
          </defs>

          {/* ── Subtle crosshair ── */}
          <line x1={CX - 246} y1={CY} x2={CX + 246} y2={CY}
            stroke="rgba(201,48,48,0.05)" strokeWidth="0.5" />
          <line x1={CX} y1={CY - 210} x2={CX} y2={CY + 215}
            stroke="rgba(201,48,48,0.05)" strokeWidth="0.5" />

          {/* ── Concentric rings ── */}
          {[48, 96, 152, 210].map((r, i) => (
            <motion.circle
              key={r}
              cx={CX} cy={CY} r={r}
              fill="none"
              stroke={i === 0 ? 'rgba(201,48,48,0.32)' : 'rgba(201,48,48,0.10)'}
              strokeWidth={i === 0 ? 0.9 : 0.6}
              strokeDasharray={i === 2 ? '3 9' : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.17, duration: 0.9 }}
            />
          ))}

          {/* ── Radar ticks on middle ring ── */}
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * 45 * Math.PI) / 180;
            return (
              <motion.line
                key={i}
                x1={CX + 92 * Math.cos(a)} y1={CY + 92 * Math.sin(a)}
                x2={CX + 100 * Math.cos(a)} y2={CY + 100 * Math.sin(a)}
                stroke="rgba(201,48,48,0.38)"
                strokeWidth="0.75"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.62 + i * 0.06 }}
              />
            );
          })}

          {/* ── Connection lines (draw-in) ── */}
          {NODES.map((n, i) => {
            const len = linelen(n.x, n.y);
            return (
              <motion.line
                key={n.id}
                x1={CX} y1={CY} x2={n.x} y2={n.y}
                stroke={`url(#scL${i})`}
                strokeWidth="0.9"
                strokeDasharray={len}
                initial={{ strokeDashoffset: len, opacity: 0 }}
                animate={{ strokeDashoffset: 0, opacity: 1 }}
                transition={{ delay: 0.88 + i * 0.18, duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
              />
            );
          })}

          {/* ── Data particles (2 per line) ── */}
          {NODES.map((n) => (
            <Fragment key={n.id}>
              <Particle nx={n.x} ny={n.y} delay={n.pDelay} />
              <Particle nx={n.x} ny={n.y} delay={n.pDelay + 1.15} />
            </Fragment>
          ))}

          {/* ── Engine nodes ── */}
          {NODES.map((n) => {
            const h = hovered === n.id;
            return (
              <motion.g
                key={n.id}
                onHoverStart={() => setHovered(n.id)}
                onHoverEnd={() => setHovered(null)}
                style={{ cursor: 'default' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: n.bootDelay, duration: 0.7 }}
              >
                {/* Halo bloom */}
                <circle
                  cx={n.x} cy={n.y} r={30}
                  fill={h ? 'rgba(201,48,48,0.17)' : 'rgba(201,48,48,0.06)'}
                  filter="url(#scNodeBlur)"
                  style={{ transition: 'fill 280ms ease' }}
                />
                {/* Outer dashed orbit */}
                <circle
                  cx={n.x} cy={n.y} r={23}
                  fill="none"
                  stroke={h ? 'rgba(255,90,90,0.5)' : 'rgba(201,48,48,0.2)'}
                  strokeWidth="0.7"
                  strokeDasharray="2 7"
                  style={{ transition: 'stroke 280ms ease' }}
                />
                {/* Node body */}
                <circle
                  cx={n.x} cy={n.y} r={15}
                  fill="#0c0304"
                  stroke={h ? 'rgba(255,90,90,0.85)' : 'rgba(201,48,48,0.52)'}
                  strokeWidth="1"
                  style={{ transition: 'stroke 280ms ease' }}
                />
                {/* Node ID */}
                <text
                  x={n.x} y={n.y + 4}
                  textAnchor="middle"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    fill: h ? '#FF6060' : 'rgba(201,48,48,0.9)',
                    transition: 'fill 280ms ease',
                  }}
                >
                  {n.id}
                </text>
                {/* Engine label */}
                <text
                  x={n.x + n.lx} y={n.y + n.ly}
                  textAnchor={n.textAnchor}
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '9px',
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    fill: h ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.48)',
                    transition: 'fill 280ms ease',
                  }}
                >
                  {n.label.toUpperCase()}
                </text>
              </motion.g>
            );
          })}

          {/* ── Core nucleus ── */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.44, duration: 0.9 }}
          >
            {/* Atmospheric bloom */}
            <circle cx={CX} cy={CY} r={46}
              fill="rgba(201,48,48,0.14)" filter="url(#scCoreBlur)" />
            {/* Breathing pulse ring */}
            <motion.circle
              cx={CX} cy={CY} r={26}
              fill="none"
              stroke="rgba(201,48,48,0.45)"
              strokeWidth="0.75"
              animate={{ opacity: [0.45, 0.1, 0.45], scale: [1, 1.26, 1] }}
              style={{ transformOrigin: `${CX}px ${CY}px` }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
            />
            {/* Core fill */}
            <circle cx={CX} cy={CY} r={17} fill="url(#scCore)" />
            {/* Specular */}
            <ellipse cx={CX - 4} cy={CY - 5} rx={5} ry={3.5}
              fill="rgba(255,210,210,0.22)" />
            {/* Label */}
            <motion.text
              x={CX} y={CY + 4.5}
              textAnchor="middle"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '7.5px',
                fontWeight: 900,
                letterSpacing: '0.32em',
                fill: 'rgba(255,241,244,0.92)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.95, duration: 0.5 }}
            >
              NOX
            </motion.text>
          </motion.g>
        </svg>
      </div>

      {/* ── Mobile: compact orbital summary ── */}
      <div className="sm:hidden flex flex-col items-center gap-6 py-6">
        {/* Mini core */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-nox-red/20 blur-2xl animate-breath" />
          <div
            className="relative w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at 36% 26%, #FF6464, #C93030 50%, #580E0E)',
              boxShadow: '0 0 24px rgba(201,48,48,0.55), 0 0 8px rgba(201,48,48,0.3)',
            }}
          >
            <span
              className="text-white/92 font-black"
              style={{ fontSize: 7, letterSpacing: '0.32em' }}
            >
              NOX
            </span>
          </div>
        </div>
        {/* Node list */}
        <div className="flex flex-col gap-2 w-full max-w-[280px]">
          {NODES.map((n) => (
            <div
              key={n.id}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-nox-red/[0.14] bg-nox-red/[0.03]"
            >
              <span className="font-mono text-[10px] font-bold text-nox-red/80 tracking-widest">{n.id}</span>
              <span className="w-px h-3 bg-nox-red/20" />
              <span className="font-mono text-[10px] text-white/50 tracking-wider uppercase">{n.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
