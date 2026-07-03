import { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  TicketCheck,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { DashboardData } from '../../lib/types';
import { formatDuration, formatRelativeTime, getInitials, labelFromKey } from '../../lib/utils';
import { Header } from '../layout/Header';
import { Skeleton } from '../ui/Skeleton';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subLabel,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  color: string;
  subLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm card-hover animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p
            className="mt-2 text-3xl font-bold text-slate-900"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {value}
          </p>
          {subLabel && <p className="mt-1 text-xs text-slate-400">{subLabel}</p>}
        </div>
        <div
          className="flex size-11 items-center justify-center rounded-xl"
          style={{ background: color + '15' }}
        >
          <Icon className="size-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{labelFromKey(label)}</span>
        <span className="text-slate-500">
          {value} <span className="text-slate-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

const priorityColors: Record<string, string> = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#3b82f6',
  LOW: '#94a3b8',
};

const categoryColors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(id);
  }, []);

  async function load() {
    setIsLoading(true);
    setError('');
    const res = await apiFetch('/api/dashboard');
    setIsLoading(false);
    if (!res.ok) {
      setError('Could not load dashboard.');
      return;
    }
    setData((await res.json()) as DashboardData);
  }

  const total = data ? Object.values(data.counts.byStatus).reduce((a, b) => a + b, 0) : 0;

  const categoryEntries = data
    ? Object.entries(data.counts.byCategory).filter(([, v]) => v > 0)
    : [];
  const categoryTotal = categoryEntries.reduce((a, [, v]) => a + v, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header view="dashboard" onRefresh={load} isRefreshing={isLoading} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Open Tickets"
            value={data ? data.counts.byStatus.OPEN : <Skeleton className="h-8 w-12" />}
            icon={TicketCheck}
            color="#3b82f6"
            subLabel="Awaiting response"
          />
          <StatCard
            label="In Progress"
            value={data ? data.counts.byStatus.IN_PROGRESS : <Skeleton className="h-8 w-12" />}
            icon={Activity}
            color="#f59e0b"
            subLabel="Actively being worked"
          />
          <StatCard
            label="AI Resolved"
            value={data ? data.counts.autoResolved : <Skeleton className="h-8 w-12" />}
            icon={Bot}
            color="#6366f1"
            subLabel="Auto-handled by AI"
          />
          <StatCard
            label="Avg Resolution"
            value={
              data ? formatDuration(data.averageResolutionMs) : <Skeleton className="h-8 w-20" />
            }
            icon={Clock}
            color="#10b981"
            subLabel="Mean time to resolve"
          />
        </div>

        {/* Secondary stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Tickets"
            value={data ? total : <Skeleton className="h-8 w-12" />}
            icon={BarChart3}
            color="#8b5cf6"
          />
          <StatCard
            label="Human Resolved"
            value={data ? data.counts.humanResolved : <Skeleton className="h-8 w-12" />}
            icon={CheckCircle2}
            color="#10b981"
          />
          <StatCard
            label="Closed"
            value={data ? data.counts.byStatus.CLOSED : <Skeleton className="h-8 w-12" />}
            icon={TrendingUp}
            color="#64748b"
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Priority breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-orange-50">
                <Zap className="size-4 text-orange-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Priority Breakdown</h2>
                <p className="text-xs text-slate-500">Tickets by urgency level</p>
              </div>
            </div>
            <div className="space-y-3">
              {data ? (
                Object.entries(data.counts.byPriority).map(([priority, count]) => (
                  <ProgressBar
                    key={priority}
                    label={priority}
                    value={count}
                    max={total}
                    color={priorityColors[priority] ?? '#6366f1'}
                  />
                ))
              ) : (
                <div className="space-y-4 py-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50">
                <BarChart3 className="size-4 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Category Breakdown</h2>
                <p className="text-xs text-slate-500">Tickets by support type</p>
              </div>
            </div>
            <div className="space-y-3">
              {data ? (
                categoryEntries.length > 0 ? (
                  categoryEntries.map(([cat, count], i) => (
                    <ProgressBar
                      key={cat}
                      label={cat}
                      value={count}
                      max={categoryTotal}
                      color={categoryColors[i % categoryColors.length]}
                    />
                  ))
                ) : (
                  <p className="text-sm text-slate-400 py-4 text-center">No category data yet.</p>
                )
              ) : (
                <div className="space-y-4 py-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100">
              <Users className="size-4 text-slate-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
              <p className="text-xs text-slate-500">Latest actions across all tickets</p>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {data ? (
              data.recentActivity.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <Activity className="size-8 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-400">No recent activity yet.</p>
                </div>
              ) : (
                data.recentActivity.slice(0, 8).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 px-5 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white mt-0.5"
                      style={{
                        background: event.actor
                          ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                          : 'linear-gradient(135deg,#10b981,#06b6d4)',
                      }}
                    >
                      {event.actor ? getInitials(event.actor.name) : 'AI'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {event.ticket.subject}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-600">
                          {event.actor?.name ?? 'AI System'}
                        </span>{' '}
                        {event.action.replace(/_/g, ' ').toLowerCase()}
                        {event.toValue ? ` → ${event.toValue.replace(/_/g, ' ')}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400 mt-0.5">
                      {formatRelativeTime(event.createdAt)}
                    </span>
                  </div>
                ))
              )
            ) : (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-3 w-12 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
