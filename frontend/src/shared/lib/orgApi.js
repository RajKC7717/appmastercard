/* ============================================================
   CONSOLE API — the seam between the admin/SPOC consoles and the backend.

   Every function has the shape of the contract in backend/API_ENDPOINTS.md:

     GET    /api/companies
     GET    /api/companies/:companyId/volunteers
     GET    /api/events                       ?companyId&status
     POST   /api/events
     PATCH  /api/events/:eventId
     PATCH  /api/events/:eventId/status
     GET    /api/events/:eventId/registrations
     GET    /api/events/:eventId/feedback
     GET    /api/events/:eventId/feedback/stats
     GET    /api/themes

   Replacing a body with `fetch(url, { credentials: 'include' })` is the
   only change needed when the backend is live. Nothing above this file
   knows the data is local.

   ONE THING WORTH SAYING OUT LOUD: this reads the volunteer app's own
   localStorage. A feedback submitted in the volunteer flow during the
   demo appears in the admin console on the next load, under the right
   activity, with its comment classified. That is the loop the Foundation
   does not have today, closing in front of you.
   ============================================================ */

import {
  ADMIN_ID,
  companies,
  companyName,
  events as seedEvents,
  feedbackSeed,
  needsSeed,
  ngoUsers,
  spocForCompany,
  spocs,
  volunteers,
} from '../data/orgData.js';
import { loadSubmissions } from '../../volunteer/lib/storage.js';
import { activities as volunteerActivities } from '../../volunteer/data/demoData.js';
import { classifyComment } from './insights.js';
import { rowAverage } from './analytics.js';

const LATENCY = 380;
const delay = (ms = LATENCY) => new Promise((resolve) => setTimeout(resolve, ms));
const ok = (data) => ({ success: true, data });

/* Flip in the console to exercise every error state:  window.__sevaFailNext = true */
function shouldFail() {
  if (typeof window !== 'undefined' && window.__sevaFailNext) {
    window.__sevaFailNext = false;
    return true;
  }
  return false;
}

/* ---------- Console-side local state -----------------------------------
   Events created or edited by an admin during the demo, and SPOC replies
   to volunteer needs. Separate keys from the volunteer app so resetting
   one never silently wipes the other.
   ---------------------------------------------------------------------- */

const EVENTS_KEY = 'seva.console.events';
const OVERRIDES_KEY = 'seva.console.eventOverrides';
const NEEDS_KEY = 'seva.console.needReplies';

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Quota or private mode. In-memory state still works for this session. */
  }
}

/* ---------- Reference data ---------------------------------------------- */

export async function getCompanies() {
  await delay(180);
  return ok(companies.filter((company) => !company.deletedAt));
}

export async function getPeople() {
  await delay(200);
  return ok({ ngoUsers, spocs, volunteers });
}

/* ---------- Events ------------------------------------------------------ */

/** Everything the console knows about events: seed + created + edited. */
function currentEvents() {
  const created = read(EVENTS_KEY, []);
  const overrides = read(OVERRIDES_KEY, {});

  return [...created, ...seedEvents]
    .map((event) => ({ ...event, ...(overrides[event.eventId] ?? {}) }))
    .map((event) => ({
      ...event,
      companyName: companyName(event.companyId),
      spocName: spocs.find((spoc) => spoc.userId === event.spocId)?.name ?? null,
    }))
    .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
}

/** GET /api/events — company scoping is the caller's business, as on the server. */
export async function getEvents({ companyId } = {}) {
  await delay();
  if (shouldFail()) throw new Error('We could not load the activities.');
  const rows = currentEvents();
  return ok(companyId ? rows.filter((event) => event.companyId === companyId) : rows);
}

/**
 * POST /api/events — RULE 8/9: created by an NGO ADMIN, for exactly one
 * company. RULE 11's company half is structural in the database; here the
 * SPOC is simply looked up from the company, so a mismatch is not
 * expressible.
 */
