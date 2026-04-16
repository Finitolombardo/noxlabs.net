interface NoxBoltProps {
  className?: string;
  glow?: boolean;
}

export default function NoxBolt({ className = '', glow = true }: NoxBoltProps) {
  return (
    <svg
      viewBox="0 0 64 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="noxBoltGradient" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#F15A5A" />
          <stop offset="40%" stopColor="#D43131" />
          <stop offset="100%" stopColor="#6B0F0F" />
        </linearGradient>
        <linearGradient id="noxBoltHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        {glow && (
          <filter id="noxBoltGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <g filter={glow ? 'url(#noxBoltGlow)' : undefined}>
        <path
          d="M 36 2 L 8 54 L 24 54 L 18 98 L 56 40 L 38 40 L 44 2 Z"
          fill="url(#noxBoltGradient)"
        />
        <path
          d="M 36 2 L 8 54 L 24 54 L 22 70 L 30 54 L 20 54 L 40 12 Z"
          fill="url(#noxBoltHighlight)"
          opacity="0.8"
        />
      </g>
    </svg>
  );
}
