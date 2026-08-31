import { useEffect, useState } from 'react';
import { Images, Trophy } from 'lucide-react';
import { api } from '../../lib/api';
import { GlassCard } from '../../components/ui/GlassCard';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';
import { EmptyState } from '../../components/shared/EmptyState';

interface GalleryItem {
  id: string;
  type: 'COMPANY_FAMILY' | 'SPORTS';
  title: string | null;
  description: string | null;
  image_url: string;
  created_at: string;
}

const TABS: { key: GalleryItem['type']; label: string; icon: typeof Images }[] = [
  { key: 'COMPANY_FAMILY', label: 'Company & Family', icon: Images },
  { key: 'SPORTS', label: 'Sports', icon: Trophy },
];

export default function ContentGallery() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<GalleryItem['type']>('COMPANY_FAMILY');

  async function load() {
    setError(null);
    try {
      const { data } = await api.get<GalleryItem[]>('/content-gallery');
      setItems(data);
    } catch {
      setError('Could not load the gallery.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error && items === null) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (items === null) {
    return <LoadingState message="Loading gallery…" />;
  }

  const filtered = items.filter((i) => i.type === tab);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Images size={20} className="text-lavender-600" />
        <div>
          <h1 className="text-xl font-bold text-ink-900">Gallery</h1>
          <p className="text-sm text-ink-500">Moments from around the company.</p>
        </div>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? 'bg-gradient-to-br from-lavender-500 to-sky-500 text-white shadow-[0_6px_18px_-6px_rgba(112,73,194,0.5)]'
                  : 'bg-white text-ink-600 border border-sand-300 hover:border-lavender-300'
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nothing here yet" message="Check back soon for more photos." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <GlassCard key={item.id} className="overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(88,58,158,0.35)]">
              <img src={item.image_url} alt={item.title ?? ''} className="h-44 w-full object-cover" />
              <div className="p-4">
                {item.title && <h3 className="text-sm font-semibold text-ink-900">{item.title}</h3>}
                {item.description && <p className="mt-1 text-xs text-ink-500">{item.description}</p>}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
