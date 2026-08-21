import { prisma } from '../config/db.js';
import { ROLES } from '../constants/roles.js';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * EVENT SERVICE  (Prisma-backed)
 * ────────────────────────────────────────────────────────────────────────────
 * Business rules enforced here:
 *   RULE 7  : event belongs to exactly one company (companyId NOT NULL)
 *   RULE 8/9: only an NgoUser with role ADMIN may create events (checked in controller)
 *   RULE 10 : spocId is optional; validated via service when supplied
 *   RULE 11 : SPOC must belong to the event's company (DB composite FK + service assert)
 */

/** Safe DTO for API responses. */
export function sanitizeEvent(event) {
  if (!event) return null;
  return {
    id: event.eventId,
    companyId: event.companyId,
    adminId: event.adminId,
    spocId: event.spocId ?? null,
    eventName: event.eventName,
    description: event.description,
    location: event.location,
    status: event.status,
    eventDate: event.eventDate,
    feedbackStart: event.feedbackStart ?? null,
    feedbackEnd: event.feedbackEnd ?? null,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

/**
 * Create a new event. Admin-only in the controller.
 */
export async function createEvent({
  companyId,
  adminId,
  spocId,
  eventName,
  description,
  location,
  eventDate,
  feedbackStart,
  feedbackEnd,
}) {
  // If spocId is supplied, verify that SPOC belongs to this company and has role SPOC.
  if (spocId) {
    await assertAssignableSpoc(companyId, spocId);
  }

  return prisma.event.create({
    data: {
      companyId,
      adminId,
      spocId: spocId ?? null,
      eventName,
      description,
      location,
      eventDate: new Date(eventDate),
      feedbackStart: feedbackStart ? new Date(feedbackStart) : null,
      feedbackEnd: feedbackEnd ? new Date(feedbackEnd) : null,
    },
  });
}

/**
 * List events — scoped by caller role.
 *   ADMIN/STAFF  → all events (optional companyId filter)
 *   SPOC/VOLUNTEER → only their company's events
 *
 * Supports optional status filter and pagination.
 */
export async function listEvents({ companyId, status, page = 1, limit = 20 } = {}) {
  const where = {};
  if (companyId) where.companyId = companyId;
  if (status) where.status = status;

  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { eventDate: 'asc' },
      skip,
      take: limit,
      include: {
        company: { select: { companyName: true } },
        spoc: { select: { name: true, email: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return { events, total, page, limit };
}

/** Get a single event by ID. Returns null if not found. */
export async function findEventById(eventId) {
  return prisma.event.findUnique({
    where: { eventId },
    include: {
      company: { select: { companyName: true } },
      spoc: { select: { name: true, email: true } },
      admin: { select: { name: true, email: true } },
    },
  });
}

/**
 * Update mutable event fields (excludes companyId, adminId).
 */
export async function updateEvent(
  eventId,
  { spocId, eventName, description, location, eventDate, feedbackStart, feedbackEnd }
) {
  const event = await prisma.event.findUnique({ where: { eventId } });
  if (!event) return null;

  if (spocId !== undefined) {
    if (spocId !== null) {
      await assertAssignableSpoc(event.companyId, spocId);
    }
  }

  const data = {};
  if (spocId !== undefined) data.spocId = spocId;
  if (eventName !== undefined) data.eventName = eventName;
  if (description !== undefined) data.description = description;
  if (location !== undefined) data.location = location;
  if (eventDate !== undefined) data.eventDate = new Date(eventDate);
  if (feedbackStart !== undefined) data.feedbackStart = feedbackStart ? new Date(feedbackStart) : null;
  if (feedbackEnd !== undefined) data.feedbackEnd = feedbackEnd ? new Date(feedbackEnd) : null;

  return prisma.event.update({ where: { eventId }, data });
}

/**
 * Change event status. CANCELLED is final (events are never deleted).
 */
export async function updateEventStatus(eventId, status) {
  return prisma.event.update({
    where: { eventId },
    data: { status },
  });
}

/**
 * Assign (or unassign) a SPOC to an event.
 * RULE 11: the SPOC must belong to the event's company.
 */
export async function assignSpoc(eventId, spocId) {
  const event = await prisma.event.findUnique({ where: { eventId } });
  if (!event) return null;

  if (spocId) {
    await assertAssignableSpoc(event.companyId, spocId);
  }

  return prisma.event.update({
    where: { eventId },
    data: { spocId: spocId ?? null },
  });
}

/**
 * Cancel an event (sets status = CANCELLED).
 * Events are never hard-deleted — registrations + feedback must stay auditable.
 */
export async function cancelEvent(eventId) {
  return prisma.event.update({
    where: { eventId },
    data: { status: 'CANCELLED' },
  });
}

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Throws a 400-like error if the user is not a SPOC of the given company.
 * RULE 11: database composite FK enforces the company match; this service
 * check additionally confirms the role = SPOC.
 */
async function assertAssignableSpoc(companyId, spocId) {
  const user = await prisma.companyUser.findFirst({
    where: { userId: spocId, companyId, role: ROLES.SPOC, deletedAt: null },
  });
  if (!user) {
    const err = new Error('The specified user is not a SPOC of this company');
    err.statusCode = 400;
    throw err;
  }
}
