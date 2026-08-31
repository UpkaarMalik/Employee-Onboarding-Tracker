import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import type { EffectiveStatus } from '../../lib/types';

export function TaskStatusIcon({ status }: { status: EffectiveStatus }) {
  if (status === 'COMPLETED') {
    return <CheckCircle2 className="h-5 w-5 text-sage-600" />;
  }
  if (status === 'AVAILABLE' || status === 'IN_PROGRESS') {
    return <Loader2 className="h-5 w-5 text-clay-500" />;
  }
  // WAITING
  return <Circle className="h-5 w-5 text-ink-300" />;
}