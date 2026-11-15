import { CareProfile } from '../../src/domain/care/CareProfile';
import { CareType } from '../../src/domain/care/CareType';
import {
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

export class InMemoryPlantReader implements PlantReader {
  constructor(private readonly plants: PlantRecord[]) {}

  async findById(plantId: string): Promise<PlantRecord | null> {
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
