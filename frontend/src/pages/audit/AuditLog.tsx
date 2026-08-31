import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { api } from '../../lib/api';
import { GlassCard } from '../../components/ui/GlassCard';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';
import { EmptyState } from '../../components/shared/EmptyState';

interface AuditLogEntry {
  id: string;
  actor_id: string;
  event_type: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const EVENT_TYPES = [
  'ROLE_CHANGED',
  'PRIVATE_NOTE_ACCESSED_BY_SUPER_ADMIN',
  'TASK_STATUS_CHANGED',
  'TASK_REASSIGNED',
  'TEMPLATE_UPDATED',
  'EMAIL_TRANSFORMED',
  'CSV_EXPORTED',
];

const EVENT_LABELS: Record<string, string> = {
  ROLE_CHANGED: 'Role changed',
  PRIVATE_NOTE_ACCESSED_BY_SUPER_ADMIN: 'Private note accessed',
  TASK_STATUS_CHANGED: 'Task status changed',
  TASK_REASSIGNED: 'Task reassigned',
  TEMPLATE_UPDATED: 'Template updated',
  EMAIL_TRANSFORMED: 'Email transformed',
  CSV_EXPORTED: 'CSV exported',
};

const EVENT_STYLES: Record<string, string> = {
  ROLE_CHANGED: 'bg-lavender-100 text-lavender-700',
  PRIVATE_NOTE_ACCESSED_BY_SUPER_ADMIN: 'bg-clay-100 text-clay-700',
  TASK_STATUS_CHANGED: 'bg-sky-100 text-sky-700',
  TASK_REASSIGNED: 'bg-butter-300/60 text-ink-700',
  TEMPLATE_UPDATED: 'bg-sage-100 text-sage-700',
  EMAIL_TRANSFORMED: 'bg-sand-200 text-ink-700',
  CSV_EXPORTED: 'bg-lavender-100 text-lavender-700',
};

// Human-readable summary from metadata — never surfaces raw UUIDs to the UI.
function describeEntry(entry: AuditLogEntry): string {
  const m = entry.metadata ?? {};
  switch (entry.event_type) {
    case 'ROLE_CHANGED':
      return `${m.from ?? '—'} → ${m.to ?? '—'}`;
    case 'TASK_STATUS_CHANGED':
      return `${m.from ?? '—'} → ${m.to ?? '—'}${m.reason ? ` (${m.reason})` : ''}`;
    case 'TASK_REASSIGNED':
      return 'Reassigned to a different owner';
    case 'CSV_EXPORTED':
      return `${m.exportType ?? 'data'} · ${m.rowCount ?? 0} row${m.rowCount === 1 ? '' : 's'}`;
    case 'PRIVATE_NOTE_ACCESSED_BY_SUPER_ADMIN':
      return `${m.noteCount ?? 0} note${m.noteCount === 1 ? '' : 's'} read (break-glass)`;
    default:
      return entry.target_type ? `on a ${entry.target_type}` : '';
  }
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eventType, setEventType] = useState('');

  async function load(filterType?: string) {
    setError(null);
    try {
      const { data } = await api.get<AuditLogEntry[]>('/audit-logs', {
        params: filterType ? { eventType: filterType } : {},
      });
      setEntries(data);
    } catch {
      setError('Could not load the audit log.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleFilterChange(value: string) {
    setEventType(value);
    load(value || undefined);
  }

  if (error && entries === null) {
    return <ErrorState message={error} onRetry={() => load(eventType || undefined)} />;
  }
  if (entries === null) {
    return <LoadingState message="Loading audit log…" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldAlert size={20} className="text-lavender-600" />
        <div>
          <h1 className="text-xl font-bold text-ink-900">Audit log</h1>
          <p className="text-sm text-ink-500">Every sensitive action, permanently recorded.</p>
        </div>
      </div>

      <select
        value={eventType}
        onChange={(e) => handleFilterChange(e.target.value)}
        className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-ink-700 outline-none focus:border-lavender-400 focus:ring-2 focus:ring-lavender-200"
      >
        <option value="">All event types</option>
        {EVENT_TYPES.map((t) => (
          <option key={t} value={t}>{EVENT_LABELS[t]}</option>
        ))}
      </select>

      {entries.length === 0 ? (
        <EmptyState title="No audit events yet" message="Sensitive actions will show up here as they happen." />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <GlassCard key={entry.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${EVENT_STYLES[entry.event_type] ?? 'bg-sand-100 text-ink-700'}`}>
                  {EVENT_LABELS[entry.event_type] ?? entry.event_type}
                </span>
                <span className="text-xs text-ink-500">{describeEntry(entry)}</span>
              </div>
              <span className="text-xs text-ink-400">{new Date(entry.created_at).toLocaleString()}</span>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
