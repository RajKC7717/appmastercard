/**
 * ────────────────────────────────────────────────────────────────────────────
 * ROLE AUTHORIZATION MIDDLEWARE — `authorize(...roles)`
 * ────────────────────────────────────────────────────────────────────────────
 * Usage:
 *   authorize('ADMIN')
 *   authorize('ADMIN', 'SPOC')
 *
 * Must run AFTER `protect` (it relies on `req.user`).
 *
 *   - 401 if the request is not authenticated (defensive; protect should run first).
 *   - 403 if the user is authenticated but their role is not allowed.
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }

    return next();
  };
}
