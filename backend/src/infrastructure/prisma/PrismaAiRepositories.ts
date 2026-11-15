import type { PrismaClient } from '../../generated/prisma/client.js';
import type {
  AiCacheRepository,
  AiUsageEntry,
  AiUsageRepository,
} from '../../domain/ai/repositories';

export class PrismaAiUsageRepository implements AiUsageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async record(entry: AiUsageEntry): Promise<void> {
    await this.prisma.aiUsageLog.create({ data: { ...entry } });
  }

  countSince(userId: string, since: Date): Promise<number> {
    return this.prisma.aiUsageLog.count({ where: { userId, createdAt: { gte: since } } });
  }
}

export class PrismaAiCacheRepository implements AiCacheRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async get(key: string): Promise<unknown | null> {
    const row = await this.prisma.aiCache.findUnique({ where: { key } });
    return row ? row.payload : null;
  }

  async set(key: string, payload: unknown): Promise<void> {
    const json = JSON.parse(JSON.stringify(payload)) as object;
    await this.prisma.aiCache.upsert({
      where: { key },
      create: { key, payload: json },
      update: { payload: json },
    });
  }
}
