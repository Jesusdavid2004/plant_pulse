import { PlantNotFoundError } from '../../domain/errors';
import type {
  AnalysisRecord,
  AnalysisRepository,
  PlantRepository,
} from '../../domain/plants/repositories';

export interface ListAnalysesInput {
  plantId: string;
  ownerId: string;
}

export class ListAnalysesUseCase {
  constructor(
    private readonly plants: PlantRepository,
    private readonly analyses: AnalysisRepository,
  ) {}

  async execute(input: ListAnalysesInput): Promise<AnalysisRecord[]> {
    const plant = await this.plants.findByIdForOwner(input.plantId, input.ownerId);
    if (!plant) throw new PlantNotFoundError();
    return this.analyses.listByPlantForOwner(input.plantId, input.ownerId);
  }
}
