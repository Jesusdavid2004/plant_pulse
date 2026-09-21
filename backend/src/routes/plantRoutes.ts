import { Router } from 'express';
import { PlantController } from '../controllers/PlantController';
import upload from '../services/uploadService';
import { validateFileUpload } from '../middlewares/fileValidation';
import { validateInputs } from '../middlewares/validateInputs';
import {
  createPlantValidation,
  updatePlantValidation,
  plantIdValidation,
} from '../middlewares/validators';

const router = Router();
const plantController = new PlantController();

router.get('/', (req, res) => plantController.getAll(req, res));
router.get('/:id', plantIdValidation, validateInputs, (req, res) =>
  plantController.getById(req, res)
);
router.post('/', createPlantValidation, validateInputs, (req, res) =>
  plantController.create(req, res)
);
router.put('/:id', updatePlantValidation, validateInputs, (req, res) =>
  plantController.update(req, res)
);
router.delete('/:id', plantIdValidation, validateInputs, (req, res) =>
  plantController.delete(req, res)
);

router.post(
  '/:id/images',
  plantIdValidation,
  validateInputs,
  upload.single('image'),
  validateFileUpload,
  (req, res) => {
    res.json({
      success: true,
      data: { filename: req.file?.filename, path: req.file?.path },
    });
  }
);

export default router;
