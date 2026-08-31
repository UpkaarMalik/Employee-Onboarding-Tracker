import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, isNetworkError } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { NoInternetState } from '../../components/shared/NoInternetState';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { completePasswordChange, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!currentPassword) next.currentPassword = 'Required';
    if (newPassword.length < 8) next.newPassword = 'Must be at least 8 characters';
    if (newPassword !== confirmPassword) next.confirmPassword = 'Passwords do not match';
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
      await api.patch('/auth/change-password', { currentPassword, newPassword });
      completePasswordChange();
      logout(); // backend revokes the refresh token on password change — force clean re-login
      navigate('/login');
    } catch (err: any) {
      if (isNetworkError(err)) {
        setOffline(true);
      } else {
        setServerError(err.response?.data?.message || 'Could not change password. Please try again.');
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
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-butter-300/40 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-gradient-to-tl from-sage-200/50 to-transparent blur-3xl" />

      <GlassCard className="relative w-full max-w-md p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-clay-400 to-clay-500 text-white shadow-lg shadow-clay-400/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-ink-900">Set a new password</h1>
          <p className="mt-1 text-sm text-ink-500">This is required before you can continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={errors.currentPassword}
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={errors.newPassword}
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />

          {serverError && (
            <div className="rounded-xl bg-clay-50 px-4 py-3 text-sm text-clay-700">
              {serverError}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Update password
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}