import type { Ticket } from './types';

/**
 * Escape CSV cell value according to RFC 4180
 */
function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Export array of Ticket objects to CSV and trigger browser download
 */
export function downloadTicketsCsv(
  tickets: Ticket[],
  filename = `tickets_export_${new Date().toISOString().slice(0, 10)}.csv`,
) {
  const headers = [
    'Ticket ID',
    'Subject',
    'Description',
    'Status',
    'Priority',
    'Category',
    'Customer Name',
    'Customer Email',
    'Notification Email',
    'Assigned Agent',
    'AI Summary',
    'Replies Count',
    'Created At',
    'Updated At',
  ];

  const rows = tickets.map((t) => [
    t.id,
    t.subject,
    t.description,
    t.status,
    t.priority,
    t.category ?? 'Uncategorized',
    t.customer.name,
    t.customer.email,
    t.notificationEmail ?? t.customer.email,
    t.agent?.name ?? 'Unassigned',
    t.aiSummary ?? '',
    t.replies.length,
    new Date(t.createdAt).toLocaleString(),
    new Date(t.updatedAt).toLocaleString(),
  ]);

  const csvContent = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV text into ticket creation objects
 */
export function parseTicketsCsv(
  csvText: string,
): Array<{ subject: string; description: string; priority?: string; email: string }> {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const results: Array<{ subject: string; description: string; priority?: string; email: string }> =
    [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parser for quoted or unquoted values
    const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      const val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
      matches.push(val.trim());
    }

    if (matches.length >= 3) {
      const subject = matches[0] || matches[1];
      const description = matches[1] || matches[2];
      const email = matches.find((m) => m.includes('@')) || 'customer@example.com';
      const priority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].find((p) =>
        matches.some((m) => m.toUpperCase() === p),
      );

      if (subject && description) {
        results.push({ subject, description, priority, email });
      }
    }
  }

  return results;
}
