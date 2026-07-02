import cookieSession from 'cookie-session';

const sessionSecret = process.env.SESSION_SECRET ?? 'dev-only-session-secret-change-me';
const isProduction = process.env.NODE_ENV === 'production';

export const sessionMiddleware = cookieSession({
  name: 'ai-ticketing.sid',
  keys: [sessionSecret],
  httpOnly: true,
  // In production the frontend and API are on different domains, so we need
  // SameSite=None + Secure so the browser actually sends the cookie on
  // cross-origin requests. In development (localhost) 'lax' is fine.
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
  maxAge: 1000 * 60 * 60 * 24 * 7,
});
