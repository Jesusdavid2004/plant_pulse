import { Router } from 'express';
import plantRoutes from './plantRoutes';

const router = Router();

router.use('/plants', plantRoutes);

export default router;
