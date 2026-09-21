import { Router } from 'express';
import { AnalysisController } from '../controllers/AnalysisController';

const router = Router();
const analysisController = new AnalysisController();

router.post('/analyze', (req, res) => analysisController.analyze(req, res));
router.get('/plant/:plantId', (req, res) => analysisController.getByPlant(req, res));

export default router;
