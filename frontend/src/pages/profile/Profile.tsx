import { useEffect, useRef, useState } from 'react';
import { Camera, Lock } from 'lucide-react';
import { api } from '../../lib/api';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';

interface Me {
  id: string;
  full_name: string;
  mobile: string | null;
  dob: string | null;
  address: string | null;
  email: string | null;
  personal_email: string;
  role: string;
  joining_date: string | null;
  profile_picture_url: string | null;
}

export default function Profile() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setError(null);
    try {
      const { data } = await api.get<Me>('/users/me');
      setMe(data);
      setAddress(data.address ?? '');
    } catch {
      setError('Could not load your profile.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSaveAddress() {
    if (!me) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.patch(`/users/${me.id}/profile`, { address });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Could not save your address.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/uploads/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMe((prev) => (prev ? { ...prev, profile_picture_url: data.url } : prev));
    } catch {
      setError('Could not upload your profile picture.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (error && me === null) {
    return <ErrorState message={error} onRetry={load} />;
  }
  if (me === null) {
    return <LoadingState message="Loading your profile…" />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Profile</h1>
        <p className="mt-1 text-sm text-ink-500">Your details, and what you can change yourself.</p>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center gap-5">
          <div className="group relative h-20 w-20 shrink-0">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-lavender-200 to-sky-200">
              {me.profile_picture_url ? (
                <img src={me.profile_picture_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-lavender-700">
                  {me.full_name.charAt(0)}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-ink-900/0 text-white opacity-0 transition-all group-hover:bg-ink-900/40 group-hover:opacity-100"
              aria-label="Change profile picture"
            >
              <Camera size={20} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePictureChange} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-900">{me.full_name}</h2>
            <p className="text-sm text-ink-500">{me.role.replace('_', ' ')}</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="space-y-4 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Editable</h3>
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Add your address" />
        <div className="flex items-center gap-3">
          <Button onClick={handleSaveAddress} loading={saving}>Save address</Button>
          {saved && <span className="text-xs font-medium text-sage-600">Saved ✓</span>}
        </div>
      </GlassCard>

      <GlassCard className="space-y-3 p-6">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-ink-500">
          <Lock size={13} /> HR/Admin controlled
        </h3>
        <ReadOnlyField label="Mobile" value={me.mobile} />
        <ReadOnlyField label="Date of birth" value={me.dob ? new Date(me.dob).toLocaleDateString() : null} />
        <ReadOnlyField label="Joining date" value={me.joining_date ? new Date(me.joining_date).toLocaleDateString() : null} />
        <ReadOnlyField label="Email" value={me.email} note="Email changes require a verified process — contact HR to change." />
        <p className="pt-1 text-xs text-ink-400">Contact HR or your Department Admin to update any of these.</p>
      </GlassCard>
    </div>
  );
}

function ReadOnlyField({ label, value, note }: { label: string; value: string | null; note?: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-sand-50 px-4 py-3">
      <div>
        <p className="text-xs text-ink-400">{label}</p>
        <p className="text-sm font-medium text-ink-800">{value ?? '—'}</p>
      </div>
      {note && <p className="max-w-[45%] text-right text-[11px] text-ink-400">{note}</p>}
    </div>
  );
}
