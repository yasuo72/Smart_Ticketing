import { useEffect, useState } from 'react';
import {
  Ban,
  CheckCircle,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserCog,
  Users,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { AuthUser, Role } from '../../lib/types';
import { cn, formatRelativeTime, getInitials } from '../../lib/utils';
import { Header } from '../layout/Header';

const roleBadge: Record<Role, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  AGENT: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  CUSTOMER: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

export function AdminPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'true' | 'false'>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { void loadUsers(); }, []);

  async function loadUsers() {
    setIsLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (roleFilter !== 'ALL') params.set('role', roleFilter);
    if (activeFilter !== 'ALL') params.set('active', activeFilter);
    const res = await apiFetch(`/api/admin/users?${params}`);
    setIsLoading(false);
    if (!res.ok) { setError('Could not load users.'); return; }
    const data = (await res.json()) as { users: AuthUser[] };
    setUsers(data.users);
  }

  async function updateUser(id: string, patch: Partial<Pick<AuthUser, 'role' | 'isActive'>>) {
    const res = await apiFetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (!res.ok) { setError('Could not update user.'); return; }
    const data = (await res.json()) as { user: AuthUser };
    setUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
  }

  async function deactivateUser(id: string) {
    const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (!res.ok) { setError('Could not deactivate user.'); return; }
    const data = (await res.json()) as { user: AuthUser };
    setUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
  }

  const activeCount = users.filter((u) => u.isActive).length;
  const agentCount = users.filter((u) => u.role === 'AGENT').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header view="users" onRefresh={loadUsers} isRefreshing={isLoading} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Users', value: users.length, icon: Users, color: '#6366f1' },
            { label: 'Active', value: activeCount, icon: UserCheck, color: '#10b981' },
            { label: 'Agents', value: agentCount, icon: UserCog, color: '#f59e0b' },
            { label: 'Admins', value: adminCount, icon: Shield, color: '#ef4444' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm card-hover">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <div className="flex size-9 items-center justify-center rounded-lg" style={{ background: stat.color + '15' }}>
                    <Icon className="size-4" style={{ color: stat.color }} />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Users table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Table header toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2 flex-1">
              <UserCog className="size-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Team Members</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-44 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-400"
              >
                <option value="ALL">All Roles</option>
                <option value="CUSTOMER">Customer</option>
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-400"
              >
                <option value="ALL">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <button
                onClick={loadUsers}
                className="flex items-center gap-1.5 h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Search
              </button>
            </div>
          </div>

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => {
                  const rb = roleBadge[u.role];
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ background: u.role === 'ADMIN' ? 'linear-gradient(135deg,#ef4444,#dc2626)' : u.role === 'AGENT' ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}
                          >
                            {getInitials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">{u.name}</p>
                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => void updateUser(u.id, { role: e.target.value as Role })}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-xs font-medium outline-none cursor-pointer',
                            rb.bg, rb.text, rb.border,
                          )}
                        >
                          <option value="CUSTOMER">Customer</option>
                          <option value="AGENT">Agent</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          value={String(u.isActive)}
                          onChange={(e) => void updateUser(u.id, { isActive: e.target.value === 'true' })}
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-xs font-medium outline-none cursor-pointer',
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200',
                          )}
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        {formatRelativeTime(u.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {u.isActive ? (
                          <button
                            onClick={() => void deactivateUser(u.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 cursor-pointer"
                          >
                            <Ban className="size-3.5" />
                            Deactivate
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                            <CheckCircle className="size-3.5 text-emerald-400" />
                            Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <Users className="size-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">{isLoading ? 'Loading users...' : 'No users found.'}</p>
            </div>
          )}

          {users.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
              <p className="text-xs text-slate-400">{users.length} user{users.length !== 1 ? 's' : ''} total</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
