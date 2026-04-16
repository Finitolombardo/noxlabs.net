interface NoxLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function NoxLogo({ size = 'md', className = '' }: NoxLogoProps) {
  const sizes = {
    sm: { wordmark: 'text-base', labs: 'text-[9px]', gap: 'gap-1.5' },
    md: { wordmark: 'text-xl', labs: 'text-[10px]', gap: 'gap-2' },
    lg: { wordmark: 'text-3xl', labs: 'text-xs', gap: 'gap-2.5' },
  };
  const s = sizes[size];

  return (
    <div className={`flex items-baseline ${s.gap} select-none ${className}`}>
      <span
        className={`${s.wordmark} font-extrabold tracking-[0.18em] text-white relative`}
        style={{
          textShadow:
            '0 0 18px rgba(201, 48, 48, 0.25), 0 0 1px rgba(232, 64, 64, 0.7), 0 1px 0 rgba(255, 180, 190, 0.08)',
        }}
      >
        NOX
      </span>
      <span className={`${s.labs} font-mono tracking-[0.32em] text-white/35 uppercase`}>
        Labs
      </span>
    </div>
  );
}
