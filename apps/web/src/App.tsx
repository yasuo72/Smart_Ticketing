import { useEffect, useState } from 'react';
import { apiFetch } from './lib/api';
import type { AuthUser, NavView } from './lib/types';
import { applyTheme, getInitialTheme } from './lib/theme';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { TicketsPage } from './components/tickets/TicketsPage';
import { AdminPage } from './components/admin/AdminPage';
import { SettingsPage } from './components/settings/SettingsPage';

export function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [activeView, setActiveView] = useState<NavView>('tickets');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Apply saved theme on mount
  useEffect(() => {
    applyTheme(getInitialTheme());
  }, []);

  // Restore session on mount
  useEffect(() => {
    async function loadSession() {
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const data = (await res.json()) as { user: AuthUser | null };
        if (data.user) {
          setCurrentUser(data.user);
          // default view based on role
          setActiveView(data.user.role === 'CUSTOMER' ? 'tickets' : 'dashboard');
        }
      }
      setSessionChecked(true);
    }
    void loadSession();
  }, []);

  async function handleLogout() {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    setActiveView('tickets');
  }

  function handleLogin(user: AuthUser) {
    setCurrentUser(user);
    setActiveView(user.role === 'CUSTOMER' ? 'tickets' : 'dashboard');
  }

  // Loading skeleton
  if (!sessionChecked) {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        {/* Mock Sidebar Skeleton */}
        <aside className="flex flex-col h-full w-64 shrink-0 bg-[#0f1117] border-r border-[#1f2333]">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1f2333]">
            <div className="size-9 rounded-xl bg-slate-800 shimmer" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-24 bg-slate-800 rounded shimmer" />
              <div className="h-2 w-16 bg-slate-800 rounded shimmer" />
            </div>
          </div>
          <div className="flex-1 px-3 py-4 space-y-4">
            <div className="space-y-2">
              <div className="h-2 w-16 bg-slate-800 rounded shimmer ml-3 mb-2" />
              <div className="h-9 w-full bg-slate-800/50 rounded-lg shimmer" />
              <div className="h-9 w-full bg-slate-800/50 rounded-lg shimmer" />
              <div className="h-9 w-full bg-slate-800/50 rounded-lg shimmer" />
            </div>
          </div>
        </aside>

        {/* Mock Content Skeleton */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Skeleton */}
          <header
            className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200"
            style={{ minHeight: '65px' }}
          >
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-slate-200 rounded shimmer" />
              <div className="h-3 w-48 bg-slate-200 rounded shimmer" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-32 bg-slate-200 rounded-lg shimmer hidden md:block" />
              <div className="size-9 bg-slate-200 rounded-lg shimmer" />
            </div>
          </header>

          {/* Main workspace area skeleton */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="h-3.5 w-24 bg-slate-200 rounded shimmer" />
                <div className="h-8 w-16 bg-slate-200 rounded shimmer" />
              </div>
              <div className="h-32 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="h-3.5 w-24 bg-slate-200 rounded shimmer" />
                <div className="h-8 w-16 bg-slate-200 rounded shimmer" />
              </div>
              <div className="h-32 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="h-3.5 w-24 bg-slate-200 rounded shimmer" />
                <div className="h-8 w-16 bg-slate-200 rounded shimmer" />
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="h-4 w-48 bg-slate-200 rounded shimmer" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-100/50 rounded shimmer" />
                <div className="h-3 w-5/6 bg-slate-100/50 rounded shimmer" />
                <div className="h-3 w-4/6 bg-slate-100/50 rounded shimmer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const handleToggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const isCustomer = currentUser?.role === 'CUSTOMER';

  // Resolve which page to show
  function renderPage() {
    if (!currentUser) return null;
    switch (activeView) {
      case 'dashboard':
        return isCustomer ? (
          <TicketsPage
            user={currentUser}
            onToggleMobileMenu={handleToggleMobileMenu}
            isCustomer={isCustomer}
          />
        ) : (
          <DashboardPage onToggleMobileMenu={handleToggleMobileMenu} />
        );
      case 'tickets':
        return (
          <TicketsPage
            user={currentUser}
            onToggleMobileMenu={handleToggleMobileMenu}
            isCustomer={isCustomer}
          />
        );
      case 'users':
        return currentUser.role === 'ADMIN' ? (
          <AdminPage onToggleMobileMenu={handleToggleMobileMenu} />
        ) : (
          <TicketsPage
            user={currentUser}
            onToggleMobileMenu={handleToggleMobileMenu}
            isCustomer={isCustomer}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            user={currentUser}
            onToggleMobileMenu={handleToggleMobileMenu}
            isCustomer={isCustomer}
          />
        );
      default:
        return (
          <TicketsPage
            user={currentUser}
            onToggleMobileMenu={handleToggleMobileMenu}
            isCustomer={isCustomer}
          />
        );
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f1f5f9' }}>
      {/* Sidebar */}
      <Sidebar
        user={currentUser}
        activeView={activeView}
        onNavigate={setActiveView}
        onLogout={handleLogout}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden min-w-0">{renderPage()}</main>
    </div>
  );
}
