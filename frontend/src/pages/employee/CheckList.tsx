import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, isNetworkError } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { OnboardingInstance, ChecklistTask } from '../../lib/types';
import { GlassCard } from '../../components/ui/GlassCard';
import { Banner } from '../../components/ui/Banner';
import { TaskStatusIcon } from '../../components/onboarding/TaskStatusIcon';
import { TaskDetailModal } from '../../components/onboarding/TaskDetailModal';
import { LoadingState } from '../../components/shared/LoadingState';
import { NoInternetState } from '../../components/shared/NoInternetState';
import { ErrorState } from '../../components/shared/ErrorState';
import { EmptyState } from '../../components/shared/EmptyState';
import { ReminderPopup } from '../../components/onboarding/ReminderPopup';

const OVERRIDE_ROLES = ['SUPER_ADMIN', 'ADMIN'];

const READING_THRESHOLD_SECONDS = 300;

function statusLabel(task: ChecklistTask): string {
  switch (task.effective_status) {
    case 'COMPLETED':
      return 'Done';
    case 'IN_PROGRESS':
      return task.task_type === 'READING' ? 'Reading in progress' : 'In progress';
    case 'AVAILABLE':
      return 'Ready';
    case 'WAITING':
      return 'Waiting';
  }
}

export default function Checklist() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [instance, setInstance] = useState<OnboardingInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actingTaskId, setActingTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    setOffline(false);
    setNotFound(false);
    try {
      const { data } = await api.get<OnboardingInstance>('/onboarding/instances/me');
      setInstance(data);
    } catch (err: any) {
      if (isNetworkError(err)) setOffline(true);
      else if (err.response?.status === 404) setNotFound(true);
      else setError('Could not load your onboarding checklist.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function canAct(task: ChecklistTask): boolean {
    if (!user) return false;
    const isOwner = task.owner_id === user.id;
    const isAdmin = OVERRIDE_ROLES.includes(user.role);
    const isEmployeeWithDeptAdminTask = user.role === 'EMPLOYEE' && task.owner_type === 'DEPARTMENT_ADMIN';
    return isOwner || isAdmin || isEmployeeWithDeptAdminTask;
  }

  async function handleStart(task: ChecklistTask) {
    setActionError(null);
    setActingTaskId(task.id);
    try {
      await api.patch(`/tasks/${task.id}/start`);
      await load();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Could not start this task.');
    } finally {
      setActingTaskId(null);
    }
  }

  async function handleComplete(task: ChecklistTask, officialEmail?: string) {
    setActionError(null);
    setActingTaskId(task.id);
    try {
      await api.patch(`/tasks/${task.id}/complete`, officialEmail ? { official_email: officialEmail } : {});
      await load();
      setSelectedTaskId(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Could not complete this task.');
    } finally {
      setActingTaskId(null);
    }
  }

  async function handleCompleteProfile(task: ChecklistTask, mobile: string, dob: string, address: string) {
    setActionError(null);
    setActingTaskId(task.id);
    try {
      await api.patch('/users/me/complete-profile', { mobile, dob, address });
      await load();
      setSelectedTaskId(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Could not save your details.');
    } finally {
      setActingTaskId(null);
    }
  }

  const selectedTask = instance?.tasks.find((t) => t.id === selectedTaskId) ?? null;

  if (offline) return <div className="flex min-h-screen items-center justify-center bg-sand-50"><NoInternetState onRetry={load} /></div>;
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-sand-50"><LoadingState /></div>;
  if (notFound) return <div className="flex min-h-screen items-center justify-center bg-sand-50"><EmptyState title="No onboarding checklist yet" message="Once HR starts your onboarding, your tasks will appear here." /></div>;
  if (error) return <div className="flex min-h-screen items-center justify-center bg-sand-50"><ErrorState message={error} onRetry={load} /></div>;
  if (!instance) return null;

  const completedCount = instance.tasks.filter((t) => t.effective_status === 'COMPLETED').length;
  const total = instance.tasks.length;

  return (
    <div className="min-h-screen bg-sand-50 px-4 py-10">
      <ReminderPopup />
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink-900">Your onboarding checklist</h1>
          <p className="mt-1 text-sm text-ink-500">{completedCount} of {total} steps complete</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sand-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sage-400 to-sage-600 transition-all duration-500"
              style={{ width: `${total ? (completedCount / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {actionError && <Banner variant="error">{actionError}</Banner>}

        <div className="mt-4 space-y-3">
          {instance.tasks.map((task) => (
            <GlassCard
              key={task.id}
              className="cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_32px_-10px_rgba(88,58,158,0.25)]"
              onClick={() => setSelectedTaskId(task.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <TaskStatusIcon status={task.effective_status} />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{task.title}</p>
                    {task.description && (
                      <p className="mt-0.5 text-xs text-ink-500">{task.description}</p>
                    )}
                    {task.task_type === 'READING' && (
                      <p className="mt-1 text-xs text-clay-600">
                        {Math.floor((task.reading_total_active_seconds ?? 0) / 60)}m /{' '}
                        {Math.ceil(READING_THRESHOLD_SECONDS / 60)}m read
                      </p>
                    )}
                    <p className="mt-1 text-xs font-medium text-ink-400">{statusLabel(task)}</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          actionable={canAct(selectedTask) && selectedTask.effective_status !== 'WAITING' && selectedTask.effective_status !== 'COMPLETED'}
          busy={actingTaskId === selectedTask.id}
          onClose={() => setSelectedTaskId(null)}
          onStart={() => handleStart(selectedTask)}
          onComplete={(email) => handleComplete(selectedTask, email)}
          onCompleteProfile={(mobile, dob, address) => handleCompleteProfile(selectedTask, mobile, dob, address)}
          onRead={() => navigate(`/reading/${selectedTask.id}`)}
        />
      )}
    </div>
  );
}