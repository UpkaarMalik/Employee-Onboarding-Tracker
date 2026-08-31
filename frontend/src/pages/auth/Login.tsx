import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, isNetworkError } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { NoInternetState } from '../../components/shared/NoInternetState';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!identifier.trim()) next.identifier = 'Email is required';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setOffline(false);
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      login(data.accessToken, data.refreshToken, data.user, data.mustChangePassword);
      navigate(data.mustChangePassword ? '/change-password' : '/dashboard');
    } catch (err: any) {
      if (isNetworkError(err)) {
        setOffline(true);
      } else {
        setServerError(err.response?.data?.message || 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (offline) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50 px-4">
        <NoInternetState onRetry={() => setOffline(false)} />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sand-50 px-4">
      {/* Ambient background shapes — subtle pastel gradient blobs */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-gradient-to-br from-sage-200/50 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-gradient-to-tl from-clay-200/50 to-transparent blur-3xl" />

      <GlassCard className="relative w-full max-w-md p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-500 to-sage-600 text-white shadow-lg shadow-sage-500/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2 3 7l9 5 9-5-9-5z" />
              <path d="M3 12l9 5 9-5M3 17l9 5 9-5" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-ink-900">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-500">Sign in to continue your onboarding</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="text"
            placeholder="you@company.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            error={errors.identifier}
            autoComplete="username"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />

          {serverError && (
            <div className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-700">
              {serverError}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-400">
          Use your temporary or official company email
        </p>
      </GlassCard>
    </div>
  );
}