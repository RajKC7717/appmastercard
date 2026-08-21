// tests/events.test.js

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { loginAs } from './helpers/auth.js';
import {
  prisma,
  getAdmin,
  getMcSpoc,
  getMcVol,
  getBnySpoc,
  getMastercard,
  getMcCompletedEvent,
  getMcUpcomingEvent,
} from './helpers/db.js';

let adminCookie;
let mcSpocCookie;
let bnySpocCookie;
let mcVolCookie;
let mastercardId;
let completedEventId;
let upcomingEventId;
let mcSpocUserId;

// Track event IDs created during tests.
// These are the raw sanitized `id` field from sanitizeEvent (not eventId).
const createdEventIds = [];

beforeAll(async () => {
  const admin = await getAdmin();
  adminCookie = await loginAs(admin.email);

  const mcSpoc = await getMcSpoc();
  mcSpocCookie = await loginAs(mcSpoc.email, 'admin@123', 'COMPANY');
  mcSpocUserId = mcSpoc.userId;

  const bnySpoc = await getBnySpoc();
  bnySpocCookie = await loginAs(bnySpoc.email, 'admin@123', 'COMPANY');

  const mcVol = await getMcVol();
  mcVolCookie = await loginAs(mcVol.email, 'admin@123', 'COMPANY');

  const mc = await getMastercard();
  mastercardId = mc.companyId;

  const completedEvent = await getMcCompletedEvent();
  completedEventId = completedEvent.eventId;

  const upcomingEvent = await getMcUpcomingEvent();
  upcomingEventId = upcomingEvent.eventId;
});

afterEach(async () => {
  // Filter out undefined/null before querying Prisma.
  const ids = createdEventIds.filter(Boolean);
  if (ids.length > 0) {
    await prisma.event.deleteMany({ where: { eventId: { in: ids } } });
  }
  createdEventIds.length = 0;
});

// Helper to safely create a test event and track its real DB id.
async function createTestEvent(name = `Test Event ${Date.now()}`) {
  const res = await request(app)
    .post('/api/events')
    .set('Cookie', adminCookie)
    .send({
      companyId: mastercardId,
      eventName: name,
      description: 'Integration test event',
      location: 'Test Location',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  // The sanitized DTO uses `id` not `eventId`
  const eventId = res.body.event?.id;
  if (eventId) createdEventIds.push(eventId);
  return res;
}

// ── Create event ──────────────────────────────────────────────────────────────

describe('POST /api/events', () => {
  it('as ADMIN → 201, creates event', async () => {
    const res = await createTestEvent();
    expect(res.status).toBe(201);
    expect(res.body.event.id).toBeDefined();
    expect(res.body.event.companyId).toBe(mastercardId);
  });

  it('as VOLUNTEER → 403', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Cookie', mcVolCookie)
      .send({
        companyId: mastercardId,
        eventName: 'Should Fail',
        description: 'x',
        location: 'x',
        eventDate: new Date().toISOString(),
      });
    expect(res.status).toBe(403);
  });

  it('missing required fields → 400', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Cookie', adminCookie)
      .send({ companyId: mastercardId });
    expect(res.status).toBe(400);
  });
});

// ── List events ───────────────────────────────────────────────────────────────

describe('GET /api/events', () => {
  it('as ADMIN → 200, sees events from all companies', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.length).toBeGreaterThanOrEqual(6);
    expect(res.body.pagination).toBeDefined();
  });

  it('as MC SPOC → 200, sees only MC events', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('Cookie', mcSpocCookie);

    expect(res.status).toBe(200);
    res.body.events.forEach((e) => {
      expect(e.companyId).toBe(mastercardId);
    });
  });

  it('pagination → 200 with correct page/limit metadata', async () => {
    const res = await request(app)
      .get('/api/events?page=1&limit=2')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.events.length).toBeLessThanOrEqual(2);
    expect(res.body.pagination.limit).toBe(2);
  });

  it('filter by status → 200, all results have that status', async () => {
    const res = await request(app)
      .get('/api/events?status=COMPLETED')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    res.body.events.forEach((e) => expect(e.status).toBe('COMPLETED'));
  });
});

