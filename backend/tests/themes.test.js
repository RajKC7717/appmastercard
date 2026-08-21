// tests/themes.test.js

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { loginAs } from './helpers/auth.js';
import { getAdmin, getMcVol } from './helpers/db.js';

let adminCookie;
let volCookie;

beforeAll(async () => {
  const admin = await getAdmin();
  adminCookie = await loginAs(admin.email);

  const vol = await getMcVol();
  volCookie = await loginAs(vol.email, 'admin@123', 'COMPANY');
});

describe('GET /api/themes', () => {
  it('as ADMIN → 200, returns 9 mandatory active themes', async () => {
    const res = await request(app)
      .get('/api/themes')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.themes)).toBe(true);
    expect(res.body.themes.length).toBeGreaterThanOrEqual(9);
    // All returned should be active and mandatory
    res.body.themes.forEach((t) => {
      expect(t.isMandatory).toBe(true);
      expect(t.isActive).toBe(true);
    });
  });

  it('as VOLUNTEER → 200 (all authenticated roles can see themes)', async () => {
    const res = await request(app)
      .get('/api/themes')
      .set('Cookie', volCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.themes)).toBe(true);
  });

  it('unauthenticated → 401', async () => {
    const res = await request(app).get('/api/themes');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/themes/all', () => {
  it('as ADMIN → 200', async () => {
    const res = await request(app)
      .get('/api/themes/all')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.themes)).toBe(true);
  });

  it('as VOLUNTEER → 403', async () => {
    const res = await request(app)
      .get('/api/themes/all')
      .set('Cookie', volCookie);

    expect(res.status).toBe(403);
  });
});
