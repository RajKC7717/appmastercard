import { Router } from 'express';

import { authorize } from '../middleware/roleMiddleware.js';
import { ROLES } from '../constants/roles.js';
import {
  submitFeedback,
  listEventFeedback,
  getEventFeedbackStats,
  getMyFeedback,
} from '../controllers/feedbackController.js';

// mergeParams: true so :eventId and :registrationId from parent routers are available.
const router = Router({ mergeParams: true });

// POST /api/events/:eventId/registrations/:registrationId/feedback   (VOLUNTEER)
router.post('/', authorize(ROLES.VOLUNTEER), submitFeedback);

export default router;
