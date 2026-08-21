import { Router } from 'express';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { ROLES } from '../constants/roles.js';
import {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  changeEventStatus,
  assignSpoc,
  cancelEvent,
} from '../controllers/eventController.js';
import {
  listEventFeedback,
  getEventFeedbackStats,
  getMyFeedback,
} from '../controllers/feedbackController.js';
import registrationRoutes from './registrationRoutes.js';

const router = Router();

// All event routes require authentication.
router.use(protect);

// ── Collection ────────────────────────────────────────────────────────────────
// POST   /api/events              (ADMIN only)
router.post('/', authorize(ROLES.ADMIN), createEvent);

// GET    /api/events              (all — role-scoped in controller)
router.get('/', listEvents);

// ── Single event ──────────────────────────────────────────────────────────────
// GET    /api/events/:eventId
router.get('/:eventId', getEvent);

// PATCH  /api/events/:eventId     (ADMIN only)
router.patch('/:eventId', authorize(ROLES.ADMIN), updateEvent);

// PATCH  /api/events/:eventId/status   (ADMIN only)
router.patch('/:eventId/status', authorize(ROLES.ADMIN), changeEventStatus);

// PATCH  /api/events/:eventId/spoc     (ADMIN only)
router.patch('/:eventId/spoc', authorize(ROLES.ADMIN), assignSpoc);

// DELETE /api/events/:eventId     (ADMIN only — sets CANCELLED)
router.delete('/:eventId', authorize(ROLES.ADMIN), cancelEvent);

// ── Event-level feedback endpoints ────────────────────────────────────────────
// GET  /api/events/:eventId/feedback         (ADMIN, STAFF, SPOC)
router.get(
  '/:eventId/feedback',
  authorize(ROLES.ADMIN, ROLES.STAFF, ROLES.SPOC),
  listEventFeedback
);

// GET  /api/events/:eventId/feedback/stats   (ADMIN, STAFF, SPOC)
router.get(
  '/:eventId/feedback/stats',
  authorize(ROLES.ADMIN, ROLES.STAFF, ROLES.SPOC),
  getEventFeedbackStats
);

// GET  /api/events/:eventId/feedback/me      (VOLUNTEER)
router.get('/:eventId/feedback/me', authorize(ROLES.VOLUNTEER), getMyFeedback);

// ── Nested registrations ──────────────────────────────────────────────────────
// All /api/events/:eventId/registrations/* → handled by registrationRoutes.
router.use('/:eventId/registrations', registrationRoutes);

export default router;
