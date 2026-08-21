import { Router } from 'express';

import { authorize } from '../middleware/roleMiddleware.js';
import { ROLES } from '../constants/roles.js';
import {
  registerForEvent,
  listRegistrations,
  getMyRegistration,
  markAttendance,
  cancelRegistration,
} from '../controllers/registrationController.js';
import registrationFeedbackRoutes from './registrationFeedbackRoutes.js';

// mergeParams: true so :eventId from parent eventRoutes is available.
const router = Router({ mergeParams: true });

// POST   /api/events/:eventId/registrations             (VOLUNTEER)
router.post('/', authorize(ROLES.VOLUNTEER), registerForEvent);

// GET    /api/events/:eventId/registrations             (ADMIN, STAFF, SPOC)
router.get('/', authorize(ROLES.ADMIN, ROLES.STAFF, ROLES.SPOC), listRegistrations);

// GET    /api/events/:eventId/registrations/me          (VOLUNTEER)
router.get('/me', authorize(ROLES.VOLUNTEER), getMyRegistration);

// PATCH  /api/events/:eventId/registrations/:registrationId/attendance  (ADMIN, STAFF, SPOC)
router.patch(
  '/:registrationId/attendance',
  authorize(ROLES.ADMIN, ROLES.STAFF, ROLES.SPOC),
  markAttendance
);

// DELETE /api/events/:eventId/registrations/:registrationId  (VOLUNTEER-self, ADMIN, STAFF)
router.delete(
  '/:registrationId',
  authorize(ROLES.ADMIN, ROLES.STAFF, ROLES.SPOC, ROLES.VOLUNTEER),
  cancelRegistration
);

// ── Nested feedback submission ─────────────────────────────────────────────────
// POST /api/events/:eventId/registrations/:registrationId/feedback
router.use('/:registrationId/feedback', registrationFeedbackRoutes);

export default router;
