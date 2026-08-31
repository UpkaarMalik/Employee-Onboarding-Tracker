import { CheckCircle2, PlayCircle, Circle } from 'lucide-react';
import type { EffectiveStatus } from '../../lib/types';

export function TaskStatusIcon({ status }: { status: EffectiveStatus }) {
  if (status === 'COMPLETED') {
    return <CheckCircle2 className="h-5 w-5 text-sage-600 animate-reveal-scale" />;
  }

  if (status === 'IN_PROGRESS') {
    return (
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute inline-flex h-3 w-3 animate-ping-ring rounded-full bg-clay-400" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-clay-500" />
      </span>
    );
  }

  if (status === 'AVAILABLE') {
    return <PlayCircle className="h-5 w-5 text-lavender-500" />;
  }

  // WAITING
  return <Circle className="h-5 w-5 text-ink-300" />;
}
