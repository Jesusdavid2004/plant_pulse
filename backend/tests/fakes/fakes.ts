import { CareProfile } from '../../src/domain/care/CareProfile';
import type { CareType } from '../../src/domain/care/CareType';
import type {
  CareEventRepository,
  Clock,
  PlantReader,
  PlantRecord,
} from '../../src/domain/care/repositories';

import type { Mailer, MailMessage } from '../../src/domain/notifications/ports';
import { PetProgress } from '../../src/domain/pet/PetProgress';
import type {
  GameResultRepository,
  PetProgressRepository,
} from '../../src/domain/pet/repositories';
import type { GameType, Reward } from '../../src/domain/pet/Rewards';

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

export class InMemoryPetProgressRepository implements PetProgressRepository {
  private readonly progress = new Map<string, PetProgress>();

  constructor(
    plantIds: string[] = ['plant-1'],
    private readonly ownerId: string = OWNER_ID,
  ) {
    for (const id of plantIds) this.progress.set(id, PetProgress.initial());
  }

  async findForOwner(plantId: string, ownerId: string): Promise<PetProgress | null> {
    if (ownerId !== this.ownerId) return null;
    return this.progress.get(plantId) ?? null;
  }

  async save(plantId: string, _previous: PetProgress, next: PetProgress): Promise<void> {
    this.progress.set(plantId, next);
  }

  current(plantId = 'plant-1'): PetProgress {
    return this.progress.get(plantId)!;
  }
}

export class InMemoryGameResultRepository implements GameResultRepository {
  readonly results: { plantId: string; game: GameType; score: number; coins: number }[] = [];

  async coinsEarnedSince(plantId: string): Promise<number> {
    return this.results
      .filter((result) => result.plantId === plantId)
      .reduce((total, result) => total + result.coins, 0);
  }

  async record(plantId: string, game: GameType, score: number, reward: Reward): Promise<void> {
    this.results.push({ plantId, game, score, coins: reward.coins });
  }
}

export class FakeMailer implements Mailer {
  readonly sent: MailMessage[] = [];
  failFor: string | null = null;

  async send(message: MailMessage): Promise<void> {
    if (message.to === this.failFor) throw new Error('SMTP unavailable');
    this.sent.push(message);
  }
}
