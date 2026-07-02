import { useState } from 'react';
import {
  Bell,
  Bot,
  Database,
  Globe,
  Key,
  Mail,
  Moon,
  Palette,
  Save,
  Shield,
  Sun,
  User,
  Zap,
} from 'lucide-react';
import { apiUrl } from '../../lib/api';
import type { AuthUser } from '../../lib/types';
import { getInitials } from '../../lib/utils';
import { Header } from '../layout/Header';

type SettingSection = 'profile' | 'notifications' | 'appearance' | 'security' | 'api';

export function SettingsPage({ user }: { user: AuthUser }) {
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');
  const [name, setName] = useState(user.name);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [browserNotifs, setBrowserNotifs] = useState(false);

  const sections: { id: SettingSection; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API & Integrations', icon: Key },
  ];

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header view="settings" />

      <div className="flex flex-1 overflow-hidden">
        {/* Settings sidebar */}
        <nav className="w-52 shrink-0 border-r border-slate-200 bg-white overflow-y-auto p-3 space-y-1">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition cursor-pointer ${
                  activeSection === s.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Settings content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* PROFILE */}
          {activeSection === 'profile' && (
            <div className="max-w-lg space-y-6 animate-fade-in">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Profile Settings</h2>
                <p className="mt-1 text-sm text-slate-500">Update your personal information.</p>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div
                  className="flex size-16 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-md"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                >
                  {getInitials(user.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <span className="mt-1 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-400 outline-none cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-slate-400">Email cannot be changed from the frontend.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                  <div className="h-10 rounded-lg border border-slate-200 bg-slate-100 px-3 flex items-center text-sm text-slate-500">
                    {user.role}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Role is managed by administrators.</p>
                </div>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 cursor-pointer"
                  style={{ background: saved ? '#10b981' : '#6366f1' }}
                >
                  <Save className="size-4" />
                  {saved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div className="max-w-lg space-y-6 animate-fade-in">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Notification Preferences</h2>
                <p className="mt-1 text-sm text-slate-500">Choose how you want to be notified.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                {[
                  { icon: Mail, label: 'Email Notifications', desc: 'Receive ticket updates via email', state: emailNotifs, set: setEmailNotifs },
                  { icon: Bell, label: 'Browser Notifications', desc: 'Show desktop push notifications', state: browserNotifs, set: setBrowserNotifs },
                ].map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.label} className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex size-9 items-center justify-center rounded-lg bg-slate-100">
                          <Icon className="size-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{n.label}</p>
                          <p className="text-xs text-slate-500">{n.desc}</p>
                        </div>
                      </div>
                      <div
                        onClick={() => n.set((p) => !p)}
                        className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors shrink-0 ${n.state ? 'bg-indigo-500' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${n.state ? 'translate-x-5' : 'translate-x-1'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* APPEARANCE */}
          {activeSection === 'appearance' && (
            <div className="max-w-lg space-y-6 animate-fade-in">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Appearance</h2>
                <p className="mt-1 text-sm text-slate-500">Customize how the interface looks.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-800 mb-3">Theme</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['light', 'dark'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition cursor-pointer ${
                        theme === t ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {t === 'light' ? <Sun className="size-6 text-amber-500" /> : <Moon className="size-6 text-indigo-500" />}
                      <span className="text-sm font-medium text-slate-700 capitalize">{t}</span>
                      {theme === t && <span className="text-xs text-indigo-600 font-medium">Active</span>}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-400">Full dark mode coming in a future release.</p>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeSection === 'security' && (
            <div className="max-w-lg space-y-6 animate-fade-in">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Security</h2>
                <p className="mt-1 text-sm text-slate-500">Manage your account security settings.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
                  <input type="password" placeholder="••••••••" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                  <input type="password" placeholder="••••••••" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
                  <input type="password" placeholder="••••••••" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-700">Password changes require a backend API endpoint (not yet implemented). These fields are for UI demonstration.</p>
                </div>
                <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 cursor-pointer" style={{ background: '#6366f1' }}>
                  <Shield className="size-4" />
                  Update Password
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Session Info</h3>
                <p className="text-xs text-slate-500 mb-3">Your current session details.</p>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between"><span className="text-slate-400">User ID</span><span className="font-mono">{user.id.slice(0, 16)}...</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Account Status</span><span className="text-emerald-600 font-medium">{user.isActive ? 'Active' : 'Inactive'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Role</span><span>{user.role}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* API & INTEGRATIONS */}
          {activeSection === 'api' && (
            <div className="max-w-lg space-y-6 animate-fade-in">
              <div>
                <h2 className="text-base font-semibold text-slate-900">API & Integrations</h2>
                <p className="mt-1 text-sm text-slate-500">System configuration and external services.</p>
              </div>

              {[
                {
                  icon: Globe,
                  title: 'API Endpoint',
                  color: '#3b82f6',
                  items: [{ label: 'Base URL', value: apiUrl }],
                },
                {
                  icon: Bot,
                  title: 'AI Provider',
                  color: '#6366f1',
                  items: [
                    { label: 'Provider', value: 'Groq (OpenAI-compatible)' },
                    { label: 'Model', value: 'llama-3.3-70b-versatile' },
                    { label: 'Status', value: 'Active' },
                  ],
                },
                {
                  icon: Mail,
                  title: 'Email Service',
                  color: '#10b981',
                  items: [
                    { label: 'Provider', value: 'Resend' },
                    { label: 'From', value: 'support@rohitis.online' },
                    { label: 'Inbound webhook', value: '/api/email/inbound/resend' },
                  ],
                },
                {
                  icon: Database,
                  title: 'Database',
                  color: '#f59e0b',
                  items: [
                    { label: 'Type', value: 'PostgreSQL (Railway)' },
                    { label: 'ORM', value: 'Prisma' },
                    { label: 'Migrations', value: 'Auto-deploy on start' },
                  ],
                },
                {
                  icon: Zap,
                  title: 'Deployment',
                  color: '#8b5cf6',
                  items: [
                    { label: 'Backend', value: 'Railway' },
                    { label: 'Frontend', value: 'Vercel / Railway' },
                    { label: 'CI/CD', value: 'GitHub Actions' },
                  ],
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="flex size-8 items-center justify-center rounded-lg" style={{ background: card.color + '15' }}>
                        <Icon className="size-4" style={{ color: card.color }} />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800">{card.title}</h3>
                    </div>
                    <div className="space-y-2">
                      {card.items.map((item) => (
                        <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="font-mono text-slate-700 break-all text-right">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
