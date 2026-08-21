import { asyncHandler } from '../utils/asyncHandler.js';
import {
  findByEmail,
  findById,
  verifyPassword,
  sanitizeUser,
  updateUser,
} from '../services/userService.js';
import {
  signToken,
  setAuthCookie,
  clearAuthCookie,
} from '../services/tokenService.js';

/**
 * POST /api/auth/login
 * Public. Accepts { email, password, loginType? }
 *
 * loginType:
 *   "ADMIN"   → searches NgoUser table (ADMIN / STAFF)
 *   "COMPANY" → searches CompanyUser table (SPOC / VOLUNTEER)
 *   omitted   → tries NgoUser first, fallback CompanyUser
 *
 * The frontend loginType is ONLY used to pick the lookup path.
 * The actual role stored in the JWT always comes from the DB record.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password, loginType } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await findByEmail(email, { loginType });

  // Same generic message for "no user" and "wrong password" to avoid leaking
  // which emails exist.
  if (!user || !(await verifyPassword(user, password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Update lastLoginAt (fire-and-forget; do not fail login if this errors)
  updateUser(user.id, { lastLoginAt: new Date() }).catch(() => {});

  const token = signToken(user);
  setAuthCookie(res, token);

  return res.status(200).json({
    message: 'Logged in successfully',
    user: sanitizeUser(user),
  });
});

/**
 * POST /api/auth/logout
 * Clears the auth cookie. Idempotent.
 */
export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ message: 'Logged out successfully' });
});

/**
 * GET /api/auth/me
 * Protected. Returns the currently authenticated user's safe info.
 * Returns: { id, name, email, role, companyId }
 */
export const me = asyncHandler(async (req, res) => {
  // req.user is set by `protect`; re-read from the data layer for freshness.
  const user = await findById(req.user.id);
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated: user not found' });
  }
  return res.status(200).json({ user: sanitizeUser(user) });
});
