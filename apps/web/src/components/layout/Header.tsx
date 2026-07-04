import { useState } from 'react';
import {
  Bell,
  Check,
  CheckCircle2,
  Copy,
  Info,
  Mail,
  Menu,
  Moon,
  RefreshCw,
  Search,
  Sun,
  X,
} from 'lucide-react';
import type { NavView } from '../../lib/types';
import { labelFromKey } from '../../lib/utils';
import { applyTheme, getInitialTheme, type ThemeMode } from '../../lib/theme';

const viewDescriptions: Record<NavView, string> = {
  dashboard: 'Overview of support operations and key metrics',
  tickets: 'Manage and respond to customer support requests',
  users: 'Manage team members, roles, and account access',
  settings: 'Account preferences and system configuration',
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'info' | 'success';
};

const initialNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'AI Support Active',
    message: 'Llama 3.3 model is processing ticket classification.',
    time: 'Just now',
    unread: true,
    type: 'info',
  },
  {
    id: 'n2',
    title: 'Ticket Auto-Resolved',
    message: 'Ticket #mvn9540s password reset instructions sent.',
    time: '5m ago',
    unread: true,
    type: 'success',
  },
  {
    id: 'n3',
    title: 'System Operational',
    message: 'All API and database services operating at peak health.',
    time: '1h ago',
    unread: false,
    type: 'info',
  },
];

type Props = {
  view: NavView;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onToggleMobileMenu?: () => void;
  isCustomer?: boolean;
};

export function Header({ view, onRefresh, isRefreshing, onToggleMobileMenu, isCustomer }: Props) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  const handleCopyEmail = () => {
    void navigator.clipboard.writeText('support@rohitis.online');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="flex flex-col shrink-0">
      {/* Animated Customer Support Banner (Only for User/Customer Side) */}
      {isCustomer && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-600 to-purple-800 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-between overflow-hidden shadow-inner border-b border-indigo-500/30">
          <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
            <span className="flex items-center gap-1 bg-indigo-500/40 text-indigo-100 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase shrink-0 border border-indigo-400/30">
              <Mail className="size-3 text-indigo-200" />
              24/7 SUPPORT
            </span>
            <div className="overflow-hidden flex-1 relative h-4">
              <div className="animate-marquee font-mono text-indigo-100 flex items-center gap-4">
                <span>
                  ✉️ Need direct assistance? Contact our support desk at{' '}
                  <strong className="text-white underline font-semibold">support@rohitis.online</strong>{' '}
                  for instant ticket creation!
                </span>
                <span>•</span>
                <span>Fast AI-Assisted Resolution • Response within minutes</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleCopyEmail}
            className="ml-3 shrink-0 flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer border border-white/20"
            title="Copy email to clipboard"
          >
            {copiedEmail ? <Check className="size-3 text-emerald-300" /> : <Copy className="size-3" />}
            {copiedEmail ? 'Copied!' : 'Copy Email'}
          </button>
        </div>
      )}

      {/* Main Header Bar */}
      <header
        className="flex items-center justify-between px-4 sm:px-6 py-3.5 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors"
        style={{ minHeight: '65px' }}
      >
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden flex size-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shrink-0"
              title="Open navigation menu"
            >
              <Menu className="size-5" />
            </button>
          )}
          <div>
            <h1
              className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {labelFromKey(view)}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
              {viewDescriptions[view]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search bar */}
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Quick search..."
              className="h-9 w-48 lg:w-56 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 text-sm text-slate-700 dark:text-slate-200 outline-none transition focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900"
            />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-slate-600" />}
          </button>

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {/* Notification bell button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications((p) => !p)}
              className="relative flex size-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              title="Notifications"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl animate-fade-in p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1.5 divide-y divide-slate-50 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No notifications</p>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-lg flex items-start justify-between gap-2 text-xs transition ${
                          item.unread
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/30'
                            : 'bg-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          {item.type === 'success' ? (
                            <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <Info className="size-4 text-indigo-500 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {item.title}
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                              {item.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {item.time}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeNotification(item.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
