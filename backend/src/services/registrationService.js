import { prisma } from '../config/db.js';
import { ROLES } from '../constants/roles.js';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * REGISTRATION SERVICE  (Prisma-backed)
 * ────────────────────────────────────────────────────────────────────────────
 * Business rules enforced here:
 *   RULE 12: volunteer may only register for their own company's events
 *   RULE 13: one registration per (event, volunteer) — Prisma unique constraint
 *   RULE 14: feedback requires a registration — FK on Feedback.registrationId
 */

/** Safe DTO for API responses. */
export function sanitizeRegistration(reg) {
  if (!reg) return null;
  return {
    id: reg.registrationId,
    eventId: reg.eventId,
    userId: reg.userId,
    attendanceStatus: reg.attendanceStatus,
    registeredAt: reg.registeredAt,
    feedbackSubmittedAt: reg.feedbackSubmittedAt ?? null,
    volunteer: reg.volunteer
      ? { id: reg.volunteer.userId, name: reg.volunteer.name, email: reg.volunteer.email }
      : undefined,
  };
}

/**
 * Register a volunteer for an event.
 * RULE 12: volunteer's companyId must match event's companyId.
 * RULE 13: duplicate registration → Prisma unique constraint → P2002.
 */
export async function registerVolunteer(eventId, volunteerId) {
  // Load both in parallel.
  const [event, volunteer] = await Promise.all([
    prisma.event.findUnique({ where: { eventId } }),
    prisma.companyUser.findUnique({ where: { userId: volunteerId } }),
  ]);

  if (!event) {
    const err = new Error('Event not found');
    err.statusCode = 404;
    throw err;
  }
  if (!volunteer || volunteer.role !== ROLES.VOLUNTEER) {
    const err = new Error('Volunteer not found');
    err.statusCode = 404;
    throw err;
  }

  // RULE 12: cross-company check.
  if (volunteer.companyId !== event.companyId) {
    const err = new Error('You may only register for your own company\'s events');
    err.statusCode = 403;
    throw err;
  }

  // Events must be open for registration.
  if (event.status !== 'REGISTRATION_OPEN') {
    const err = new Error(`Registration is not open for this event (current status: ${event.status})`);
    err.statusCode = 400;
    throw err;
  }

  try {
    return await prisma.eventRegistration.create({
      data: { eventId, userId: volunteerId },
      include: { volunteer: { select: { userId: true, name: true, email: true } } },
    });
  } catch (err) {
    // Prisma unique-constraint violation → duplicate registration (RULE 13).
    if (err.code === 'P2002') {
      const dup = new Error('You are already registered for this event');
      dup.statusCode = 409;
      throw dup;
    }
    throw err;
  }
}

/**
 * List all registrations for an event.
 */
export async function listRegistrations(eventId) {
  return prisma.eventRegistration.findMany({
    where: { eventId },
    orderBy: { registeredAt: 'asc' },
    include: { volunteer: { select: { userId: true, name: true, email: true } } },
  });
}

/** Get a single registration by ID. */
export async function findRegistrationById(registrationId) {
  return prisma.eventRegistration.findUnique({
    where: { registrationId },
    include: {
      volunteer: { select: { userId: true, name: true, email: true } },
      event: { select: { eventId: true, eventName: true, companyId: true } },
    },
  });
}

/** Get registration by eventId + volunteerId. */
export async function findRegistrationByEventAndUser(eventId, userId) {
  return prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId } },
    include: { volunteer: { select: { userId: true, name: true, email: true } } },
  });
}

/**
 * Update attendance status for a registration.
 * Allowed statuses: ATTENDED, ABSENT, REGISTERED, CANCELLED.
 */
export async function updateAttendance(registrationId, attendanceStatus) {
  return prisma.eventRegistration.update({
    where: { registrationId },
    data: { attendanceStatus },
  });
}

/**
 * Cancel (soft-cancel) a registration by setting attendanceStatus = CANCELLED.
 */
export async function cancelRegistration(registrationId) {
  return prisma.eventRegistration.update({
    where: { registrationId },
    data: { attendanceStatus: 'CANCELLED' },
  });
}
