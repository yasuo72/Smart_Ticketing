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

export function createApp() {
  const app = express();
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:5173';

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: webOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(sessionMiddleware);

  if (process.env.NODE_ENV !== 'test') {
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
