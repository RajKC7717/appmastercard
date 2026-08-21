import { Router } from 'express';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { resolveCompany } from '../middleware/companyMiddleware.js';
import { ROLES } from '../constants/roles.js';
import {
  createCompany,
  listCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
} from '../controllers/companyController.js';
import spocRoutes from './spocRoutes.js';
import volunteerRoutes from './volunteerRoutes.js';

const router = Router();

// Everything under /api/companies requires authentication.
router.use(protect);

// ── Company collection ────────────────────────────────────────────────────────
// POST /api/companies        (ADMIN)
router.post('/', authorize(ROLES.ADMIN), createCompany);

// GET  /api/companies        (ADMIN)
router.get('/', authorize(ROLES.ADMIN), listCompanies);

// ── Single company ────────────────────────────────────────────────────────────
// GET    /api/companies/:companyId  (ADMIN any; SPOC/VOLUNTEER own via resolveCompany)
router.get('/:companyId', resolveCompany, getCompany);

// PATCH  /api/companies/:companyId  (ADMIN)
router.patch('/:companyId', authorize(ROLES.ADMIN), resolveCompany, updateCompany);

// DELETE /api/companies/:companyId  (ADMIN)
router.delete('/:companyId', authorize(ROLES.ADMIN), resolveCompany, deleteCompany);

// ── Nested resources ──────────────────────────────────────────────────────────
router.use('/:companyId/spoc', spocRoutes);
router.use('/:companyId/volunteers', volunteerRoutes);

export default router;
