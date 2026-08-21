// tests/companies.test.js

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { loginAs } from './helpers/auth.js';
import { prisma, getAdmin, getMcSpoc, getMcVol, getMastercard, getBNY } from './helpers/db.js';

let adminCookie;
let mcSpocCookie;
let mcVolCookie;
let mastercardId;
let bnyId;

// Track companies created during tests so we can clean up.
const createdCompanyIds = [];

beforeAll(async () => {
  const admin = await getAdmin();
  adminCookie = await loginAs(admin.email);

  const mcSpoc = await getMcSpoc();
  mcSpocCookie = await loginAs(mcSpoc.email, 'admin@123', 'COMPANY');

  const mcVol = await getMcVol();
  mcVolCookie = await loginAs(mcVol.email, 'admin@123', 'COMPANY');

  const mc = await getMastercard();
  mastercardId = mc.companyId;

  const bny = await getBNY();
  bnyId = bny.companyId;
});

afterEach(async () => {
  // Hard-delete any companies created by tests to keep the DB clean.
  if (createdCompanyIds.length > 0) {
    await prisma.company.deleteMany({ where: { companyId: { in: createdCompanyIds } } });
    createdCompanyIds.length = 0;
  }
});

// ── List companies ─────────────────────────────────────────────────────────────

describe('GET /api/companies', () => {
  it('as ADMIN → 200, returns list of companies', async () => {
    const res = await request(app)
      .get('/api/companies')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.companies)).toBe(true);
    expect(res.body.companies.length).toBeGreaterThanOrEqual(3);
  });

  it('as SPOC → 403 (SPOC cannot list all companies)', async () => {
    const res = await request(app)
      .get('/api/companies')
      .set('Cookie', mcSpocCookie);

    expect(res.status).toBe(403);
  });

  it('as VOLUNTEER → 403', async () => {
    const res = await request(app)
      .get('/api/companies')
      .set('Cookie', mcVolCookie);

    expect(res.status).toBe(403);
  });

  it('unauthenticated → 401', async () => {
    const res = await request(app).get('/api/companies');
    expect(res.status).toBe(401);
  });
});

// ── Create company ─────────────────────────────────────────────────────────────

describe('POST /api/companies', () => {
  it('as ADMIN → 201, creates company', async () => {
    const res = await request(app)
      .post('/api/companies')
      .set('Cookie', adminCookie)
      .send({ name: `TestCo_${Date.now()}` });

    expect(res.status).toBe(201);
    expect(res.body.company).toBeDefined();
    expect(res.body.company.id).toBeDefined();
    createdCompanyIds.push(res.body.company.id);
  });

  it('as SPOC → 403', async () => {
    const res = await request(app)
      .post('/api/companies')
      .set('Cookie', mcSpocCookie)
      .send({ name: 'ShouldFail' });

    expect(res.status).toBe(403);
  });

  it('missing companyName → 400', async () => {
    const res = await request(app)
      .post('/api/companies')
      .set('Cookie', adminCookie)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ── Get single company ─────────────────────────────────────────────────────────

describe('GET /api/companies/:companyId', () => {
  it('as ADMIN → 200 for any company', async () => {
    const res = await request(app)
      .get(`/api/companies/${mastercardId}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.company.id).toBe(mastercardId);
  });

  it('SPOC can get their own company → 200', async () => {
    const res = await request(app)
      .get(`/api/companies/${mastercardId}`)
      .set('Cookie', mcSpocCookie);

    expect(res.status).toBe(200);
  });

  it('SPOC accessing another company → 403', async () => {
    const res = await request(app)
      .get(`/api/companies/${bnyId}`)
      .set('Cookie', mcSpocCookie);

    expect(res.status).toBe(403);
  });

  it('non-existent company → 404', async () => {
    const res = await request(app)
      .get(`/api/companies/00000000-0000-0000-0000-000000000000`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(404);
  });
});

// ── Update company ─────────────────────────────────────────────────────────────

describe('PATCH /api/companies/:companyId', () => {
  it('as ADMIN → 200, updates name', async () => {
    // Create a temp company to update.
    const createRes = await request(app)
      .post('/api/companies')
      .set('Cookie', adminCookie)
      .send({ name: `UpdateMe_${Date.now()}` });
    const id = createRes.body.company.id;
    createdCompanyIds.push(id);

    const res = await request(app)
      .patch(`/api/companies/${id}`)
      .set('Cookie', adminCookie)
      .send({ name: 'UpdatedName' });

    expect(res.status).toBe(200);
    expect(res.body.company.name).toBe('UpdatedName');
  });

  it('as SPOC → 403', async () => {
    const res = await request(app)
      .patch(`/api/companies/${mastercardId}`)
      .set('Cookie', mcSpocCookie)
      .send({ companyName: 'ShouldFail' });

    expect(res.status).toBe(403);
  });
});

// ── Delete company ─────────────────────────────────────────────────────────────

describe('DELETE /api/companies/:companyId', () => {
  it('as ADMIN → 200, soft-deletes company', async () => {
    // Create a temp company to delete.
    const createRes = await request(app)
      .post('/api/companies')
      .set('Cookie', adminCookie)
      .send({ name: `DeleteMe_${Date.now()}` });
    const id = createRes.body.company.id;

    const res = await request(app)
      .delete(`/api/companies/${id}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    // Don't push to createdCompanyIds — already deleted by the test.
  });

  it('as SPOC → 403', async () => {
    const res = await request(app)
      .delete(`/api/companies/${mastercardId}`)
      .set('Cookie', mcSpocCookie);

    expect(res.status).toBe(403);
  });
});

