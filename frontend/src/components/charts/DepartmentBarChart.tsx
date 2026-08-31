import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
  employee_count: number;
}

interface Props {
  data: DepartmentSummary[];
  /** When provided, clicking a bar calls this with that department — e.g. to navigate to the Company page. */
  onBarClick?: (dept: DepartmentSummary) => void;
}

export function DepartmentBarChart({ data, onBarClick }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#efeae1" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#6f7069' }}
          axisLine={{ stroke: '#e2dacc' }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: '#6f7069' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f3f7f5' }}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2dacc',
            fontSize: 13,
          }}
        />
        <Bar
          dataKey="employee_count"
          name="Employees"
          fill="#4f8e78"
          radius={[6, 6, 0, 0]}
          cursor={onBarClick ? 'pointer' : undefined}
          onClick={onBarClick ? (entry) => entry.payload && onBarClick(entry.payload as DepartmentSummary) : undefined}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
