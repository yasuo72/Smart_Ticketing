import { useEffect, useState, type FormEvent } from 'react';
import {
  Bot,
  ChevronRight,
  Inbox,
  Lock,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  UserCog,
  X,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { AuthUser, Priority, Ticket, TicketStatus } from '../../lib/types';
import { cn, formatFullDate, formatRelativeTime, getInitials } from '../../lib/utils';
import { Header } from '../layout/Header';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

const statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'AUTO_RESOLVED', 'RESOLVED', 'CLOSED'];
const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const statusBorderColor: Record<TicketStatus, string> = {
  OPEN: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  AUTO_RESOLVED: '#8b5cf6',
  RESOLVED: '#10b981',
  CLOSED: '#94a3b8',
};

export function TicketsPage({ user }: { user: AuthUser }) {
  const isStaff = user.role === 'AGENT' || user.role === 'ADMIN';
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | Priority>('ALL');
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('MEDIUM');
  const [replyBody, setReplyBody] = useState('');
  const [polishedReply, setPolishedReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');

  const selected = tickets.find((t) => t.id === selectedId) ?? tickets[0] ?? null;

  const filtered = tickets.filter((t) => {
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  useEffect(() => { void loadTickets(); }, []);

  async function loadTickets() {
    setIsLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
    const res = await apiFetch(`/api/tickets?${params}`);
    setIsLoading(false);
    if (!res.ok) { setError('Could not load tickets.'); return; }
    const data = (await res.json()) as { tickets: Ticket[] };
    setTickets(data.tickets);
    setSelectedId((cur) => cur ?? data.tickets[0]?.id ?? null);
  }

  async function createTicket(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const res = await apiFetch('/api/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject, description, priority: newPriority }),
    });
    const data = (await res.json().catch(() => ({}))) as { ticket?: Ticket; error?: string };
    if (!res.ok || !data.ticket) { setError(data.error ?? 'Could not create ticket.'); return; }
    setTickets((prev) => [data.ticket!, ...prev]);
    setSelectedId(data.ticket.id);
    setSubject(''); setDescription(''); setNewPriority('MEDIUM');
    setShowCreateForm(false);
  }

  async function updateTicket(id: string, patch: Partial<Ticket> & { assignToMe?: boolean }) {
    const res = await apiFetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    const data = (await res.json().catch(() => ({}))) as { ticket?: Ticket; error?: string };
    if (!res.ok || !data.ticket) { setError(data.error ?? 'Could not update ticket.'); return; }
    replace(data.ticket);
  }

  async function createReply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const res = await apiFetch(`/api/tickets/${selected.id}/replies`, {
      method: 'POST',
      body: JSON.stringify({ body: replyBody, isInternal }),
    });
    const data = (await res.json().catch(() => ({}))) as { ticket?: Ticket; error?: string };
    if (!res.ok || !data.ticket) { setError(data.error ?? 'Could not send reply.'); return; }
    replace(data.ticket);
    setReplyBody(''); setPolishedReply(''); setIsInternal(false);
  }

  async function polishReply() {
    setError(''); setIsPolishing(true);
    const res = await apiFetch('/api/ai/polish-reply', {
      method: 'POST',
      body: JSON.stringify({ draft: replyBody }),
    });
    const data = (await res.json().catch(() => ({}))) as { polished?: string; error?: string };
    setIsPolishing(false);
    if (!res.ok || !data.polished) { setError(data.error ?? 'Could not polish reply.'); return; }
    setPolishedReply(data.polished);
  }

  function replace(ticket: Ticket) {
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)));
    setSelectedId(ticket.id);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header view="tickets" onRefresh={loadTickets} isRefreshing={isLoading} />

      <div className="flex flex-1 overflow-hidden" data-testid="ticket-workspace">
        {/* Left panel: list */}
        <div
          className="flex flex-col w-80 shrink-0 border-r border-slate-200 bg-white overflow-hidden"
          data-testid="ticket-list"
        >
          {/* List header + actions */}
          <div className="px-4 py-3 border-b border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">All Tickets</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={loadTickets}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                >
                  <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
                {user.role === 'CUSTOMER' && (
                  <button
                    onClick={() => setShowCreateForm((p) => !p)}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition cursor-pointer"
                    style={{ background: '#6366f1', color: 'white' }}
                  >
                    <Inbox className="size-3" />
                    New
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-1 focus:ring-indigo-100"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-400"
              >
                <option value="ALL">All Status</option>
                {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
                className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-400"
              >
                <option value="ALL">All Priority</option>
                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <button
                onClick={loadTickets}
                className="col-span-2 h-7 rounded-md text-xs font-medium text-white transition cursor-pointer"
                style={{ background: '#6366f1' }}
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Create ticket inline form */}
          {showCreateForm && user.role === 'CUSTOMER' && (
            <form
              onSubmit={createTicket}
              data-testid="create-ticket-form"
              className="border-b border-slate-100 p-4 space-y-3 bg-slate-50 animate-fade-in"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-slate-800">New Ticket</h3>
                <button type="button" onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="size-4" />
                </button>
              </div>
              <input
                required
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
              />
              <textarea
                required
                placeholder="Describe your issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 resize-none"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
              >
                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <button
                type="submit"
                className="w-full h-9 rounded-lg text-sm font-medium text-white transition cursor-pointer"
                style={{ background: '#6366f1' }}
              >
                Submit Ticket
              </button>
            </form>
          )}

          {error && (
            <div className="mx-3 mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Ticket list items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filtered.map((ticket) => {
              const isSelected = selected?.id === ticket.id;
              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 transition-all border-l-2 cursor-pointer',
                    isSelected
                      ? 'bg-indigo-50 border-l-indigo-500'
                      : 'bg-white hover:bg-slate-50 border-l-transparent',
                  )}
                  style={!isSelected ? { borderLeftColor: statusBorderColor[ticket.status] } : {}}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-medium truncate', isSelected ? 'text-indigo-900' : 'text-slate-800')}>
                      {ticket.subject}
                    </p>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 truncate">
                    {ticket.aiSummary ?? ticket.description}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <StatusBadge status={ticket.status} />
                    {ticket.category && (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                        {ticket.category}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-slate-400">
                      {formatRelativeTime(ticket.updatedAt)}
                    </span>
                  </div>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <MessageSquare className="size-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">
                  {isLoading ? 'Loading tickets...' : 'No tickets found.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel: detail */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50" data-testid="ticket-detail">
          {selected ? (
            <>
              {/* Detail header */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <span>Tickets</span>
                      <ChevronRight className="size-3" />
                      <span className="text-slate-600 font-medium truncate max-w-60">{selected.subject}</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">{selected.subject}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <StatusBadge status={selected.status} />
                      <PriorityBadge priority={selected.priority} />
                      {selected.category && (
                        <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                          {selected.category}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">#{selected.id.slice(-8)}</span>
                    </div>
                  </div>

                  {/* Staff controls */}
                  {isStaff && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <select
                        value={selected.status}
                        onChange={(e) => void updateTicket(selected.id, { status: e.target.value as TicketStatus })}
                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-400 shadow-sm cursor-pointer"
                      >
                        {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                      <select
                        value={selected.priority}
                        onChange={(e) => void updateTicket(selected.id, { priority: e.target.value as Priority })}
                        className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-indigo-400 shadow-sm cursor-pointer"
                      >
                        {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <button
                        onClick={() => void updateTicket(selected.id, { assignToMe: true })}
                        className="flex items-center gap-1.5 h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm cursor-pointer"
                      >
                        <UserCog className="size-3.5" />
                        Assign to me
                      </button>
                    </div>
                  )}
                </div>

                {/* Meta info row */}
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                  <span>
                    <span className="font-medium text-slate-700">Customer: </span>
                    {selected.customer.name} ({selected.customer.email})
                  </span>
                  <span>
                    <span className="font-medium text-slate-700">Assigned: </span>
                    {selected.agent?.name ?? 'Unassigned'}
                  </span>
                  <span>
                    <span className="font-medium text-slate-700">Created: </span>
                    {formatFullDate(selected.createdAt)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white mx-6 mt-4 rounded-xl border border-slate-200 p-4 shrink-0 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selected.description}</p>
                {selected.aiSummary && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2">
                    <Bot className="size-3.5 text-indigo-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-indigo-700 leading-relaxed">{selected.aiSummary}</p>
                  </div>
                )}
              </div>

              {/* Thread */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {selected.replies.map((reply) => {
                  const isCustomer = reply.author.role === 'CUSTOMER';
                  return (
                    <article
                      key={reply.id}
                      className={cn(
                        'flex gap-3 animate-fade-in',
                        isCustomer ? 'flex-row' : 'flex-row-reverse',
                      )}
                    >
                      {/* Avatar */}
                      <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white mt-1"
                        style={{
                          background: isCustomer
                            ? 'linear-gradient(135deg,#3b82f6,#06b6d4)'
                            : reply.author.name === 'AI System'
                            ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                            : 'linear-gradient(135deg,#10b981,#059669)',
                        }}
                      >
                        {reply.author.name === 'AI System' ? <Bot className="size-4" /> : getInitials(reply.author.name)}
                      </div>

                      <div className={cn('max-w-[75%] space-y-1', isCustomer ? 'items-start' : 'items-end')}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-slate-700">{reply.author.name}</span>
                          <span className="text-xs text-slate-400">{reply.author.role}</span>
                          {reply.isInternal && (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Internal Note
                            </span>
                          )}
                          {reply.author.name === 'AI System' && (
                            <span className="flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                              <Bot className="size-3" />
                              AI
                            </span>
                          )}
                          <span className="text-xs text-slate-400">{formatRelativeTime(reply.createdAt)}</span>
                        </div>
                        <div
                          className={cn(
                            'rounded-xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                            reply.isInternal
                              ? 'border border-amber-200 bg-amber-50 text-amber-900'
                              : isCustomer
                              ? 'border border-slate-200 bg-white text-slate-800'
                              : 'text-white',
                          )}
                          style={!reply.isInternal && !isCustomer ? { background: 'linear-gradient(135deg,#6366f1,#4f46e5)' } : {}}
                        >
                          <p className="whitespace-pre-wrap">{reply.body}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {selected.replies.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-center">
                    <MessageSquare className="size-8 text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">No replies yet. Start the conversation below.</p>
                  </div>
                )}
              </div>

              {/* Reply composer */}
              <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
                {selected.status === 'CLOSED' && !isStaff && (
                  <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600 mb-3">
                    <Lock className="size-4" />
                    This ticket is closed. Contact support to reopen.
                  </div>
                )}
                <form onSubmit={createReply} data-testid="reply-form" className="space-y-3">
                  <textarea
                    required
                    rows={3}
                    placeholder="Write your reply..."
                    value={replyBody}
                    disabled={!isStaff && selected.status === 'CLOSED'}
                    onChange={(e) => { setReplyBody(e.target.value); setPolishedReply(''); }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none resize-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />

                  {polishedReply && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 animate-fade-in">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                          <Sparkles className="size-3.5" />
                          AI Polished Reply
                        </span>
                        <button
                          type="button"
                          onClick={() => { setReplyBody(polishedReply); setPolishedReply(''); }}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                        >
                          Use this →
                        </button>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{polishedReply}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      {isStaff && (
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <div
                            className={cn(
                              'relative w-9 h-5 rounded-full transition-colors',
                              isInternal ? 'bg-amber-500' : 'bg-slate-200',
                            )}
                            onClick={() => setIsInternal((p) => !p)}
                          >
                            <div
                              className={cn(
                                'absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform',
                                isInternal ? 'translate-x-4' : 'translate-x-0.5',
                              )}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-600">Internal note</span>
                        </label>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isStaff && (
                        <button
                          type="button"
                          disabled={!replyBody || isPolishing}
                          onClick={() => void polishReply()}
                          className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-40 cursor-pointer"
                        >
                          <Sparkles className={`size-3.5 ${isPolishing ? 'animate-spin' : ''}`} />
                          {isPolishing ? 'Polishing...' : 'Polish with AI'}
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={!isStaff && selected.status === 'CLOSED'}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40 cursor-pointer"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
                      >
                        <Send className="size-3.5" />
                        Send Reply
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                <MessageSquare className="size-8 text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-700 mb-1">No ticket selected</h3>
              <p className="text-sm text-slate-400">Select a ticket from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
