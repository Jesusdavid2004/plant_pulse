import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import type { Container } from '../../container';
import { PlantNotFoundError } from '../../domain/errors';
import { HTTP_STATUS } from '../../shared/constants';
import { requireAuth, requireUploadedImage } from './middlewares';
import { currentUserId, paramId, parseOrThrow, requestLocale, sendData } from './support';

const MAX_NAME_LENGTH = 100;
const PHOTO_CACHE_CONTROL = 'private, max-age=300';

const nameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH);
const registerFieldsSchema = z.object({ name: nameSchema.optional() });
const updatePlantSchema = z
  .object({
    name: nameSchema.optional(),
    species: z.string().trim().max(MAX_NAME_LENGTH).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);
const careSchema = z.object({ type: z.string().min(1).max(MAX_NAME_LENGTH) });

export interface PlantRouterDependencies {
  container: Container;
  imageUpload: RequestHandler;
  aiLimiter: RequestHandler;
}

export function createPlantRouter({
  container,
  imageUpload,
  aiLimiter,
}: PlantRouterDependencies): Router {
  const router = Router();
  const { useCases } = container;
  router.use(requireAuth(container.accessTokens));

  router.get('/', async (_req, res) => {
    sendData(res, await useCases.listPlants.execute({ ownerId: currentUserId(res) }));
  });

  router.post('/', aiLimiter, imageUpload, async (req, res) => {
    const { name } = parseOrThrow(registerFieldsSchema, req.body ?? {});
    const registration = await useCases.registerPlantWithPhoto.execute({
      ownerId: currentUserId(res),
      rawImage: requireUploadedImage(req),
      locale: requestLocale(req),
      name: name ?? null,
    });
    sendData(res, registration, HTTP_STATUS.CREATED);
  });

  router.get('/:id', async (req, res) => {
    sendData(
      res,
      await useCases.getPlant.execute({ plantId: paramId(req), ownerId: currentUserId(res) }),
    );
  });

  router.patch('/:id', async (req, res) => {
    const changes = parseOrThrow(updatePlantSchema, req.body);
    sendData(
      res,
      await useCases.updatePlant.execute({
        plantId: paramId(req),
        ownerId: currentUserId(res),
        changes: {
          ...(changes.name !== undefined && { name: changes.name }),
          ...(changes.species !== undefined && { species: changes.species }),
        },
      }),
    );
  });

  router.delete('/:id', async (req, res) => {
    await useCases.deletePlant.execute({ plantId: paramId(req), ownerId: currentUserId(res) });
    res.status(HTTP_STATUS.NO_CONTENT).end();
  });

  router.post('/:id/checkups', aiLimiter, imageUpload, async (req, res) => {
    const checkup = await useCases.checkupPlant.execute({
      plantId: paramId(req),
      ownerId: currentUserId(res),
      rawImage: requireUploadedImage(req),
      locale: requestLocale(req),
    });
    sendData(res, checkup, HTTP_STATUS.CREATED);
  });

  router.get('/:id/analyses', async (req, res) => {
    sendData(
      res,
      await useCases.listAnalyses.execute({ plantId: paramId(req), ownerId: currentUserId(res) }),
    );
  });

  router.post('/:id/care', async (req, res) => {
    const { type } = parseOrThrow(careSchema, req.body);
    const result = await useCases.logCareEvent.execute({
      plantId: paramId(req),
      ownerId: currentUserId(res),
      type,
    });
    sendData(res, result, HTTP_STATUS.CREATED);
  });

  router.get('/:id/mood', async (req, res) => {
    sendData(
      res,
      await useCases.getPlantMood.execute({ plantId: paramId(req), ownerId: currentUserId(res) }),
    );
  });

  router.get('/:id/photos/:photoId', async (req, res) => {
    const photo = await container.photos.findForOwner(paramId(req, 'photoId'), currentUserId(res));
    if (!photo || photo.plantId !== paramId(req)) throw new PlantNotFoundError();
    res.setHeader('Cache-Control', PHOTO_CACHE_CONTROL);
    res.type('image/jpeg').send(await container.imageStorage.read(photo.storageKey));
  });

  return router;
}
