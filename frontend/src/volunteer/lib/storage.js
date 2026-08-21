/* ============================================================
   localStorage layer.

   Three jobs:
   1. Duplicate prevention, layer one — a per-activity flag so the same
      device cannot submit feedback twice. Server-side dedupe is layer two
      and is already structural in the schema: feedback.registration_id is
      UNIQUE, so a second submission is impossible at the database level.
   2. Progressive save — the draft is written after every answered card, so
      a volunteer who closes the tab mid-form does not lose what they gave.
   3. Registrations and SPOC requests made during the demo.

   Every read is guarded: private-browsing Safari throws on localStorage.
   ============================================================ */

const SUBMISSIONS_KEY = 'seva.volunteer.submissions';
const REGISTRATIONS_KEY = 'seva.volunteer.registrations';
const NEEDS_KEY = 'seva.volunteer.needs';
const TUTORIAL_KEY = 'seva.volunteer.tutorialSeen';
const DRAFT_PREFIX = 'seva.volunteer.draft.';
const LANG_KEY = 'seva.volunteer.language';

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
    return true;
  } catch {
    return false; // Quota or private mode. In-memory state still works.
  }
}

function remove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* nothing to do — the flow must not break over storage */
  }
}

const asArray = (value) => (Array.isArray(value) ? value : []);

/* ---------- Submitted feedback ---------------------------------------- */

export function loadSubmissions() {
  return asArray(read(SUBMISSIONS_KEY, []));
}

export function saveSubmission(record) {
  const list = loadSubmissions().filter((f) => f.activityId !== record.activityId);
  write(SUBMISSIONS_KEY, [record, ...list]);
  clearDraft(record.activityId);
  return record;
}

/* ---------- Registrations ---------------------------------------------
   One entry per activity this device registered for, so the count on the
   card and the "Registered" state survive a reload.
   ---------------------------------------------------------------------- */

export function loadRegistrations() {
  return asArray(read(REGISTRATIONS_KEY, []));
}

export function saveRegistration(activityId) {
  const list = loadRegistrations();
  if (list.includes(activityId)) return list;
  const next = [...list, activityId];
  write(REGISTRATIONS_KEY, next);
  return next;
}

/* ---------- Needs raised with the SPOC --------------------------------- */

export function loadNeeds() {
  return asArray(read(NEEDS_KEY, []));
}

export function saveNeed(record) {
  const next = [record, ...loadNeeds()];
  write(NEEDS_KEY, next);
  return record;
}

/* ---------- Tutorial --------------------------------------------------- */

export function loadTutorialSeen() {
  return read(TUTORIAL_KEY, false) === true;
}

export function saveTutorialSeen() {
  write(TUTORIAL_KEY, true);
}

/* ---------- Drafts (progressive save) ---------------------------------- */

export function loadDraft(activityId) {
  return read(`${DRAFT_PREFIX}${activityId}`, null);
}

export function saveDraft(activityId, answers) {
  return write(`${DRAFT_PREFIX}${activityId}`, {
    activityId,
    answers,
    status: 'PARTIAL',
    updatedAt: new Date().toISOString(),
  });
}

export function clearDraft(activityId) {
  remove(`${DRAFT_PREFIX}${activityId}`);
}

/* ---------- Language preference ---------------------------------------- */

export function loadLanguage(fallback = 'EN') {
  const stored = read(LANG_KEY, fallback);
  return ['EN', 'HI', 'MR'].includes(stored) ? stored : fallback;
}

export function saveLanguage(code) {
  write(LANG_KEY, code);
}

/** Demo helper — wipes everything this device stored. Used on Profile. */
export function resetDemoState(activityIds = []) {
  [SUBMISSIONS_KEY, REGISTRATIONS_KEY, NEEDS_KEY, TUTORIAL_KEY, LANG_KEY].forEach(remove);
  activityIds.forEach(clearDraft);
}
