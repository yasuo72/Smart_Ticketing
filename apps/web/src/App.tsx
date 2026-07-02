import { useEffect, useState } from 'react';
import { apiFetch } from './lib/api';
import type { AuthUser, NavView } from './lib/types';
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
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: '#f1f5f9' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex size-12 items-center justify-center rounded-2xl shadow-lg"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            <svg className="size-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Resolve which page to show
  function renderPage() {
    if (!currentUser) return null;
    switch (activeView) {
      case 'dashboard':
        return currentUser.role === 'CUSTOMER' ? (
          <TicketsPage user={currentUser} />
        ) : (
          <DashboardPage />
        );
      case 'tickets':
        return <TicketsPage user={currentUser} />;
      case 'users':
        return currentUser.role === 'ADMIN' ? <AdminPage /> : <TicketsPage user={currentUser} />;
      case 'settings':
        return <SettingsPage user={currentUser} />;
      default:
        return <TicketsPage user={currentUser} />;
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
      />

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">{renderPage()}</main>
    </div>
  );
}
