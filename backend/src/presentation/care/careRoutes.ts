import { Router } from 'express';
import { container } from '../../container';
import { validateInputs } from '../../middlewares/validateInputs';
import { plantIdValidation } from '../../middlewares/validators';

const CREATED_STATUS = 201;

const router = Router();

router.post('/:id/care', plantIdValidation, validateInputs, async (req, res) => {
  const result = await container.logCareEvent.execute({
    plantId: req.params.id as string,
    type: req.body?.type,
  });
  res.status(CREATED_STATUS).json({ success: true, data: result });
});

router.get('/:id/mood', plantIdValidation, validateInputs, async (req, res) => {
  const result = await container.getPlantMood.execute({ plantId: req.params.id as string });
  res.json({ success: true, data: result });
});

export default router;
