import { PlantNotFoundError } from '../../domain/errors';
import type { PlantRepository, PlantSummary } from '../../domain/plants/repositories';

export interface GetPlantInput {
  plantId: string;
  ownerId: string;
}

export class GetPlantUseCase {
  constructor(private readonly plants: PlantRepository) {}

  async execute(input: GetPlantInput): Promise<PlantSummary> {
    const plant = await this.plants.findByIdForOwner(input.plantId, input.ownerId);
    if (!plant) throw new PlantNotFoundError();
    return plant;
  }
}
