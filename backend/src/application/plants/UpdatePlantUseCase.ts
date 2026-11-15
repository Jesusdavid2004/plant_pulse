import { PlantNotFoundError } from '../../domain/errors';
import type { PlantChanges, PlantRepository, PlantSummary } from '../../domain/plants/repositories';

export interface UpdatePlantInput {
  plantId: string;
  ownerId: string;
  changes: PlantChanges;
}

export class UpdatePlantUseCase {
  constructor(private readonly plants: PlantRepository) {}

  async execute(input: UpdatePlantInput): Promise<PlantSummary> {
    const plant = await this.plants.update(input.plantId, input.ownerId, input.changes);
    if (!plant) throw new PlantNotFoundError();
    return plant;
  }
}