export async function createEvent(payload) {
  await delay(650);
  if (shouldFail()) throw new Error('We could not save this activity.');

  const required = ['companyId', 'eventName', 'eventDate', 'location'];
  const missing = required.filter((field) => !payload[field]);
  if (missing.length) {
    const error = new Error('Fill in every required field before saving.');
    error.code = 'VALIDATION';
    error.fields = missing;
    throw error;
  }

  const created = read(EVENTS_KEY, []);
  const sequence = 300 + created.length;
  const startTime = payload.startTime || '09:00';
  const endTime = payload.endTime || '13:00';

  const event = {
    eventId: `ACT-2026-${String(sequence).padStart(4, '0')}`,
    companyId: payload.companyId,
    adminId: ADMIN_ID,
    spocId: spocForCompany(payload.companyId)?.userId ?? null,
    eventName: payload.eventName.trim(),
    description: payload.description?.trim() || 'Details to be confirmed with the corporate SPOC.',
    location: payload.location.trim(),
    area: payload.area || 'Kothrud',
    activityType: payload.activityType || 'Community',
    status: payload.status || 'UPCOMING',
    eventDate: `${payload.eventDate}T${startTime}:00+05:30`,
    startTime,
    endTime,
    /* The feedback window defaults to "from the moment it ends until
       midnight" — the sixty-second promise only holds if the form is open
       the instant the volunteer puts their gloves down. */
    feedbackStart: `${payload.eventDate}T${endTime}:00+05:30`,
    feedbackEnd: `${payload.eventDate}T23:59:00+05:30`,
    volunteersNeeded: Number(payload.volunteersNeeded) || 25,
    volunteersRegistered: 0,
    createdLocally: true,
  };

  write(EVENTS_KEY, [event, ...created]);
  return ok({ ...event, companyName: companyName(event.companyId) });
}

/** PATCH /api/events/:eventId */
export async function updateEvent(eventId, patch) {
  await delay(500);
  if (shouldFail()) throw new Error('We could not save your changes.');

  const overrides = read(OVERRIDES_KEY, {});
  const next = { ...overrides, [eventId]: { ...(overrides[eventId] ?? {}), ...patch } };
  write(OVERRIDES_KEY, next);

  const event = currentEvents().find((row) => row.eventId === eventId);
  return ok(event);
}

/** PATCH /api/events/:eventId/status — the lifecycle transition. */
export function setEventStatus(eventId, status) {
  return updateEvent(eventId, { status });
}

/** DELETE /api/events/:eventId — cancels. Never a hard delete (schema note). */
export function cancelEvent(eventId) {
  return updateEvent(eventId, { status: 'CANCELLED' });
}

/* ---------- Feedback ---------------------------------------------------- */

/**
 * Anything submitted in the volunteer portal on this device, expressed as
 * a console row. The volunteer app stores the whole payload, so nothing
 * has to be guessed.
 */
function localFeedback() {
  return loadSubmissions().map((record) => {
    const activity = volunteerActivities.find((row) => row.activityId === record.activityId);
    return {
      feedbackId: `FBK-LOCAL-${record.reference}`,
      reference: record.reference,
      registrationId: `REG-${record.activityId}-${record.volunteerId}`,
      eventId: record.activityId,
      companyId: 'CMP-0001',
      volunteerId: record.volunteerId,
      volunteerName: record.volunteerName,
      volunteerInitials: (record.volunteerName ?? 'V V')
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join(''),
      volunteerEmail: record.volunteerEmail,
      submittedAt: record.submittedAt,
      language: record.language ?? 'EN',
      overallComment: record.overallComment ?? '',
      themeComments: record.themeComments ?? {},
      ratings: record.ratings ?? {},
      processingStatus: 'COMPLETED',
      /* Marked so the console can say, honestly, which rows arrived
         through the live portal during this session. */
      source: 'LIVE',
      activityName: activity?.name,
    };
  });
}

/**
 * GET /api/events/:eventId/feedback — every submission, joined to its
 * activity and enriched with the classifier's rows.
 *
 * The join happens here rather than in each screen so a feedback row
 * always carries the same fields no matter which console opened it.
 */
export async function getFeedback({ companyId } = {}) {
  await delay();
  if (shouldFail()) throw new Error('We could not load the feedback.');

  const eventsById = new Map(currentEvents().map((event) => [event.eventId, event]));
  const local = localFeedback();
  const localReferences = new Set(local.map((row) => row.reference));

  const rows = [...local, ...feedbackSeed.filter((row) => !localReferences.has(row.reference))]
    .filter((row) => eventsById.has(row.eventId))
    .map((row) => {
      const event = eventsById.get(row.eventId);
      const insights = classifyComment(row.overallComment, { feedbackId: row.feedbackId });

      return {
        ...row,
        eventName: event.eventName,
        eventDate: event.eventDate,
        activityType: event.activityType,
        area: event.area,
        companyId: event.companyId,
        companyName: event.companyName,
        average: rowAverage(row),
        insights,
        themes: [...new Set(insights.map((insight) => insight.detectedTheme))],
        /* The reasons a volunteer typed against a low score are feedback
           too — they are classified alongside the main comment so a
           one-line "what went wrong?" is not lost to reporting. */
        themeCommentText: Object.values(row.themeComments ?? {}).join(' '),
      };
    })
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  return ok(companyId ? rows.filter((row) => row.companyId === companyId) : rows);
}

