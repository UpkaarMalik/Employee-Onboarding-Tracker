import { useEffect, useState } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Banner } from '../../components/ui/Banner';
import { LoadingState } from '../../components/shared/LoadingState';
import { Confetti } from '../../components/ui/Confetti';

interface MineResponse {
  feedback_rating: number;
  feedback_comments: string | null;
  feedback_submitted_at: string;
}

const HIGHLIGHT_TAGS = [
  'Onboarding pace',
  'Task clarity',
  'Support from team',
  'Tools & access',
  'Communication',
  'Documentation',
];

const RATING_CAPTIONS: Record<number, string> = {
  1: 'Not great',
  2: 'Could be better',
  3: 'Pretty good',
  4: 'Great experience',
  5: 'Loved it!',
};

export default function Feedback() {
  const [mine, setMine] = useState<MineResponse | null | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fireConfetti, setFireConfetti] = useState(false);

  async function load() {
    try {
      const { data } = await api.get<MineResponse | null>('/feedback/mine');
      setMine(data);
    } catch {
      setMine(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleTag(tag: string) {
    setTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  }

  async function handleSubmit() {
    if (rating === 0) {
      setError('Pick a star rating to continue — everything else is optional.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const highlightLine = tags.size > 0 ? `Highlights: ${Array.from(tags).join(', ')}` : '';
      const combinedComments = [highlightLine, comments.trim()].filter(Boolean).join('\n\n');

      const { data } = await api.post('/feedback', {
        rating,
        comments: combinedComments || undefined,
      });
      setMine(data ? { feedback_rating: rating, feedback_comments: combinedComments || null, feedback_submitted_at: new Date().toISOString() } : null);
      setFireConfetti(true);
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(
        message === 'Feedback can only be submitted once onboarding is completed'
          ? "Your onboarding isn't finished yet — feedback unlocks once you're all done!"
          : message || 'Could not submit your feedback.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (mine === undefined) {
    return <LoadingState message="Loading…" />;
  }

  if (mine) {
    return (
      <div className="mx-auto max-w-lg">
        <GlassCard className="animate-reveal-scale p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sage-400 to-sage-600 text-white">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="text-lg font-bold text-ink-900">Thanks for the feedback!</h1>
          <div className="mt-3 flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={22}
                className={n <= mine.feedback_rating ? 'fill-butter-500 text-butter-500' : 'text-sand-300'}
              />
            ))}
          </div>
          {mine.feedback_comments && (
            <p className="mt-4 whitespace-pre-line rounded-xl bg-sand-50 p-4 text-left text-sm text-ink-600">
              {mine.feedback_comments}
            </p>
          )}
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <Confetti fire={fireConfetti} onDone={() => setFireConfetti(false)} />

      <div className="mb-6 text-center animate-fade-slide-up">
        <h1 className="text-xl font-bold text-ink-900">How was your onboarding?</h1>
        <p className="mt-1 text-sm text-ink-500">Takes 10 seconds. Everything below the stars is optional.</p>
      </div>

      <GlassCard className="animate-fade-slide-up p-8" style={{ animationDelay: '80ms' }}>
        <div className="flex flex-col items-center">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = n <= (hoverRating || rating);
              return (
                <button
                  key={n}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  className="p-1 transition-transform duration-150 hover:scale-125"
                >
                  <Star
                    size={34}
                    className={`transition-colors duration-150 ${
                      active ? 'fill-butter-500 text-butter-500' : 'text-sand-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <p className="mt-2 h-5 text-sm font-medium text-ink-600">
            {RATING_CAPTIONS[hoverRating || rating] ?? ' '}
          </p>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            What stood out? <span className="normal-case font-normal text-ink-400">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {HIGHLIGHT_TAGS.map((tag) => {
              const selected = tags.has(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    selected
                      ? 'border-lavender-400 bg-lavender-100 text-lavender-700 shadow-[0_2px_10px_-2px_rgba(112,73,194,0.4)]'
                      : 'border-sand-300 bg-white text-ink-600 hover:border-lavender-300 hover:bg-lavender-50'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-400">
            Anything else? <span className="normal-case font-normal text-ink-400">(optional)</span>
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            placeholder="Tell us what worked, or what we should fix…"
            className="w-full rounded-xl border border-sand-300 bg-white/80 px-4 py-3 text-sm text-ink-900 outline-none transition-all placeholder:text-ink-400 focus:border-lavender-400 focus:ring-2 focus:ring-lavender-200"
          />
        </div>

        {error && (
          <div className="mt-4"><Banner variant="error">{error}</Banner></div>
        )}

        <Button variant="accent" className="mt-6 w-full" onClick={handleSubmit} loading={submitting}>
          Submit feedback
        </Button>
      </GlassCard>
    </div>
  );
}
