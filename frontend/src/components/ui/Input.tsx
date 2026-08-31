import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...rest }, ref) => {
    return (
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
        <input
          ref={ref}
          className={`w-full rounded-xl border bg-white/80 px-4 py-3 text-sm text-ink-900
                      placeholder:text-ink-400 outline-none transition-all duration-150
                      focus:ring-2 focus:ring-sage-300 focus:border-sage-400
                      ${error ? 'border-clay-400' : 'border-sand-300'} ${className}`}
          {...rest}
        />
        {error && <span className="mt-1 block text-xs text-clay-600">{error}</span>}
      </label>
    );
  },
);
Input.displayName = 'Input';