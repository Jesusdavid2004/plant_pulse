import { Router } from 'express';
import plantRoutes from './plantRoutes';
import analysisRoutes from './analysisRoutes';

const router = Router();

router.use('/plants', plantRoutes);
router.use('/analysis', analysisRoutes);

export default router;
