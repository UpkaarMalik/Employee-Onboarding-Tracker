import { useEffect, useState } from 'react';
import { EyeOff, Heart, MessageCircle, Plus, ShieldOff, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Banner } from '../../components/ui/Banner';
import { LoadingState } from '../../components/shared/LoadingState';
import { EmptyState } from '../../components/shared/EmptyState';

interface Post {
  id: string;
  content: string;
  status: 'VISIBLE' | 'HIDDEN';
  moderation_reason: string | null;
  created_at: string;
  reactions: Record<string, number>;
  my_reaction: string | null;
}

interface PollOption {
  id: string;
  text: string;
}

interface Poll {
  id: string;
  question: string;
  is_active: boolean;
  options: PollOption[];
  my_vote_option_id: string | null;
}

const MODERATOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR'];

export default function Community() {
  const { user } = useAuth();
  const canModerate = !!user && MODERATOR_ROLES.includes(user.role);

  const [tab, setTab] = useState<'posts' | 'polls'>('posts');
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [polls, setPolls] = useState<Poll[] | null>(null);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPosts() {
    try {
      const { data } = await api.get<Post[]>('/posts');
      setPosts(data);
    } catch {
      setError('Could not load posts.');
    }
  }

  async function loadPolls() {
    try {
      const { data } = await api.get<Poll[]>('/polls');
      setPolls(data);
    } catch {
      setError('Could not load polls.');
    }
  }

  useEffect(() => {
    loadPosts();
    loadPolls();
  }, []);

  async function handleSubmitPost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosting(true);
    setError(null);
    try {
      await api.post('/posts', { content: newPost.trim() });
      setNewPost('');
      await loadPosts();
    } catch {
      setError('Could not publish your post.');
    } finally {
      setPosting(false);
    }
  }

  async function handleReact(postId: string) {
    try {
      await api.post(`/posts/${postId}/react`, { reaction: '❤️' });
      await loadPosts();
    } catch {
      setError('Could not react to this post.');
    }
  }

  async function handleModerate(postId: string, action: 'HIDE' | 'RESTORE') {
    try {
      await api.patch(`/posts/${postId}/moderate`, { action });
      await loadPosts();
    } catch {
      setError('Could not moderate this post.');
    }
  }

  async function handleVote(pollId: string, optionId: string) {
    try {
      await api.post(`/polls/${pollId}/vote`, { option_id: optionId });
      await loadPolls();
    } catch {
      setError('Could not submit your vote.');
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <MessageCircle size={20} className="text-lavender-600" />
        <div>
          <h1 className="text-xl font-bold text-ink-900">Community</h1>
          <p className="text-sm text-ink-500">Posts are always anonymous — even to moderators.</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['posts', 'polls'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-all ${
              tab === t
                ? 'bg-gradient-to-br from-lavender-500 to-sky-500 text-white shadow-[0_6px_18px_-6px_rgba(112,73,194,0.5)]'
                : 'bg-white text-ink-600 border border-sand-300 hover:border-lavender-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <Banner variant="error">{error}</Banner>}

      {tab === 'posts' && (
        <div className="space-y-4">
          <GlassCard className="p-5">
            <form onSubmit={handleSubmitPost} className="space-y-3">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows={3}
                placeholder="Share something with the team — nobody will see it's from you…"
                className="w-full rounded-xl border border-sand-300 bg-white/80 px-4 py-3 text-sm text-ink-900 outline-none focus:border-lavender-400 focus:ring-2 focus:ring-lavender-200"
              />
              <Button type="submit" variant="accent" loading={posting} disabled={!newPost.trim()}>
                <Plus size={15} /> Post anonymously
              </Button>
            </form>
          </GlassCard>

          {posts === null ? (
            <LoadingState message="Loading posts…" />
          ) : posts.length === 0 ? (
            <EmptyState title="No posts yet" message="Be the first to share something." />
          ) : (
            posts.map((post) => (
              <GlassCard key={post.id} className={`p-5 ${post.status === 'HIDDEN' ? 'opacity-60' : ''}`}>
                <p className="text-sm text-ink-800">{post.content}</p>
                {post.status === 'HIDDEN' && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-clay-600">
                    <EyeOff size={12} /> Hidden{post.moderation_reason ? `: ${post.moderation_reason}` : ''}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleReact(post.id)}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        post.my_reaction ? 'bg-clay-100 text-clay-700' : 'bg-sand-100 text-ink-500 hover:bg-clay-50'
                      }`}
                    >
                      <Heart size={12} className={post.my_reaction ? 'fill-clay-500' : ''} />
                      {Object.values(post.reactions).reduce((a, b) => a + b, 0)}
                    </button>
                    <span className="text-xs text-ink-400">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  {canModerate && (
                    <button
                      onClick={() => handleModerate(post.id, post.status === 'VISIBLE' ? 'HIDE' : 'RESTORE')}
                      className="flex items-center gap-1 text-xs font-medium text-ink-400 hover:text-lavender-600"
                    >
                      {post.status === 'VISIBLE' ? <><ShieldOff size={12} /> Hide</> : <><ShieldCheck size={12} /> Restore</>}
                    </button>
                  )}
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {tab === 'polls' && (
        <div className="space-y-4">
          {polls === null ? (
            <LoadingState message="Loading polls…" />
          ) : polls.length === 0 ? (
            <EmptyState title="No polls yet" message="Check back soon." />
          ) : (
            polls.map((poll) => (
              <GlassCard key={poll.id} className="p-5">
                <h3 className="mb-3 text-sm font-semibold text-ink-900">{poll.question}</h3>
                <div className="space-y-2">
                  {poll.options.map((opt) => {
                    const votedFor = poll.my_vote_option_id === opt.id;
                    return (
                      <button
                        key={opt.id}
                        disabled={!!poll.my_vote_option_id || !poll.is_active}
                        onClick={() => handleVote(poll.id, opt.id)}
                        className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-all disabled:cursor-not-allowed ${
                          votedFor
                            ? 'border-lavender-400 bg-lavender-50 text-lavender-700 font-medium'
                            : 'border-sand-300 bg-white text-ink-700 hover:border-lavender-300 hover:bg-lavender-50 disabled:hover:border-sand-300 disabled:hover:bg-white'
                        }`}
                      >
                        {opt.text} {votedFor && '✓'}
                      </button>
                    );
                  })}
                </div>
                {poll.my_vote_option_id && (
                  <p className="mt-2 text-xs text-ink-400">You've voted on this poll.</p>
                )}
              </GlassCard>
            ))
          )}
        </div>
      )}
    </div>
  );
}
