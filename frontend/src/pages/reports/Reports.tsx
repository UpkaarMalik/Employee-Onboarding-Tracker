import { useEffect, useState } from 'react';
import { AlertTriangle, Star } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../lib/api';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatusDonutChart } from '../../components/charts/StatusDonutChart';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';
import { EmptyState } from '../../components/shared/EmptyState';

interface FunnelResponse {
  funnel: { status: string; count: number }[];
  averageCompletionDays: number | null;
}

interface OverdueResponse {
  thresholdDays: number;
  count: number;
  items: { id: string; title: string; employee_name: string; owner_name: string | null; days_open: number }[];
}

interface FeedbackSummaryResponse {
  count: number;
  average: number | null;
  distribution: { rating: number; count: number }[];
}

export default function Reports() {
  const [funnel, setFunnel] = useState<FunnelResponse | null>(null);
  const [overdue, setOverdue] = useState<OverdueResponse | null>(null);
  const [feedback, setFeedback] = useState<FeedbackSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [{ data: f }, { data: o }, { data: fb }] = await Promise.all([
        api.get<FunnelResponse>('/reports/onboarding-funnel'),
        api.get<OverdueResponse>('/reports/task-overdue'),
        api.get<FeedbackSummaryResponse>('/reports/feedback-summary'),
      ]);
      setFunnel(f);
      setOverdue(o);
      setFeedback(fb);
    } catch {
      setError('Could not load reports.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error && funnel === null) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (funnel === null || overdue === null || feedback === null) {
    return <LoadingState message="Crunching the numbers…" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Reports</h1>
        <p className="mt-1 text-sm text-ink-500">Onboarding analytics at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <GlassCard className="p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">Onboarding funnel</h2>
            {funnel.averageCompletionDays !== null && (
              <span className="rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-700">
                avg {funnel.averageCompletionDays.toFixed(1)} days to complete
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={funnel.funnel} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#efeae1" vertical={false} />
              <XAxis dataKey="status" tick={{ fontSize: 12, fill: '#6f7069' }} axisLine={{ stroke: '#e2dacc' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6f7069' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2dacc', fontSize: 13 }} />
              <Bar dataKey="count" fill="#8862d9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Status split</h2>
          <StatusDonutChart data={funnel.funnel} />
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-clay-500" />
            <h2 className="text-sm font-semibold text-ink-900">
              Overdue tasks ({overdue.thresholdDays}+ days open)
            </h2>
          </div>
          {overdue.items.length === 0 ? (
            <EmptyState title="Nothing overdue" message="Every required task is on track." />
          ) : (
            <ul className="space-y-2">
              {overdue.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-xl bg-clay-50/70 px-4 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-ink-800">{item.title}</p>
                    <p className="text-xs text-ink-500">
                      {item.employee_name} · owner: {item.owner_name ?? '—'}
                    </p>
                  </div>
                  <span className="rounded-full bg-clay-200 px-2.5 py-1 text-xs font-semibold text-clay-700">
                    {item.days_open}d
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Star size={16} className="text-butter-500" />
            <h2 className="text-sm font-semibold text-ink-900">Feedback summary</h2>
          </div>
          {feedback.count === 0 ? (
            <EmptyState title="No feedback yet" message="Ratings will appear here once onboardings complete." />
          ) : (
            <>
              <div className="mb-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-ink-900">{feedback.average?.toFixed(1)}</span>
                <span className="text-sm text-ink-500">/ 5 average · {feedback.count} responses</span>
              </div>
              <div className="space-y-2">
                {feedback.distribution.slice().reverse().map((d) => (
                  <div key={d.rating} className="flex items-center gap-2">
                    <span className="w-10 text-xs text-ink-500">{d.rating} ★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-butter-500 to-clay-400"
                        style={{ width: feedback.count > 0 ? `${(d.count / feedback.count) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs text-ink-400">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
