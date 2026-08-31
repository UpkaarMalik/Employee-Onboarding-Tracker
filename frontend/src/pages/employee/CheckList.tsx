import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { ChecklistTask, OnboardingInstance } from '../../lib/types';
import { GlassCard } from '../../components/ui/GlassCard';
import { TaskStatusIcon } from '../../components/onboarding/TaskStatusIcon';
import { TaskDetailModal } from '../../components/onboarding/TaskDetailModal';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';
import { EmptyState } from '../../components/shared/EmptyState';
import { Confetti } from '../../components/ui/Confetti';
import { Banner } from '../../components/ui/Banner';

const STATUS_LABEL: Record<string, string> = {
  WAITING: 'Waiting',
  AVAILABLE: 'Ready to start',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

export default function Checklist() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [instance, setInstance] = useState<OnboardingInstance | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [fireConfetti, setFireConfetti] = useState(false);

  async function load(): Promise<OnboardingInstance | null> {
    setError(null);
    try {
      const { data } = await api.get<OnboardingInstance>('/onboarding/instances/me');
      setInstance(data);
      return data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError('Could not load your checklist.');
      }
      return null;
    }
  }

  useEffect(() => {
    load();
  }, []);

  function canAct(ownerId: string): boolean {
    if (!user) return false;
    return ownerId === user.id || user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
  }

  async function handleStart(taskId: string) {
    setBusy(true);
    try {
      await api.patch(`/tasks/${taskId}/start`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not start this task.');
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete(taskId: string, officialEmailValue?: string) {
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/tasks/${taskId}/complete`, officialEmailValue ? { official_email: officialEmailValue } : {});
      await load();
      setFireConfetti(true);
      setSelectedTaskId(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not complete this task.');
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <EmptyState
        title="No onboarding checklist yet"
        message="Once HR starts your onboarding, your tasks will appear here."
      />
    );
  }
  if (error && instance === null) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (instance === null) {
    return <LoadingState message="Loading your checklist…" />;
  }

  const sortedTasks = instance.tasks.slice().sort((a, b) => a.order_index - b.order_index);
  const requiredTasks = sortedTasks.filter((t) => t.is_required);
  const completedRequired = requiredTasks.filter((t) => t.effective_status === 'COMPLETED').length;
  const percent = requiredTasks.length > 0
    ? Math.round((completedRequired / requiredTasks.length) * 100)
    : 0;

  const selectedTask: ChecklistTask | undefined = sortedTasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="space-y-8">
      <Confetti fire={fireConfetti} onDone={() => setFireConfetti(false)} />

      <div className="animate-fade-slide-up">
        <h1 className="text-xl font-bold text-ink-900">Your onboarding checklist</h1>
        <p className="mt-1 text-sm text-ink-500">
          {instance.status === 'COMPLETED'
            ? 'All required tasks are complete — nice work!'
            : `${percent}% of required tasks complete`}
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sand-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-lavender-500 to-sky-500 transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {error && <Banner variant="error">{error}</Banner>}

      <div className="space-y-3">
        {sortedTasks.map((task, i) => {
          const isWaiting = task.effective_status === 'WAITING';
          const isDone = task.effective_status === 'COMPLETED';

          return (
            <GlassCard
              key={task.id}
              className="animate-fade-slide-up cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_32px_-10px_rgba(88,58,158,0.25)]"
              style={{ animationDelay: `${i * 45}ms` } as CSSProperties}
              onClick={() => setSelectedTaskId(task.id)}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5">
                  <TaskStatusIcon status={task.effective_status} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-sm font-semibold ${isDone ? 'text-ink-400 line-through' : 'text-ink-900'}`}>
                      {task.title}
                    </h3>
                    <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
                      {STATUS_LABEL[task.effective_status]}
                    </span>
                    {task.is_required && (
                      <span className="rounded-full bg-lavender-100 px-2 py-0.5 text-[11px] font-medium text-lavender-700">
                        Required
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="mt-1 text-xs text-ink-500">{task.description}</p>
                  )}
                </div>

                {isWaiting && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-ink-400">
                    <Lock size={13} /> Locked
                  </span>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          actionable={canAct(selectedTask.owner_id) && selectedTask.effective_status !== 'WAITING' && selectedTask.effective_status !== 'COMPLETED'}
          busy={busy}
          onClose={() => setSelectedTaskId(null)}
          onStart={() => handleStart(selectedTask.id)}
          onComplete={(email) => handleComplete(selectedTask.id, email)}
          onRead={() => navigate(`/reading/${selectedTask.id}`)}
        />
      )}
    </div>
  );
}
