import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './authRoutes.js';
import companyRoutes from './companyRoutes.js';
import eventRoutes from './eventRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';
import themeRoutes from './themeRoutes.js';
import testRoutes from './testRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/events', eventRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/themes', themeRoutes);
router.use('/test', testRoutes);

export default router;
