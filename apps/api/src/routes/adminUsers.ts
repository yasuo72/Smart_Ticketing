import { Router, type ErrorRequestHandler } from 'express';
import { z, ZodError } from 'zod';
import { Role } from '../generated/prisma/client.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { toSafeUser, hashPassword } from '../services/auth.js';

export const adminUsersRouter = Router();

// ── Schemas ───────────────────────────────────────────────

const listUsersSchema = z.object({
  role: z.enum(Role).optional(),
  search: z.string().trim().max(120).optional(),
  active: z.enum(['true', 'false']).optional(),
});

const createStaffSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
  role: z.enum([Role.AGENT, Role.ADMIN]),
});

const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    role: z.enum(Role).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required.',
  });

// All routes below require admin auth
adminUsersRouter.use(requireAuth, requireRole(Role.ADMIN));

// ── List users ────────────────────────────────────────────
adminUsersRouter.get('/users', async (request, response, next) => {
  try {
    const query = listUsersSchema.parse(request.query);

    const users = await prisma.user.findMany({
      where: {
        role: query.role,
        isActive: query.active ? query.active === 'true' : undefined,
        OR: query.search
          ? [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    response.json({ users: users.map(toSafeUser) });
  } catch (error) {
    next(error);
  }
});

// ── Create staff account (agent or admin, with hashed password) ──
adminUsersRouter.post('/users', async (request, response, next) => {
  try {
    const input = createStaffSchema.parse(request.body);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      response.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
        isActive: true,
      },
    });

    response.status(201).json({ user: toSafeUser(user) });
  } catch (error) {
    next(error);
  }
});

// ── Get single user ───────────────────────────────────────
adminUsersRouter.get('/users/:id', async (request, response) => {
  const user = await prisma.user.findUnique({ where: { id: request.params.id } });
  if (!user) {
    response.status(404).json({ error: 'User not found.' });
    return;
  }
  response.json({ user: toSafeUser(user) });
});

// ── Update user (role, name, isActive) ────────────────────
adminUsersRouter.patch('/users/:id', async (request, response, next) => {
  try {
    const input = updateUserSchema.parse(request.body);
    const targetUser = await prisma.user.findUnique({ where: { id: request.params.id } });
    if (!targetUser) {
      response.status(404).json({ error: 'User not found.' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: request.params.id },
      data: input,
    });

    response.json({ user: toSafeUser(updatedUser) });
  } catch (error) {
    next(error);
  }
});

// ── Deactivate user (soft-delete, keeps ticket history) ───
adminUsersRouter.delete('/users/:id', async (request, response) => {
  const targetUser = await prisma.user.findUnique({ where: { id: request.params.id } });

  if (!targetUser) {
    response.status(404).json({ error: 'User not found.' });
    return;
  }

  if (targetUser.id === request.currentUser?.id) {
    response.status(400).json({ error: 'Admins cannot deactivate their own account.' });
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUser.id },
    data: { isActive: false },
  });

  response.json({ user: toSafeUser(updatedUser) });
});

// ── List ALL tickets (admin overview) ─────────────────────
adminUsersRouter.get('/tickets', async (request, response, next) => {
  try {
    const { status, priority, search } = request.query as Record<string, string | undefined>;

    const tickets = await prisma.ticket.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(priority ? { priority: priority as never } : {}),
        ...(search
          ? {
              OR: [
                { subject: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        agent: { select: { id: true, name: true, email: true } },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    response.json({ tickets });
  } catch (error) {
    next(error);
  }
});

// ── Hard-delete ticket (cascades replies + audit events) ──
adminUsersRouter.delete('/tickets/:id', async (request, response, next) => {
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: request.params.id } });
    if (!ticket) {
      response.status(404).json({ error: 'Ticket not found.' });
      return;
    }

    await prisma.reply.deleteMany({ where: { ticketId: ticket.id } });
    await prisma.auditEvent.deleteMany({ where: { ticketId: ticket.id } });
    await prisma.ticket.delete({ where: { id: ticket.id } });

    response.json({ success: true, deletedId: ticket.id });
  } catch (error) {
    next(error);
  }
});

// ── Error handler ─────────────────────────────────────────
const adminUsersErrorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;

  if (error instanceof ZodError) {
    response.status(400).json({
      error: 'Invalid request.',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  response.status(500).json({ error: 'Unexpected admin management error.' });
};

adminUsersRouter.use(adminUsersErrorHandler);
