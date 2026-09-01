import { useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { LoadingState } from '../shared/LoadingState';
import { EmptyState } from '../shared/EmptyState';

interface Department {
  id: string;
  name: string;
}

interface TrendPoint {
  day: string;
  department_id: string;
  department_name: string;
  count: number;
}

interface TrendResponse {
  departments: Department[];
  points: TrendPoint[];
}

type ChartType = 'bar' | 'pie';
type RangeKey = 'today' | '3d' | '1w' | '1m' | '1y' | 'custom';

const RANGE_PRESETS: { key: RangeKey; label: string; days: number | null }[] = [
  { key: 'today', label: 'Today', days: 0 },
  { key: '3d', label: '3 Days', days: 3 },
  { key: '1w', label: '1 Week', days: 7 },
  { key: '1m', label: '1 Month', days: 30 },
  { key: '1y', label: '1 Year', days: 365 },
  { key: 'custom', label: 'Custom', days: null },
];

const DEPARTMENT_COLORS = ['#8862d9', '#3f8bcf', '#4f8e78', '#d97748', '#e8be55', '#a284e6', '#be5f35'];

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDayTick(day: string): string {
  const d = new Date(day);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function TrendChart() {
  const [range, setRange] = useState<RangeKey>('1m');
  const [customFrom, setCustomFrom] = useState(toDateInput(new Date(Date.now() - 30 * 86400000)));
  const [customTo, setCustomTo] = useState(toDateInput(new Date()));
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [data, setData] = useState<TrendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeptIds, setSelectedDeptIds] = useState<Set<string> | null>(null);

  const { from, to } = useMemo(() => {
    if (range === 'custom') return { from: customFrom, to: customTo };
    const preset = RANGE_PRESETS.find((r) => r.key === range)!;
    const toDate = new Date();
    const fromDate = new Date(Date.now() - (preset.days ?? 0) * 86400000);
    return { from: toDateInput(fromDate), to: toDateInput(toDate) };
  }, [range, customFrom, customTo]);

  async function load() {
    setError(null);
    try {
      const { data } = await api.get<TrendResponse>('/reports/onboarding-trend', { params: { from, to } });
      setData(data);
      if (selectedDeptIds === null) {
        setSelectedDeptIds(new Set(data.departments.map((d) => d.id)));
      }
    } catch {
      setError('Could not load onboarding trends.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const colorByDept = useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(data.departments.map((d, i) => [d.id, DEPARTMENT_COLORS[i % DEPARTMENT_COLORS.length]]));
  }, [data]);

  function toggleDept(id: string) {
    setSelectedDeptIds((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(id)) {
        // Always keep at least one department selected — an empty chart is
        // never useful, and it's confusing to end up there by accident.
        if (next.size === 1) return next;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const activeDepartments = (data?.departments ?? []).filter((d) => selectedDeptIds?.has(d.id));

  const seriesData = useMemo(() => {
    if (!data) return [];
    const byDay = new Map<string, Record<string, any>>();
    for (const p of data.points) {
      if (!selectedDeptIds?.has(p.department_id)) continue;
      const row = byDay.get(p.day) ?? { day: p.day };
      row[p.department_name] = p.count;
      byDay.set(p.day, row);
    }
    return Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));
  }, [data, selectedDeptIds]);

  const pieData = useMemo(() => {
    if (!data) return [];
    const totals = new Map<string, { name: string; value: number; id: string }>();
    for (const p of data.points) {
      if (!selectedDeptIds?.has(p.department_id)) continue;
      const existing = totals.get(p.department_id) ?? { name: p.department_name, value: 0, id: p.department_id };
      existing.value += p.count;
      totals.set(p.department_id, existing);
    }
    return Array.from(totals.values()).filter((d) => d.value > 0);
  }, [data, selectedDeptIds]);

  if (!data && !error) return <LoadingState message="Loading trends…" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {RANGE_PRESETS.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                range === r.key
                  ? 'bg-gradient-to-br from-lavender-500 to-sky-500 text-white shadow-[0_4px_14px_-4px_rgba(112,73,194,0.5)]'
                  : 'bg-white text-ink-600 border border-sand-300 hover:border-lavender-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-full border border-sand-300 bg-white p-1">
          {([
            { key: 'bar', icon: BarChart3 },
            { key: 'pie', icon: PieChartIcon },
          ] as const).map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setChartType(key)}
              aria-label={key}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                chartType === key ? 'bg-lavender-500 text-white' : 'text-ink-500 hover:bg-sand-100'
              }`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {range === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-lg border border-sand-300 px-2 py-1 text-xs"
          />
          <span className="text-ink-400">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-lg border border-sand-300 px-2 py-1 text-xs"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(data?.departments ?? []).map((d) => {
          const active = selectedDeptIds?.has(d.id);
          return (
            <button
              key={d.id}
              onClick={() => toggleDept(d.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                active ? 'border-transparent text-white' : 'border-sand-300 bg-white text-ink-400 opacity-60'
              }`}
              style={active ? { backgroundColor: colorByDept[d.id] } : undefined}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colorByDept[d.id] }} />
              {d.name}
            </button>
          );
        })}
      </div>

      {error && <EmptyState title="Could not load trends" message={error} />}

      {!error && data && (seriesData.length === 0 && pieData.length === 0) && (
        <EmptyState title="No onboardings in this range" message="Try a wider date range or a different selection." />
      )}

      {!error && (seriesData.length > 0 || pieData.length > 0) && (
        <ResponsiveContainer width="100%" height={280}>
          {chartType === 'pie' ? (
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3} cornerRadius={6}>
                {pieData.map((d) => <Cell key={d.id} fill={colorByDept[d.id]} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2dacc', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          ) : (
            <BarChart data={seriesData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#efeae1" vertical={false} />
              <XAxis
                dataKey="day"
                tickFormatter={formatDayTick}
                tick={{ fontSize: 11, fill: '#6f7069' }}
                axisLine={{ stroke: '#e2dacc' }}
                tickLine={false}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6f7069' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2dacc', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {activeDepartments.map((d) => (
                <Bar key={d.id} dataKey={d.name} fill={colorByDept[d.id]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
}
