import { AUTH_COOKIE, verifyToken } from '../services/tokenService.js';
import { findById } from '../services/userService.js';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * AUTHENTICATION MIDDLEWARE — `protect`
 * ────────────────────────────────────────────────────────────────────────────
 * 1. Reads the JWT from the HTTP-only cookie.
 * 2. Verifies it.
 * 3. Loads the matching user from the data layer.
 * 4. Attaches the safe user object to `req.user`.
 * 5. Calls next().
 *
 * Returns 401 if there is no token, the token is invalid/expired, or the
 * user no longer exists.
 */
export async function protect(req, res, next) {
  try {
    const token = req.cookies?.[AUTH_COOKIE];

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated: no token provided' });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      // Covers invalid signature AND expired tokens.
      return res.status(401).json({ message: 'Not authenticated: invalid or expired token' });
    }

    const user = await findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated: user not found' });
    }

    // Attach a trimmed, trusted view of the user. The role/companyId here come
    // from the server-loaded record, NOT from client input.
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    return next();
  } catch (err) {
    return next(err);
  }
}
