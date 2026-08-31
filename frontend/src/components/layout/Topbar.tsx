import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Bell, ChevronDown, User, LogOut, UserCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { AppNotification, NotificationType } from '../../lib/types';

const UNREAD_POLL_MS = 30000;
const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR'];

const WORKSPACE_ITEMS = [
  { to: '/notes', label: 'Notes' },
  { to: '/resources', label: 'Resources' },
  { to: '/company', label: 'Company' },
  { to: '/entitlements', label: 'Benefits' },
  { to: '/feedback', label: 'Feedback' },
];

const ADMIN_ITEMS = [
  { to: '/admin/templates', label: 'Templates' },
  { to: '/admin/onboardings', label: 'Onboardings' },
  { to: '/reports', label: 'Reports' },
  { to: '/audit-log', label: 'Audit log' },
];

function deepLinkFor(type: NotificationType): string {
  switch (type) {
    case 'TASK_ASSIGNED':
    case 'TASK_WAITING':
    case 'ONBOARDING_STARTED':
      return '/checklist';
    case 'ONBOARDING_COMPLETED':
      return '/dashboard';
    default:
      return '/dashboard';
  }
}

function NavMenu({ label, items }: { label: string; items: { to: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isActiveGroup = items.some((i) => location.pathname.startsWith(i.to));

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 rounded-lg px-1 py-1.5 transition-colors hover:text-lavender-600 ${
          isActiveGroup ? 'text-lavender-600' : 'text-ink-700'
        }`}
      >
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-48 animate-fade-slide-up rounded-2xl border border-sand-200 bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(88,58,158,0.3)]">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-lavender-50 hover:text-lavender-700"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  const isStaff = !!user && STAFF_ROLES.includes(user.role);

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
    function onClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleBellToggle() {
    const next = !bellOpen;
    setBellOpen(next);
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
    setBellOpen(false);
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
      <nav className="flex items-center gap-6 text-sm font-medium text-ink-700">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-ink-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-lavender-500 to-sky-500 text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2 3 7l9 5 9-5-9-5z" />
              <path d="M3 12l9 5 9-5" />
            </svg>
          </span>
          Onboarding
        </Link>
        <Link to="/checklist" className="hover:text-lavender-600">Checklist</Link>
        <NavMenu label="Workspace" items={WORKSPACE_ITEMS} />
        {isStaff && <NavMenu label="Admin" items={ADMIN_ITEMS} />}
      </nav>

      <div className="flex items-center gap-2">
        <div className="relative" ref={bellRef}>
          <button
            onClick={handleBellToggle}
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

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 animate-fade-slide-up rounded-2xl border border-sand-200 bg-white shadow-[0_16px_40px_-8px_rgba(88,58,158,0.3)]">
              <div className="border-b border-sand-100 px-4 py-3 text-sm font-semibold text-ink-900">
                Notifications
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loading && <p className="px-4 py-6 text-center text-sm text-ink-400">Loading…</p>}
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

        <div className="relative" ref={accountRef}>
          <button
            onClick={() => setAccountOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand-100 text-ink-600 transition-colors hover:bg-lavender-100 hover:text-lavender-700"
            aria-label="Account"
          >
            <User size={18} />
          </button>
          {accountOpen && (
            <div className="absolute right-0 mt-2 w-48 animate-fade-slide-up rounded-2xl border border-sand-200 bg-white p-1.5 shadow-[0_16px_40px_-8px_rgba(88,58,158,0.3)]">
              <div className="px-3 py-2 text-xs text-ink-400">{user?.fullName}</div>
              <Link
                to="/profile"
                onClick={() => setAccountOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-lavender-50 hover:text-lavender-700"
              >
                <UserCircle2 size={15} /> Profile
              </Link>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-clay-600 transition-colors hover:bg-clay-50"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
