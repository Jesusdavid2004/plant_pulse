import type { PrismaClient } from '../../generated/prisma/client.js';
import { ConcurrentUpdateError } from '../../domain/errors';
import {
  DEFAULT_POT,
  DEFAULT_SCENE,
  isPotKey,
  isSceneKey,
  type PotKey,
} from '../../domain/pet/Catalog';
import { PetProgress } from '../../domain/pet/PetProgress';
import type { GameResultRepository, PetProgressRepository } from '../../domain/pet/repositories';
import type { GameType, Reward } from '../../domain/pet/Rewards';

export class PrismaPetProgressRepository implements PetProgressRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findForOwner(plantId: string, ownerId: string): Promise<PetProgress | null> {
    const row = await this.prisma.plant.findFirst({
      where: { id: plantId, userId: ownerId },
      select: { xp: true, coins: true, scene: true, pot: true, unlockedPots: true },
    });
    if (!row) return null;

    const unlockedPots = row.unlockedPots.filter(isPotKey) as PotKey[];
    return new PetProgress({
      xp: row.xp,
      coins: row.coins,
      scene: isSceneKey(row.scene) ? row.scene : DEFAULT_SCENE,
      pot: isPotKey(row.pot) ? row.pot : DEFAULT_POT,
      unlockedPots: unlockedPots.length > 0 ? unlockedPots : [DEFAULT_POT],
    });
  }

  async save(plantId: string, previous: PetProgress, next: PetProgress): Promise<void> {
    const result = await this.prisma.plant.updateMany({
      where: {
        id: plantId,
        xp: previous.xp,
        coins: previous.coins,
        unlockedPots: { equals: [...previous.unlockedPots] },
      },
      data: {
        xp: next.xp,
        coins: next.coins,
        scene: next.scene,
        pot: next.pot,
        unlockedPots: [...next.unlockedPots],
      },
    });
    if (result.count === 0) throw new ConcurrentUpdateError();
  }
}

export class PrismaGameResultRepository implements GameResultRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async coinsEarnedSince(plantId: string, since: Date): Promise<number> {
    const total = await this.prisma.gameResult.aggregate({
      where: { plantId, createdAt: { gte: since } },
      _sum: { coins: true },
    });
    return total._sum.coins ?? 0;
  }

  async record(
    plantId: string,
    game: GameType,
    score: number,
    reward: Reward,
    at: Date,
  ): Promise<void> {
    await this.prisma.gameResult.create({
      data: { plantId, game, score, coins: reward.coins, xp: reward.xp, createdAt: at },
    });
  }
}
