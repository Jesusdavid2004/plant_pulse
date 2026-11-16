import { isCareType, type CareType } from '../../domain/care/CareType';
import type { CareEventRepository, Clock, PlantReader } from '../../domain/care/repositories';
import { InvalidCareTypeError, PlantNotFoundError } from '../../domain/errors';
import type { PetProgressRepository } from '../../domain/pet/repositories';
import { careReward, type Reward } from '../../domain/pet/Rewards';

export interface LogCareEventInput {
  plantId: string;
  ownerId: string;
  type: string;
}

export interface LogCareEventOutput {
  plantId: string;
  type: CareType;
  occurredAt: Date;
  reward: Reward;
  leveledUp: boolean;
  level: number;
}

export class LogCareEventUseCase {
  constructor(
    private readonly plants: PlantReader,
    private readonly careEvents: CareEventRepository,
    private readonly progress: PetProgressRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: LogCareEventInput): Promise<LogCareEventOutput> {
    if (!isCareType(input.type)) throw new InvalidCareTypeError();

    const plant = await this.plants.findByIdForOwner(input.plantId, input.ownerId);
    if (!plant) throw new PlantNotFoundError();
    const previous = await this.progress.findForOwner(plant.id, input.ownerId);
    if (!previous) throw new PlantNotFoundError();

    const occurredAt = this.clock.now();
    const lastCare = await this.careEvents.findLastCareDates(plant.id);
    const reward = careReward(input.type, lastCare[input.type], occurredAt);
    const next = previous.earn(reward);

    await this.careEvents.record(plant.id, input.type, occurredAt);
    await this.progress.save(plant.id, previous, next);

    return {
      plantId: plant.id,
      type: input.type,
      occurredAt,
      reward,
      leveledUp: next.level > previous.level,
      level: next.level,
    };
  }
}
