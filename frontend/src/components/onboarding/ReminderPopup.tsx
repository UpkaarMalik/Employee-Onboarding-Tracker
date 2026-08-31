import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, X } from 'lucide-react';
import { api } from '../../lib/api';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';

interface Reminder {
  id: string;
  title: string;
  reading_total_active_seconds: number;
}

const POLL_INTERVAL_MS = 5 * 60 * 1000; // check every 5 min; server enforces the actual 3hr rule

export function ReminderPopup() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  async function poll() {
    try {
      const { data } = await api.get<Reminder[]>('/reading/reminders');
      setReminders(data);
    } catch {
      // Silent — reminders are a nice-to-have, never block the page on this failing.
    }
  }

  useEffect(() => {
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const visible = reminders.filter((r) => !dismissed.has(r.id));
  if (visible.length === 0) return null;
  const reminder = visible[0];

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm animate-reveal-scale">
      <GlassCard className="p-5 shadow-[0_16px_48px_-12px_rgba(88,58,158,0.35)] ring-1 ring-lavender-200/60">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-clay-100 to-butter-300/60 text-clay-600">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-900">Still pending: {reminder.title}</p>
            <p className="mt-1 text-xs text-ink-500">
              You haven't finished this reading task yet. It only takes a few minutes.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                className="px-4 py-2 text-xs"
                onClick={() => navigate(`/reading/${reminder.id}`)}
              >
                Continue reading
              </Button>
              <Button
                variant="ghost"
                className="px-4 py-2 text-xs"
                onClick={() => setDismissed((prev) => new Set(prev).add(reminder.id))}
              >
                Later
              </Button>
            </div>
          </div>
          <button
            onClick={() => setDismissed((prev) => new Set(prev).add(reminder.id))}
            className="text-ink-300 hover:text-ink-500"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </GlassCard>
    </div>
  );
}