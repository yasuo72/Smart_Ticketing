import { Router, type ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import {
  AuthError,
  authenticateUser,
  createCustomerAccount,
  loginSchema,
  signupSchema,
} from '../services/auth.js';

export const authRouter = Router();

authRouter.post('/signup', async (request, response, next) => {
  try {
    const input = signupSchema.parse(request.body);
    const user = await createCustomerAccount(input);

    request.session = {
      userId: user.id,
    };

    response.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    const user = await authenticateUser(input);

    request.session = {
      userId: user.id,
    };

    response.json({ user });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', (request, response) => {
  request.session = null;
  response.status(204).send();
});

authRouter.get('/me', requireAuth, (request, response) => {
  response.json({ user: request.currentUser });
});

const authErrorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;

  if (error instanceof ZodError) {
    response.status(400).json({
      error: 'Invalid request body.',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof AuthError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  response.status(500).json({ error: 'Unexpected authentication error.' });
};

authRouter.use(authErrorHandler);
