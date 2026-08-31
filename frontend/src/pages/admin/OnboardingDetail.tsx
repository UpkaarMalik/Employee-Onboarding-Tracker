import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, History } from 'lucide-react';
import { api } from '../../lib/api';
import type { OnboardingInstance } from '../../lib/types';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { TaskStatusIcon } from '../../components/onboarding/TaskStatusIcon';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';

interface HistoryEntry {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string;
  changed_at: string;
}

interface EmployeeLite {
  id: string;
  full_name: string;
}

export default function OnboardingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [instance, setInstance] = useState<OnboardingInstance | null>(null);
  const [employee, setEmployee] = useState<EmployeeLite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [historyLoading, setHistoryLoading] = useState(false);

  async function load() {
    setError(null);
    try {
      const { data } = await api.get<OnboardingInstance>(`/onboarding/instances/${id}`);
      setInstance(data);
      const { data: emp } = await api.get<EmployeeLite>(`/users/${data.employee_id}`);
      setEmployee(emp);
    } catch {
      setError('Could not load this onboarding instance.');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleTask(taskId: string) {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
      return;
    }
    setExpandedTaskId(taskId);
    if (!history[taskId]) {
      setHistoryLoading(true);
      try {
        const { data } = await api.get<HistoryEntry[]>(`/tasks/${taskId}/history`);
        setHistory((prev) => ({ ...prev, [taskId]: data }));
      } finally {
        setHistoryLoading(false);
      }
    }
  }

  if (error && instance === null) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (instance === null) {
    return <LoadingState message="Loading onboarding instance…" />;
  }

  const sortedTasks = instance.tasks.slice().sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => navigate('/admin/onboardings')}>
        <ArrowLeft size={14} /> Back to onboardings
      </Button>

      <div>
        <h1 className="text-xl font-bold text-ink-900">{employee?.full_name ?? 'Onboarding instance'}</h1>
        <p className="mt-1 text-sm text-ink-500">Status: {instance.status.replace('_', ' ')}</p>
      </div>

      <div className="space-y-3">
        {sortedTasks.map((task) => (
          <GlassCard key={task.id} className="overflow-hidden p-0">
            <button
              onClick={() => toggleTask(task.id)}
              className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-sand-50"
            >
              <TaskStatusIcon status={task.effective_status} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">{task.title}</p>
                <p className="text-xs text-ink-400">{task.owner_type.replace('_', ' ')}</p>
              </div>
              <History size={15} className="text-ink-300" />
              <ChevronDown
                size={16}
                className={`text-ink-400 transition-transform ${expandedTaskId === task.id ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedTaskId === task.id && (
              <div className="animate-fade-slide-up border-t border-sand-100 bg-sand-50/60 px-5 py-4">
                {historyLoading && !history[task.id] && (
                  <p className="text-xs text-ink-400">Loading history…</p>
                )}
                {history[task.id]?.length === 0 && (
                  <p className="text-xs text-ink-400">No status changes recorded yet.</p>
                )}
                <ol className="space-y-3 border-l-2 border-lavender-200 pl-4">
                  {history[task.id]?.map((entry) => (
                    <li key={entry.id} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-lavender-500" />
                      <p className="text-xs font-medium text-ink-800">
                        {entry.from_status ?? 'created'} → {entry.to_status}
                      </p>
                      <p className="text-[11px] text-ink-400">
                        {new Date(entry.changed_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
