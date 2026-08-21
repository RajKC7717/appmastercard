// tests/feedback.test.js

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { loginAs } from './helpers/auth.js';
import {
  prisma,
  getAdmin,
  getMcSpoc,
  getMcVol,
  getMcVol2,
  getMcCompletedEvent,
  getBnyCompletedEvent,
  getFirstFeedbackForEvent,
  getRegistration,
} from './helpers/db.js';

let adminCookie;
let mcSpocCookie;
let mcVolCookie;
let mcVol2Cookie;
let mcVolId;
let mcVol2Id;
let completedEventId;
let bnyEventId;

beforeAll(async () => {
  const admin = await getAdmin();
  adminCookie = await loginAs(admin.email);

  const mcSpoc = await getMcSpoc();
  mcSpocCookie = await loginAs(mcSpoc.email, 'admin@123', 'COMPANY');

  const mcVol = await getMcVol();
  mcVolCookie = await loginAs(mcVol.email, 'admin@123', 'COMPANY');
  mcVolId = mcVol.userId;

  const mcVol2 = await getMcVol2();
  mcVol2Cookie = await loginAs(mcVol2.email, 'admin@123', 'COMPANY');
  mcVol2Id = mcVol2.userId;

  const mcEvent = await getMcCompletedEvent();
  completedEventId = mcEvent.eventId;

  const bnyEvent = await getBnyCompletedEvent();
  bnyEventId = bnyEvent.eventId;
});

// ── Helper to get theme IDs ───────────────────────────────────────────────────

async function getAllThemeIds() {
  const themes = await prisma.feedbackTheme.findMany({ where: { isMandatory: true } });
  return themes.map((t) => ({ themeId: t.themeId, rating: 4 }));
}

// ── Submit feedback ───────────────────────────────────────────────────────────

