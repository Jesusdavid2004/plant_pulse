import { PrismaClient } from '../../generated/prisma/client.js';
import { CareProfile } from '../../domain/care/CareProfile';
import { PlantReader, PlantRecord } from '../../domain/care/repositories';

export class PrismaPlantReader implements PlantReader {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(plantId: string): Promise<PlantRecord | null> {
    const plant = await this.prisma.plant.findUnique({
      where: { id: plantId },
      select: {
        id: true,
        createdAt: true,
        analyses: { select: { healthScore: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!plant) return null;

    return {
      id: plant.id,
      createdAt: plant.createdAt,
      careProfile: CareProfile.default(),
      latestHealthScore: plant.analyses[0]?.healthScore ?? null,
    };
  }
}
