import type { ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

type BannerVariant = 'success' | 'warning' | 'error' | 'info';

const VARIANT_STYLES: Record<BannerVariant, { wrap: string; icon: string }> = {
  success: { wrap: 'bg-sage-50 text-sage-700 border border-sage-200', icon: 'text-sage-600' },
  warning: { wrap: 'bg-butter-300/30 text-ink-800 border border-butter-500/40', icon: 'text-butter-500' },
  error: { wrap: 'bg-clay-50 text-clay-700 border border-clay-200', icon: 'text-clay-500' },
  info: { wrap: 'bg-lavender-50 text-lavender-700 border border-lavender-200', icon: 'text-lavender-500' },
};

const VARIANT_ICON: Record<BannerVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

export function Banner({ variant, children }: { variant: BannerVariant; children: ReactNode }) {
  const styles = VARIANT_STYLES[variant];
  const Icon = VARIANT_ICON[variant];
  return (
    <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm animate-fade-slide-up ${styles.wrap}`}>
      <Icon size={16} className={`mt-0.5 shrink-0 ${styles.icon}`} />
      <span>{children}</span>
    </div>
  );
}