// ── Get single event ──────────────────────────────────────────────────────────

describe('GET /api/events/:eventId', () => {
  it('as ADMIN → 200', async () => {
    const res = await request(app)
      .get(`/api/events/${completedEventId}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    // sanitizeEvent returns `id`, not `eventId`
    expect(res.body.event.id).toBe(completedEventId);
  });

  it('MC SPOC → 200 for own company event', async () => {
    const res = await request(app)
      .get(`/api/events/${completedEventId}`)
      .set('Cookie', mcSpocCookie);

    expect(res.status).toBe(200);
  });

  it('BNY SPOC → 403 for MC event (cross-company)', async () => {
    const res = await request(app)
      .get(`/api/events/${completedEventId}`)
      .set('Cookie', bnySpocCookie);

    expect(res.status).toBe(403);
  });

  it('non-existent eventId → 404', async () => {
    const res = await request(app)
      .get('/api/events/00000000-0000-0000-0000-000000000000')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(404);
  });
});

// ── Update event ──────────────────────────────────────────────────────────────

describe('PATCH /api/events/:eventId', () => {
  it('as ADMIN → 200, updates eventName', async () => {
    const createRes = await createTestEvent('ToUpdate');
    const id = createRes.body.event.id; // sanitized `id`

    const res = await request(app)
      .patch(`/api/events/${id}`)
      .set('Cookie', adminCookie)
      .send({ eventName: 'UpdatedName' });

    expect(res.status).toBe(200);
    expect(res.body.event.eventName).toBe('UpdatedName');
  });
});

// ── Change event status ───────────────────────────────────────────────────────

describe('PATCH /api/events/:eventId/status', () => {
  it('valid status → 200', async () => {
    const createRes = await createTestEvent('StatusChange');
    const id = createRes.body.event.id;

    const res = await request(app)
      .patch(`/api/events/${id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'REGISTRATION_OPEN' });

    expect(res.status).toBe(200);
    expect(res.body.event.status).toBe('REGISTRATION_OPEN');
  });

  it('invalid status value → 400', async () => {
    const res = await request(app)
      .patch(`/api/events/${upcomingEventId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'INVALID_STATUS' });

    expect(res.status).toBe(400);
  });

  it('as SPOC → 403', async () => {
    const res = await request(app)
      .patch(`/api/events/${upcomingEventId}/status`)
      .set('Cookie', mcSpocCookie)
      .send({ status: 'ONGOING' });

    expect(res.status).toBe(403);
  });
});

// ── Assign SPOC ───────────────────────────────────────────────────────────────

describe('PATCH /api/events/:eventId/spoc', () => {
  it('as ADMIN → 200, assigns spocId', async () => {
    const createRes = await createTestEvent('SpocAssign');
    const id = createRes.body.event.id;

    const res = await request(app)
      .patch(`/api/events/${id}/spoc`)
      .set('Cookie', adminCookie)
      .send({ spocId: mcSpocUserId });

    expect(res.status).toBe(200);
    expect(res.body.event.spocId).toBe(mcSpocUserId);
  });
});

// ── Cancel event (DELETE) ─────────────────────────────────────────────────────

describe('DELETE /api/events/:eventId', () => {
  it('as ADMIN → 200, event status = CANCELLED', async () => {
    const createRes = await createTestEvent('CancelMe');
    const id = createRes.body.event.id;

    const res = await request(app)
      .delete(`/api/events/${id}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.event.status).toBe('CANCELLED');
  });

  it('as SPOC → 403', async () => {
    const res = await request(app)
      .delete(`/api/events/${upcomingEventId}`)
      .set('Cookie', mcSpocCookie);

    expect(res.status).toBe(403);
  });
});
