import type { Priority } from '../../lib/types';
import { cn } from '../../lib/utils';

const config: Record<Priority, { label: string; bg: string; text: string; border: string }> = {
  LOW: { label: 'Low', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  MEDIUM: { label: 'Medium', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  HIGH: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  URGENT: { label: 'Urgent', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const c = config[priority] ?? config.MEDIUM;
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold', c.bg, c.text, c.border)}>
      {c.label}
    </span>
  );
}
