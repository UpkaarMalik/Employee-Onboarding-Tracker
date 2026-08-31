import { useEffect, useState } from 'react';
import { Gift, HeartPulse, Laptop2, Plus, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { Entitlement, EntitlementCategory } from '../../lib/types';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';
import { EmptyState } from '../../components/shared/EmptyState';

const CATEGORY_ICON: Record<EntitlementCategory, typeof Gift> = {
  INSURANCE: HeartPulse,
  DEVICE: Laptop2,
  PERK: Sparkles,
  OTHER: Gift,
};

const MANAGER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR'];

export default function Entitlements() {
  const { user } = useAuth();
  const canManage = !!user && MANAGER_ROLES.includes(user.role);

  const [items, setItems] = useState<Entitlement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EntitlementCategory>('PERK');
  const [saving, setSaving] = useState(false);

  async function load() {
    setError(null);
    try {
      const { data } = await api.get<Entitlement[]>('/entitlements');
      setItems(data);
    } catch {
      setError('Could not load entitlements.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/entitlements', { name, description: description || undefined, category });
      setName('');
      setDescription('');
      setCategory('PERK');
      setShowForm(false);
      await load();
    } catch {
      setError('Could not create this entitlement.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(item: Entitlement) {
    try {
      await api.patch(`/entitlements/${item.id}`, { is_active: !item.is_active });
      await load();
    } catch {
      setError('Could not update this entitlement.');
    }
  }

  if (error && items === null) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (items === null) {
    return <LoadingState message="Loading benefits…" />;
  }

  const grouped = items.reduce<Record<string, Entitlement[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">My Benefits</h1>
          <p className="mt-1 text-sm text-ink-500">Everything you're entitled to as an employee.</p>
        </div>
        {canManage && (
          <Button variant="accent" onClick={() => setShowForm((s) => !s)}>
            <Plus size={15} /> Add entitlement
          </Button>
        )}
      </div>

      {showForm && canManage && (
        <GlassCard className="animate-fade-slide-up p-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EntitlementCategory)}
                className="w-full rounded-xl border border-sand-300 bg-white/80 px-4 py-3 text-sm text-ink-900 outline-none focus:border-lavender-400 focus:ring-2 focus:ring-lavender-200"
              >
                <option value="INSURANCE">Insurance</option>
                <option value="DEVICE">Device</option>
                <option value="PERK">Perk</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <div className="sm:col-span-2">
              <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={saving}>Save entitlement</Button>
            </div>
          </form>
        </GlassCard>
      )}

      {items.length === 0 ? (
        <EmptyState title="No entitlements yet" message="The benefits catalog is empty." />
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => {
          const Icon = CATEGORY_ICON[cat as EntitlementCategory] ?? Gift;
          return (
            <section key={cat}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {catItems.map((item) => (
                  <GlassCard
                    key={item.id}
                    className={`p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-10px_rgba(88,58,158,0.3)] ${
                      !item.is_active ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-lavender-100 to-sky-100 text-lavender-600">
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-ink-900">{item.name}</h3>
                        {item.description && <p className="mt-1 text-xs text-ink-500">{item.description}</p>}
                        {canManage && (
                          <button
                            onClick={() => toggleActive(item)}
                            className="mt-2 text-xs font-medium text-lavender-600 hover:text-lavender-700"
                          >
                            {item.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
