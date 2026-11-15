import { CareType, isCareType } from '../../domain/care/CareType';
import { InvalidCareTypeError, PlantNotFoundError } from '../../domain/care/errors';
import { CareEventRepository, Clock, PlantReader } from '../../domain/care/repositories';

export interface LogCareEventInput {
  plantId: string;
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

    const plant = await this.plants.findById(input.plantId);
    if (!plant) throw new PlantNotFoundError();

    const occurredAt = this.clock.now();
    await this.careEvents.record(plant.id, input.type, occurredAt);
    return { plantId: plant.id, type: input.type, occurredAt };
  }
}
