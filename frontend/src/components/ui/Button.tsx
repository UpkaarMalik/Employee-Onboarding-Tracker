import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
}

export function Button({ variant = 'primary', loading, children, className = '', disabled, ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-br from-sage-500 to-sage-600 text-white shadow-[0_6px_20px_-6px_rgba(79,142,120,0.6)] hover:shadow-[0_8px_24px_-6px_rgba(79,142,120,0.75)] hover:-translate-y-0.5',
    secondary:
      'bg-clay-50 text-clay-700 border border-clay-200 hover:bg-clay-100',
    ghost:
      'bg-transparent text-ink-700 hover:bg-sand-100',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  );
}