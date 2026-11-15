import type { PrismaClient } from './generated/prisma/client.js';
import { PlantPhotoAnalyzer } from './application/ai/PlantPhotoAnalyzer';
import { DeleteAccountUseCase } from './application/auth/DeleteAccountUseCase';
import { GetCurrentUserUseCase } from './application/auth/GetCurrentUserUseCase';
import { LoginUserUseCase } from './application/auth/LoginUserUseCase';
import { LogoutUserUseCase } from './application/auth/LogoutUserUseCase';
import { RefreshSessionUseCase } from './application/auth/RefreshSessionUseCase';
import { RegisterUserUseCase } from './application/auth/RegisterUserUseCase';
import { SessionIssuer } from './application/auth/SessionIssuer';
import { GetPlantMoodUseCase } from './application/care/GetPlantMoodUseCase';
import { LogCareEventUseCase } from './application/care/LogCareEventUseCase';
import { CheckupPlantUseCase } from './application/plants/CheckupPlantUseCase';
import { DeletePlantUseCase } from './application/plants/DeletePlantUseCase';
import { GetPlantUseCase } from './application/plants/GetPlantUseCase';
import { ListAnalysesUseCase } from './application/plants/ListAnalysesUseCase';
import { ListPlantsUseCase } from './application/plants/ListPlantsUseCase';
import { RegisterPlantWithPhotoUseCase } from './application/plants/RegisterPlantWithPhotoUseCase';
import { UpdatePlantUseCase } from './application/plants/UpdatePlantUseCase';
import type { AIProvider } from './domain/ai/AIProvider';
import type { ImageProcessor, ImageStorage } from './domain/ai/repositories';
import type { AccessTokenService } from './domain/auth/repositories';
import type { PhotoRepository } from './domain/plants/repositories';
import { createAIProvider } from './infrastructure/ai/createAIProvider';
import { PrismaCareEventRepository } from './infrastructure/care/PrismaCareEventRepository';
import { PrismaPlantReader } from './infrastructure/care/PrismaPlantReader';
import { SystemClock } from './infrastructure/care/SystemClock';
import { LocalImageStorage } from './infrastructure/images/LocalImageStorage';
import { SharpImageProcessor } from './infrastructure/images/SharpImageProcessor';
import {
  PrismaAiCacheRepository,
  PrismaAiUsageRepository,
} from './infrastructure/prisma/PrismaAiRepositories';
import { PrismaAnalysisRepository } from './infrastructure/prisma/PrismaAnalysisRepository';
import { PrismaPhotoRepository } from './infrastructure/prisma/PrismaPhotoRepository';
import { PrismaPlantRepository } from './infrastructure/prisma/PrismaPlantRepository';
import { PrismaRefreshTokenRepository } from './infrastructure/prisma/PrismaRefreshTokenRepository';
import { PrismaUserRepository } from './infrastructure/prisma/PrismaUserRepository';
import {
  BcryptPasswordHasher,
  CryptoRefreshTokenFactory,
  JwtAccessTokenService,
} from './infrastructure/security/security';
import type { AppConfig } from './shared/config';

const TIMING_EQUALIZER_PASSWORD = 'timing-equalizer-password';

export interface ContainerOverrides {
  aiProvider?: AIProvider;
  imageStorage?: ImageStorage;
  imageProcessor?: ImageProcessor;
  passwordHashCost?: number;
}

export interface Container {
  accessTokens: AccessTokenService;
  photos: PhotoRepository;
  imageStorage: ImageStorage;
  useCases: ReturnType<typeof buildUseCases>;
}

function buildUseCases(deps: {
  prisma: PrismaClient;
  config: AppConfig;
  aiProvider: AIProvider;
  imageStorage: ImageStorage;
  imageProcessor: ImageProcessor;
  accessTokens: AccessTokenService;
  timingEqualizerHash: string;
  passwordHasher: BcryptPasswordHasher;
}) {
  const { prisma, config, imageStorage } = deps;
  const clock = new SystemClock();
  const users = new PrismaUserRepository(prisma);
  const refreshTokens = new PrismaRefreshTokenRepository(prisma);
  const refreshFactory = new CryptoRefreshTokenFactory(config.auth.refreshTokenDays);
  const sessions = new SessionIssuer(deps.accessTokens, refreshFactory, refreshTokens);
  const plants = new PrismaPlantRepository(prisma);
  const analyses = new PrismaAnalysisRepository(prisma);
  const photos = new PrismaPhotoRepository(prisma);
  const careEvents = new PrismaCareEventRepository(prisma);
  const plantReader = new PrismaPlantReader(prisma);
  const analyzer = new PlantPhotoAnalyzer(
    deps.aiProvider,
    deps.imageProcessor,
    new PrismaAiUsageRepository(prisma),
    clock,
    config.ai.dailyQuotaPerUser,
  );

  return {
    registerUser: new RegisterUserUseCase(users, deps.passwordHasher, sessions, clock),
    loginUser: new LoginUserUseCase(
      users,
      deps.passwordHasher,
      sessions,
      clock,
      deps.timingEqualizerHash,
    ),
    refreshSession: new RefreshSessionUseCase(
      users,
      refreshTokens,
      refreshFactory,
      sessions,
      clock,
    ),
    logoutUser: new LogoutUserUseCase(refreshTokens, refreshFactory, clock),
    getCurrentUser: new GetCurrentUserUseCase(users),
    deleteAccount: new DeleteAccountUseCase(users, photos, imageStorage),
    listPlants: new ListPlantsUseCase(plants),
    getPlant: new GetPlantUseCase(plants),
    updatePlant: new UpdatePlantUseCase(plants),
    deletePlant: new DeletePlantUseCase(plants, photos, imageStorage),
    listAnalyses: new ListAnalysesUseCase(plants, analyses),
    registerPlantWithPhoto: new RegisterPlantWithPhotoUseCase(
      analyzer,
      plants,
      analyses,
      photos,
      imageStorage,
    ),
    checkupPlant: new CheckupPlantUseCase(analyzer, plants, analyses, photos, imageStorage),
    logCareEvent: new LogCareEventUseCase(plantReader, careEvents, clock),
    getPlantMood: new GetPlantMoodUseCase(plantReader, careEvents, clock),
  };
}

export async function buildContainer(
  prisma: PrismaClient,
  config: AppConfig,
  overrides: ContainerOverrides = {},
): Promise<Container> {
  const passwordHasher = new BcryptPasswordHasher(overrides.passwordHashCost);
  const accessTokens = new JwtAccessTokenService(
    config.auth.jwtSecret,
    config.auth.accessTokenMinutes,
  );
  const imageStorage = overrides.imageStorage ?? new LocalImageStorage(config.upload.dir);

  const useCases = buildUseCases({
    prisma,
    config,
    aiProvider:
      overrides.aiProvider ?? createAIProvider(config, new PrismaAiCacheRepository(prisma)),
    imageStorage,
    imageProcessor: overrides.imageProcessor ?? new SharpImageProcessor(),
    accessTokens,
    timingEqualizerHash: await passwordHasher.hash(TIMING_EQUALIZER_PASSWORD),
    passwordHasher,
  });

  return { accessTokens, photos: new PrismaPhotoRepository(prisma), imageStorage, useCases };
}
