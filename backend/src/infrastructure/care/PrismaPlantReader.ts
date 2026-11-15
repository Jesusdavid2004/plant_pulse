import type { PrismaClient } from '../../generated/prisma/client.js';
import { careProfileForCategory } from '../../domain/care/CareCatalog';
import type { PlantReader, PlantRecord } from '../../domain/care/repositories';

export class PrismaPlantReader implements PlantReader {
  constructor(private readonly prisma: PrismaClient) {}

  async findByIdForOwner(plantId: string, ownerId: string): Promise<PlantRecord | null> {
    const plant = await this.prisma.plant.findFirst({
      where: { id: plantId, userId: ownerId },
      select: {
        id: true,
        createdAt: true,
        careCategory: true,
        analyses: { select: { healthScore: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!plant) return null;

    return {
      id: plant.id,
      createdAt: plant.createdAt,
      careProfile: careProfileForCategory(plant.careCategory),
      latestHealthScore: plant.analyses[0]?.healthScore ?? null,
    };
  }
}
