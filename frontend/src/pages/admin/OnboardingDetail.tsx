import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, History, Play, Check, Mail, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { OnboardingInstance, ChecklistTask } from '../../lib/types';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TaskStatusIcon } from '../../components/onboarding/TaskStatusIcon';
import { Banner } from '../../components/ui/Banner';
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
  const { user } = useAuth();
  const [instance, setInstance] = useState<OnboardingInstance | null>(null);
  const [employee, setEmployee] = useState<EmployeeLite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actingTaskId, setActingTaskId] = useState<string | null>(null);
  const [emailModalTask, setEmailModalTask] = useState<ChecklistTask | null>(null);
  const [emailInput, setEmailInput] = useState('');

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

  function canAct(task: ChecklistTask): boolean {
    if (!user) return false;
    const isOwner = task.owner_id === user.id;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'HR';
    const isEmployeeWithDeptAdminTask = user.role === 'EMPLOYEE' && task.owner_type === 'DEPARTMENT_ADMIN';
    return isOwner || isAdmin || isEmployeeWithDeptAdminTask;
  }

  function canAdminAct(task: ChecklistTask): boolean {
    return canAct(task) && task.owner_type !== 'EMPLOYEE' && task.task_type !== 'READING';
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

  async function handleComplete(task: ChecklistTask) {
    if (task.title === 'Company Email ID Issuance') {
      setEmailModalTask(task);
      setEmailInput('');
      return;
    }
    completeTask(task);
  }

  async function completeTask(task: ChecklistTask, email?: string) {
    setActionError(null);
    setActingTaskId(task.id);
    try {
      await api.patch(`/tasks/${task.id}/complete`, email ? { official_email: email } : {});
      await load();
      setEmailModalTask(null);
      setEmailInput('');
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Could not complete this task.');
    } finally {
      setActingTaskId(null);
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
    <div className="space-y-8">
      <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => navigate('/admin/onboardings')}>
        <ArrowLeft size={14} /> Back to onboardings
      </Button>

      <div>
        <h1 className="text-xl font-bold text-ink-900">{employee?.full_name ?? 'Onboarding instance'}</h1>
        <p className="mt-1 text-sm text-ink-500">Status: {instance.status.replace('_', ' ')}</p>
      </div>

      {actionError && <Banner variant="error">{actionError}</Banner>}

      <div className="space-y-3">
        {sortedTasks.map((task) => (
          <GlassCard key={task.id} className="overflow-hidden p-0">
            <div className="flex w-full items-center gap-3 p-5">
              <TaskStatusIcon status={task.effective_status} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-900">{task.title}</p>
                <p className="text-xs text-ink-400">{task.owner_type.replace('_', ' ')}</p>
              </div>
              {canAdminAct(task) && task.effective_status !== 'WAITING' && task.effective_status !== 'COMPLETED' && (
                <div className="flex items-center gap-2">
                  {task.effective_status === 'AVAILABLE' && (
                    <button
                      onClick={() => handleStart(task)}
                      disabled={actingTaskId === task.id}
                      className="flex items-center gap-1 rounded-lg bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-200 disabled:opacity-50"
                    >
                      <Play size={12} /> Start
                    </button>
                  )}
                  {task.effective_status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleComplete(task)}
                      disabled={actingTaskId === task.id}
                      className="flex items-center gap-1 rounded-lg bg-sage-100 px-2 py-1 text-xs font-semibold text-sage-700 transition-colors hover:bg-sage-200 disabled:opacity-50"
                    >
                      <Check size={12} /> Complete
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={() => toggleTask(task.id)}
                className="flex items-center gap-2 text-ink-400 transition-colors hover:text-ink-600"
              >
                <History size={15} />
                <ChevronDown
                  size={16}
                  className={`transition-transform ${expandedTaskId === task.id ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

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

      {emailModalTask && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/40 px-4 backdrop-blur-sm"
          onClick={() => { setEmailModalTask(null); setEmailInput(''); }}
        >
          <GlassCard
            className="w-full max-w-md bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-sage-600" />
                <h3 className="text-base font-semibold text-ink-900">Assign Company Email</h3>
              </div>
              <button
                onClick={() => { setEmailModalTask(null); setEmailInput(''); }}
                className="text-ink-300 hover:text-ink-600"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-2 text-sm text-ink-500">
              Enter the official company email address to assign to this employee.
            </p>
            <Input
              label="Official email address"
              placeholder="employee@company.com"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="mt-4"
            />
            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => { setEmailModalTask(null); setEmailInput(''); }}
              >
                Cancel
              </Button>
              <Button
                variant="accent"
                disabled={!emailInput}
                loading={actingTaskId === emailModalTask.id}
                onClick={() => completeTask(emailModalTask, emailInput)}
              >
                <Mail size={14} /> Confirm &amp; Complete
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
