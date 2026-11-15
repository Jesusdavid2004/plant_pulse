import type { PrismaClient } from '../../generated/prisma/client.js';
import { parsePetTraits } from '../../domain/plants/PetTraits';
import type {
  NewPlant,
  PlantChanges,
  PlantProfileUpdate,
  PlantRepository,
  PlantSummary,
} from '../../domain/plants/repositories';

interface PlantRow {
  id: string;
  name: string;
  species: string | null;
  commonName: string | null;
  careCategory: string | null;
  petTraits: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

function toSummary(row: PlantRow): PlantSummary {
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    commonName: row.commonName,
    careCategory: row.careCategory,
    petTraits: parsePetTraits(row.petTraits),
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaPlantRepository implements PlantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(plant: NewPlant): Promise<PlantSummary> {
    const row = await this.prisma.plant.create({
      data: {
        userId: plant.ownerId,
        name: plant.name,
        species: plant.species,
        commonName: plant.commonName,
        careCategory: plant.careCategory,
        petTraits: { ...plant.petTraits },
      },
    });
    return toSummary(row);
  }

  async listByOwner(ownerId: string): Promise<PlantSummary[]> {
    const rows = await this.prisma.plant.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toSummary);
  }

  async findByIdForOwner(plantId: string, ownerId: string): Promise<PlantSummary | null> {
    const row = await this.prisma.plant.findFirst({ where: { id: plantId, userId: ownerId } });
    return row ? toSummary(row) : null;
  }

  async update(
    plantId: string,
    ownerId: string,
    changes: PlantChanges,
  ): Promise<PlantSummary | null> {
    const result = await this.prisma.plant.updateMany({
      where: { id: plantId, userId: ownerId },
      data: {
        ...(changes.name !== undefined && { name: changes.name }),
        ...(changes.species !== undefined && { species: changes.species }),
      },
    });
    if (result.count === 0) return null;
    return this.findByIdForOwner(plantId, ownerId);
  }

  async applyProfile(plantId: string, ownerId: string, profile: PlantProfileUpdate): Promise<void> {
    await this.prisma.plant.updateMany({
      where: { id: plantId, userId: ownerId },
      data: {
        species: profile.species,
        commonName: profile.commonName,
        careCategory: profile.careCategory,
        petTraits: { ...profile.petTraits },
      },
    });
  }

  async delete(plantId: string, ownerId: string): Promise<boolean> {
    const result = await this.prisma.plant.deleteMany({ where: { id: plantId, userId: ownerId } });
    return result.count > 0;
  }
}
