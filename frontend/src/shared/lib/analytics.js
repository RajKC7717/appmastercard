/* ============================================================
   AGGREGATIONS — the arithmetic behind every console number.

   Kept in one file, away from the components, for two reasons: an average
   that is computed in three places will eventually disagree with itself,
   and every function here maps onto a query the backend already exposes
   (`GET /api/events/:id/feedback/stats` returns exactly what
   `themeAverages` produces). When the API is wired in, these become the
   fallback for anything the server does not aggregate.
   ============================================================ */

import { THEME_CODES, THEME_LABEL, THEME_QUESTION } from '../data/orgData.js';

/** A rating at or below this is the one a coordinator has to act on. */
export const LOW_RATING = 2;

const round1 = (n) => Math.round(n * 10) / 10;

/** Every 1-5 answer across a set of feedback rows. */
export function allRatings(feedback) {
  return feedback.flatMap((row) => Object.values(row.ratings ?? {}));
}

/** Mean of every rating across every theme. `null` when there is nothing yet. */
export function averageRating(feedback) {
  const values = allRatings(feedback);
  if (!values.length) return null;
  return round1(values.reduce((sum, n) => sum + n, 0) / values.length);
}

/**
 * Average per theme, in the form's display order.
 * Mirrors `GET /api/events/:eventId/feedback/stats`.
 */
export function themeAverages(feedback) {
  return THEME_CODES.map((themeCode, index) => {
    const values = feedback
      .map((row) => row.ratings?.[themeCode])
      .filter((value) => typeof value === 'number');

    return {
      themeCode,
      themeName: THEME_LABEL[themeCode],
      question: THEME_QUESTION[themeCode],
      displayOrder: index + 1,
      count: values.length,
      avgRating: values.length ? round1(values.reduce((sum, n) => sum + n, 0) / values.length) : null,
      lowCount: values.filter((value) => value <= LOW_RATING).length,
    };
  });
}

/** How many volunteers scored a theme 1, 2, 3, 4 and 5. */
export function ratingDistribution(feedback, themeCode) {
  const counts = [0, 0, 0, 0, 0];
  feedback.forEach((row) => {
    const value = row.ratings?.[themeCode];
    if (value >= 1 && value <= 5) counts[value - 1] += 1;
  });
  return counts.map((count, index) => ({ rating: index + 1, count }));
}

/** The mean of one row's nine answers — the "score this volunteer gave". */
export function rowAverage(row) {
  const values = Object.values(row.ratings ?? {});
  if (!values.length) return null;
  return round1(values.reduce((sum, n) => sum + n, 0) / values.length);
}

/**
 * Everything a console needs to describe one event in a table row or a
 * header, computed once.
 */
export function summariseEvent(event, feedback) {
  const rows = feedback.filter((row) => row.eventId === event.eventId);
  const responses = rows.length;
  const registered = event.volunteersRegistered;
  const responseRate = registered ? Math.round((responses / registered) * 100) : 0;
  const ratings = allRatings(rows);
  const lowCount = ratings.filter((value) => value <= LOW_RATING).length;
  /* People, not answers. One unhappy volunteer can produce nine low
     scores on their own, and counting those as nine complaints is how a
     dashboard ends up flagging everything and therefore nothing. */
  const lowResponders = rows.filter((row) =>
    Object.values(row.ratings ?? {}).some((value) => value <= LOW_RATING),
  ).length;

  return {
    ...event,
    responses,
    pending: Math.max(0, registered - responses),
    responseRate,
    avgRating: averageRating(rows),
    lowCount,
    lowResponders,
    /* Worth opening: at least five volunteers scored something 1 or 2,
       AND they are a quarter of everyone who responded. Either test on
       its own misfires — the first flags every large activity, the
       second flags an activity where two of five people grumbled. */
    needsAttention: lowResponders >= 5 && responses > 0 && lowResponders / responses >= 0.25,
    comments: rows.filter((row) => row.overallComment?.trim()).length,
  };
}

/** One line per corporate partner, for the partners table and SPOC reports. */
export function summariseCompany(company, events, feedback) {
  const companyEvents = events.filter((event) => event.companyId === company.companyId);
  const ids = new Set(companyEvents.map((event) => event.eventId));
  const rows = feedback.filter((row) => ids.has(row.eventId));
  const registered = companyEvents.reduce((sum, event) => sum + event.volunteersRegistered, 0);

  return {
    ...company,
    eventCount: companyEvents.length,
    completedCount: companyEvents.filter((event) => event.status === 'COMPLETED').length,
    upcomingCount: companyEvents.filter((event) =>
      ['UPCOMING', 'REGISTRATION_OPEN'].includes(event.status),
    ).length,
    volunteersEngaged: registered,
    responses: rows.length,
    responseRate: registered ? Math.round((rows.length / registered) * 100) : 0,
    avgRating: averageRating(rows),
  };
}

/**
 * The counts that belong at the top of a work queue: what needs someone
 * today, not four vanity tiles.
 */
export function workQueueCounts(events, feedback) {
  const collecting = events.filter((event) => event.status === 'ONGOING');
  const collectingIds = new Set(collecting.map((event) => event.eventId));
  const awaited = collecting.reduce(
    (sum, event) =>
      sum +
      Math.max(
        0,
        event.volunteersRegistered -
          feedback.filter((row) => row.eventId === event.eventId).length,
      ),
    0,
  );

  const lowScoring = events
    .map((event) => summariseEvent(event, feedback))
    .filter((event) => event.needsAttention);

  return {
    collecting: collecting.length,
    awaitingResponses: awaited,
    flagged: lowScoring.length,
    flaggedEvents: lowScoring,
    collectingIds,
  };
}

/** Response rate across a whole set of events — the headline health number. */
export function overallResponseRate(events, feedback) {
  const eligible = events.filter((event) => ['ONGOING', 'COMPLETED'].includes(event.status));
  const registered = eligible.reduce((sum, event) => sum + event.volunteersRegistered, 0);
  const ids = new Set(eligible.map((event) => event.eventId));
  const responses = feedback.filter((row) => ids.has(row.eventId)).length;
  return registered ? Math.round((responses / registered) * 100) : 0;
}

/** Month key "2026-08" -> label "Aug 2026", for the trend chart. */
export function monthlyTrend(events, feedback, months = 4) {
  const buckets = new Map();

  feedback.forEach((row) => {
    const key = row.submittedAt.slice(0, 7);
    const current = buckets.get(key) ?? { key, responses: 0, ratings: [] };
    current.responses += 1;
    current.ratings.push(...Object.values(row.ratings ?? {}));
    buckets.set(key, current);
  });

  return [...buckets.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-months)
    .map((bucket) => ({
      key: bucket.key,
      label: new Date(`${bucket.key}-01T00:00:00`).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      }),
      responses: bucket.responses,
      avgRating: bucket.ratings.length
        ? round1(bucket.ratings.reduce((sum, n) => sum + n, 0) / bucket.ratings.length)
        : null,
    }));
}
