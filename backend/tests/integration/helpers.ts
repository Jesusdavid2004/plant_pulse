import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import request from 'supertest';
import type { Express } from 'express';
import { buildContainer } from '../../src/container';
import { PrismaClient } from '../../src/generated/prisma/client.js';
import { FakeAIProvider } from '../../src/infrastructure/ai/FakeAIProvider';
import { createApp } from '../../src/presentation/http/app';
import { buildConfig } from '../../src/shared/config';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from '../../src/shared/constants';

const TEST_PASSWORD = 'correct-horse-battery';
const TEST_HASH_COST = 4;
const SAMPLE_IMAGE_SIZE_PX = 64;

export interface TestContext {
  app: Express;
  prisma: PrismaClient;
  aiProvider: FakeAIProvider;
  uploadDir: string;
  close: () => Promise<void>;
}

export async function createTestContext(
  envOverrides: Record<string, string> = {},
): Promise<TestContext> {
  const uploadDir = mkdtempSync(path.join(tmpdir(), 'plantpulse-uploads-'));
  const config = buildConfig({
    ...process.env,
    UPLOAD_DIR: uploadDir,
    RATE_LIMIT_AUTH_PER_15_MIN: '1000',
    RATE_LIMIT_AI_PER_MIN: '1000',
    RATE_LIMIT_GENERAL_PER_MIN: '10000',
    ...envOverrides,
  });
  const prisma = new PrismaClient();
  const aiProvider = new FakeAIProvider();
  const container = await buildContainer(prisma, config, {
    aiProvider,
    passwordHashCost: TEST_HASH_COST,
  });

  return {
    app: createApp(container, config),
    prisma,
    aiProvider,
    uploadDir,
    close: async () => {
      await prisma.$disconnect();
      rmSync(uploadDir, { recursive: true, force: true });
    },
  };
}

export async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.aiUsageLog.deleteMany();
  await prisma.aiCache.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.plant.deleteMany();
  await prisma.user.deleteMany();
}

export function sampleJpeg(): Promise<Buffer> {
  return sharp({
    create: {
      width: SAMPLE_IMAGE_SIZE_PX,
      height: SAMPLE_IMAGE_SIZE_PX,
      channels: 3,
      background: { r: 40, g: 140, b: 70 },
    },
  })
    .jpeg()
    .toBuffer();
}

export interface RegisteredUser {
  email: string;
  accessToken: string;
  authorization: string;
  refreshCookie: string;
}

export async function registerUser(app: Express, email: string): Promise<RegisteredUser> {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ email, password: TEST_PASSWORD, name: 'Tester' });
  const cookies = response.headers['set-cookie'] as unknown as string[];
  const accessToken = response.body.data.accessToken as string;
  return {
    email,
    accessToken,
    authorization: `Bearer ${accessToken}`,
    refreshCookie: cookies[0]!.split(';')[0]!,
  };
}

export const csrfHeader = { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE };
export { TEST_PASSWORD };
