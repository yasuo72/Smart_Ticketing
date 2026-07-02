/* global process */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(rootDir, '.env');

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return acc;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return acc;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      acc[key] = value;
      return acc;
    }, {});
}

const parsed = parseEnvFile(envPath);
const env = process.env;

const candidates = [
  env.DATABASE_URL,
  env.POSTGRES_URL,
  env.POSTGRES_PRISMA_URL,
  env.PRIVATE_DATABASE_URL,
  env.RAILWAY_DATABASE_URL,
  parsed.DATABASE_URL,
  parsed.POSTGRES_URL,
  parsed.POSTGRES_PRISMA_URL,
  parsed.PRIVATE_DATABASE_URL,
  parsed.RAILWAY_DATABASE_URL,
];

const resolved = candidates.find((value) => typeof value === 'string' && value.trim());

if (resolved) {
  env.DATABASE_URL = resolved.trim();
}
