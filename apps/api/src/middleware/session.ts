import cookieSession from 'cookie-session';

const sessionSecret = process.env.SESSION_SECRET ?? 'dev-only-session-secret-change-me';
const isProduction = process.env.NODE_ENV === 'production';

export const sessionMiddleware = cookieSession({
  name: 'ai-ticketing.sid',
  keys: [sessionSecret],
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  maxAge: 1000 * 60 * 60 * 24 * 7,
});
