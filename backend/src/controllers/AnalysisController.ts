import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { aiServiceClient } from '../services/aiService';
import prisma from '../config/prisma';

export class AnalysisController extends BaseController {
  async analyze(req: Request, res: Response) {
    return this.handleRequest(req, res, async () => {
      const { plantId, images } = req.body;

      const result = await aiServiceClient.analyze(images, plantId);

      const analysis = await prisma.analysis.create({
        data: {
          plantId,
          healthScore: result.health_score,
          status: result.status,
          diagnosis: result.diagnosis,
          prognosis: result.prognosis,
          carePlan: result.care_plan as any,
        },
      });

      return { analysis, aiResult: result };
    });
  }

  async getByPlant(req: Request, res: Response) {
    return this.handleRequest(req, res, async () => {
      const { plantId } = req.params;
      const analyses = await prisma.analysis.findMany({
        where: { plantId },
        orderBy: { createdAt: 'desc' },
      });
      return analyses;
    });
  }
}
