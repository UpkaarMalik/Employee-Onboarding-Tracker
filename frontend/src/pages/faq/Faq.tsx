import { useEffect, useState } from 'react';
import { HelpCircle, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Banner } from '../../components/ui/Banner';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';
import { EmptyState } from '../../components/shared/EmptyState';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const MANAGER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR'];

export default function Faq() {
  const { user } = useAuth();
  const canManage = !!user && MANAGER_ROLES.includes(user.role);

  const [items, setItems] = useState<FaqItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setError(null);
    try {
      const { data } = await api.get<FaqItem[]>('/faq');
      setItems(data);
    } catch {
      setError('Could not load the FAQ.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/faq', { category, question, answer });
      setCategory('');
      setQuestion('');
      setAnswer('');
      setShowForm(false);
      await load();
    } catch {
      setError('Could not add this question.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/faq/${id}`);
      await load();
    } catch {
      setError('Could not remove this question.');
    }
  }

  if (error && items === null) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (items === null) {
    return <LoadingState message="Loading FAQ…" />;
  }

  const grouped = items.reduce<Record<string, FaqItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HelpCircle size={20} className="text-lavender-600" />
          <div>
            <h1 className="text-xl font-bold text-ink-900">FAQ</h1>
            <p className="text-sm text-ink-500">Common questions, answered.</p>
          </div>
        </div>
        {canManage && (
          <Button variant="accent" onClick={() => setShowForm((s) => !s)}>
            <Plus size={15} /> Add question
          </Button>
        )}
      </div>

      {error && <Banner variant="error">{error}</Banner>}

      {showForm && canManage && (
        <GlassCard className="animate-fade-slide-up p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. IT Setup" required />
            <Input label="Question" value={question} onChange={(e) => setQuestion(e.target.value)} required />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-700">Answer</span>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={3}
                required
                className="w-full rounded-xl border border-sand-300 bg-white/80 px-4 py-3 text-sm text-ink-900 outline-none focus:border-lavender-400 focus:ring-2 focus:ring-lavender-200"
              />
            </label>
            <Button type="submit" loading={saving}>Save question</Button>
          </form>
        </GlassCard>
      )}

      {items.length === 0 ? (
        <EmptyState title="No FAQs yet" message="Questions will appear here once added." />
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <section key={cat}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">{cat}</h2>
            <div className="space-y-2">
              {catItems.map((item) => (
                <GlassCard key={item.id} className="overflow-hidden p-0">
                  <button
                    onClick={() => setOpenId(openId === item.id ? null : item.id)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-sand-50"
                  >
                    <span className="text-sm font-medium text-ink-900">{item.question}</span>
                    {canManage && (
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="shrink-0 text-ink-300 hover:text-clay-500"
                      >
                        <Trash2 size={14} />
                      </span>
                    )}
                  </button>
                  {openId === item.id && (
                    <div className="animate-fade-slide-up border-t border-sand-100 bg-sand-50/60 px-5 py-4 text-sm text-ink-600">
                      {item.answer}
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
