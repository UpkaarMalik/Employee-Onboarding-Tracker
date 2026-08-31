import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { AppNotification, NotificationType } from '../../lib/types';

const UNREAD_POLL_MS = 30000;

function deepLinkFor(type: NotificationType): string {
  switch (type) {
    case 'TASK_ASSIGNED':
    case 'TASK_WAITING':
      return '/checklist';
    case 'ONBOARDING_STARTED':
      return '/checklist';
    case 'ONBOARDING_COMPLETED':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function pollUnread() {
      try {
        const { data } = await api.get('/notifications/unread-count');
        if (!cancelled) setUnreadCount(data.count);
      } catch {
        // Silently ignore — next poll will retry
      }
    }

    pollUnread();
    const interval = setInterval(pollUnread, UNREAD_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data.slice(0, 10));
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleNotificationClick(n: AppNotification) {
    setOpen(false);
    if (!n.is_read) {
      try {
        await api.patch(`/notifications/${n.id}/read`);
        setUnreadCount((c) => Math.max(c - 1, 0));
      } catch {
        // Non-fatal — navigation proceeds regardless
      }
    }
    navigate(deepLinkFor(n.type));
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sand-200 bg-white/80 px-6 py-3 backdrop-blur-xl">
      <nav className="flex items-center gap-5 text-sm font-medium text-ink-700">
        <Link to="/dashboard" className="font-bold text-ink-900">Onboarding</Link>
        <Link to="/checklist" className="hover:text-sage-600">Checklist</Link>
        <Link to="/notes" className="hover:text-sage-600">Notes</Link>
        <Link to="/resources" className="hover:text-sage-600">Resources</Link>
        <Link to="/company" className="hover:text-sage-600">Company</Link>
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'HR') && (
          <Link to="/admin/templates" className="hover:text-sage-600">Templates</Link>
        )}
      </nav>

      <div className="flex items-center gap-3">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleToggle}
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-600 transition-colors hover:bg-sand-100"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-clay-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-sand-200 bg-white shadow-[0_12px_40px_-8px_rgba(41,74,65,0.2)]">
              <div className="border-b border-sand-100 px-4 py-3 text-sm font-semibold text-ink-900">
                Notifications
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loading && (
                  <p className="px-4 py-6 text-center text-sm text-ink-400">Loading…</p>
                )}
                {!loading && notifications.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-ink-400">No notifications yet</p>
                )}
                {!loading && notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`block w-full border-b border-sand-100 px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-sand-50 ${
                      n.is_read ? 'text-ink-500' : 'text-ink-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{n.title}</span>
                      {!n.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sage-500" />}
                    </div>
                    {n.message && <p className="mt-0.5 text-xs text-ink-400">{n.message}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand-100 text-ink-600 hover:bg-sand-200"
          aria-label="Account"
          title={user?.fullName ?? 'Account'}
        >
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
