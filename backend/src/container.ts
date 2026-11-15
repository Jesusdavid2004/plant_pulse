import prisma from './config/prisma';
import { GetPlantMoodUseCase } from './application/care/GetPlantMoodUseCase';
import { LogCareEventUseCase } from './application/care/LogCareEventUseCase';
import { PrismaCareEventRepository } from './infrastructure/care/PrismaCareEventRepository';
import { PrismaPlantReader } from './infrastructure/care/PrismaPlantReader';
import { SystemClock } from './infrastructure/care/SystemClock';

const plantReader = new PrismaPlantReader(prisma);
const careEvents = new PrismaCareEventRepository(prisma);
const clock = new SystemClock();

export const container = {
  logCareEvent: new LogCareEventUseCase(plantReader, careEvents, clock),
  getPlantMood: new GetPlantMoodUseCase(plantReader, careEvents, clock),
};
