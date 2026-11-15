import { CareProfile } from '../../src/domain/care/CareProfile';
import type { CareType } from '../../src/domain/care/CareType';
import type {
  CareEventRepository,
  Clock,
  PlantReader,
  PlantRecord,
} from '../../src/domain/care/repositories';

export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return this.current;
  }
}

export const OWNER_ID = 'owner-1';

export class InMemoryPlantReader implements PlantReader {
  constructor(
    private readonly plants: PlantRecord[],
    private readonly ownerId: string = OWNER_ID,
  ) {}

  async findByIdForOwner(plantId: string, ownerId: string): Promise<PlantRecord | null> {
    if (ownerId !== this.ownerId) return null;
    return this.plants.find((plant) => plant.id === plantId) ?? null;
  }
}

export class InMemoryCareEventRepository implements CareEventRepository {
  readonly events: { plantId: string; type: CareType; occurredAt: Date }[] = [];

  async record(plantId: string, type: CareType, occurredAt: Date): Promise<void> {
    this.events.push({ plantId, type, occurredAt });
  }

  async findLastCareDates(plantId: string): Promise<Partial<Record<CareType, Date>>> {
    const lastDates: Partial<Record<CareType, Date>> = {};
    for (const event of this.events.filter((item) => item.plantId === plantId)) {
      const current = lastDates[event.type];
      if (!current || event.occurredAt > current) lastDates[event.type] = event.occurredAt;
    }
    return lastDates;
  }
}

export function buildPlant(overrides: Partial<PlantRecord> = {}): PlantRecord {
  return {
    id: 'plant-1',
    createdAt: new Date('2026-11-01T00:00:00Z'),
    careProfile: CareProfile.default(),
    latestHealthScore: null,
    ...overrides,
  };
}
