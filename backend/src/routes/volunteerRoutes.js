import { Router } from 'express';

import { authorize } from '../middleware/roleMiddleware.js';
import { resolveCompany } from '../middleware/companyMiddleware.js';
import { ROLES } from '../constants/roles.js';
import {
  createVolunteer,
  listVolunteers,
  getVolunteer,
  updateVolunteer,
  deleteVolunteer,
} from '../controllers/volunteerController.js';

// mergeParams so :companyId from the parent company router is available.
const router = Router({ mergeParams: true });

// Resolve + authorize the company for every volunteer route. This blocks
// cross-company access (e.g. Mastercard SPOC → TCS) before the controller runs.
router.use(resolveCompany);

// POST   /api/companies/:companyId/volunteers                 (ADMIN, SPOC)
router.post('/', authorize(ROLES.ADMIN, ROLES.SPOC), createVolunteer);

// GET    /api/companies/:companyId/volunteers                 (ADMIN, SPOC)
router.get('/', authorize(ROLES.ADMIN, ROLES.SPOC), listVolunteers);

// GET    /api/companies/:companyId/volunteers/:volunteerId    (ADMIN, SPOC, VOLUNTEER-self)
router.get('/:volunteerId', authorize(ROLES.ADMIN, ROLES.SPOC, ROLES.VOLUNTEER), getVolunteer);

// PATCH  /api/companies/:companyId/volunteers/:volunteerId    (ADMIN, SPOC)
router.patch('/:volunteerId', authorize(ROLES.ADMIN, ROLES.SPOC), updateVolunteer);

// DELETE /api/companies/:companyId/volunteers/:volunteerId    (ADMIN, SPOC)
router.delete('/:volunteerId', authorize(ROLES.ADMIN, ROLES.SPOC), deleteVolunteer);

export default router;
