import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../constants/roles.js';
import * as themeService from '../services/themeService.js';

/**
 * GET /api/themes            (all authenticated users)
 * Returns active themes ordered by displayOrder.
 * Used by the frontend to render the feedback form.
 */
export const listActiveThemes = asyncHandler(async (_req, res) => {
  const themes = await themeService.listActiveThemes();
  return res.status(200).json({ themes: themes.map(themeService.sanitizeTheme) });
});

/**
 * GET /api/themes/all        (ADMIN, STAFF only)
 * Returns all themes including retired ones — for admin dashboards.
 */
export const listAllThemes = asyncHandler(async (_req, res) => {
  const themes = await themeService.listAllThemes();
  return res.status(200).json({ themes: themes.map(themeService.sanitizeTheme) });
});
