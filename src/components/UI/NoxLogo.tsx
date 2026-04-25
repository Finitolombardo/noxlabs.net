import NoxBolt from './NoxBolt';

interface NoxLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function NoxLogo({ size = 'md', className = '' }: NoxLogoProps) {
  const sizes = {
    sm: {
      bolt: 'w-[14px] h-[22px]',
      wordmark: 'text-[14px]',
      labs: 'text-[9px]',
      gap: 'gap-2',
      divider: 'h-[14px]',
    },
    md: {
      bolt: 'w-[18px] h-[28px]',
      wordmark: 'text-[20px]',
      labs: 'text-[10px]',
      gap: 'gap-3',
      divider: 'h-[18px]',
    },
    lg: {
      bolt: 'w-[24px] h-[38px]',
      wordmark: 'text-[32px]',
      labs: 'text-[12px]',
      gap: 'gap-3.5',
      divider: 'h-[22px]',
    },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.gap} select-none ${className}`}>
      {/* Bolt mark with ambient bloom */}
      <div className="relative flex-none">
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: '-5px',
            background: 'rgba(201, 48, 48, 0.28)',
            filter: 'blur(10px)',
          }}
        />
        <NoxBolt
          glow={false}
          className={`${s.bolt} relative drop-shadow-[0_0_10px_rgba(201,48,48,0.65)]`}
        />
      </div>

      {/* NOX wordmark */}
      <span
        className={`${s.wordmark} font-black tracking-[0.22em] text-white leading-none`}
        style={{
          textShadow:
            '0 0 24px rgba(201, 48, 48, 0.28), 0 0 1px rgba(255, 120, 130, 0.85), 0 1px 0 rgba(255, 180, 190, 0.12)',
          WebkitTextStroke: '0.3px rgba(255, 200, 204, 0.08)',
        }}
      >
        NOX
      </span>

      {/* Divider */}
      <span
        className={`${s.divider} w-px bg-gradient-to-b from-transparent via-nox-red/60 to-transparent`}
        aria-hidden="true"
      />

      {/* LABS label */}
      <span
        className={`${s.labs} font-mono font-semibold tracking-[0.42em] text-white/60 uppercase leading-none`}
      >
        Labs
      </span>
    </div>
  );
}
