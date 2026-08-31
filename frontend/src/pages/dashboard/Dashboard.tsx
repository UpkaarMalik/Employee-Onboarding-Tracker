import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ClipboardList, Sparkles, StickyNote, Users2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
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

const QUICK_ACTIONS = [
  { to: '/checklist', label: 'Checklist', description: 'Your onboarding tasks, start to finish.', icon: ClipboardList, bg: 'from-lavender-100 to-lavender-50', iconColor: 'text-lavender-600' },
  { to: '/notes', label: 'Private Notes', description: 'Jot things down — only you can see these.', icon: StickyNote, bg: 'from-sky-100 to-sky-50', iconColor: 'text-sky-600' },
  { to: '/community', label: 'Community', description: 'See what the team is talking about.', icon: Users2, bg: 'from-butter-300/50 to-butter-300/20', iconColor: 'text-clay-600' },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

      <div className="space-y-8">
        <div className="rounded-3xl bg-navy-900 p-6 text-white shadow-[0_20px_60px_-20px_rgba(16,22,44,0.6)] animate-fade-slide-up sm:p-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xl font-semibold sm:text-2xl">{greeting()} 👋</p>
              <p className="mt-1 text-lg text-white/80">{user?.fullName}</p>
              <p className="mt-3 text-sm uppercase tracking-wide text-white/50">
                {onboarding ? (onboarding.status === 'COMPLETED' ? 'Onboarding complete' : `${percent}% of your onboarding is done`) : 'No onboarding assigned yet'}
              </p>
            </div>
            <Button variant="accent" className="!bg-gradient-to-br !from-orange-400 !to-orange-600 shadow-[0_10px_28px_-8px_rgba(238,143,46,0.6)]" onClick={() => navigate('/checklist')}>
              View Checklist <ArrowRight size={15} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 animate-fade-slide-up" style={{ animationDelay: '90ms' }}>
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <GlassCard
                key={action.to}
                className={`relative cursor-pointer bg-gradient-to-br p-5 transition-all hover:-translate-y-1 hover:shadow-[0_16px_36px_-12px_rgba(88,58,158,0.3)] ${action.bg}`}
                onClick={() => navigate(action.to)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Icon size={18} className={action.iconColor} />
                </div>
                <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/10 text-ink-700">
                  <ArrowUpRight size={14} />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink-900">{action.label}</h3>
                <p className="mt-1 text-xs text-ink-600">{action.description}</p>
              </GlassCard>
            );
          })}
        </div>

        <div className="animate-fade-slide-up" style={{ animationDelay: '150ms' }}>
          {!onboarding ? (
            <EmptyState
              title="No onboarding in progress"
              message="Once HR starts your onboarding, your checklist will show up here."
            />
          ) : (
            <GlassCard className="overflow-hidden p-0">
              <div className="flex items-center justify-between bg-sand-100/60 px-6 py-4">
                <h2 className="text-sm font-semibold text-ink-900">
                  {onboarding.status === 'COMPLETED' ? (
                    <span className="inline-flex items-center gap-2">
                      All done <Sparkles size={16} className="text-sage-600" />
                    </span>
                  ) : 'Up next'}
                </h2>
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

        <div className="animate-fade-slide-up" style={{ animationDelay: '210ms' }}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">
            Company overview
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <GlassCard className="p-6 lg:col-span-3">
              <h3 className="mb-4 text-sm font-semibold text-ink-900">Headcount by department</h3>
              <DepartmentBarChart data={company.departments} onBarClick={() => navigate('/company')} />
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