/* ---------- Registrations ----------------------------------------------
   GET /api/events/:eventId/registrations. The seed does not carry a row
   per registration — 1,400 of them would be data for its own sake — so
   the attendance sheet is derived from the volunteers of the event's
   company, with the ones who submitted feedback marked ATTENDED.
   ---------------------------------------------------------------------- */

export async function getRegistrations(eventId, feedbackRows = []) {
  await delay(300);
  if (shouldFail()) throw new Error('We could not load the attendance sheet.');

  const event = currentEvents().find((row) => row.eventId === eventId);
  if (!event) {
    const error = new Error('This activity no longer exists.');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const responded = new Map(feedbackRows.map((row) => [row.volunteerId, row]));
  const pool = volunteers.filter((person) => person.companyId === event.companyId);

  const rows = pool.slice(0, event.volunteersRegistered).map((person, index) => {
    const feedback = responded.get(person.userId);
    return {
      registrationId: `REG-${eventId}-${person.userId}`,
      eventId,
      userId: person.userId,
      volunteerName: person.name,
      volunteerInitials: person.initials,
      volunteerEmail: person.email,
      volunteerPhone: person.phone,
      area: person.area,
      attendanceStatus: feedback
        ? 'ATTENDED'
        : event.status === 'COMPLETED'
          ? index % 11 === 0
            ? 'ABSENT'
            : 'ATTENDED'
          : 'REGISTERED',
      feedbackSubmittedAt: feedback?.submittedAt ?? null,
      feedbackReference: feedback?.reference ?? null,
    };
  });

  /* Anyone who actually submitted must be on the sheet, even if the slice
     above missed them — a submitted feedback proves attendance. */
  responded.forEach((feedback, volunteerId) => {
    if (rows.some((row) => row.userId === volunteerId)) return;
    rows.unshift({
      registrationId: feedback.registrationId,
      eventId,
      userId: volunteerId,
      volunteerName: feedback.volunteerName,
      volunteerInitials: feedback.volunteerInitials,
      volunteerEmail: feedback.volunteerEmail,
      volunteerPhone: '—',
      area: '—',
      attendanceStatus: 'ATTENDED',
      feedbackSubmittedAt: feedback.submittedAt,
      feedbackReference: feedback.reference,
    });
  });

  return ok(rows);
}

/* ---------- Volunteering needs ------------------------------------------ */

export async function getNeeds({ companyId } = {}) {
  await delay(260);
  const replies = read(NEEDS_KEY, {});
  const eventsById = new Map(currentEvents().map((event) => [event.eventId, event]));

  const rows = needsSeed
    .map((need) => ({
      ...need,
      ...(replies[need.reference] ?? {}),
      eventName: eventsById.get(need.eventId)?.eventName ?? 'Activity no longer listed',
      companyName: companyName(need.companyId),
    }))
    .sort((a, b) => new Date(b.raisedAt) - new Date(a.raisedAt));

  return ok(companyId ? rows.filter((need) => need.companyId === companyId) : rows);
}

/** A SPOC answering a volunteer. Closes the loop the portal opened. */
export async function respondToNeed(reference, response) {
  await delay(450);
  if (shouldFail()) throw new Error('We could not send your reply.');
  if (!response.trim()) {
    const error = new Error('Write a reply before sending it.');
    error.code = 'VALIDATION';
    throw error;
  }

  const replies = read(NEEDS_KEY, {});
  const record = {
    status: 'RESOLVED',
    response: response.trim(),
    respondedAt: new Date().toISOString(),
  };
  write(NEEDS_KEY, { ...replies, [reference]: record });
  return ok({ reference, ...record });
}

/** Demo helper — clears everything the consoles wrote on this device. */
export function resetConsoleState() {
  [EVENTS_KEY, OVERRIDES_KEY, NEEDS_KEY].forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* nothing to do */
    }
  });
}
