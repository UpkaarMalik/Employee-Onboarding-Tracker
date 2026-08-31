import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'pill';
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
    accent:
      'bg-gradient-to-br from-lavender-500 to-sky-500 text-white shadow-[0_6px_20px_-6px_rgba(112,73,194,0.55)] hover:shadow-[0_10px_28px_-6px_rgba(112,73,194,0.7)] hover:-translate-y-0.5',
    pill:
      'rounded-full bg-white text-ink-900 border border-sand-300 shadow-sm hover:border-lavender-300 hover:shadow-[0_6px_18px_-8px_rgba(112,73,194,0.4)] hover:-translate-y-0.5',
  };

  return (
    <button
      className={`${base} ${variant === 'pill' ? 'rounded-full' : ''} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
      )}
      {children}
    </button>
  );
}
