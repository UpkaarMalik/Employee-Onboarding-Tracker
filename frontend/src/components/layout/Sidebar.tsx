import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, StickyNote, BookOpen, Building2, Images,
  Gift, MessageSquareHeart, HelpCircle, Users2, LayoutTemplate, ListChecks,
  BarChart3, ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR'];

const MAIN_ITEMS = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/checklist', label: 'Checklist', icon: ClipboardList },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/resources', label: 'Resources', icon: BookOpen },
  { to: '/company', label: 'Company', icon: Building2 },
  { to: '/gallery', label: 'Gallery', icon: Images },
  { to: '/entitlements', label: 'Benefits', icon: Gift },
  { to: '/community', label: 'Community', icon: Users2 },
  { to: '/feedback', label: 'Feedback', icon: MessageSquareHeart },
  { to: '/faq', label: 'FAQ', icon: HelpCircle },
];

const ADMIN_ITEMS = [
  { to: '/admin/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/admin/onboardings', label: 'Onboardings', icon: ListChecks },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/audit-log', label: 'Audit Log', icon: ShieldAlert },
];

function NavLink({ to, label, icon: Icon, onNavigate }: { to: string; label: string; icon: typeof LayoutDashboard; onNavigate?: () => void }) {
  const location = useLocation();
  const active = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
        active
          ? 'bg-orange-500 text-white shadow-[0_6px_18px_-4px_rgba(238,143,46,0.6)]'
          : 'text-white/65 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon size={17} />
      {label}
    </Link>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const isStaff = !!user && STAFF_ROLES.includes(user.role);

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-sm lg:hidden"
          aria-hidden
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-6 overflow-y-auto bg-navy-900 px-4 py-6 transition-transform duration-300 lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2 px-2 text-lg font-bold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2 3 7l9 5 9-5-9-5z" />
              <path d="M3 12l9 5 9-5" />
            </svg>
          </span>
          Onboarding
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          <p className="px-3.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/35">Main</p>
          {MAIN_ITEMS.map((item) => <NavLink key={item.to} {...item} onNavigate={onClose} />)}

          {isStaff && (
            <>
              <p className="mt-4 px-3.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/35">Admin</p>
              {ADMIN_ITEMS.map((item) => <NavLink key={item.to} {...item} onNavigate={onClose} />)}
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
