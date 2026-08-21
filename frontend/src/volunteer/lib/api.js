/* ============================================================
   MOCK API — the seam between this frontend and the real backend.

   Every function has the shape of the agreed contract:

     GET   /api/volunteer/me
     GET   /api/volunteer/activities
     GET   /api/volunteer/feedback
     GET   /api/activities/:activityId/feedback-form
     POST  /api/events/:activityId/register     → 201 | 409 full | 409 already
     POST  /api/feedback                        → 201 | 409 already submitted
     PATCH /api/feedback/:activityId/partial    → progressive save
     GET   /api/volunteer/needs
     POST  /api/volunteer/needs                 → raise a need with the SPOC

   When the backend is ready, replace the bodies with fetch() calls and
   delete data/demoData.js. Nothing else in the app changes.
   ============================================================ */

import {
  activities,
  seededFeedback,
  seededNeeds,
  spoc,
  volunteer,
} from '../data/demoData.js';
import {
  loadNeeds,
  loadRegistrations,
  loadSubmissions,
  saveDraft,
  saveNeed,
  saveRegistration,
  saveSubmission,
} from './storage.js';
import { makeReference } from './format.js';

/** Network latency, so loading and error states are actually visible. */
const LATENCY = 420;
const delay = (ms = LATENCY) => new Promise((resolve) => setTimeout(resolve, ms));

/* Flip in the browser console to exercise the error state:
     window.__sevaFailNext = true                                        */
function shouldFail() {
  if (typeof window !== 'undefined' && window.__sevaFailNext) {
    window.__sevaFailNext = false;
    return true;
  }
  return false;
}

const ok = (data) => ({ success: true, data });

/** The feedback record for an activity, from this device or the seed. */
function findFeedback(activityId) {
  return (
    loadSubmissions().find((f) => f.activityId === activityId) ||
    seededFeedback.find((f) => f.activityId === activityId) ||
    null
  );
}

/* ---------------------------------------------------------------------- */

export async function getVolunteer() {
  await delay(160);
  return ok({ ...volunteer, spoc });
}

/** Activities this volunteer can see, with their registration and feedback state. */
export async function getActivities() {
  await delay();
  if (shouldFail()) throw new Error('We could not load your activities.');

  const registeredHere = loadRegistrations();

  return ok(
    activities.map((activity) => {
      const record = findFeedback(activity.activityId);
      const registeredOnThisDevice = registeredHere.includes(activity.activityId);
      const isRegistered = activity.isRegistered || registeredOnThisDevice;

      return {
        ...activity,
        isRegistered,
        /* A registration made during the demo really does take a slot. */
        volunteersRegistered:
          activity.volunteersRegistered + (registeredOnThisDevice ? 1 : 0),
        alreadySubmitted: Boolean(record),
        feedbackReference: record?.reference ?? null,
      };
    }),
  );
}

/** Seeded history merged with anything submitted on this device. */
export async function getFeedbackHistory() {
  await delay();
  if (shouldFail()) throw new Error('We could not load your feedback history.');

  const local = loadSubmissions();
  const localIds = new Set(local.map((f) => f.activityId));
  const merged = [...local, ...seededFeedback.filter((f) => !localIds.has(f.activityId))];

  return ok(merged.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
}

/** GET /api/activities/:activityId/feedback-form */
export async function getFeedbackForm(activityId) {
  await delay();
  if (shouldFail()) throw new Error('We could not open this feedback form.');

  const activity = activities.find((a) => a.activityId === activityId);
  if (!activity) {
    const error = new Error('This feedback link is not valid.');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const record = findFeedback(activityId);

  return ok({
    ...activity,
    isOpen: activity.feedbackOpen,
    alreadySubmitted: Boolean(record),
    reference: record?.reference ?? null,
    submittedAt: record?.submittedAt ?? null,
  });
}

/** POST /api/events/:activityId/register */
export async function registerForEvent(activityId) {
  await delay(500);
  if (shouldFail()) throw new Error('We could not complete your registration.');

  const activity = activities.find((a) => a.activityId === activityId);
  if (!activity) {
    const error = new Error('This activity no longer exists.');
    error.code = 'NOT_FOUND';
    throw error;
  }

  const registeredHere = loadRegistrations();
  if (activity.isRegistered || registeredHere.includes(activityId)) {
    /* Mirrors the UNIQUE(event_id, user_id) constraint on registrations. */
    const error = new Error('You are already registered for this activity.');
    error.code = 'ALREADY_REGISTERED';
    throw error;
  }

  const taken = activity.volunteersRegistered + (registeredHere.includes(activityId) ? 1 : 0);
  if (taken >= activity.volunteersNeeded) {
    /* Over-subscription is a real operational problem, so "full" is a
       clearly communicated state, never a failed submit. */
    const error = new Error('This activity is full.');
    error.code = 'FULL';
    throw error;
  }

  saveRegistration(activityId);
  return ok({
    activityId,
    attendanceStatus: 'REGISTERED',
    volunteersRegistered: taken + 1,
    remaining: activity.volunteersNeeded - (taken + 1),
  });
}

/** PATCH /api/feedback/:activityId/partial — fire-and-forget, never blocks. */
export async function savePartial(activityId, answers) {
  saveDraft(activityId, answers);
  return ok({ activityId, status: 'PARTIAL' });
}

/**
 * POST /api/feedback → 201, or 409 when this registration already has one.
 *
 * The payload carries `ratings` keyed by themeCode — one row of
 * feedback_ratings each — plus the verbatim overallComment. `themeComments`
 * holds the reason given for any low rating; see EMAIL_INTEGRATION.md and
 * the note in docs for where those land in the schema.
 */
export async function submitFeedback(payload) {
  await delay(900); // A submit should feel like it did something.
  if (shouldFail()) throw new Error('Your feedback did not send.');

  const existing = findFeedback(payload.activityId);
  if (existing) {
    const error = new Error('Already submitted');
    error.code = 'DUPLICATE';
    error.data = { reference: existing.reference };
    throw error;
  }

  const sequence = 103 + loadSubmissions().length + Math.floor(Math.random() * 40);
  const record = {
    ...payload,
    reference: makeReference('FB', sequence),
    submittedAt: new Date().toISOString(),
    status: 'COMPLETE',
  };

  saveSubmission(record);
  return ok({
    reference: record.reference,
    status: record.status,
    submittedAt: record.submittedAt,
    /* The backend queues the confirmation mail inside the same transaction
       that writes the feedback, and reports back whether it was accepted.
       The UI must never claim an email was sent when it was not — see
       EMAIL_INTEGRATION.md for the provider keys and the trigger point. */
    confirmationEmail: { sent: true, to: payload.volunteerEmail },
  });
}

/* ---------- Needs raised with the SPOC --------------------------------- */

export async function getNeeds() {
  await delay(300);
  const local = loadNeeds();
  const merged = [...local, ...seededNeeds];
  return ok(merged.sort((a, b) => new Date(b.raisedAt) - new Date(a.raisedAt)));
}

/** POST /api/volunteer/needs */
export async function submitNeed({ activityId, categories, note }) {
  await delay(700);
  if (shouldFail()) throw new Error('We could not send this to your SPOC.');

  if (!categories.length) {
    const error = new Error('Choose at least one need.');
    error.code = 'VALIDATION';
    throw error;
  }

  const sequence = 25 + loadNeeds().length;
  const record = {
    reference: makeReference('REQ', sequence),
    activityId,
    categories,
    note: note.trim(),
    raisedAt: new Date().toISOString(),
    status: 'OPEN',
    response: null,
  };

  saveNeed(record);
  return ok(record);
}
