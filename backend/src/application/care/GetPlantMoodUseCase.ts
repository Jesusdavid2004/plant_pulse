import { PlantNotFoundError } from '../../domain/care/errors';
import { computePlantMood, PlantMoodSnapshot } from '../../domain/care/PlantMood';
import { CareEventRepository, Clock, PlantReader } from '../../domain/care/repositories';

export interface GetPlantMoodInput {
  plantId: string;
}

export type GetPlantMoodOutput = PlantMoodSnapshot & { plantId: string };

export class GetPlantMoodUseCase {
  constructor(
    private readonly plants: PlantReader,
    private readonly careEvents: CareEventRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: GetPlantMoodInput): Promise<GetPlantMoodOutput> {
    const plant = await this.plants.findById(input.plantId);
    if (!plant) throw new PlantNotFoundError();

    const lastCareAt = await this.careEvents.findLastCareDates(plant.id);
    const snapshot = computePlantMood({
      profile: plant.careProfile,
      lastCareAt,
      plantCreatedAt: plant.createdAt,
      healthScore: plant.latestHealthScore,
      now: this.clock.now(),
    });
    return { plantId: plant.id, ...snapshot };
  }
}
