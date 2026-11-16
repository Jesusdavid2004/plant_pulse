import type { AIProvider } from '../../domain/ai/AIProvider';
import type {
  AiUsageRepository,
  ImageProcessor,
  ProcessedImage,
} from '../../domain/ai/repositories';
import type { Clock } from '../../domain/care/repositories';
import { AIQuotaExceededError, NotAPlantError } from '../../domain/errors';
import { assessHealth, type HealthAssessment } from '../../domain/plants/HealthAssessment';
import { buildPetTraits, type PetTraits } from '../../domain/plants/PetTraits';
import type { Locale } from '../../shared/constants';
import { plantAnalysisSchema, type PlantAnalysisResponse } from './plantAnalysisSchema';
import {
  buildPlantAnalysisSystemPrompt,
  buildPlantAnalysisUserPrompt,
  PLANT_ANALYSIS_PROMPT_VERSION,
  PLANT_ANALYSIS_SCHEMA_NAME,
} from './prompts/plantAnalysis.v2';

export interface PlantPhotoAnalysis {
  image: ProcessedImage;
  identification: Pick<PlantAnalysisResponse, 'commonName' | 'scientificName' | 'careCategory'>;
  petTraits: PetTraits;
  health: HealthAssessment & Pick<PlantAnalysisResponse, 'healthCondition' | 'severity'>;
  explanation: Pick<PlantAnalysisResponse, 'diagnosis' | 'advice' | 'visibleSigns'>;
}

export interface AnalyzePhotoInput {
  userId: string;
  rawImage: Buffer;
  locale: Locale;
}

export class PlantPhotoAnalyzer {
  constructor(
    private readonly provider: AIProvider,
    private readonly imageProcessor: ImageProcessor,
    private readonly usage: AiUsageRepository,
    private readonly clock: Clock,
    private readonly dailyQuotaPerUser: number,
  ) {}

  async analyze(input: AnalyzePhotoInput): Promise<PlantPhotoAnalysis> {
    await this.assertWithinDailyQuota(input.userId);
    const image = await this.imageProcessor.sanitize(input.rawImage);

    const result = await this.provider.generateStructured({
      systemPrompt: buildPlantAnalysisSystemPrompt(input.locale),
      userPrompt: buildPlantAnalysisUserPrompt(),
      images: [{ mimeType: image.mimeType, base64Data: image.buffer.toString('base64') }],
      schema: plantAnalysisSchema,
      schemaName: PLANT_ANALYSIS_SCHEMA_NAME,
      promptVersion: PLANT_ANALYSIS_PROMPT_VERSION,
      locale: input.locale,
    });

    if (!result.cached) {
      await this.usage.record({
        userId: input.userId,
        provider: result.provider,
        model: result.model,
        promptVersion: PLANT_ANALYSIS_PROMPT_VERSION,
        latencyMs: result.latencyMs,
        ...result.usage,
      });
    }

    return this.toAnalysis(image, result.data);
  }

  private toAnalysis(image: ProcessedImage, data: PlantAnalysisResponse): PlantPhotoAnalysis {
    if (!data.isPlant) throw new NotAPlantError();

    return {
      image,
      identification: {
        commonName: data.commonName,
        scientificName: data.scientificName,
        careCategory: data.careCategory,
      },
      petTraits: buildPetTraits({
        leafShape: data.leafShape,
        leafCount: data.leafCount,
        leafColor: data.leafColor,
        bloomShape: data.bloomShape,
        bloomColor: data.bloomColor,
      }),
      health: {
        ...assessHealth(data.healthCondition, data.severity),
        healthCondition: data.healthCondition,
        severity: data.severity,
      },
      explanation: {
        diagnosis: data.diagnosis,
        advice: data.advice,
        visibleSigns: data.visibleSigns,
      },
    };
  }

  private async assertWithinDailyQuota(userId: string): Promise<void> {
    const startOfDay = new Date(this.clock.now());
    startOfDay.setUTCHours(0, 0, 0, 0);
    const used = await this.usage.countSince(userId, startOfDay);
    if (used >= this.dailyQuotaPerUser) throw new AIQuotaExceededError();
  }
}
