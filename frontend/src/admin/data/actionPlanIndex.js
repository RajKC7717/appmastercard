/* ============================================================
   Maps the AI action plans onto real activity records.

   `adminActionPlans.js` was written against an earlier, standalone mock
   list keyed 1..5. Rather than rewrite that file — it is shaped to the
   proposed GET /api/events/:eventId/action-plan contract and should stay
   that way — this index says which event each plan belongs to.

   When the endpoint exists, this file goes away: the plan arrives with
   the event id already on it.
   ============================================================ */

import { actionPlans } from './adminActionPlans.js';

/** eventId -> the action plan generated from that activity's feedback. */
export const ACTION_PLAN_FOR_EVENT = {
  'ACT-2026-0224': actionPlans[1], // Waste Segregation Drive · Infosys
  'ACT-2026-0227': actionPlans[2], // Digital Literacy Session · TCS
  'ACT-2026-0218': actionPlans[3], // Women Digital Literacy Workshop · Accenture
  'ACT-2026-0221': actionPlans[4], // Tree Plantation, Warje · Wipro
  'ACT-2026-0212': actionPlans[5], // Community Development Camp · Mastercard
};

export const EVENTS_WITH_PLANS = Object.keys(ACTION_PLAN_FOR_EVENT);
