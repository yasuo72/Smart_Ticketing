import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { Role } from './generated/prisma/client.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import { sessionMiddleware } from './middleware/session.js';
import { aiRouter } from './routes/ai.js';
import { adminUsersRouter } from './routes/adminUsers.js';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { emailRouter } from './routes/email.js';
import { ticketsRouter } from './routes/tickets.js';

function getAllowedOrigins() {
  const configuredOrigins = process.env.WEB_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [];
  const defaults = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'];

  return Array.from(new Set([...configuredOrigins, ...defaults]));
}

export function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin not allowed: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(sessionMiddleware);

  if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
  }

  app.get('/health', (_request, response) => {
    response.json({
      status: 'ok',
      service: 'ai-ticketing-api',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/hello', (_request, response) => {
    response.json({
      message: 'AI Ticketing API is running.',
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminUsersRouter);
  app.use('/api/tickets', ticketsRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/email', emailRouter);

  app.get('/api/protected', requireAuth, (request, response) => {
    response.json({
      message: 'You are authenticated.',
      user: request.currentUser,
    });
  });

  app.get('/api/admin/ping', requireAuth, requireRole(Role.ADMIN), (_request, response) => {
    response.json({
      message: 'Admin access confirmed.',
    });
  });

  return app;
}
