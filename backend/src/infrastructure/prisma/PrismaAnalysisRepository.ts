import type { PrismaClient } from '../../generated/prisma/client.js';
import type {
  AnalysisRecord,
  AnalysisRepository,
  NewAnalysis,
} from '../../domain/plants/repositories';

interface AnalysisRow {
  id: string;
  plantId: string;
  healthScore: number;
  status: string;
  diagnosis: string;
  carePlan: unknown;
  createdAt: Date;
}

function toRecord(row: AnalysisRow): AnalysisRecord {
  return {
    id: row.id,
    plantId: row.plantId,
    healthScore: row.healthScore,
    status: row.status,
    diagnosis: row.diagnosis,
    carePlan: Array.isArray(row.carePlan) ? row.carePlan.map(String) : [],
    createdAt: row.createdAt,
  };
}

export class PrismaAnalysisRepository implements AnalysisRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(analysis: NewAnalysis): Promise<AnalysisRecord> {
    const row = await this.prisma.analysis.create({
      data: {
        plantId: analysis.plantId,
        healthScore: analysis.healthScore,
        status: analysis.status,
        diagnosis: analysis.diagnosis,
        carePlan: analysis.carePlan,
      },
    });
    return toRecord(row);
  }

  async listByPlantForOwner(plantId: string, ownerId: string): Promise<AnalysisRecord[]> {
    const rows = await this.prisma.analysis.findMany({
      where: { plantId, plant: { userId: ownerId } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toRecord);
  }
}
