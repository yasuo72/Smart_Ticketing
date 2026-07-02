import type { TicketStatus } from '../../lib/types';
import { cn } from '../../lib/utils';

const config: Record<
  TicketStatus,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  OPEN: {
    label: 'Open',
    dot: 'bg-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  AUTO_RESOLVED: {
    label: 'Auto Resolved',
    dot: 'bg-purple-500',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  RESOLVED: {
    label: 'Resolved',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  CLOSED: {
    label: 'Closed',
    dot: 'bg-slate-400',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const c = config[status] ?? config.OPEN;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        c.bg,
        c.text,
        c.border,
      )}
    >
      <span className={cn('size-1.5 rounded-full', c.dot)} />
      {c.label}
    </span>
  );
}
