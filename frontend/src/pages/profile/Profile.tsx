import { useEffect, useRef, useState } from 'react';
import { Calendar, Camera, Cake, Lock, Mail, MapPin, Phone, UserCircle2 } from 'lucide-react';
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

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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
      <div className="overflow-hidden rounded-3xl bg-navy-900 shadow-[0_20px_60px_-20px_rgba(16,22,44,0.6)]">
        <div className="h-24 bg-gradient-to-br from-lavender-600 via-lavender-500 to-sky-500 sm:h-28" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col items-start gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="group relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
              <div className="h-full w-full overflow-hidden rounded-full border-4 border-navy-900 bg-gradient-to-br from-lavender-200 to-sky-200 shadow-lg">
                {me.profile_picture_url ? (
                  <img src={me.profile_picture_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-lavender-700">
                    {me.full_name.charAt(0)}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-ink-900/0 text-white opacity-0 transition-all group-hover:bg-ink-900/45 group-hover:opacity-100"
                aria-label="Change profile picture"
              >
                <Camera size={22} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePictureChange} />
            </div>

            <div className="flex flex-wrap gap-2 pb-1 sm:pb-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                {me.role.replace('_', ' ')}
              </span>
              {me.joining_date && (
                <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-300">
                  Member since {formatDate(me.joining_date)}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4">
            <h1 className="text-xl font-bold text-white">{me.full_name}</h1>
            <p className="mt-0.5 text-sm text-white/60">{me.personal_email}</p>
          </div>
        </div>
      </div>

      <GlassCard className="space-y-4 p-6">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-ink-500">
          <UserCircle2 size={14} /> Editable
        </h3>
        <Input
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Add your address"
        />
        <div className="flex items-center gap-3">
          <Button onClick={handleSaveAddress} loading={saving}>Save address</Button>
          {saved && <span className="text-xs font-medium text-sage-600">Saved ✓</span>}
        </div>
      </GlassCard>

      <GlassCard className="space-y-3 p-6">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-ink-500">
          <Lock size={13} /> HR/Admin controlled
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField icon={Phone} label="Mobile" value={me.mobile} />
          <ReadOnlyField icon={Cake} label="Date of birth" value={formatDate(me.dob)} />
          <ReadOnlyField icon={Calendar} label="Joining date" value={formatDate(me.joining_date)} />
          <ReadOnlyField icon={Mail} label="Email" value={me.email} note="Contact HR to change" />
        </div>
        <p className="pt-1 text-xs text-ink-400">Contact HR or your Department Admin to update any of these.</p>
      </GlassCard>
    </div>
  );
}

function ReadOnlyField({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof MapPin;
  label: string;
  value: string | null;
  note?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-sand-50 px-4 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-lavender-600 shadow-sm">
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-400">{label}</p>
        <p className="truncate text-sm font-medium text-ink-800">{value ?? '—'}</p>
        {note && <p className="mt-0.5 text-[11px] text-ink-400">{note}</p>}
      </div>
    </div>
  );
}
