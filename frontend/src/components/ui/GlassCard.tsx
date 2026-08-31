import type { HTMLAttributes } from 'react';

export function GlassCard({
  children,
  className = '',
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl
                  shadow-[0_8px_40px_-12px_rgba(41,74,65,0.18)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
