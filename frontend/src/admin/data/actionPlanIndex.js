/* ============================================================
   ACTION PLAN RESOLVER — one way in, and it never returns a half-plan.

   WHAT WAS BROKEN HERE (and why the Action plans tab did not work):

   1. `adminActionPlans.js` defines keys 1, 2, 3 and 5. There is no 4.
      This file mapped an activity onto `actionPlans[4]`, so that entry
      was `undefined` while its key still existed — the list page dropped
      the activity silently and its detail route was a dead link.

   2. Key 3 is a STUB: `generationState: 'pending'` with no
      `overallExperience` and no `actionPlan` array. Both screens read
      `plan.overallExperience.summary` and `plan.actionPlan.filter(...)`
      without checking, so the page threw
      `Cannot read properties of undefined` the moment data arrived.
      It rendered fine while loading, which is exactly why it looked
      intermittent.

   The fix is not to patch the mock. It is that a plan now comes from one
   function which either returns a COMPLETE plan or returns null, and
   every screen handles null. A hand-written plan is preferred where one
   exists and is complete; otherwise the plan is generated from the
   activity's own feedback.
   ============================================================ */

import { actionPlans } from './adminActionPlans.js';
import {
  generateActionPlan,
  isUsableCuratedPlan,
  normaliseCuratedPlan,
} from './actionPlanEngine.js';

/**
 * eventId -> hand-written plan. Key 4 is deliberately absent from
 * `adminActionPlans.js`, so Tree Plantation is not listed here; it gets a
 * generated plan like every other activity instead of a dead link.
 */
export const CURATED_PLAN_FOR_EVENT = {
  'ACT-2026-0224': actionPlans[1], // Waste Segregation Drive · Infosys
  'ACT-2026-0227': actionPlans[2], // Digital Literacy Session · TCS
  'ACT-2026-0218': actionPlans[3], // Women Digital Literacy Workshop · Accenture — stub, unusable
  'ACT-2026-0212': actionPlans[5], // Community Development Camp · Mastercard
};

/**
 * Can a plan be produced for this activity?
 *
 * Only once the feedback window has closed. An activity still collecting
 * feedback would produce a plan from half its responses, and the first
 * thing anyone would do is act on it.
 */
export function planEligibility(event) {
  if (!event) return { eligible: false, reason: 'This activity no longer exists.' };
  if (event.status === 'CANCELLED') {
    return { eligible: false, reason: 'This activity was cancelled, so there is nothing to analyse.' };
  }
  if (event.status === 'ONGOING') {
    return {
      eligible: false,
      reason: 'Feedback is still open. The plan is generated once the window closes at midnight.',
    };
  }
  if (event.status !== 'COMPLETED') {
    return { eligible: false, reason: 'This activity has not been held yet.' };
  }
  if (!event.responses) {
    return { eligible: false, reason: 'No volunteer submitted feedback, so there is nothing to analyse.' };
  }
  return { eligible: true, reason: null };
}

/**
 * The most recent earlier activity of the same type for the same partner.
 * This is what makes "did the last change work?" answerable — and it is
 * only answerable because past feedback is kept rather than discarded.
 */
export function findPreviousActivity(event, allEvents, feedbackForEvent) {
  const earlier = allEvents
    .filter(
      (candidate) =>
        candidate.eventId !== event.eventId &&
        candidate.companyId === event.companyId &&
        candidate.activityType === event.activityType &&
        candidate.status === 'COMPLETED' &&
        new Date(candidate.eventDate) < new Date(event.eventDate),
    )
    .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

  const previous = earlier[0];
  if (!previous) return null;
  return { event: previous, feedback: feedbackForEvent(previous.eventId) };
}

/**
 * The plan for one activity, or null if there is not one yet.
 *
 * `generatedAt` is the timestamp recorded when an admin generated the
 * plan. A curated plan does not need one — it ships with the build.
 */
export function resolveActionPlan({ event, feedback, previous, generatedAt }) {
  if (!event) return null;

  const curated = CURATED_PLAN_FOR_EVENT[event.eventId];
  if (isUsableCuratedPlan(curated)) {
    return normaliseCuratedPlan(curated, event);
  }

  if (!generatedAt) return null;
  if (!planEligibility(event).eligible) return null;

  return { ...generateActionPlan(event, feedback, previous), generatedAt };
}

/** True when this activity ships with a usable hand-written plan. */
export const hasCuratedPlan = (eventId) => isUsableCuratedPlan(CURATED_PLAN_FOR_EVENT[eventId]);
