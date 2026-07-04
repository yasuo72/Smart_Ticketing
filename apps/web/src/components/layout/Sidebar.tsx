import { Bot, Cpu, LayoutDashboard, LifeBuoy, LogOut, Settings, Ticket, Users } from 'lucide-react';
import type { AuthUser, NavView } from '../../lib/types';
import { cn, getInitials } from '../../lib/utils';

type NavItem = {
  id: NavView;
  label: string;
  icon: React.ElementType;
  roles: Array<'CUSTOMER' | 'AGENT' | 'ADMIN'>;
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['AGENT', 'ADMIN'] },
  { id: 'tickets', label: 'Tickets', icon: Ticket, roles: ['CUSTOMER', 'AGENT', 'ADMIN'] },
  { id: 'users', label: 'Users', icon: Users, roles: ['ADMIN'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['CUSTOMER', 'AGENT', 'ADMIN'] },
];

type Props = {
  user: AuthUser;
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
};

export function Sidebar({
  user,
  activeView,
  onNavigate,
  onLogout,
  isOpenMobile = false,
  onCloseMobile,
}: Props) {
  const visibleNav = navItems.filter((item) => item.roles.includes(user.role));

  const handleNavClick = (view: NavView) => {
    onNavigate(view);
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'flex flex-col h-full w-64 shrink-0 z-50 transition-transform duration-200 ease-in-out',
          'fixed inset-y-0 left-0 md:static',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
        style={{ background: '#0f1117', borderRight: '1px solid #1f2333' }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 py-5"
          style={{ borderBottom: '1px solid #1f2333' }}
        >
          <div
            className="flex size-9 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            <LifeBuoy className="size-5 text-white" />
          </div>
          <div>
            <p
              className="text-sm font-semibold text-white"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              AI Ticketing
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span className="text-xs" style={{ color: '#64748b' }}>
                Production
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4 space-y-1">
          <p
            className="px-3 mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#475569' }}
          >
            Navigation
          </p>
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer',
                  isActive
                    ? 'nav-active text-white'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
                )}
              >
                <Icon
                  className={cn('size-4 shrink-0', isActive ? 'text-indigo-400' : 'text-slate-500')}
                />
                {item.label}
                {isActive && <span className="ml-auto size-1.5 rounded-full bg-indigo-400" />}
              </button>
            );
          })}

          {/* AI section divider */}
          <div className="pt-4 pb-1">
            <p
              className="px-3 mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: '#475569' }}
            >
              AI Features
            </p>
            <div
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm"
              style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.15)',
              }}
            >
              <Bot className="size-4 shrink-0 text-indigo-400" />
              <div>
                <p className="text-xs font-medium text-slate-300">Groq AI Active</p>
                <p className="text-xs" style={{ color: '#475569' }}>
                  llama-3.3-70b
                </p>
              </div>
              <Cpu className="ml-auto size-3 text-indigo-400" />
            </div>
          </div>
        </nav>

        {/* Stats strip */}
        <div
          className="px-3 py-3 mx-3 mb-3 rounded-lg"
          style={{ background: '#1a1d27', border: '1px solid #1f2333' }}
        >
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Open', color: '#60a5fa' },
              { label: 'In Progress', color: '#f59e0b' },
              { label: 'Resolved', color: '#34d399' },
            ].map((s) => (
              <div key={s.label}>
                <div
                  className="size-1.5 rounded-full mx-auto mb-1"
                  style={{ background: s.color }}
                />
                <p className="text-xs" style={{ color: '#475569' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* User footer */}
        <div className="px-3 pb-4" style={{ borderTop: '1px solid #1f2333', paddingTop: '12px' }}>
          <div
            className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            style={{ background: '#1a1d27' }}
          >
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
            >
              {getInitials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs" style={{ color: '#475569' }}>
                {user.role}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="shrink-0 rounded-md p-1.5 text-slate-500 transition hover:bg-slate-700 hover:text-slate-300 cursor-pointer"
              title="Sign out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
