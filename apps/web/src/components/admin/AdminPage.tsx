import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  ChevronDown,
  Eye,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Tag,
  Ticket,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { AuthUser, Priority, Role, TicketStatus } from '../../lib/types';
import { cn, formatFullDate, formatRelativeTime, getInitials } from '../../lib/utils';
import { Header } from '../layout/Header';
import { StatusBadge } from '../tickets/StatusBadge';
import { PriorityBadge } from '../tickets/PriorityBadge';

// ── Types ──────────────────────────────────────────────────────────────────
type AdminTicket = {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  category: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: string; name: string; email: string };
  agent: { id: string; name: string; email: string } | null;
  _count: { replies: number };
};

type Tab = 'users' | 'tickets';

const roleBadge: Record<Role, { bg: string; text: string; border: string }> = {
  ADMIN: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  AGENT: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  CUSTOMER: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
};

// ── Create Staff Modal ─────────────────────────────────────────────────────
function CreateStaffModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (user: AuthUser) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'AGENT' | 'ADMIN'>('AGENT');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstInput = useRef<HTMLInputElement>(null);

  useEffect(() => { firstInput.current?.focus(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const res = await apiFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = (await res.json().catch(() => ({}))) as { user?: AuthUser; error?: string };
    setIsSubmitting(false);

    if (!res.ok || !data.user) {
      setError(data.error ?? 'Could not create account.');
      return;
    }

    onCreated(data.user);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl animate-scale-in">
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <UserPlus className="size-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Create Staff Account</h2>
              <p className="text-xs text-slate-500">Add a new agent or admin to the workspace</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['AGENT', 'ADMIN'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition cursor-pointer',
                    role === r
                      ? r === 'AGENT'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-red-400 bg-red-50 text-red-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300',
                  )}
                >
                  {r === 'AGENT' ? <UserCog className="size-4" /> : <Shield className="size-4" />}
                  {r === 'AGENT' ? 'Agent' : 'Admin'}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input
              ref={firstInput}
              required
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <input
              required
              type="email"
              placeholder="jane@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Temporary Password</label>
            <input
              required
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <p className="mt-1 text-xs text-slate-400">Share this password securely with the new {role.toLowerCase()}.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-10 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 cursor-pointer"
              style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
            >
              {isSubmitting ? 'Creating...' : `Create ${role === 'AGENT' ? 'Agent' : 'Admin'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Confirm Delete Modal ───────────────────────────────────────────────────
function ConfirmDeleteModal({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  isDangerous,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isDangerous?: boolean;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl animate-scale-in">
        <div className="p-6 text-center">
          <div className={cn('mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl', isDangerous ? 'bg-red-100' : 'bg-amber-100')}>
            <AlertTriangle className={cn('size-7', isDangerous ? 'text-red-600' : 'text-amber-600')} />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2">{title}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
        </div>
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer">
            Cancel
          </button>
          <button
            onClick={() => void handleConfirm()}
            disabled={isDeleting}
            className="flex-1 h-10 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 cursor-pointer"
            style={{ background: isDangerous ? '#ef4444' : '#f59e0b' }}
          >
            {isDeleting ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main AdminPage ─────────────────────────────────────────────────────────
export function AdminPage() {
  const [tab, setTab] = useState<Tab>('users');

  // Users state
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'true' | 'false'>('ALL');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userError, setUserError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteUser, setDeleteUser] = useState<AuthUser | null>(null);

  // Tickets state
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('ALL');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState('ALL');
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [deleteTicket, setDeleteTicket] = useState<AdminTicket | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  useEffect(() => { void loadUsers(); }, []);
  useEffect(() => { if (tab === 'tickets') void loadTickets(); }, [tab]);

  // ── Users API ──────────────────────────────────────────
  async function loadUsers() {
    setIsLoadingUsers(true); setUserError('');
    const params = new URLSearchParams();
    if (userSearch.trim()) params.set('search', userSearch.trim());
    if (roleFilter !== 'ALL') params.set('role', roleFilter);
    if (activeFilter !== 'ALL') params.set('active', activeFilter);
    const res = await apiFetch(`/api/admin/users?${params}`);
    setIsLoadingUsers(false);
    if (!res.ok) { setUserError('Could not load users.'); return; }
    const data = (await res.json()) as { users: AuthUser[] };
    setUsers(data.users);
  }

  async function updateUser(id: string, patch: Partial<Pick<AuthUser, 'role' | 'isActive'>>) {
    const res = await apiFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    if (!res.ok) { setUserError('Could not update user.'); return; }
    const data = (await res.json()) as { user: AuthUser };
    setUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
  }

  async function confirmDeactivateUser() {
    if (!deleteUser) return;
    const res = await apiFetch(`/api/admin/users/${deleteUser.id}`, { method: 'DELETE' });
    if (!res.ok) { setUserError('Could not deactivate user.'); return; }
    const data = (await res.json()) as { user: AuthUser };
    setUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
  }

  // ── Tickets API ────────────────────────────────────────
  async function loadTickets() {
    setIsLoadingTickets(true); setTicketError('');
    const params = new URLSearchParams();
    if (ticketStatusFilter !== 'ALL') params.set('status', ticketStatusFilter);
    if (ticketPriorityFilter !== 'ALL') params.set('priority', ticketPriorityFilter);
    if (ticketSearch.trim()) params.set('search', ticketSearch.trim());
    const res = await apiFetch(`/api/admin/tickets?${params}`);
    setIsLoadingTickets(false);
    if (!res.ok) { setTicketError('Could not load tickets.'); return; }
    const data = (await res.json()) as { tickets: AdminTicket[] };
    setTickets(data.tickets);
  }

  async function confirmDeleteTicket() {
    if (!deleteTicket) return;
    const res = await apiFetch(`/api/admin/tickets/${deleteTicket.id}`, { method: 'DELETE' });
    if (!res.ok) { setTicketError('Could not delete ticket.'); return; }
    setTickets((prev) => prev.filter((t) => t.id !== deleteTicket.id));
  }

  // ── Stats ──────────────────────────────────────────────
  const activeCount = users.filter((u) => u.isActive).length;
  const agentCount = users.filter((u) => u.role === 'AGENT').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;

  const filteredTickets = tickets.filter((t) =>
    !ticketSearch.trim() || t.subject.toLowerCase().includes(ticketSearch.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header view="users" onRefresh={tab === 'users' ? loadUsers : loadTickets} isRefreshing={isLoadingUsers || isLoadingTickets} />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Stats row */}
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
                <p className="mt-2 text-2xl font-bold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            {/* Tab buttons */}
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {([
                { id: 'users' as Tab, icon: Users, label: 'Users' },
                { id: 'tickets' as Tab, icon: Ticket, label: 'Tickets' },
              ] as const).map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition cursor-pointer',
                      tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                    )}
                  >
                    <Icon className="size-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Tab-level actions */}
            {tab === 'users' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 cursor-pointer"
                style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
              >
                <Plus className="size-4" />
                Create Staff Account
              </button>
            )}
            {tab === 'tickets' && (
              <button
                onClick={loadTickets}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${isLoadingTickets ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
          </div>

          {/* ── USERS TAB ───────────────────────────────────────── */}
          {tab === 'users' && (
            <>
              {/* Filters toolbar */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-50 bg-slate-50 px-5 py-3">
                <div className="relative flex-1 min-w-40">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void loadUsers()}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                  />
                </div>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-400">
                  <option value="ALL">All Roles</option>
                  <option value="CUSTOMER">Customer</option>
                  <option value="AGENT">Agent</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-400">
                  <option value="ALL">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <button onClick={loadUsers} className="flex items-center gap-1.5 h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer">
                  <Search className="size-3.5" /> Search
                </button>
              </div>

              {userError && <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{userError}</div>}

              {/* Users table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Joined</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map((u) => {
                      const rb = roleBadge[u.role];
                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
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
                              className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer transition', rb.bg, rb.text, rb.border)}
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
                              className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold outline-none cursor-pointer', u.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200')}
                            >
                              <option value="true">● Active</option>
                              <option value="false">○ Inactive</option>
                            </select>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500">{formatRelativeTime(u.createdAt)}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              {u.isActive ? (
                                <button
                                  onClick={() => setDeleteUser(u)}
                                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 cursor-pointer"
                                >
                                  <Ban className="size-3.5" />
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() => void updateUser(u.id, { isActive: true })}
                                  className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 cursor-pointer"
                                >
                                  <CheckCircle className="size-3.5" />
                                  Reactivate
                                </button>
                              )}
                            </div>
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
                  <p className="text-sm text-slate-400">{isLoadingUsers ? 'Loading users...' : 'No users found.'}</p>
                </div>
              )}

              {users.length > 0 && (
                <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 flex items-center justify-between">
                  <p className="text-xs text-slate-400">{users.length} user{users.length !== 1 ? 's' : ''}</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Add staff member
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── TICKETS TAB ─────────────────────────────────────── */}
          {tab === 'tickets' && (
            <>
              {/* Filter toolbar */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-50 bg-slate-50 px-5 py-3">
                <div className="relative flex-1 min-w-40">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search tickets..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                  />
                </div>
                <select value={ticketStatusFilter} onChange={(e) => setTicketStatusFilter(e.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-400">
                  <option value="ALL">All Status</option>
                  {['OPEN', 'IN_PROGRESS', 'AUTO_RESOLVED', 'RESOLVED', 'CLOSED'].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <select value={ticketPriorityFilter} onChange={(e) => setTicketPriorityFilter(e.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-400">
                  <option value="ALL">All Priority</option>
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <button onClick={loadTickets} className="flex items-center gap-1.5 h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer">
                  <Search className="size-3.5" /> Filter
                </button>
              </div>

              {ticketError && <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{ticketError}</div>}

              {/* Tickets table */}
              <div className="divide-y divide-slate-50">
                {filteredTickets.map((ticket) => {
                  const isExpanded = expandedTicketId === ticket.id;
                  return (
                    <div key={ticket.id} className="group">
                      <div
                        className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                      >
                        {/* Expand chevron */}
                        <ChevronDown className={cn('size-4 mt-0.5 text-slate-400 transition-transform shrink-0', isExpanded && 'rotate-180')} />

                        {/* Customer avatar */}
                        <div
                          className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}
                        >
                          {getInitials(ticket.customer.name)}
                        </div>

                        {/* Main info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{ticket.subject}</p>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">
                                {ticket.customer.name} ({ticket.customer.email})
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <StatusBadge status={ticket.status} />
                              <PriorityBadge priority={ticket.priority} />
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                            {ticket.category && (
                              <span className="flex items-center gap-1"><Tag className="size-3" />{ticket.category}</span>
                            )}
                            <span className="flex items-center gap-1"><MessageSquare className="size-3" />{ticket._count.replies} replies</span>
                            <span className="flex items-center gap-1"><Eye className="size-3" />
                              {ticket.agent ? `Assigned: ${ticket.agent.name}` : 'Unassigned'}
                            </span>
                            <span>{formatFullDate(ticket.createdAt)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setDeleteTicket(ticket)}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Expanded row: description */}
                      {isExpanded && (
                        <div className="border-t border-slate-50 bg-slate-50 px-16 py-4 animate-fade-in">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                          <div className="mt-3 flex gap-2">
                            <span className="text-xs text-slate-400">
                              ID: <span className="font-mono text-slate-600">{ticket.id}</span>
                            </span>
                            <span className="text-xs text-slate-400">
                              Updated: {formatRelativeTime(ticket.updatedAt)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredTickets.length === 0 && (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Ticket className="size-8 text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">{isLoadingTickets ? 'Loading tickets...' : 'No tickets found.'}</p>
                  </div>
                )}
              </div>

              {filteredTickets.length > 0 && (
                <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
                  <p className="text-xs text-slate-400">{filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}
      {showCreateModal && (
        <CreateStaffModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(user) => setUsers((prev) => [user, ...prev])}
        />
      )}

      {deleteUser && (
        <ConfirmDeleteModal
          title="Deactivate Account"
          description={`Are you sure you want to deactivate ${deleteUser.name}'s account? They will no longer be able to log in. Their tickets and history are preserved.`}
          confirmLabel="Deactivate"
          onConfirm={confirmDeactivateUser}
          onClose={() => setDeleteUser(null)}
        />
      )}

      {deleteTicket && (
        <ConfirmDeleteModal
          title="Permanently Delete Ticket"
          description={`This will permanently delete "${deleteTicket.subject}" and all its replies and audit history. This action cannot be undone.`}
          confirmLabel="Delete Permanently"
          onConfirm={confirmDeleteTicket}
          onClose={() => setDeleteTicket(null)}
          isDangerous
        />
      )}
    </div>
  );
}
