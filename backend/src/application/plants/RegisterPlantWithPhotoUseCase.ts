import type { ImageStorage } from '../../domain/ai/repositories';
import type {
  AnalysisRecord,
  AnalysisRepository,
  PhotoRepository,
  PlantRepository,
  PlantSummary,
} from '../../domain/plants/repositories';
import type { Locale } from '../../shared/constants';
import type { PlantPhotoAnalysis, PlantPhotoAnalyzer } from '../ai/PlantPhotoAnalyzer';

export const REGISTRATION_PHOTO_LABEL = 'registration';

export interface RegisterPlantWithPhotoInput {
  ownerId: string;
  rawImage: Buffer;
  locale: Locale;
  name: string | null;
}

export interface PlantRegistration {
  plant: PlantSummary;
  analysis: AnalysisRecord;
  advice: string[];
  visibleSigns: string[];
}

export class RegisterPlantWithPhotoUseCase {
  constructor(
    private readonly analyzer: PlantPhotoAnalyzer,
    private readonly plants: PlantRepository,
    private readonly analyses: AnalysisRepository,
    private readonly photos: PhotoRepository,
    private readonly storage: ImageStorage,
  ) {}

  async execute(input: RegisterPlantWithPhotoInput): Promise<PlantRegistration> {
    const result = await this.analyzer.analyze({
      userId: input.ownerId,
      rawImage: input.rawImage,
      locale: input.locale,
    });

    const storageKey = await this.storage.save(result.image);
    try {
      return await this.persist(input, result, storageKey);
    } catch (error) {
      await this.storage.remove(storageKey);
      throw error;
    }
  }

  private async persist(
    input: RegisterPlantWithPhotoInput,
    result: PlantPhotoAnalysis,
    storageKey: string,
  ): Promise<PlantRegistration> {
    const plant = await this.plants.create({
      ownerId: input.ownerId,
      name: input.name ?? result.identification.commonName,
      species: result.identification.scientificName,
      commonName: result.identification.commonName,
      careCategory: result.identification.careCategory,
      petTraits: result.petTraits,
    });
    const analysis = await this.analyses.create({
      plantId: plant.id,
      healthScore: result.health.score,
      status: result.health.status,
      diagnosis: result.explanation.diagnosis,
      carePlan: result.explanation.advice,
    });
    await this.photos.add(plant.id, storageKey, REGISTRATION_PHOTO_LABEL);

    return {
      plant,
      analysis,
      advice: result.explanation.advice,
      visibleSigns: result.explanation.visibleSigns,
    };
  }
}
