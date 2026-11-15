import type { PlantRepository, PlantSummary } from '../../domain/plants/repositories';

export interface ListPlantsInput {
  ownerId: string;
}

export class ListPlantsUseCase {
  constructor(private readonly plants: PlantRepository) {}

  execute(input: ListPlantsInput): Promise<PlantSummary[]> {
    return this.plants.listByOwner(input.ownerId);
  }
}
