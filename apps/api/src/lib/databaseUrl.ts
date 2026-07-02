export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  const direct = env.DATABASE_URL?.trim();
  if (direct) {
    return direct;
  }

  for (const candidate of [
    env.POSTGRES_URL,
    env.POSTGRES_PRISMA_URL,
    env.PRIVATE_DATABASE_URL,
    env.RAILWAY_DATABASE_URL,
  ]) {
    const value = candidate?.trim();
    if (value) {
      return value;
    }
  }

  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = env;
  if (PGHOST && PGUSER && PGPASSWORD && PGDATABASE) {
    const port = PGPORT?.trim() || '5432';
    const user = encodeURIComponent(PGUSER);
    const password = encodeURIComponent(PGPASSWORD);
    return `postgresql://${user}:${password}@${PGHOST}:${port}/${PGDATABASE}?schema=public`;
  }

  return undefined;
}

export function ensureDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  if (!env.DATABASE_URL?.trim()) {
    const resolved = resolveDatabaseUrl(env);
    if (resolved) {
      env.DATABASE_URL = resolved;
    }
  }

  return env.DATABASE_URL?.trim();
}
