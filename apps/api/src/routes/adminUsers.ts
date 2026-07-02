import { Router, type ErrorRequestHandler } from 'express';
import { z, ZodError } from 'zod';
import { Role } from '../generated/prisma/client.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { toSafeUser } from '../services/auth.js';

export const adminUsersRouter = Router();

const listUsersSchema = z.object({
  role: z.enum(Role).optional(),
  search: z.string().trim().max(120).optional(),
  active: z.enum(['true', 'false']).optional(),
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

adminUsersRouter.use(requireAuth, requireRole(Role.ADMIN));

adminUsersRouter.get('/users', async (request, response, next) => {
  try {
    const query = listUsersSchema.parse(request.query);

    const users = await prisma.user.findMany({
      where: {
        role: query.role,
        isActive: query.active ? query.active === 'true' : undefined,
        OR: query.search
          ? [
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ]
          : undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    response.json({ users: users.map(toSafeUser) });
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.get('/users/:id', async (request, response) => {
  const user = await prisma.user.findUnique({
    where: {
      id: request.params.id,
    },
  });

  if (!user) {
    response.status(404).json({ error: 'User not found.' });
    return;
  }

  response.json({ user: toSafeUser(user) });
});

adminUsersRouter.patch('/users/:id', async (request, response, next) => {
  try {
    const input = updateUserSchema.parse(request.body);
    const targetUser = await prisma.user.findUnique({
      where: {
        id: request.params.id,
      },
    });

    if (!targetUser) {
      response.status(404).json({ error: 'User not found.' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: request.params.id,
      },
      data: input,
    });

    response.json({ user: toSafeUser(updatedUser) });
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.delete('/users/:id', async (request, response) => {
  const targetUser = await prisma.user.findUnique({
    where: {
      id: request.params.id,
    },
  });

  if (!targetUser) {
    response.status(404).json({ error: 'User not found.' });
    return;
  }

  if (targetUser.id === request.currentUser?.id) {
    response.status(400).json({ error: 'Admins cannot deactivate their own account.' });
    return;
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: targetUser.id,
    },
    data: {
      isActive: false,
    },
  });

  response.json({ user: toSafeUser(updatedUser) });
});

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

  response.status(500).json({ error: 'Unexpected admin user management error.' });
};

adminUsersRouter.use(adminUsersErrorHandler);
