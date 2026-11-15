import { isCareType, type CareType } from '../../domain/care/CareType';
import type { CareEventRepository, Clock, PlantReader } from '../../domain/care/repositories';
import { InvalidCareTypeError, PlantNotFoundError } from '../../domain/errors';

export interface LogCareEventInput {
  plantId: string;
  ownerId: string;
  type: string;
}

export interface LogCareEventOutput {
  plantId: string;
  type: CareType;
  occurredAt: Date;
}

export class LogCareEventUseCase {
  constructor(
    private readonly plants: PlantReader,
    private readonly careEvents: CareEventRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: LogCareEventInput): Promise<LogCareEventOutput> {
    if (!isCareType(input.type)) throw new InvalidCareTypeError();

    const plant = await this.plants.findByIdForOwner(input.plantId, input.ownerId);
    if (!plant) throw new PlantNotFoundError();

    const occurredAt = this.clock.now();
    await this.careEvents.record(plant.id, input.type, occurredAt);
    return { plantId: plant.id, type: input.type, occurredAt };
  }
}
