import { Router } from 'express';
import { Priority, Role, TicketStatus } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth, requireRole(Role.AGENT, Role.ADMIN));

dashboardRouter.get('/', async (_request, response) => {
  const statusCounts = await prisma.ticket.groupBy({
    by: ['status'],
    _count: {
      status: true,
    },
  });
  const priorityCounts = await prisma.ticket.groupBy({
    by: ['priority'],
    _count: {
      priority: true,
    },
  });
  const categoryCounts = await prisma.ticket.groupBy({
    by: ['category'],
    _count: {
      category: true,
    },
    where: {
      category: {
        not: null,
      },
    },
  });
  const resolutionTickets = await prisma.ticket.findMany({
    where: {
      resolvedAt: {
        not: null,
      },
    },
    select: {
      createdAt: true,
      resolvedAt: true,
      status: true,
    },
  });
  const recentActivity = await prisma.auditEvent.findMany({
    take: 12,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      ticket: {
        select: {
          id: true,
          subject: true,
        },
      },
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  const resolvedDurations = resolutionTickets
    .filter((ticket) => ticket.resolvedAt)
    .map((ticket) => ticket.resolvedAt!.getTime() - ticket.createdAt.getTime());
  const averageResolutionMs =
    resolvedDurations.length > 0
      ? Math.round(
          resolvedDurations.reduce((total, duration) => total + duration, 0) /
            resolvedDurations.length,
        )
      : null;

  response.json({
    counts: {
      byStatus: fillEnumCounts(TicketStatus, statusCounts, 'status'),
      byPriority: fillEnumCounts(Priority, priorityCounts, 'priority'),
      byCategory: Object.fromEntries(
        categoryCounts.map((item) => [item.category ?? 'Uncategorized', item._count.category]),
      ),
      autoResolved: resolutionTickets.filter(
        (ticket) => ticket.status === TicketStatus.AUTO_RESOLVED,
      ).length,
      humanResolved: resolutionTickets.filter((ticket) => ticket.status === TicketStatus.RESOLVED)
        .length,
    },
    averageResolutionMs,
    recentActivity: recentActivity.map((event) => ({
      id: event.id,
      action: event.action,
      fromValue: event.fromValue,
      toValue: event.toValue,
      createdAt: event.createdAt.toISOString(),
      ticket: event.ticket,
      actor: event.actor,
    })),
  });
});

function fillEnumCounts<T extends Record<string, string>>(
  enumObject: T,
  counts: Array<Record<string, unknown> & { _count: Record<string, number> }>,
  key: string,
) {
  const entries = Object.values(enumObject).map((value) => [value, 0]);

  for (const item of counts) {
    const value = item[key];

    if (typeof value === 'string') {
      entries.push([value, item._count[key] ?? 0]);
    }
  }

  return Object.fromEntries(entries);
}
