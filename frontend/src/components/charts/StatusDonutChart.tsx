import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { StatusBreakdownItem } from '../../lib/types';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#cabfa9',
  IN_PROGRESS: '#3f8bcf',
  COMPLETED: '#4f8e78',
  CANCELLED: '#d97748',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function StatusDonutChart({ data }: { data: StatusBreakdownItem[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            innerRadius={62}
            outerRadius={90}
            paddingAngle={3}
            cornerRadius={6}
          >
            {data.map((d) => (
              <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? '#8862d9'} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={((value: number, _name: unknown, item: any) => [
              value,
              STATUS_LABELS[item?.payload?.status] ?? item?.payload?.status,
            ]) as any}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2dacc', fontSize: 13 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-ink-900">{total}</span>
        <span className="text-xs text-ink-400">onboardings</span>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((d) => (
          <span key={d.status} className="flex items-center gap-1.5 text-xs text-ink-500">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[d.status] ?? '#8862d9' }}
            />
            {STATUS_LABELS[d.status] ?? d.status} ({d.count})
          </span>
        ))}
      </div>
    </div>
  );
}
