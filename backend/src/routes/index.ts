import { Router } from 'express';
import plantRoutes from './plantRoutes';
import analysisRoutes from './analysisRoutes';
import careRoutes from '../presentation/care/careRoutes';

const router = Router();

router.use('/plants', careRoutes);
router.use('/plants', plantRoutes);
router.use('/analysis', analysisRoutes);

export default router;
