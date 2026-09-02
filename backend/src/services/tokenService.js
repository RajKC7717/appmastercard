import jwt from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import jwt from 'jsonwebtoken';


import { config, isProd } from '../config/index.js';

/** Name of the HTTP-only cookie that carries the JWT. */
export const AUTH_COOKIE = 'token';

/**
 * Build the JWT payload from a user. Contains only non-sensitive identifiers —
 * never the password.
 */
export function buildPayload(user) {
  return {
    id: user.id,
    role: user.role,
    companyId: user.companyId,
  };
}

/** Sign a JWT for the given user. */
export function signToken(user) {
  return jwt.sign(buildPayload(user), config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/** Verify a JWT. Throws if invalid/expired. */
export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

/** Options shared by set/clear so the browser matches the cookie on clear. */
const baseCookieOptions = {
  httpOnly: true,
  secure: isProd, // only sent over HTTPS in production
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
};

/** Set the auth cookie on the response. */
export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, {
    ...baseCookieOptions,
    maxAge: config.cookieMaxAge,
  });
}

/** Clear the auth cookie on the response. */
export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, baseCookieOptions);
}
