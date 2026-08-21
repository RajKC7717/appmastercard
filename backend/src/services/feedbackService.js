import { prisma } from '../config/db.js';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * FEEDBACK SERVICE  (Prisma-backed)
 * ────────────────────────────────────────────────────────────────────────────
 * Business rules enforced here:
 *   RULE 14: feedback requires a registration — FK on registrationId
 *   RULE 15: at most one feedback per registration — UNIQUE(registrationId)
 *   RULE 16: ratings must be 1–5 — DB CHECK constraint
 *   RULE 17: one rating per (feedback, theme) — UNIQUE DB constraint
 *   RULE 18: all mandatory themes must be rated — checked before insert
 *   RULE 19/20: overallComment stored verbatim, never rewritten
 */

/** Safe DTO for a full feedback with ratings. */
export function sanitizeFeedback(fb) {
  if (!fb) return null;
  return {
    id: fb.feedbackId,
    registrationId: fb.registrationId,
    overallComment: fb.overallComment ?? null,
    language: fb.language,
    processingStatus: fb.processingStatus,
    submittedAt: fb.submittedAt,
    ratings: (fb.ratings || []).map((r) => ({
      id: r.ratingId,
      themeId: r.themeId,
      themeCode: r.theme?.themeCode,
      themeName: r.theme?.themeName,
      rating: r.rating,
      source: r.source,
    })),
    insights: (fb.insights || []).map((i) => ({
      id: i.insightId,
      detectedTheme: i.detectedTheme,
      sentiment: i.sentiment,
      sentimentScore: i.sentimentScore ? Number(i.sentimentScore) : null,
      confidence: Number(i.confidence),
      evidenceText: i.evidenceText,
      extractionMethod: i.extractionMethod,
    })),
  };
}

/**
 * Submit feedback for a registration.
 * ratings: [{ themeId, rating }]
 *
 * RULE 15: if feedback already exists for this registration, throws 409.
 * RULE 18: all mandatory themes must have a rating in the submission.
 */
export async function submitFeedback(registrationId, { overallComment, language, ratings = [] }) {
  // Load registration to confirm it exists and get the eventId.
  const registration = await prisma.eventRegistration.findUnique({
    where: { registrationId },
    include: { event: true },
  });
  if (!registration) {
    const err = new Error('Registration not found');
    err.statusCode = 404;
    throw err;
  }

  // RULE 15: check no feedback already submitted.
  const existing = await prisma.feedback.findUnique({ where: { registrationId } });
  if (existing) {
    const err = new Error('Feedback has already been submitted for this registration');
    err.statusCode = 409;
    throw err;
  }

  // Check feedback window if configured.
  const { feedbackStart, feedbackEnd } = registration.event;
  const now = new Date();
  if (feedbackStart && now < feedbackStart) {
    const err = new Error('Feedback window has not opened yet');
    err.statusCode = 400;
    throw err;
  }
  if (feedbackEnd && now > feedbackEnd) {
    const err = new Error('Feedback window has closed');
    err.statusCode = 400;
    throw err;
  }

  // RULE 18: all mandatory themes must be present in the submission.
  const mandatoryThemes = await prisma.feedbackTheme.findMany({
    where: { isMandatory: true, isActive: true },
  });
  const submittedThemeIds = new Set(ratings.map((r) => r.themeId));
  const missing = mandatoryThemes.filter((t) => !submittedThemeIds.has(t.themeId));
  if (missing.length > 0) {
    const err = new Error(
      `Missing ratings for mandatory themes: ${missing.map((t) => t.themeCode).join(', ')}`
    );
    err.statusCode = 400;
    throw err;
  }

  // RULE 16: rating values must be 1–5.
  for (const r of ratings) {
    if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5) {
      const err = new Error(`Rating for theme ${r.themeId} must be an integer between 1 and 5`);
      err.statusCode = 400;
      throw err;
    }
  }

  // Wrap insert + denormalised feedbackSubmittedAt update in one transaction.
  const feedback = await prisma.$transaction(async (tx) => {
    const fb = await tx.feedback.create({
      data: {
        registrationId,
        overallComment: overallComment ?? null,
        language: language || 'EN',
        processingStatus: 'PENDING',
        ratings: {
          create: ratings.map((r) => ({
            themeId: r.themeId,
            rating: r.rating,
            source: 'EXPLICIT',
          })),
        },
      },
      include: {
        ratings: { include: { theme: { select: { themeCode: true, themeName: true } } } },
        insights: true,
      },
    });

    // Update denormalised column on EventRegistration (RULE from schema comments).
    await tx.eventRegistration.update({
      where: { registrationId },
      data: { feedbackSubmittedAt: fb.submittedAt },
    });

    return fb;
  });

  return feedback;
}

/**
 * Get a single feedback with ratings and insights.
 */
export async function getFeedback(feedbackId) {
  return prisma.feedback.findUnique({
    where: { feedbackId },
    include: {
      ratings: { include: { theme: { select: { themeCode: true, themeName: true } } } },
      insights: true,
      registration: {
        include: {
          event: { select: { eventId: true, eventName: true, companyId: true } },
          volunteer: { select: { userId: true, name: true, email: true } },
        },
      },
    },
  });
}

/**
 * Get all feedback for an event.
 */
export async function listFeedbackForEvent(eventId) {
  return prisma.feedback.findMany({
    where: { registration: { eventId } },
    orderBy: { submittedAt: 'desc' },
    include: {
      ratings: { include: { theme: { select: { themeCode: true, themeName: true } } } },
      insights: true,
      registration: {
        include: { volunteer: { select: { userId: true, name: true, email: true } } },
      },
    },
  });
}

/**
 * Get aggregate stats (average rating per theme) for an event.
 * Returns: [{ themeId, themeCode, themeName, avgRating, count }]
 */
export async function getFeedbackStats(eventId) {
  const rows = await prisma.feedbackRating.groupBy({
    by: ['themeId'],
    where: {
      source: 'EXPLICIT',
      feedback: { registration: { eventId } },
    },
    _avg: { rating: true },
    _count: { rating: true },
  });

  // Enrich with theme info.
  const themeIds = rows.map((r) => r.themeId);
  const themes = await prisma.feedbackTheme.findMany({
    where: { themeId: { in: themeIds } },
    select: { themeId: true, themeCode: true, themeName: true, displayOrder: true },
  });
  const themeMap = Object.fromEntries(themes.map((t) => [t.themeId, t]));

  return rows
    .map((r) => ({
      themeId: r.themeId,
      themeCode: themeMap[r.themeId]?.themeCode,
      themeName: themeMap[r.themeId]?.themeName,
      avgRating: r._avg.rating ? Math.round(r._avg.rating * 100) / 100 : null,
      count: r._count.rating,
      displayOrder: themeMap[r.themeId]?.displayOrder ?? 999,
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get a volunteer's own feedback for a specific event.
 */
export async function getMyFeedback(volunteerId, eventId) {
  const registration = await prisma.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId: volunteerId } },
  });
  if (!registration) return null;

  return prisma.feedback.findUnique({
    where: { registrationId: registration.registrationId },
    include: {
      ratings: { include: { theme: { select: { themeCode: true, themeName: true } } } },
      insights: true,
    },
  });
}
