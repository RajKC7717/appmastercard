import { Router } from 'express';

import { login, logout, me } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/auth/login   (public)
router.post('/login', login);

// POST /api/auth/logout  (public — clearing a cookie needs no auth)
router.post('/logout', logout);

// GET  /api/auth/me      (protected)
router.get('/me', protect, me);

export default router;
