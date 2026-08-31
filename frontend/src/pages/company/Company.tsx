import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { api } from '../../lib/api';
import { DepartmentBarChart, type DepartmentSummary } from '../../components/charts/DepartmentBarChart';
import { TrendChart } from '../../components/charts/TrendChart';
import { GlassCard } from '../../components/ui/GlassCard';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';

export default function Company() {
  const [departments, setDepartments] = useState<DepartmentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const { data } = await api.get<DepartmentSummary[]>('/company/departments-summary');
      setDepartments(data);
    } catch {
      setError('Could not load company data.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error && departments === null) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (departments === null) {
    return <LoadingState message="Loading company overview…" />;
  }

  const totalEmployees = departments.reduce((sum, d) => sum + d.employee_count, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Building2 size={20} className="text-lavender-600" />
        <div>
          <h1 className="text-xl font-bold text-ink-900">Company</h1>
          <p className="text-sm text-ink-500">Department directory and headcount overview.</p>
        </div>
      </div>

      <GlassCard className="p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink-900">Onboarding trends by department</h2>
        <TrendChart />
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="mb-4 text-sm font-semibold text-ink-900">Headcount by department</h2>
        <DepartmentBarChart data={departments} />
      </GlassCard>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
          Departments ({totalEmployees} employees total)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {departments.map((d) => (
            <GlassCard key={d.id} className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
                <Building2 size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-ink-900">{d.name}</h3>
                <p className="text-xs text-ink-400">{d.code}</p>
              </div>
              <span className="shrink-0 rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-700">
                {d.employee_count} {d.employee_count === 1 ? 'employee' : 'employees'}
              </span>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
