// tests/helpers/auth.js
// -----------------------------------------------------------------------------
// Login helper — returns a Set-Cookie value for a seed user so subsequent
// supertest requests can authenticate by setting the Cookie header.
// -----------------------------------------------------------------------------

import request from 'supertest';
import app from '../../src/app.js';

/**
 * Log in as a seed user and return the raw `token=...` cookie string.
 * Pass this to supertest via `.set('Cookie', cookie)`.
 *
 * @param {string} email
 * @param {string} [password='admin@123']
 * @param {'ADMIN'|'COMPANY'} [loginType]
 */
export async function loginAs(email, password = 'admin@123', loginType) {
  const body = { email, password };
  if (loginType) body.loginType = loginType;

  const res = await request(app).post('/api/auth/login').send(body);

  if (res.status !== 200) {
    throw new Error(
      `loginAs(${email}) failed with ${res.status}: ${JSON.stringify(res.body)}`
    );
  }

  // Extract the Set-Cookie header value (may be an array).
  const raw = res.headers['set-cookie'];
  const cookie = Array.isArray(raw) ? raw[0] : raw;

  if (!cookie) {
    throw new Error(`loginAs(${email}): no Set-Cookie header in response`);
  }

  // Return only the first segment (token=xxx) — strip HttpOnly flags etc.
  return cookie.split(';')[0];
}
