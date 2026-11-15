import type { ImageStorage } from '../../domain/ai/repositories';
import { PlantNotFoundError } from '../../domain/errors';
import type { PhotoRepository, PlantRepository } from '../../domain/plants/repositories';

export interface DeletePlantInput {
  plantId: string;
  ownerId: string;
}

export class DeletePlantUseCase {
  constructor(
    private readonly plants: PlantRepository,
    private readonly photos: PhotoRepository,
    private readonly storage: ImageStorage,
  ) {}

  async execute(input: DeletePlantInput): Promise<void> {
    const storageKeys = await this.photos.listStorageKeysByPlant(input.plantId, input.ownerId);
    const deleted = await this.plants.delete(input.plantId, input.ownerId);
    if (!deleted) throw new PlantNotFoundError();
    await Promise.all(storageKeys.map((key) => this.storage.remove(key)));
  }
}
