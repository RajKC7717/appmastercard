import { Router } from 'express';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { getFeedback } from '../controllers/feedbackController.js';

const router = Router();

// All routes require authentication.
router.use(protect);

// GET /api/feedback/:feedbackId   (owner, ADMIN, STAFF, SPOC)
router.get(
  '/:feedbackId',
  authorize(ROLES.ADMIN, ROLES.STAFF, ROLES.SPOC, ROLES.VOLUNTEER),
  getFeedback
);

export default router;
