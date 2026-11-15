import type { PrismaClient } from '../../generated/prisma/client.js';
import type { CareType } from '../../domain/care/CareType';
import type { CareEventRepository } from '../../domain/care/repositories';

export class PrismaCareEventRepository implements CareEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async record(plantId: string, type: CareType, occurredAt: Date): Promise<void> {
    await this.prisma.careEvent.create({ data: { plantId, type, occurredAt } });
  }

  async findLastCareDates(plantId: string): Promise<Partial<Record<CareType, Date>>> {
    const groups = await this.prisma.careEvent.groupBy({
      by: ['type'],
      where: { plantId },
      _max: { occurredAt: true },
    });

    const lastCareDates: Partial<Record<CareType, Date>> = {};
    for (const group of groups) {
      if (group._max.occurredAt) lastCareDates[group.type as CareType] = group._max.occurredAt;
    }
    return lastCareDates;
  }
}
