interface NoxLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function NoxLogo({ size = 'md', className = '' }: NoxLogoProps) {
  const sizes = {
    sm: { wordmark: 'text-[15px]', labs: 'text-[9px]', gap: 'gap-1.5', divider: 'h-3' },
    md: { wordmark: 'text-[22px]', labs: 'text-[10px]', gap: 'gap-2.5', divider: 'h-4' },
    lg: { wordmark: 'text-[34px]', labs: 'text-[12px]', gap: 'gap-3', divider: 'h-6' },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.gap} select-none ${className}`}>
      <span
        className={`${s.wordmark} font-black tracking-[0.22em] text-white leading-none relative`}
        style={{
          textShadow:
            '0 0 24px rgba(201, 48, 48, 0.28), 0 0 1px rgba(255, 120, 130, 0.85), 0 1px 0 rgba(255, 180, 190, 0.12)',
          WebkitTextStroke: '0.3px rgba(255, 200, 204, 0.08)',
        }}
      >
        NOX
      </span>
      <span
        className={`${s.divider} w-px bg-gradient-to-b from-transparent via-nox-red/50 to-transparent`}
        aria-hidden="true"
      />
      <span
        className={`${s.labs} font-semibold tracking-[0.38em] text-white/55 uppercase leading-none`}
      >
        Labs
      </span>
    </div>
  );
}
