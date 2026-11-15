import type { PrismaClient } from '../../generated/prisma/client.js';
import type { PhotoRecord, PhotoRepository } from '../../domain/plants/repositories';

interface ImageRow {
  id: string;
  plantId: string;
  url: string;
  dayLabel: string;
  createdAt: Date;
}

function toRecord(row: ImageRow): PhotoRecord {
  return {
    id: row.id,
    plantId: row.plantId,
    storageKey: row.url,
    label: row.dayLabel,
    createdAt: row.createdAt,
  };
}

export class PrismaPhotoRepository implements PhotoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async add(plantId: string, storageKey: string, label: string): Promise<PhotoRecord> {
    const row = await this.prisma.image.create({
      data: { plantId, url: storageKey, dayLabel: label },
    });
    return toRecord(row);
  }

  async findForOwner(photoId: string, ownerId: string): Promise<PhotoRecord | null> {
    const row = await this.prisma.image.findFirst({
      where: { id: photoId, plant: { userId: ownerId } },
    });
    return row ? toRecord(row) : null;
  }

  async listStorageKeysByOwner(ownerId: string): Promise<string[]> {
    const rows = await this.prisma.image.findMany({
      where: { plant: { userId: ownerId } },
      select: { url: true },
    });
    return rows.map((row) => row.url);
  }

  async listStorageKeysByPlant(plantId: string, ownerId: string): Promise<string[]> {
    const rows = await this.prisma.image.findMany({
      where: { plantId, plant: { userId: ownerId } },
      select: { url: true },
    });
    return rows.map((row) => row.url);
  }
}
