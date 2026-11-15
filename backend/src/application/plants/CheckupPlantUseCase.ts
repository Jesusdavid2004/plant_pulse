import type { ImageStorage } from '../../domain/ai/repositories';
import { PlantNotFoundError } from '../../domain/errors';
import type {
  AnalysisRecord,
  AnalysisRepository,
  PhotoRepository,
  PlantRepository,
} from '../../domain/plants/repositories';
import type { Locale } from '../../shared/constants';
import type { PlantPhotoAnalyzer } from '../ai/PlantPhotoAnalyzer';

export const CHECKUP_PHOTO_LABEL = 'checkup';

export interface CheckupPlantInput {
  plantId: string;
  ownerId: string;
  rawImage: Buffer;
  locale: Locale;
}

export interface PlantCheckup {
  analysis: AnalysisRecord;
  advice: string[];
  visibleSigns: string[];
}

export class CheckupPlantUseCase {
  constructor(
    private readonly analyzer: PlantPhotoAnalyzer,
    private readonly plants: PlantRepository,
    private readonly analyses: AnalysisRepository,
    private readonly photos: PhotoRepository,
    private readonly storage: ImageStorage,
  ) {}

  async execute(input: CheckupPlantInput): Promise<PlantCheckup> {
    const plant = await this.plants.findByIdForOwner(input.plantId, input.ownerId);
    if (!plant) throw new PlantNotFoundError();

    const result = await this.analyzer.analyze({
      userId: input.ownerId,
      rawImage: input.rawImage,
      locale: input.locale,
    });

    const storageKey = await this.storage.save(result.image);
    try {
      const analysis = await this.analyses.create({
        plantId: plant.id,
        healthScore: result.health.score,
        status: result.health.status,
        diagnosis: result.explanation.diagnosis,
        carePlan: result.explanation.advice,
      });
      await this.photos.add(plant.id, storageKey, CHECKUP_PHOTO_LABEL);
      return {
        analysis,
        advice: result.explanation.advice,
        visibleSigns: result.explanation.visibleSigns,
      };
    } catch (error) {
      await this.storage.remove(storageKey);
      throw error;
    }
  }
}
