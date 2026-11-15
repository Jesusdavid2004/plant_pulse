import type { CareProfile } from './CareProfile';
import type { CareType } from './CareType';

export interface PlantRecord {
  id: string;
  createdAt: Date;
  careProfile: CareProfile;
  latestHealthScore: number | null;
}

export interface PlantReader {
  findByIdForOwner(plantId: string, ownerId: string): Promise<PlantRecord | null>;
}

export interface CareEventRepository {
  record(plantId: string, type: CareType, occurredAt: Date): Promise<void>;
  findLastCareDates(plantId: string): Promise<Partial<Record<CareType, Date>>>;
}

export interface Clock {
  now(): Date;
}
