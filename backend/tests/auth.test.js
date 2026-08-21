// tests/auth.test.js

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { getAdmin } from './helpers/db.js';

let adminEmail;

beforeAll(async () => {
  const admin = await getAdmin();
  adminEmail = admin.email;
});

describe('POST /api/auth/login', () => {
  it('valid admin credentials → 200, sets token cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'admin@123' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged in successfully');
    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe('ADMIN');
    // Cookie should be set
    const cookie = res.headers['set-cookie'];
    expect(cookie).toBeDefined();
    expect(Array.isArray(cookie) ? cookie[0] : cookie).toMatch(/token=/);
  });

  it('wrong password → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('unknown email → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'admin@123' });

    expect(res.status).toBe(401);
  });

  it('missing email → 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'admin@123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('required');
  });

  it('missing password → 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail });

    expect(res.status).toBe(400);
  });

  it('loginType=COMPANY login with SPOC → 200', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rahul.mehta@mastercard.example', password: 'admin@123', loginType: 'COMPANY' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('SPOC');
  });
});

describe('POST /api/auth/logout', () => {
  it('logout → 200, clears cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });
});

describe('GET /api/auth/me', () => {
  it('with valid cookie → 200 with user info', async () => {
    // First log in to get a cookie.
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'admin@123' });

    const rawCookie = loginRes.headers['set-cookie'];
    const cookie = (Array.isArray(rawCookie) ? rawCookie[0] : rawCookie).split(';')[0];

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(adminEmail);
    expect(res.body.user.role).toBe('ADMIN');
  });

  it('without cookie → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
