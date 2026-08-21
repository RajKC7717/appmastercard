import { Router } from 'express';

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// GET /api/test/protected  — any authenticated user
router.get('/protected', protect, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});

// GET /api/test/admin      — ADMIN only
router.get('/admin', protect, authorize(ROLES.ADMIN), (req, res) => {
  res.json({ message: 'Hello ADMIN', user: req.user });
});

// GET /api/test/company    — SPOC or VOLUNTEER only
router.get('/company', protect, authorize(ROLES.SPOC, ROLES.VOLUNTEER), (req, res) => {
  res.json({ message: 'Hello company user', user: req.user });
});

export default router;
