import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Search, UserPlus, Users, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Banner } from '../../components/ui/Banner';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';
import { EmptyState } from '../../components/shared/EmptyState';

const CAN_CREATE_ROLES = ['SUPER_ADMIN', 'HR'];

interface Department {
  id: string;
  name: string;
  code: string;
}

interface EmployeeRow {
  id: string;
  full_name: string;
  personal_email: string;
  role: string;
  department_id: string | null;
  joining_date: string | null;
  is_active: boolean;
  created_at: string;
}

interface FormState {
  full_name: string;
  personal_email: string;
  department_id: string;
  joining_date: string;
}

const EMPTY_FORM: FormState = { full_name: '', personal_email: '', department_id: '', joining_date: '' };

export default function Employees() {
  const { user } = useAuth();
  const canCreate = !!user && CAN_CREATE_ROLES.includes(user.role);

  const [employees, setEmployees] = useState<EmployeeRow[] | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(null);

  const departmentById = useMemo(
    () => Object.fromEntries(departments.map((d) => [d.id, d])),
    [departments],
  );

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees?.filter((employee) => {
      const matchesSearch = !query || employee.full_name.toLowerCase().includes(query);
      const matchesDepartment = departmentFilter === 'ALL' || employee.department_id === departmentFilter;
      const matchesStatus = statusFilter === 'ALL'
        || (statusFilter === 'ACTIVE' && employee.is_active)
        || (statusFilter === 'INACTIVE' && !employee.is_active);
      return matchesSearch && matchesDepartment && matchesStatus;
    }) ?? [];
  }, [employees, search, departmentById, departmentFilter, statusFilter]);

  async function load() {
    setLoadError(null);
    try {
      const [{ data: employeeData }, { data: departmentData }] = await Promise.all([
        api.get<EmployeeRow[]>('/users'),
        api.get<Department[]>('/departments'),
      ]);
      setEmployees(employeeData);
      setDepartments(departmentData);
    } catch {
      setLoadError('Could not load employees.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
      await api.post('/users', {
        full_name: form.full_name,
        personal_email: form.personal_email,
        department_id: form.department_id || undefined,
        joining_date: form.joining_date,
      });
      setSuccessMessage(`${form.full_name} has been added. Temporary login credentials were emailed to them.`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Could not create employee.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError && employees === null) {
    return <ErrorState message={loadError} onRetry={load} />;
  }
  if (employees === null) {
    return <LoadingState message="Loading employees…" />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-lavender-600" />
          <div>
            <h1 className="text-xl font-bold text-ink-900">Employees</h1>
            <p className="text-sm text-ink-500">Everyone in the company, and where they stand.</p>
          </div>
        </div>
        {canCreate && (
          <Button onClick={() => { setShowForm((v) => !v); setFormError(null); setSuccessMessage(null); }}>
            <UserPlus size={16} /> New employee
          </Button>
        )}
      </div>

      {successMessage && <Banner variant="success">{successMessage}</Banner>}

      {canCreate && showForm && (
        <GlassCard className="p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                value={form.full_name}
                onChange={(e) => updateField('full_name', e.target.value)}
                required
              />
              <Input
                label="Personal email"
                type="email"
                value={form.personal_email}
                onChange={(e) => updateField('personal_email', e.target.value)}
                required
              />
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink-700">Department</span>
                <select
                  className="w-full rounded-xl border border-sand-300 bg-white/80 px-4 py-3 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-sage-300 focus:border-sage-400"
                  value={form.department_id}
                  onChange={(e) => updateField('department_id', e.target.value)}
                >
                  <option value="">Select department…</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
              <Input
                label="Joining date"
                type="date"
                value={form.joining_date}
                onChange={(e) => updateField('joining_date', e.target.value)}
                required
              />
            </div>

            {formError && <Banner variant="error">{formError}</Banner>}

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Create employee
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      {employees.length === 0 ? (
        <EmptyState
          title="No employees yet"
          message={canCreate ? 'Add your first employee to get their onboarding started.' : 'No employees have been added yet.'}
        />
      ) : (
        <>
          <GlassCard className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <label className="relative min-w-0 flex-1">
                <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by employee name..."
                  className="w-full rounded-xl border border-sand-300 bg-white/80 py-3 pl-10 pr-4 text-sm text-ink-900 outline-none transition focus:border-lavender-400 focus:ring-2 focus:ring-lavender-200"
                />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  aria-label="Filter by department"
                  className="rounded-xl border border-sand-300 bg-white/80 px-3 py-3 text-sm text-ink-700 outline-none focus:border-lavender-400 focus:ring-2 focus:ring-lavender-200"
                >
                  <option value="ALL">All departments</option>
                  {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  aria-label="Filter by status"
                  className="rounded-xl border border-sand-300 bg-white/80 px-3 py-3 text-sm text-ink-700 outline-none focus:border-lavender-400 focus:ring-2 focus:ring-lavender-200"
                >
                  <option value="ALL">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <p className="mt-2 px-1 text-xs text-ink-400">Showing {filteredEmployees.length} of {employees.length} employees</p>
          </GlassCard>

          {filteredEmployees.length === 0 ? (
            <EmptyState title="No matching employees" message="Try a different search or filter." />
          ) : (
            <div className="space-y-3">
          {filteredEmployees.map((emp) => (
            <GlassCard
              key={emp.id}
              className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-5 transition-all hover:-translate-y-0.5 hover:border-lavender-200 hover:shadow-[0_14px_34px_-12px_rgba(88,58,158,0.3)]"
              onClick={() => setSelectedEmployee(emp)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedEmployee(emp); }}
            >
              <div>
                <h3 className="text-sm font-semibold text-ink-900">{emp.full_name}</h3>
                <p className="mt-0.5 text-xs text-ink-400">{emp.personal_email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-lavender-100 px-3 py-1 font-semibold text-lavender-700">
                  {emp.role}
                </span>
                <span className="rounded-full bg-sand-100 px-3 py-1 font-medium text-ink-600">
                  {emp.department_id ? departmentById[emp.department_id]?.name ?? 'Unknown dept' : 'No department'}
                </span>
                <span className={`rounded-full px-3 py-1 font-semibold ${emp.is_active ? 'bg-sage-100 text-sage-700' : 'bg-clay-100 text-clay-700'}`}>
                  {emp.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </GlassCard>
          ))}
            </div>
          )}
        </>
      )}

      {selectedEmployee && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/45 px-4 backdrop-blur-sm"
          onClick={() => setSelectedEmployee(null)}
        >
          <GlassCard className="w-full max-w-md bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-lavender-600">Employee preview</p>
                <h2 className="mt-1 text-xl font-bold text-ink-900">{selectedEmployee.full_name}</h2>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                aria-label="Close employee preview"
                className="rounded-lg p-1 text-ink-400 transition hover:bg-sand-100 hover:text-ink-700"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <PreviewField label="Personal email" value={selectedEmployee.personal_email} />
              <PreviewField label="Role" value={selectedEmployee.role} />
              <PreviewField
                label="Department"
                value={selectedEmployee.department_id ? departmentById[selectedEmployee.department_id]?.name ?? 'Unknown department' : 'No department'}
              />
              <PreviewField label="Joining date" value={selectedEmployee.joining_date ? new Date(selectedEmployee.joining_date).toLocaleDateString() : '—'} />
              <PreviewField label="Status" value={selectedEmployee.is_active ? 'Active' : 'Inactive'} />
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-sand-50 px-4 py-3">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-ink-800">{value}</p>
    </div>
  );
}
