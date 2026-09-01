import { useEffect, useState } from 'react';
import { FileText, Eye, X } from 'lucide-react';
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

function buildResourcePreviewHtml(resource: ResourceItem) {
  const title = resource.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const description = resource.description
    ? resource.description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    : 'Company policy document';

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          :root {
            color-scheme: light;
            --bg: #f6f1ea;
            --panel: #ffffff;
            --text: #1f2430;
            --muted: #667085;
            --line: #e8e0d5;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: var(--bg);
            color: var(--text);
            font-family: Inter, Segoe UI, sans-serif;
            padding: 56px 72px;
          }
          .page {
            max-width: 980px;
            margin: 0 auto;
            background: var(--panel);
            border: 2px solid var(--line);
            border-radius: 18px;
            box-shadow: 0 10px 30px rgba(17, 24, 39, 0.06);
            padding: 64px 72px 80px;
          }
          .label {
            margin: 0 0 12px;
            color: var(--muted);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
          }
          h1 {
            margin: 0 0 20px;
            font-size: clamp(2.5rem, 4vw, 5rem);
            line-height: 1.04;
            letter-spacing: -0.05em;
            font-weight: 800;
          }
          p {
            margin: 0;
            color: var(--muted);
            font-size: 1.05rem;
            line-height: 1.8;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <p class="label">Company resource</p>
          <h1>${title}</h1>
          <p>${description}</p>
        </div>
      </body>
    </html>
  `;
}

export default function Resources() {
  const [resources, setResources] = useState<ResourceItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);

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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-lavender-100 to-sky-100 text-lavender-600 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-ink-900">{r.title}</h3>
                    {r.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-ink-500">{r.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedResource(r)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-sage-700 hover:text-sage-800"
                      >
                        <Eye size={12} /> Preview in reader
                      </button>
                      <span className="text-xs text-ink-400">Read only</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      ))}

      {selectedResource && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-navy-950/55 p-3 sm:p-5 lg:pl-[19rem] lg:pr-8"
          onClick={() => setSelectedResource(null)}
        >
          <div
            className="w-full max-w-6xl overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-[0_28px_80px_-18px_rgba(15,23,42,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-sand-200 px-4 py-3 sm:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">Reading view</p>
                <h3 className="text-base font-semibold text-ink-900">{selectedResource.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResource(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-500 transition-colors hover:bg-sand-100 hover:text-ink-700"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-sand-50 p-3 sm:p-4 lg:p-5">
              <div className="h-[72vh] overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-inner">
                <iframe
                  title={selectedResource.title}
                  srcDoc={buildResourcePreviewHtml(selectedResource)}
                  className="h-full w-full border-0 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-sand-200 px-4 py-3 text-xs text-ink-500 sm:px-6">
              <span>Preview only — download is disabled in this viewer.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
