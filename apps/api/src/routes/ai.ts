import { Router, type ErrorRequestHandler } from 'express';
import { z, ZodError } from 'zod';
import { Role } from '../generated/prisma/client.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { polishReply } from '../services/ai/ticketAi.js';

export const aiRouter = Router();

const polishReplySchema = z.object({
  draft: z.string().trim().min(1).max(5000),
});

aiRouter.use(requireAuth);

aiRouter.post(
  '/polish-reply',
  requireRole(Role.AGENT, Role.ADMIN),
  async (request, response, next) => {
    try {
      const input = polishReplySchema.parse(request.body);
      const polished = await polishReply(input.draft);

      response.json({ polished });
    } catch (error) {
      next(error);
    }
  },
);

const aiErrorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
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

  response.status(500).json({ error: 'AI request failed.' });
};

aiRouter.use(aiErrorHandler);
