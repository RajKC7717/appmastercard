import { prisma } from '../config/db.js';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * FEEDBACK THEME SERVICE  (Prisma-backed)
 * ────────────────────────────────────────────────────────────────────────────
 * Provides the catalogue of rateable themes used to render the feedback form
 * and run the RULE 18 completeness check.
 */

/** Shape a theme for API responses. */
export function sanitizeTheme(theme) {
  if (!theme) return null;
  return {
    id: theme.themeId,
    themeCode: theme.themeCode,
    themeName: theme.themeName,
    question: theme.question,
    description: theme.description ?? null,
    scaleLabels: theme.scaleLabels,
    isMandatory: theme.isMandatory,
    isActive: theme.isActive,
    displayOrder: theme.displayOrder,
  };
}

/**
 * List active themes ordered for the feedback form.
 * isActive = true → currently shown to volunteers.
 */
export async function listActiveThemes() {
  return prisma.feedbackTheme.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });
}

/**
 * List ALL themes including retired ones — for ADMIN reporting.
 */
export async function listAllThemes() {
  return prisma.feedbackTheme.findMany({
    orderBy: [{ isActive: 'desc' }, { displayOrder: 'asc' }],
  });
}

/**
 * Find a theme by its stable code (e.g. "IMPACT").
 */
export async function findByCode(themeCode) {
  return prisma.feedbackTheme.findUnique({ where: { themeCode } });
}
