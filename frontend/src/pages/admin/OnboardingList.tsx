import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { GlassCard } from '../../components/ui/GlassCard';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';
import { EmptyState } from '../../components/shared/EmptyState';
import { NoSearchResults } from '../../components/shared/NoSearchResults';

interface InstanceRow {
  id: string;
  employee_id: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface EmployeeLite {
  id: string;
  full_name: string;
  department_id: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-sand-100 text-ink-600',
  IN_PROGRESS: 'bg-sky-100 text-sky-700',
  COMPLETED: 'bg-sage-100 text-sage-700',
  CANCELLED: 'bg-clay-100 text-clay-700',
};

export default function OnboardingList() {
  const navigate = useNavigate();
  const [instances, setInstances] = useState<InstanceRow[] | null>(null);
  const [employees, setEmployees] = useState<Record<string, EmployeeLite>>({});
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  async function load() {
    setError(null);
    try {
      const [{ data: instanceData }, { data: userData }, { data: deptData }] = await Promise.all([
        api.get<InstanceRow[]>('/onboarding/instances'),
        api.get<EmployeeLite[]>('/users'),
        api.get<{ id: string; name: string }[]>('/departments'),
      ]);
      setInstances(instanceData);
      setEmployees(Object.fromEntries(userData.map((u) => [u.id, u])));
      setDepartments(deptData);
    } catch {
      setError('Could not load onboarding instances.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!instances) return [];
    return instances.filter((inst) => {
      if (statusFilter !== 'ALL' && inst.status !== statusFilter) return false;
      if (departmentFilter !== 'ALL') {
        const emp = employees[inst.employee_id];
        if (!emp || emp.department_id !== departmentFilter) return false;
      }
      return true;
    });
  }, [instances, employees, statusFilter, departmentFilter]);

  if (error && instances === null) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (instances === null) {
    return <LoadingState message="Loading onboarding instances…" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Users size={20} className="text-lavender-600" />
        <div>
          <h1 className="text-xl font-bold text-ink-900">Onboardings</h1>
          <p className="text-sm text-ink-500">All onboarding instances across the company.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-ink-700 outline-none focus:border-lavender-400 focus:ring-2 focus:ring-lavender-200"
        >
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-ink-700 outline-none focus:border-lavender-400 focus:ring-2 focus:ring-lavender-200"
        >
          <option value="ALL">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {instances.length === 0 && (
        <EmptyState title="No onboarding instances yet" message="Create employees to start onboarding them." />
      )}
      {instances.length > 0 && filtered.length === 0 && <NoSearchResults query="these filters" />}

      <div className="space-y-3">
        {filtered.map((inst) => (
          <GlassCard
            key={inst.id}
            className="flex cursor-pointer items-center justify-between p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-10px_rgba(88,58,158,0.3)]"
            onClick={() => navigate(`/admin/onboardings/${inst.id}`)}
          >
            <div>
              <h3 className="text-sm font-semibold text-ink-900">
                {employees[inst.employee_id]?.full_name ?? 'Unknown employee'}
              </h3>
              <p className="mt-0.5 text-xs text-ink-400">
                Started {inst.started_at ? new Date(inst.started_at).toLocaleDateString() : '—'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[inst.status]}`}>
                {inst.status.replace('_', ' ')}
              </span>
              <ArrowRight size={16} className="text-ink-300" />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
