import type { NextFunction, Request, Response } from 'express';
import { Role } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { toSafeUser } from '../services/auth.js';

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const userId = request.session?.userId;

  if (typeof userId !== 'string') {
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.isActive) {
    request.session = null;
    response.status(401).json({ error: 'Authentication required.' });
    return;
  }

  request.currentUser = toSafeUser(user);
  next();
}

export function requireRole(...roles: Role[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    const currentUser = request.currentUser;

    if (!currentUser) {
      response.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(currentUser.role)) {
      response.status(403).json({ error: 'You do not have permission to access this resource.' });
      return;
    }

    next();
  };
}
