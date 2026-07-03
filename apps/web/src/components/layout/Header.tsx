import { Bell, Menu, RefreshCw, Search } from 'lucide-react';
import type { NavView } from '../../lib/types';
import { labelFromKey } from '../../lib/utils';

const viewDescriptions: Record<NavView, string> = {
  dashboard: 'Overview of support operations and key metrics',
  tickets: 'Manage and respond to customer support requests',
  users: 'Manage team members, roles, and account access',
  settings: 'Account preferences and system configuration',
};

type Props = {
  view: NavView;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onToggleMobileMenu?: () => void;
};

export function Header({ view, onRefresh, isRefreshing, onToggleMobileMenu }: Props) {
  return (
    <header
      className="flex items-center justify-between px-4 sm:px-6 py-3.5 shrink-0"
      style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', minHeight: '65px' }}
    >
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
            title="Open navigation menu"
          >
            <Menu className="size-5" />
          </button>
        )}
        <div>
          <h1
            className="text-base sm:text-lg font-semibold text-slate-900"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {labelFromKey(view)}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-1">
            {viewDescriptions[view]}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search bar */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Quick search..."
            className="h-9 w-52 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}

        {/* Notification bell */}
        <button className="relative flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 cursor-pointer">
          <Bell className="size-4" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-indigo-500" />
        </button>
      </div>
    </header>
  );
}
