import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../constants/roles.js';
import * as eventService from '../services/eventService.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve companyId scope based on caller role. */
function scopeCompanyId(user, queryCompanyId) {
  if (user.role === ROLES.ADMIN || user.role === ROLES.STAFF) {
    return queryCompanyId || undefined; // ADMIN/STAFF can filter by any or see all
  }
  return user.companyId; // SPOC/VOLUNTEER see only their own company
}

// ── Handlers ──────────────────────────────────────────────────────────────────

/**
 * POST /api/events           (ADMIN only)
 * Body: { companyId, spocId?, eventName, description, location, eventDate,
 *         feedbackStart?, feedbackEnd? }
 */
export const createEvent = asyncHandler(async (req, res) => {
  const {
    companyId,
    spocId,
    eventName,
    description,
    location,
    eventDate,
    feedbackStart,
    feedbackEnd,
  } = req.body || {};

  if (!companyId || !eventName || !description || !location || !eventDate) {
    return res.status(400).json({
      message: 'companyId, eventName, description, location, and eventDate are required',
    });
  }

  const event = await eventService.createEvent({
    companyId,
    adminId: req.user.id,
    spocId: spocId || null,
    eventName,
    description,
    location,
    eventDate,
    feedbackStart: feedbackStart || null,
    feedbackEnd: feedbackEnd || null,
  });

  return res.status(201).json({ event: eventService.sanitizeEvent(event) });
});

/**
 * GET /api/events            (all authenticated users, role-scoped)
 * Query: ?companyId=&status=&page=&limit=
 */
export const listEvents = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const companyId = scopeCompanyId(req.user, req.query.companyId);

  const result = await eventService.listEvents({
    companyId,
    status: status || undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });

  return res.status(200).json({
    events: result.events.map(eventService.sanitizeEvent),
    pagination: { total: result.total, page: result.page, limit: result.limit },
  });
});

/**
 * GET /api/events/:eventId   (all authenticated users, company-scoped)
 */
export const getEvent = asyncHandler(async (req, res) => {
  const event = await eventService.findEventById(req.params.eventId);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  // Non-admin/staff can only see their own company's events.
  if (
    req.user.role !== ROLES.ADMIN &&
    req.user.role !== ROLES.STAFF &&
    event.companyId !== req.user.companyId
  ) {
    return res.status(403).json({ message: 'Forbidden: not your company event' });
  }

  return res.status(200).json({ event: eventService.sanitizeEvent(event) });
});

/**
 * PATCH /api/events/:eventId (ADMIN only)
 * Body: any subset of { spocId, eventName, description, location, eventDate,
 *                       feedbackStart, feedbackEnd }
 */
export const updateEvent = asyncHandler(async (req, res) => {
  const updated = await eventService.updateEvent(req.params.eventId, req.body || {});
  if (!updated) return res.status(404).json({ message: 'Event not found' });
  return res.status(200).json({ event: eventService.sanitizeEvent(updated) });
});

/**
 * PATCH /api/events/:eventId/status   (ADMIN only)
 * Body: { status: 'UPCOMING'|'REGISTRATION_OPEN'|'ONGOING'|'COMPLETED'|'CANCELLED' }
 */
export const changeEventStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  const validStatuses = ['UPCOMING', 'REGISTRATION_OPEN', 'ONGOING', 'COMPLETED', 'CANCELLED'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
  }

  const updated = await eventService.updateEventStatus(req.params.eventId, status);
  if (!updated) return res.status(404).json({ message: 'Event not found' });
  return res.status(200).json({ event: eventService.sanitizeEvent(updated) });
});

/**
 * PATCH /api/events/:eventId/spoc     (ADMIN only)
 * Body: { spocId: '<uuid>' | null }
 */
export const assignSpoc = asyncHandler(async (req, res) => {
  const { spocId } = req.body || {};
  const updated = await eventService.assignSpoc(req.params.eventId, spocId ?? null);
  if (!updated) return res.status(404).json({ message: 'Event not found' });
  return res.status(200).json({ event: eventService.sanitizeEvent(updated) });
});

/**
 * DELETE /api/events/:eventId         (ADMIN only)
 * Cancels the event — events are never hard-deleted.
 */
export const cancelEvent = asyncHandler(async (req, res) => {
  const updated = await eventService.cancelEvent(req.params.eventId);
  if (!updated) return res.status(404).json({ message: 'Event not found' });
  return res.status(200).json({ message: 'Event cancelled', event: eventService.sanitizeEvent(updated) });
});
