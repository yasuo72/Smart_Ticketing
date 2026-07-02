import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  Ban,
  BarChart3,
  Clock,
  Inbox,
  LifeBuoy,
  LogIn,
  LogOut,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserCog,
  UserPlus,
} from 'lucide-react';
import { Button } from './components/ui/button';

type Role = 'CUSTOMER' | 'AGENT' | 'ADMIN';
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'AUTO_RESOLVED' | 'RESOLVED' | 'CLOSED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

type Ticket = {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  category: string | null;
  aiSummary: string | null;
  customer: Pick<AuthUser, 'id' | 'name' | 'email'>;
  agent: Pick<AuthUser, 'id' | 'name' | 'email'> | null;
  replies: TicketReply[];
  createdAt: string;
  updatedAt: string;
};

type TicketReply = {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: Pick<AuthUser, 'id' | 'name' | 'email' | 'role'>;
};

type AuthMode = 'login' | 'signup';

type DashboardData = {
  counts: {
    byStatus: Record<TicketStatus, number>;
    byPriority: Record<Priority, number>;
    byCategory: Record<string, number>;
    autoResolved: number;
    humanResolved: number;
  };
  averageResolutionMs: number | null;
  recentActivity: Array<{
    id: string;
    action: string;
    fromValue: string | null;
    toValue: string | null;
    createdAt: string;
    ticket: {
      id: string;
      subject: string;
    };
    actor: Pick<AuthUser, 'id' | 'name' | 'email' | 'role'> | null;
  }>;
};

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'AUTO_RESOLVED', 'RESOLVED', 'CLOSED'];
const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = (await response.json()) as { user: AuthUser };
        setCurrentUser(data.user);
      }
    }

    void loadSession();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const response = await fetch(`${apiUrl}/api/auth/${authMode}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        authMode === 'signup'
          ? {
              name,
              email,
              password,
            }
          : {
              email,
              password,
            },
      ),
    });

    const data = (await response.json().catch(() => ({}))) as {
      user?: AuthUser;
      error?: string;
    };

    setIsSubmitting(false);

    if (!response.ok || !data.user) {
      setMessage(data.error ?? 'Authentication failed.');
      return;
    }

    setCurrentUser(data.user);
    setName('');
    setPassword('');
    setMessage('');
  }

  async function handleLogout() {
    await fetch(`${apiUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setCurrentUser(null);
    setPassword('');
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-teal-600 text-white">
              <LifeBuoy className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI Ticketing</h1>
              <p className="text-sm text-slate-500">Support workspace</p>
            </div>
          </div>

          {currentUser ? (
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="size-4" aria-hidden="true" />
              Sign out
            </Button>
          ) : null}
        </div>
      </header>

      {currentUser ? (
        <Workspace user={currentUser} />
      ) : (
        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 inline-flex rounded-md border border-slate-200 bg-slate-100 p-1">
              <ModeButton active={authMode === 'login'} onClick={() => setAuthMode('login')}>
                <LogIn className="size-4" aria-hidden="true" />
                Login
              </ModeButton>
              <ModeButton active={authMode === 'signup'} onClick={() => setAuthMode('signup')}>
                <UserPlus className="size-4" aria-hidden="true" />
                Sign up
              </ModeButton>
            </div>

            <form className="space-y-4" data-testid="auth-form" onSubmit={handleSubmit}>
              {authMode === 'signup' ? (
                <Field
                  label="Name"
                  onChange={setName}
                  type="text"
                  value={name}
                  autoComplete="name"
                />
              ) : null}
              <Field
                label="Email"
                onChange={setEmail}
                type="email"
                value={email}
                autoComplete="email"
              />
              <Field
                label="Password"
                onChange={setPassword}
                type="password"
                value={password}
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              />

              {message ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {message}
                </p>
              ) : null}

              <Button className="w-full" disabled={isSubmitting}>
                {authMode === 'login' ? (
                  <LogIn className="size-4" aria-hidden="true" />
                ) : (
                  <UserPlus className="size-4" aria-hidden="true" />
                )}
                {isSubmitting ? 'Working...' : authMode === 'login' ? 'Login' : 'Create account'}
              </Button>
            </form>
          </div>

          <SignedOutPreview />
        </section>
      )}
    </main>
  );
}

