import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import prisma from '../config/prisma';

export class PlantController extends BaseController {
  async getAll(req: Request, res: Response) {
    return this.handleRequest(req, res, async () => {
      const plants = await prisma.plant.findMany({
        include: { images: true, analyses: true },
      });
      return plants;
    });
  }

  async getById(req: Request, res: Response) {
    return this.handleRequest(req, res, async () => {
      const { id } = req.params;
      const plant = await prisma.plant.findUnique({
        where: { id },
        include: { images: true, analyses: true },
      });
      if (!plant) {
        throw new Error('Plant not found');
      }
      return plant;
    });
  }

  async create(req: Request, res: Response) {
    return this.handleRequest(req, res, async () => {
      const { name, species, userId } = req.body;
      const plant = await prisma.plant.create({
        data: { name, species, userId },
      });
      return plant;
    });
  }

  async update(req: Request, res: Response) {
    return this.handleRequest(req, res, async () => {
      const { id } = req.params;
      const { name, species, status } = req.body;
      const plant = await prisma.plant.update({
        where: { id },
        data: { name, species, status },
      });
      return plant;
    });
  }

  async delete(req: Request, res: Response) {
    return this.handleRequest(req, res, async () => {
      const { id } = req.params;
      await prisma.plant.delete({ where: { id } });
      return { message: 'Plant deleted successfully' };
    });
  }
}
