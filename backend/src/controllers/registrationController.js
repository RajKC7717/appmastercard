import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../constants/roles.js';
import * as registrationService from '../services/registrationService.js';
import * as eventService from '../services/eventService.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Assert the caller (ADMIN/STAFF/SPOC) has access to this event.
 * Returns the event or throws a handled error.
 */
async function getAuthorizedEvent(eventId, user) {
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
 * POST /api/events/:eventId/registrations        (VOLUNTEER)
 * A volunteer registers themselves for the event.
 */
export const registerForEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const volunteerId = req.user.id;

  const registration = await registrationService.registerVolunteer(eventId, volunteerId);
  return res.status(201).json({ registration: registrationService.sanitizeRegistration(registration) });
});

/**
 * GET /api/events/:eventId/registrations         (ADMIN, STAFF, SPOC)
 * Lists all registrations for the event.
 */
export const listRegistrations = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  await getAuthorizedEvent(eventId, req.user);

  const registrations = await registrationService.listRegistrations(eventId);
  return res.status(200).json({
    registrations: registrations.map(registrationService.sanitizeRegistration),
  });
});

/**
 * GET /api/events/:eventId/registrations/me      (VOLUNTEER)
 * Returns the caller's own registration for this event.
 */
export const getMyRegistration = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const registration = await registrationService.findRegistrationByEventAndUser(
    eventId,
    req.user.id
  );
  if (!registration) {
    return res.status(404).json({ message: 'You are not registered for this event' });
  }
  return res.status(200).json({ registration: registrationService.sanitizeRegistration(registration) });
});

/**
 * PATCH /api/events/:eventId/registrations/:registrationId/attendance  (ADMIN, STAFF, SPOC)
 * Mark attendance for a registration.
 * Body: { attendanceStatus: 'ATTENDED' | 'ABSENT' | 'REGISTERED' }
 */
export const markAttendance = asyncHandler(async (req, res) => {
  const { eventId, registrationId } = req.params;
  await getAuthorizedEvent(eventId, req.user);

  const { attendanceStatus } = req.body || {};
  const validStatuses = ['REGISTERED', 'ATTENDED', 'ABSENT'];
  if (!attendanceStatus || !validStatuses.includes(attendanceStatus)) {
    return res.status(400).json({
      message: `attendanceStatus must be one of: ${validStatuses.join(', ')}`,
    });
  }

  const existing = await registrationService.findRegistrationById(registrationId);
  if (!existing || existing.eventId !== eventId) {
    return res.status(404).json({ message: 'Registration not found for this event' });
  }

  const updated = await registrationService.updateAttendance(registrationId, attendanceStatus);
  return res.status(200).json({ registration: registrationService.sanitizeRegistration(updated) });
});

/**
 * DELETE /api/events/:eventId/registrations/:registrationId  (VOLUNTEER-self or ADMIN/STAFF)
 * Sets attendanceStatus = CANCELLED.
 */
export const cancelRegistration = asyncHandler(async (req, res) => {
  const { eventId, registrationId } = req.params;

  const existing = await registrationService.findRegistrationById(registrationId);
  if (!existing || existing.eventId !== eventId) {
    return res.status(404).json({ message: 'Registration not found for this event' });
  }

  // VOLUNTEER may only cancel their own.
  if (req.user.role === ROLES.VOLUNTEER && existing.userId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden: you may only cancel your own registration' });
  }

  // Non-admin/staff SPOC can only cancel registrations in their company's event.
  if (
    req.user.role !== ROLES.ADMIN &&
    req.user.role !== ROLES.STAFF &&
    req.user.role !== ROLES.VOLUNTEER
  ) {
    await getAuthorizedEvent(eventId, req.user);
  }

  const updated = await registrationService.cancelRegistration(registrationId);
  return res.status(200).json({ registration: registrationService.sanitizeRegistration(updated) });
});
