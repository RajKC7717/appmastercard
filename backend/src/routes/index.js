import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/health', healthRoutes);
// Add more route groups here:
// router.use('/users', userRoutes);

export default router;
