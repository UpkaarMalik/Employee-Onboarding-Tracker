import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import type { DashboardResponse } from '../../lib/types';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { TaskStatusIcon } from '../../components/onboarding/TaskStatusIcon';
import { DepartmentBarChart } from '../../components/charts/DepartmentBarChart';
import { StatusDonutChart } from '../../components/charts/StatusDonutChart';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';
import { EmptyState } from '../../components/shared/EmptyState';
import { IntroReveal, useIntroReveal } from '../../components/layout/IntroReveal';

export default function Dashboard() {
  const navigate = useNavigate();
  const showingIntro = useIntroReveal();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const { data } = await api.get<DashboardResponse>('/dashboard/me');
      setData(data);
    } catch {
      setError('Could not load your dashboard.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error && data === null) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (data === null) {
    return <LoadingState message="Loading your dashboard…" />;
  }

  const { onboarding, company } = data;
  const requiredTasks = onboarding?.tasks.filter((t) => t.is_required) ?? [];
  const completedRequired = requiredTasks.filter((t) => t.effective_status === 'COMPLETED').length;
  const percent = requiredTasks.length > 0
    ? Math.round((completedRequired / requiredTasks.length) * 100)
    : 0;

  return (
    <>
      {showingIntro && <IntroReveal />}

      <div className="space-y-10">
        <div className="animate-fade-slide-up" style={{ animationDelay: '0ms' }}>
          <h1 className="text-2xl font-bold text-ink-900">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-500">Here's where your onboarding stands today.</p>
        </div>

        <div className="animate-fade-slide-up" style={{ animationDelay: '90ms' }}>
          {!onboarding ? (
            <EmptyState
              title="No onboarding in progress"
              message="Once HR starts your onboarding, your checklist will show up here."
            />
          ) : (
            <GlassCard className="overflow-hidden p-0">
              <div className="bg-gradient-to-br from-lavender-500 via-lavender-500 to-sky-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                      Your onboarding
                    </p>
                    <h2 className="mt-1 text-xl font-bold">
                      {onboarding.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-2">
                          All done <Sparkles size={18} />
                        </span>
                      ) : (
                        `${percent}% complete`
                      )}
                    </h2>
                  </div>
                  <Button variant="pill" onClick={() => navigate('/checklist')}>
                    View checklist <ArrowRight size={15} />
                  </Button>
                </div>
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700 ease-out"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              <ul className="divide-y divide-sand-100">
                {onboarding.tasks
                  .slice()
                  .sort((a, b) => a.order_index - b.order_index)
                  .slice(0, 5)
                  .map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center gap-3 px-6 py-3 text-sm transition-colors hover:bg-sand-50"
                    >
                      <TaskStatusIcon status={task.effective_status} />
                      <span
                        className={
                          task.effective_status === 'COMPLETED'
                            ? 'text-ink-400 line-through'
                            : 'text-ink-800'
                        }
                      >
                        {task.title}
                      </span>
                    </li>
                  ))}
              </ul>
            </GlassCard>
          )}
        </div>

        <div className="animate-fade-slide-up" style={{ animationDelay: '180ms' }}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">
            Company overview
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <GlassCard className="p-6 lg:col-span-3">
              <h3 className="mb-4 text-sm font-semibold text-ink-900">Headcount by department</h3>
              <DepartmentBarChart data={company.departments} />
            </GlassCard>
            <GlassCard className="p-6 lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold text-ink-900">Onboarding status</h3>
              <StatusDonutChart data={company.statusBreakdown} />
            </GlassCard>
          </div>
        </div>
      </div>
    </>
  );
}
