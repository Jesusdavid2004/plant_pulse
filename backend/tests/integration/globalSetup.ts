import { execSync } from 'node:child_process';
import dotenv from 'dotenv';
import { PrismaClient } from '../../src/generated/prisma/client.js';

dotenv.config();

const ADMIN_DATABASE = 'postgres';
const TEST_SUFFIX = '_test';

function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

function resolveTestDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl)
    throw new Error('DATABASE_URL or TEST_DATABASE_URL is required for integration tests');
  const baseName = new URL(baseUrl).pathname.replace(/^\//, '');
  return withDatabase(
    baseUrl,
    baseName.endsWith(TEST_SUFFIX) ? baseName : `${baseName}${TEST_SUFFIX}`,
  );
}

async function ensureDatabaseExists(testUrl: string): Promise<void> {
  const database = new URL(testUrl).pathname.replace(/^\//, '');
  const admin = new PrismaClient({ datasourceUrl: withDatabase(testUrl, ADMIN_DATABASE) });
  try {
    const existing = await admin.$queryRaw<{ datname: string }[]>`
      SELECT datname FROM pg_database WHERE datname = ${database}`;
    if (existing.length === 0) await admin.$executeRawUnsafe(`CREATE DATABASE "${database}"`);
  } finally {
    await admin.$disconnect();
  }
}

export default async function setup(): Promise<void> {
  const testUrl = resolveTestDatabaseUrl();
  await ensureDatabaseExists(testUrl);
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'ignore',
  });
  process.env.DATABASE_URL = testUrl;
}
