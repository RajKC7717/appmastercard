import { Router } from 'express';

import { authorize } from '../middleware/roleMiddleware.js';
import { resolveCompany } from '../middleware/companyMiddleware.js';
import { ROLES } from '../constants/roles.js';
import {
  createSpoc,
  getSpoc,
  updateSpoc,
  deleteSpoc,
} from '../controllers/spocController.js';

// mergeParams so :companyId from the parent company router is available here.
const router = Router({ mergeParams: true });

// Every SPOC route first resolves + authorizes the company.
router.use(resolveCompany);

// POST   /api/companies/:companyId/spoc            (ADMIN)
router.post('/', authorize(ROLES.ADMIN), createSpoc);

// GET    /api/companies/:companyId/spoc            (ADMIN, SPOC — own via resolveCompany)
router.get('/', authorize(ROLES.ADMIN, ROLES.SPOC), getSpoc);

// PATCH  /api/companies/:companyId/spoc/:spocId    (ADMIN)
router.patch('/:spocId', authorize(ROLES.ADMIN), updateSpoc);

// DELETE /api/companies/:companyId/spoc/:spocId    (ADMIN)
router.delete('/:spocId', authorize(ROLES.ADMIN), deleteSpoc);

export default router;
