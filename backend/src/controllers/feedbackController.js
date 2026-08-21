import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../constants/roles.js';
import * as feedbackService from '../services/feedbackService.js';
import * as registrationService from '../services/registrationService.js';
import * as eventService from '../services/eventService.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function assertEventAccess(eventId, user) {
  const event = await eventService.findEventById(eventId);
  if (!event) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }
  if (
    user.role !== ROLES.ADMIN &&
    user.role !== ROLES.STAFF &&
    event.companyId !== user.companyId
  ) {
    const err = new Error("Forbidden: not your company's event");
    err.statusCode = 403;
    throw err;
  }
  return event;
}

// ── Handlers ──────────────────────────────────────────────────────────────────

/**
 * POST /api/events/:eventId/registrations/:registrationId/feedback  (VOLUNTEER)
 * Submit feedback for a registration.
 * Body: { overallComment?, language?, ratings: [{ themeId, rating }] }
 */
export const submitFeedback = asyncHandler(async (req, res) => {
  const { registrationId } = req.params;

  // Confirm this registration belongs to the calling volunteer.
  const registration = await registrationService.findRegistrationById(registrationId);
  if (!registration || registration.userId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden: not your registration' });
  }

  const { overallComment, language, ratings } = req.body || {};

  if (!ratings || !Array.isArray(ratings) || ratings.length === 0) {
    return res.status(400).json({ message: 'ratings array is required' });
  }

  const feedback = await feedbackService.submitFeedback(registrationId, {
    overallComment,
    language,
    ratings,
  });

  return res.status(201).json({ feedback: feedbackService.sanitizeFeedback(feedback) });
});

/**
 * GET /api/events/:eventId/feedback                 (ADMIN, STAFF, SPOC)
 * All feedback submissions for an event.
 */
export const listEventFeedback = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  await assertEventAccess(eventId, req.user);

  const feedbacks = await feedbackService.listFeedbackForEvent(eventId);
  return res.status(200).json({ feedback: feedbacks.map(feedbackService.sanitizeFeedback) });
});

/**
 * GET /api/events/:eventId/feedback/stats           (ADMIN, STAFF, SPOC)
 * Aggregated average ratings per theme for an event.
 */
export const getEventFeedbackStats = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  await assertEventAccess(eventId, req.user);

  const stats = await feedbackService.getFeedbackStats(eventId);
  return res.status(200).json({ stats });
});

/**
 * GET /api/events/:eventId/feedback/me              (VOLUNTEER)
 * The calling volunteer's own feedback for this event.
 */
export const getMyFeedback = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const feedback = await feedbackService.getMyFeedback(req.user.id, eventId);
  if (!feedback) {
    return res.status(404).json({ message: 'You have not submitted feedback for this event' });
  }
  return res.status(200).json({ feedback: feedbackService.sanitizeFeedback(feedback) });
});

/**
 * GET /api/feedback/:feedbackId                     (owner, ADMIN, STAFF, SPOC)
 * Retrieve a single feedback by its ID.
 */
export const getFeedback = asyncHandler(async (req, res) => {
  const feedback = await feedbackService.getFeedback(req.params.feedbackId);
  if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

  const reg = feedback.registration;

  // VOLUNTEER: only their own feedback.
  if (req.user.role === ROLES.VOLUNTEER && reg.userId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  // SPOC: only their company's feedback.
  if (req.user.role === ROLES.SPOC && reg.event?.companyId !== req.user.companyId) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return res.status(200).json({ feedback: feedbackService.sanitizeFeedback(feedback) });
});
