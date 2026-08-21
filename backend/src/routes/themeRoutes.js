import { Router } from 'express';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { ROLES } from '../constants/roles.js';
import { listActiveThemes, listAllThemes } from '../controllers/themeController.js';

const router = Router();

// All theme routes require authentication.
router.use(protect);

// GET /api/themes       — active themes for the feedback form (all roles)
router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.STAFF, ROLES.SPOC, ROLES.VOLUNTEER),
  listActiveThemes
);

// GET /api/themes/all   — all themes including retired (ADMIN/STAFF only)
router.get('/all', authorize(ROLES.ADMIN, ROLES.STAFF), listAllThemes);

export default router;