function Workspace({ user }: { user: AuthUser }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
      <div className="space-y-6">
        {user.role === 'AGENT' || user.role === 'ADMIN' ? <DashboardPanel /> : null}
        <TicketsPanel user={user} />
        {user.role === 'ADMIN' ? <AdminUsersPanel /> : null}
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{user.name}</p>
              <p className="truncate text-sm text-slate-600">{user.email}</p>
              <Pill>{user.role}</Pill>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}

function DashboardPanel() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void loadDashboard();
    const intervalId = window.setInterval(() => {
      void loadDashboard();
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function loadDashboard() {
    setIsLoading(true);
    setMessage('');

    const response = await fetch(`${apiUrl}/api/dashboard`, {
      credentials: 'include',
    });

    setIsLoading(false);

    if (!response.ok) {
      setMessage('Could not load dashboard.');
      return;
    }

    const data = (await response.json()) as DashboardData;
    setDashboard(data);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-slate-600" aria-hidden="true" />
          <h2 className="font-semibold">Dashboard</h2>
        </div>
        <Button size="sm" variant="secondary" onClick={loadDashboard} disabled={isLoading}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {message ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {message}
        </p>
      ) : null}

      {dashboard ? (
        <div className="space-y-5 p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Open" value={String(dashboard.counts.byStatus.OPEN ?? 0)} />
            <Metric
              label="In progress"
              value={String(dashboard.counts.byStatus.IN_PROGRESS ?? 0)}
            />
            <Metric label="Auto resolved" value={String(dashboard.counts.autoResolved)} />
            <Metric label="Avg resolution" value={formatDuration(dashboard.averageResolutionMs)} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Breakdown title="By priority" values={dashboard.counts.byPriority} />
            <Breakdown title="By category" values={dashboard.counts.byCategory} />
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Clock className="size-4" aria-hidden="true" />
              Recent activity
            </h3>
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
              {dashboard.recentActivity.slice(0, 6).map((event) => (
                <div className="px-4 py-3 text-sm" key={event.id}>
                  <p className="font-medium text-slate-800">{event.ticket.subject}</p>
                  <p className="mt-1 text-slate-500">
                    {event.actor?.name ?? 'System'} {event.action.replaceAll('_', ' ')}
                    {event.toValue ? ` to ${event.toValue.replace('_', ' ')}` : ''}
                  </p>
                </div>
              ))}

              {dashboard.recentActivity.length === 0 ? (
                <p className="px-4 py-5 text-center text-sm text-slate-500">
                  No recent activity yet.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <p className="p-5 text-sm text-slate-500">
          {isLoading ? 'Loading dashboard...' : 'No dashboard data yet.'}
        </p>
      )}
    </div>
  );
}

function TicketsPanel({ user }: { user: AuthUser }) {
  const isStaff = user.role === 'AGENT' || user.role === 'ADMIN';
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | Priority>('ALL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('MEDIUM');
  const [replyBody, setReplyBody] = useState('');
  const [polishedReply, setPolishedReply] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0];

  useEffect(() => {
    void loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTickets() {
    setIsLoading(true);
    setMessage('');

    const params = new URLSearchParams();

    if (statusFilter !== 'ALL') {
      params.set('status', statusFilter);
    }

    if (priorityFilter !== 'ALL') {
      params.set('priority', priorityFilter);
    }

    const response = await fetch(`${apiUrl}/api/tickets?${params.toString()}`, {
      credentials: 'include',
    });

    setIsLoading(false);

    if (!response.ok) {
      setMessage('Could not load tickets.');
      return;
    }

    const data = (await response.json()) as { tickets: Ticket[] };
    setTickets(data.tickets);
    setSelectedTicketId((currentId) => currentId ?? data.tickets[0]?.id ?? null);
  }

  async function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    const response = await fetch(`${apiUrl}/api/tickets`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject,
        description,
        priority: newPriority,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      ticket?: Ticket;
      error?: string;
    };

    if (!response.ok || !data.ticket) {
      setMessage(data.error ?? 'Could not create ticket.');
      return;
    }

    setTickets((currentTickets) => [data.ticket!, ...currentTickets]);
    setSelectedTicketId(data.ticket.id);
    setSubject('');
    setDescription('');
    setNewPriority('MEDIUM');
  }

  async function updateTicket(ticketId: string, data: Partial<Ticket> & { assignToMe?: boolean }) {
    const response = await fetch(`${apiUrl}/api/tickets/${ticketId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      ticket?: Ticket;
      error?: string;
    };

    if (!response.ok || !payload.ticket) {
      setMessage(payload.error ?? 'Could not update ticket.');
      return;
    }

    replaceTicket(payload.ticket);
  }

  async function createReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTicket) {
      return;
    }

    const response = await fetch(`${apiUrl}/api/tickets/${selectedTicket.id}/replies`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: replyBody,
        isInternal,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      ticket?: Ticket;
      error?: string;
    };

    if (!response.ok || !data.ticket) {
      setMessage(data.error ?? 'Could not send reply.');
      return;
    }

    replaceTicket(data.ticket);
    setReplyBody('');
    setPolishedReply('');
    setIsInternal(false);
  }

  async function polishCurrentReply() {
    setMessage('');
    setIsPolishing(true);

    const response = await fetch(`${apiUrl}/api/ai/polish-reply`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        draft: replyBody,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      polished?: string;
      error?: string;
    };

    setIsPolishing(false);

    if (!response.ok || !data.polished) {
      setMessage(data.error ?? 'Could not polish reply.');
      return;
    }

    setPolishedReply(data.polished);
  }

  function replaceTicket(ticket: Ticket) {
    setTickets((currentTickets) =>
      currentTickets.map((currentTicket) =>
        currentTicket.id === ticket.id ? ticket : currentTicket,
      ),
    );
    setSelectedTicketId(ticket.id);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]" data-testid="ticket-workspace">
      <div className="space-y-4">
        {user.role === 'CUSTOMER' ? (
          <form
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            data-testid="create-ticket-form"
            onSubmit={createTicket}
          >
            <h2 className="mb-4 font-semibold">New ticket</h2>
            <div className="space-y-3">
              <Field
                autoComplete="off"
                label="Subject"
                onChange={setSubject}
                type="text"
                value={subject}
              />
              <label className="block text-sm font-medium text-slate-700">
                Description
                <textarea
                  className="mt-1 min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  value={description}
                />
              </label>
              <Select
                label="Priority"
                onChange={(value) => setNewPriority(value as Priority)}
                value={newPriority}
                values={priorities}
              />
              <Button className="w-full">
                <Inbox className="size-4" aria-hidden="true" />
                Create ticket
              </Button>
            </div>
          </form>
        ) : null}

        <div
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
          data-testid="ticket-list"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">Tickets</h2>
            <Button size="sm" variant="secondary" onClick={loadTickets} disabled={isLoading}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:grid-cols-2">
            <Select
              label="Status"
              onChange={(value) => setStatusFilter(value as 'ALL' | TicketStatus)}
              value={statusFilter}
              values={['ALL', ...statuses]}
            />
            <Select
              label="Priority"
              onChange={(value) => setPriorityFilter(value as 'ALL' | Priority)}
              value={priorityFilter}
              values={['ALL', ...priorities]}
            />
            <Button className="sm:col-span-2" size="sm" onClick={loadTickets}>
              <Search className="size-4" aria-hidden="true" />
              Apply filters
            </Button>
          </div>

          {message ? (
            <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
              {message}
            </p>
          ) : null}

          <div className="divide-y divide-slate-200">
            {tickets.map((ticket) => (
              <button
                className={`block w-full px-5 py-4 text-left transition ${
                  selectedTicket?.id === ticket.id ? 'bg-teal-50' : 'bg-white hover:bg-slate-50'
                }`}
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{ticket.subject}</h3>
                    <p className="truncate text-sm text-slate-500">
                      {ticket.aiSummary ?? ticket.description}
                    </p>
                  </div>
                  <Pill>{ticket.priority}</Pill>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill>{ticket.status}</Pill>
                  <Pill>{ticket.category ?? 'Uncategorized'}</Pill>
                </div>
              </button>
            ))}

            {tickets.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                {isLoading ? 'Loading tickets...' : 'No tickets found.'}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="rounded-lg border border-slate-200 bg-white shadow-sm"
        data-testid="ticket-detail"
      >
        {selectedTicket ? (
          <div>
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedTicket.subject}</h2>
                  <p className="mt-2 text-sm text-slate-600">{selectedTicket.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill>{selectedTicket.status}</Pill>
                    <Pill>{selectedTicket.priority}</Pill>
                    <Pill>{selectedTicket.agent?.name ?? 'Unassigned'}</Pill>
                  </div>
                </div>

                {isStaff ? (
                  <div className="grid min-w-56 gap-2">
                    <Select
                      label="Status"
                      onChange={(value) =>
                        void updateTicket(selectedTicket.id, { status: value as TicketStatus })
                      }
                      value={selectedTicket.status}
                      values={statuses}
                    />
                    <Select
                      label="Priority"
                      onChange={(value) =>
                        void updateTicket(selectedTicket.id, { priority: value as Priority })
                      }
                      value={selectedTicket.priority}
                      values={priorities}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void updateTicket(selectedTicket.id, { assignToMe: true })}
                    >
                      <UserCog className="size-4" aria-hidden="true" />
                      Assign to me
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="space-y-3">
                {selectedTicket.replies.map((reply) => (
                  <article
                    className={`rounded-lg border p-4 ${
                      reply.isInternal
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                    key={reply.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{reply.author.name}</p>
                        <p className="text-xs text-slate-500">{reply.author.role}</p>
                      </div>
                      {reply.isInternal ? <Pill>Internal</Pill> : null}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{reply.body}</p>
                  </article>
                ))}

                {selectedTicket.replies.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                    No visible replies yet.
                  </p>
                ) : null}
              </div>

              <form
                className="space-y-3 border-t border-slate-200 pt-4"
                data-testid="reply-form"
                onSubmit={createReply}
              >
                <label className="block text-sm font-medium text-slate-700">
                  Reply
                  <textarea
                    className="mt-1 min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    disabled={!isStaff && selectedTicket.status === 'CLOSED'}
                    onChange={(event) => {
                      setReplyBody(event.target.value);
                      setPolishedReply('');
                    }}
                    required
                    value={replyBody}
                  />
                </label>

                {isStaff && polishedReply ? (
                  <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                    <p className="text-xs font-medium uppercase text-teal-700">Polished reply</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                      {polishedReply}
                    </p>
                    <Button
                      className="mt-3"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setReplyBody(polishedReply);
                        setPolishedReply('');
                      }}
                    >
                      Use polished
                    </Button>
                  </div>
                ) : null}

                {isStaff ? (
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      checked={isInternal}
                      onChange={(event) => setIsInternal(event.target.checked)}
                      type="checkbox"
                    />
                    Internal note
                  </label>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {isStaff ? (
                    <Button
                      disabled={!replyBody || isPolishing}
                      onClick={() => void polishCurrentReply()}
                      type="button"
                      variant="secondary"
                    >
                      <Sparkles className="size-4" aria-hidden="true" />
                      {isPolishing ? 'Polishing...' : 'Polish'}
                    </Button>
                  ) : null}
                  <Button disabled={!isStaff && selectedTicket.status === 'CLOSED'}>
                    <Send className="size-4" aria-hidden="true" />
                    Send reply
                  </Button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center text-slate-500">
            <MessageSquare className="mb-3 size-8" aria-hidden="true" />
            <p>No ticket selected.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminUsersPanel() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'true' | 'false'>('ALL');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    setMessage('');

    const params = new URLSearchParams();

    if (search.trim()) {
      params.set('search', search.trim());
    }

    if (roleFilter !== 'ALL') {
      params.set('role', roleFilter);
    }

    if (activeFilter !== 'ALL') {
      params.set('active', activeFilter);
    }

    const response = await fetch(`${apiUrl}/api/admin/users?${params.toString()}`, {
      credentials: 'include',
    });

    setIsLoading(false);

    if (!response.ok) {
      setMessage('Could not load users.');
      return;
    }

    const data = (await response.json()) as { users: AuthUser[] };
    setUsers(data.users);
  }

  async function updateUser(userId: string, data: Partial<Pick<AuthUser, 'role' | 'isActive'>>) {
    const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      setMessage('Could not update user.');
      return;
    }

    const payload = (await response.json()) as { user: AuthUser };
    setUsers((currentUsers) =>
      currentUsers.map((user) => (user.id === payload.user.id ? payload.user : user)),
    );
  }

  async function deactivateUser(userId: string) {
    const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      setMessage('Could not deactivate user.');
      return;
    }

    const payload = (await response.json()) as { user: AuthUser };
    setUsers((currentUsers) =>
      currentUsers.map((user) => (user.id === payload.user.id ? payload.user : user)),
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <UserCog className="size-5 text-slate-600" aria-hidden="true" />
          <h2 className="font-semibold">Users</h2>
        </div>
        <Button size="sm" variant="secondary" onClick={loadUsers} disabled={isLoading}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 md:grid-cols-[1fr_150px_150px_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users"
            type="search"
            value={search}
          />
        </label>
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          onChange={(event) => setRoleFilter(event.target.value as 'ALL' | Role)}
          value={roleFilter}
        >
          <option value="ALL">All roles</option>
          <option value="CUSTOMER">Customers</option>
          <option value="AGENT">Agents</option>
          <option value="ADMIN">Admins</option>
        </select>
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          onChange={(event) => setActiveFilter(event.target.value as 'ALL' | 'true' | 'false')}
          value={activeFilter}
        >
          <option value="ALL">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <Button size="sm" onClick={loadUsers}>
          <Search className="size-4" aria-hidden="true" />
          Search
        </Button>
      </div>

      {message ? (
        <p className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {message}
        </p>
      ) : null}

      <div className="divide-y divide-slate-200">
        {users.map((user) => (
          <article
            className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_150px_140px_auto]"
            key={user.id}
          >
            <div className="min-w-0">
              <h3 className="truncate font-medium">{user.name}</h3>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
            </div>
            <select
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => void updateUser(user.id, { role: event.target.value as Role })}
              value={user.role}
            >
              <option value="CUSTOMER">Customer</option>
              <option value="AGENT">Agent</option>
              <option value="ADMIN">Admin</option>
            </select>
            <select
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) =>
                void updateUser(user.id, { isActive: event.target.value === 'true' })
              }
              value={String(user.isActive)}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void deactivateUser(user.id)}
              disabled={!user.isActive}
            >
              <Ban className="size-4" aria-hidden="true" />
              Deactivate
            </Button>
          </article>
        ))}

        {users.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">
            {isLoading ? 'Loading users...' : 'No users found.'}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SignedOutPreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold">Ticket workspace</h2>
      </div>
      <div className="space-y-4 p-5 text-sm text-slate-600">
        <p>Customers can create tickets and reply to their own threads.</p>
        <p>Agents and admins can view the queue, assign work, change status, and add notes.</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Breakdown({ title, values }: { title: string; values: Record<string, number> }) {
  const entries = Object.entries(values).filter(([, value]) => value > 0);

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <div className="mt-3 space-y-2">
        {entries.map(([label, value]) => (
          <div className="flex items-center justify-between gap-3 text-sm" key={label}>
            <span className="truncate text-slate-600">{label.replace('_', ' ')}</span>
            <span className="font-medium text-slate-950">{value}</span>
          </div>
        ))}

        {entries.length === 0 ? <p className="text-sm text-slate-500">No data yet.</p> : null}
      </div>
    </div>
  );
}

function formatDuration(milliseconds: number | null) {
  if (milliseconds === null) {
    return 'n/a';
  }

  const minutes = Math.round(milliseconds / 60000);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  return `${Math.round(minutes / 60)}h`;
}

function ModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex h-9 items-center gap-2 rounded px-3 text-sm font-medium ${
        active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function Field({
  autoComplete,
  label,
  onChange,
  type,
  value,
}: {
  autoComplete: string;
  label: string;
  onChange: (value: string) => void;
  type: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        autoComplete={autoComplete}
        className="mt-1 block h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        onChange={(event) => onChange(event.target.value)}
        required
        type={type}
        value={value}
      />
    </label>
  );
}

function Select({
  label,
  onChange,
  value,
  values,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  values: string[];
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select
        className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {values.map((option) => (
          <option key={option} value={option}>
            {option.replace('_', ' ')}
          </option>
        ))}
      </select>
    </label>
  );
}

function Pill({ children }: { children: string }) {
  return (
    <span className="mt-2 inline-flex w-fit items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
      {children.replace('_', ' ')}
    </span>
  );
}
