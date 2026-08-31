import { useEffect, useState } from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import type { ResourceCategory, ResourceItem } from '../../lib/types';
import { GlassCard } from '../../components/ui/GlassCard';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';
import { EmptyState } from '../../components/shared/EmptyState';

const CATEGORY_LABELS: Record<ResourceCategory, string> = {
  POLICY: 'Policies',
  HANDBOOK: 'Handbooks',
  PLAYBOOK: 'Playbooks',
  LEARNING: 'Learning',
};

export default function Resources() {
  const [resources, setResources] = useState<ResourceItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const { data } = await api.get<ResourceItem[]>('/resources');
      setResources(data);
    } catch {
      setError('Could not load resources.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error && resources === null) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (resources === null) {
    return <LoadingState message="Loading resources…" />;
  }
  if (resources.length === 0) {
    return <EmptyState title="No resources yet" message="Check back later for company policies and guides." />;
  }

  const grouped = resources.reduce<Record<string, ResourceItem[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <FileText size={20} className="text-lavender-600" />
        <div>
          <h1 className="text-xl font-bold text-ink-900">Resources</h1>
          <p className="text-sm text-ink-500">Read-anytime company documents and guides.</p>
        </div>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
            {CATEGORY_LABELS[category as ResourceCategory] ?? category}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((r) => (
              <GlassCard key={r.id} className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-ink-900">{r.title}</h3>
                    {r.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-ink-500">{r.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <a
                        href={r.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sage-700 hover:text-sage-800"
                      >
                        {r.is_downloadable ? 'Download' : 'Preview'} <ExternalLink size={12} />
                      </a>
                      {!r.is_downloadable && (
                        <span className="text-xs text-ink-400">Preview only</span>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
