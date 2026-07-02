import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { ensureDatabaseUrl } from './databaseUrl.js';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const connectionString = ensureDatabaseUrl(process.env);

if (!connectionString) {
  throw new Error('DATABASE_URL is required to initialize Prisma.');
}

const adapter = new PrismaPg({ connectionString });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