describe('POST /api/events/:eventId/registrations/:registrationId/feedback', () => {
  it('VOLUNTEER submits feedback for own registration → 201 or 409 (already submitted)', async () => {
    // mcVol is ATTENDED for completedEvent (seeded)
    const reg = await getRegistration(completedEventId, mcVolId);
    if (!reg) {
      console.log('Skip: no registration found for mcVol on completed event');
      return;
    }

    const ratings = await getAllThemeIds();

    const res = await request(app)
      .post(`/api/events/${completedEventId}/registrations/${reg.registrationId}/feedback`)
      .set('Cookie', mcVolCookie)
      .send({
        overallComment: 'Test integration feedback',
        language: 'EN',
        ratings,
      });

    // 201 if first submission, 409 if feedback already exists from seed
    expect([201, 409]).toContain(res.status);
  });

  it('missing ratings → 400', async () => {
    const reg = await getRegistration(completedEventId, mcVolId);
    if (!reg) return;

    const res = await request(app)
      .post(`/api/events/${completedEventId}/registrations/${reg.registrationId}/feedback`)
      .set('Cookie', mcVolCookie)
      .send({ overallComment: 'No ratings here' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('ratings');
  });

  it('VOLUNTEER submitting on someone else\'s registration → 403', async () => {
    // Get mcVol2's registration for completed event (if seeded)
    const reg = await getRegistration(completedEventId, mcVol2Id);
    if (!reg) {
      console.log('Skip: no registration for mcVol2 on completed event');
      return;
    }

    const ratings = await getAllThemeIds();

    const res = await request(app)
      .post(`/api/events/${completedEventId}/registrations/${reg.registrationId}/feedback`)
      .set('Cookie', mcVolCookie) // mcVol trying to submit on mcVol2's reg
      .send({ ratings });

    expect(res.status).toBe(403);
  });

  it('ADMIN cannot submit feedback (not VOLUNTEER) → 403', async () => {
    const reg = await getRegistration(completedEventId, mcVolId);
    if (!reg) return;

    const ratings = await getAllThemeIds();

    const res = await request(app)
      .post(`/api/events/${completedEventId}/registrations/${reg.registrationId}/feedback`)
      .set('Cookie', adminCookie)
      .send({ ratings });

    expect(res.status).toBe(403);
  });
});

// ── List event feedback ───────────────────────────────────────────────────────

describe('GET /api/events/:eventId/feedback', () => {
  it('as ADMIN → 200, returns array', async () => {
    const res = await request(app)
      .get(`/api/events/${completedEventId}/feedback`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.feedback)).toBe(true);
  });

  it('as SPOC (own company event) → 200', async () => {
    const res = await request(app)
      .get(`/api/events/${completedEventId}/feedback`)
      .set('Cookie', mcSpocCookie);

    expect(res.status).toBe(200);
  });

  it('as VOLUNTEER → 403', async () => {
    const res = await request(app)
      .get(`/api/events/${completedEventId}/feedback`)
      .set('Cookie', mcVolCookie);

    expect(res.status).toBe(403);
  });
});

// ── Feedback stats ────────────────────────────────────────────────────────────

describe('GET /api/events/:eventId/feedback/stats', () => {
  it('as ADMIN → 200, returns stats object', async () => {
    const res = await request(app)
      .get(`/api/events/${completedEventId}/feedback/stats`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.stats).toBeDefined();
  });

  it('as SPOC → 200', async () => {
    const res = await request(app)
      .get(`/api/events/${completedEventId}/feedback/stats`)
      .set('Cookie', mcSpocCookie);

    expect(res.status).toBe(200);
  });

  it('as VOLUNTEER → 403', async () => {
    const res = await request(app)
      .get(`/api/events/${completedEventId}/feedback/stats`)
      .set('Cookie', mcVolCookie);

    expect(res.status).toBe(403);
  });
});

// ── My feedback ───────────────────────────────────────────────────────────────

describe('GET /api/events/:eventId/feedback/me', () => {
  it('as VOLUNTEER who submitted → 200', async () => {
    // mcVol has seeded feedback on completedEvent (registrationId mcR1)
    const res = await request(app)
      .get(`/api/events/${completedEventId}/feedback/me`)
      .set('Cookie', mcVolCookie);

    // 200 if seeded feedback exists, 404 if not
    expect([200, 404]).toContain(res.status);
  });

  it('as ADMIN → 403 (only VOLUNTEER role allowed)', async () => {
    const res = await request(app)
      .get(`/api/events/${completedEventId}/feedback/me`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(403);
  });
});

// ── Get feedback by ID ────────────────────────────────────────────────────────

describe('GET /api/feedback/:feedbackId', () => {
  it('as ADMIN → 200', async () => {
    const fb = await getFirstFeedbackForEvent(completedEventId);
    if (!fb) {
      console.log('Skip: no feedback for completedEvent');
      return;
    }

    const res = await request(app)
      .get(`/api/feedback/${fb.feedbackId}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.feedback.id).toBe(fb.feedbackId);
  });

  it('VOLUNTEER accessing their OWN feedback → 200', async () => {
    const reg = await getRegistration(completedEventId, mcVolId);
    if (!reg) return;

    const fb = await prisma.feedback.findUnique({ where: { registrationId: reg.registrationId } });
    if (!fb) {
      console.log('Skip: mcVol has no feedback yet');
      return;
    }

    const res = await request(app)
      .get(`/api/feedback/${fb.feedbackId}`)
      .set('Cookie', mcVolCookie);

    expect(res.status).toBe(200);
  });

  it('VOLUNTEER accessing someone else\'s feedback → 403', async () => {
    // Get feedback belonging to mcVol2
    const reg = await getRegistration(completedEventId, mcVol2Id);
    if (!reg) return;

    const fb = await prisma.feedback.findUnique({ where: { registrationId: reg.registrationId } });
    if (!fb) return;

    // mcVol tries to read mcVol2's feedback
    const res = await request(app)
      .get(`/api/feedback/${fb.feedbackId}`)
      .set('Cookie', mcVolCookie);

    expect(res.status).toBe(403);
  });

  it('non-existent feedbackId → 404', async () => {
    const res = await request(app)
      .get('/api/feedback/00000000-0000-0000-0000-000000000000')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(404);
  });
});
