/* ============================================================
   ACTION PLAN ENGINE

   Turns one activity's feedback into a plan: what went well, what needs
   attention, what to actually do about it, and a checklist for the next
   activity of the same kind.

   This is the last step of use case C. Classifying feedback into themes
   tells the Foundation what volunteers talked about; this file is what
   turns that into a decision. Every claim it makes carries the number of
   volunteers behind it and the exact words they used — an action item
   with no evidence attached is an opinion, and no coordinator should be
   asked to act on one.

   The output shape matches the proposed
   `GET /api/events/:eventId/action-plan` contract in API_CONTRACT.md
   exactly, so when the AI service in /ai starts producing real plans,
   this file is deleted and nothing above it changes.

   NOTE ON `adminActionPlans.js`: that file holds hand-written plans for
   a few activities and is richer prose than anything generated here, so
   it is still preferred where it has a COMPLETE entry. It is also where
   the bug was — it defines keys 1, 2, 3 and 5, with no 4, and key 3 is a
   stub with no `overallExperience` at all. Everything below is written
   so that a missing or half-finished plan produces a generated one
   rather than a crash.
   ============================================================ */

import { INSIGHT_THEMES, summariseThemes } from '../../shared/lib/insights.js';
import { averageRating, themeAverages } from '../../shared/lib/analytics.js';
import { formatDate, formatDateTime } from '../../shared/lib/date.js';

/** Below this many written comments there is nothing honest to conclude. */
export const MIN_COMMENTS_FOR_PLAN = 3;

/* ---------- What to do about each theme --------------------------------
   One prescription per aspect the classifier can detect. Written as
   something a coordinator could actually carry out on Monday morning —
   "send the briefing 24 hours ahead" rather than "improve communication".
   ---------------------------------------------------------------------- */

const PRESCRIPTION = {
  TIMELINE_PLANNING: {
    action: 'Publish a fixed run-sheet and hold the stated end time.',
    description:
      'Agree the start, break and end times with the corporate SPOC a week ahead, put them in the volunteer briefing, and name one coordinator responsible for calling each transition on the day.',
    role: 'Activity Coordinator',
    phase: 'before_event',
    rootCause: 'The schedule is agreed on the day rather than committed to in advance.',
    impact: 'Volunteers can plan their travel back, and the activity stops over-running.',
    metric: 'Timeline mentions turn positive, and the activity ends within 30 minutes of the stated time.',
  },
  REQUIREMENTS_PLANNING: {
    action: 'Send a standard pre-activity briefing 24 hours before.',
    description:
      'One message covering reporting point, coordinator contact, what to bring, what the task is and how it is done. Same template every time, filled in per activity.',
    role: 'Activity Coordinator',
    phase: 'before_event',
    rootCause: 'Roles, tasks and materials are explained verbally on the day, so the first hour is spent orienting people.',
    impact: 'Volunteers arrive knowing what they are doing, and the first hour becomes productive.',
    metric: 'Requirements-related negative mentions fall by half at the next activity.',
  },
  FINANCIAL_PLANNING: {
    action: 'Confirm the budget and who pays for what before the activity is opened.',
    description:
      'Fix the material, transport and refreshment budget with the corporate partner before registration opens, and record it on the activity so nobody is out of pocket on the day.',
    role: 'Programme Manager',
    phase: 'before_event',
    rootCause: 'Funding is confirmed close to the activity, so material and refreshment decisions are made late.',
    impact: 'Materials are procured on time instead of being rationed on the day.',
    metric: 'No budget or expense mentions in the next cycle of feedback.',
  },
  PRE_EVENT_COMMUNICATION: {
    action: 'Send a confirmation 48 hours ahead and a reminder the evening before.',
    description:
      'Two messages, both through the corporate SPOC so they reach the company channel volunteers actually read: a confirmation with the details, and a short reminder with the reporting point and coordinator number.',
    role: 'Volunteer Coordinator',
    phase: 'before_event',
    rootCause: 'Details are shared once, early, and are lost by the time the activity comes round.',
    impact: 'Fewer volunteers arrive at the wrong place or the wrong time.',
    metric: 'Pre-activity communication scores rise above 4 out of 5.',
  },
  DAY_OF_COMMUNICATION: {
    action: 'Station a named coordinator at the reporting point for the first 30 minutes.',
    description:
      'One person, visible, whose only job for the first half hour is directing arriving volunteers and running the same two-minute walkthrough for each group.',
    role: 'Activity Coordinator',
    phase: 'during_event',
    rootCause: 'Arriving volunteers have to find someone to ask, and get different answers.',
    impact: 'Removes the "had to ask three people where to go" pattern entirely.',
    metric: 'No "did not know where to report" comments at the next activity.',
  },
  STAFF_SUPPORT: {
    action: 'Give every volunteer group one named staff contact for the day.',
    description:
      'Split volunteers into groups of no more than fifteen and put a named coordinator against each, introduced by name at the start.',
    role: 'Volunteer Coordinator',
    phase: 'during_event',
    rootCause: 'Too few staff are spread across too many volunteers to answer questions quickly.',
    impact: 'Questions get answered in the moment instead of turning into frustration.',
    metric: 'Staff support scores rise, and staff mentions turn positive.',
  },
  SKILL_UTILIZATION: {
    action: 'Ask for skills at registration and assign roles from the answers.',
    description:
      'Add one optional question at registration — what are you good at — and use it to assign the roles that need it, rather than allocating tasks at random on the day.',
    role: 'Volunteer Coordinator',
    phase: 'before_event',
    rootCause: 'Roles are assigned on arrival with no information about what the volunteer can do.',
    impact: 'Professionals stop standing around doing work anyone could do.',
    metric: 'Skill-utilisation scores rise above 4 out of 5.',
  },
  IMPACT: {
    action: 'Close the loop: tell volunteers what their day actually produced.',
    description:
      'Send the numbers within a week — kits assembled, saplings planted, students taught — through the corporate SPOC, with one photograph.',
    role: 'Programme Manager',
    phase: 'after_event',
    rootCause: 'Volunteers leave without being told what the day added up to.',
    impact: 'The activity feels worth the Saturday, which is what brings people back.',
    metric: 'Impact and recommendation scores rise together.',
  },
  PARTICIPATION_LIKELIHOOD: {
    action: 'Follow up personally with anyone who scored 2 or below.',
    description:
      'The corporate SPOC calls or messages each low scorer within three days, asks what went wrong, and reports back. Fixing one bad experience is cheaper than recruiting a replacement.',
    role: 'Corporate SPOC',
    phase: 'after_event',
    rootCause: 'A poor experience goes unaddressed, so the volunteer simply does not sign up again.',
    impact: 'Retains volunteers who would otherwise quietly drop out.',
    metric: 'Repeat participation rate rises at the next activity for this partner.',
  },
  EQUIPMENT: {
    action: 'Procure materials to headcount plus 15%, and check them the evening before.',
    description:
      'Count gloves, tools and kits against the registered headcount with a 15% margin, and physically verify the count the evening before rather than on the morning.',
    role: 'Logistics Coordinator',
    phase: 'before_event',
    rootCause: 'Materials are counted against an optimistic headcount and checked too late to fix.',
    impact: 'Nobody shares a pair of gloves or waits for tools.',
    metric: 'Zero shortage mentions at the next activity.',
  },
  TRANSPORT: {
    action: 'Confirm both legs of transport in writing before the activity opens.',
    description:
      'Pickup points, times and the return departure confirmed with the vendor and published in the briefing. The return leg is the one that gets forgotten and the one volunteers remember.',
    role: 'Logistics Coordinator',
    phase: 'before_event',
    rootCause: 'Return transport is arranged informally and is not confirmed in writing.',
    impact: 'No volunteer waits outside a venue at 7 pm for a bus that is not coming.',
    metric: 'No transport complaints in the next cycle.',
  },
  FOOD: {
    action: 'Cater to the registered headcount and put water at the work site.',
    description:
      'Order refreshments against the confirmed registration count, and place drinking water at the work area rather than only at the entrance.',
    role: 'Logistics Coordinator',
    phase: 'before_event',
    rootCause: 'Catering is ordered against an early estimate and water is kept in one place.',
    impact: 'Volunteers are not hunting for water in the middle of physical work.',
    metric: 'No food or water mentions in the next cycle.',
  },
  VENUE: {
    action: 'Cap registration at what the venue actually holds.',
    description:
      'Set the volunteer cap from a physical walkthrough of the site, not from the number the partner would like to send, and split into shifts if demand is higher.',
    role: 'Programme Manager',
    phase: 'before_event',
    rootCause: 'Registration is capped by ambition rather than by the space available.',
    impact: 'The site stops being crowded, which is also a safety issue.',
    metric: 'Venue mentions stop appearing as negatives.',
  },
  SAFETY: {
    action: 'Put a stocked first-aid point on site with a named first-aider.',
    description:
      'A visible first-aid point, one trained person named in the briefing, and a safety walkthrough of the site before volunteers start work.',
    role: 'Activity Coordinator',
    phase: 'during_event',
    rootCause: 'Safety provision is assumed rather than assigned to someone by name.',
    impact: 'Removes a genuine liability as well as a complaint.',
    metric: 'Safety is named positively, or not at all, in the next cycle.',
  },
  WAITING_TIME: {
    action: 'Stagger arrivals and have the first task ready before anyone arrives.',
    description:
      'Split arrival into two slots thirty minutes apart, and set up the first task the evening before so work starts the moment people are briefed.',
    role: 'Activity Coordinator',
    phase: 'during_event',
    rootCause: 'Everyone arrives at once into a site that is still being set up.',
    impact: 'Volunteers start working within ten minutes instead of standing around.',
    metric: 'Waiting mentions disappear from the next activity of this type.',
  },
  ACTIVITY_DIFFICULTY: {
    action: 'Say plainly in the briefing how physical the work is.',
    description:
      'One line in the activity description about the physical demand, so volunteers self-select and the ones who arrive are prepared for it.',
    role: 'Volunteer Coordinator',
    phase: 'before_event',
    rootCause: 'The description undersells how demanding the work is.',
    impact: 'Expectations match the day, and fewer volunteers leave early.',
    metric: 'Difficulty mentions become neutral rather than negative.',
  },
  ACCESSIBILITY: {
    action: 'Record step-free access on the activity and ask about access needs at registration.',
    description:
      'Add access information to every activity record and one optional question at registration, so a wheelchair user or an older volunteer knows before they travel.',
    role: 'Programme Manager',
    phase: 'before_event',
    rootCause: 'Access is not recorded anywhere, so it can only be discovered by asking.',
    impact: 'Volunteers with access needs can take part instead of dropping out quietly.',
    metric: 'Access questions are answered before the day, not on it.',
  },
  FACILITATOR: {
    action: 'Brief facilitators on the volunteer group before the session.',
    description:
      'A fifteen-minute briefing for the trainer or facilitator covering who the volunteers are, what they already know and what the session has to achieve.',
    role: 'Programme Manager',
    phase: 'before_event',
    rootCause: 'Facilitators meet the group cold and pitch the session wrongly.',
    impact: 'Sessions land at the right level for the people in the room.',
    metric: 'Facilitator mentions turn positive.',
  },
  BENEFICIARY_INTERACTION: {
    action: 'Structure direct contact time into the run-sheet.',
    description:
      'Give every volunteer a named slot with the students or families rather than leaving contact to whoever happens to be at the front.',
    role: 'Activity Coordinator',
    phase: 'during_event',
    rootCause: 'Contact with beneficiaries happens by accident, so some volunteers get none.',
    impact: 'Everyone gets the part of the day that makes it feel worthwhile.',
    metric: 'Beneficiary-interaction mentions rise and turn positive.',
  },
  OTHER: {
    action: 'Review the comments in this theme with the corporate SPOC.',
    description:
      'These did not fall into a known category. Read them with the partner and decide whether a new category is needed.',
    role: 'Programme Manager',
    phase: 'after_event',
    rootCause: 'Recurring comments the current categories do not cover.',
    impact: 'Stops a real, repeated issue being invisible to reporting.',
    metric: 'The theme either resolves or earns a category of its own.',
  },
};

const fallbackPrescription = (theme) => ({
  action: `Review what volunteers said about ${(INSIGHT_THEMES[theme] ?? theme).toLowerCase()}.`,
  description:
    'Read the comments below with the corporate SPOC and agree one concrete change before the next activity.',
  role: 'Programme Manager',
  phase: 'before_event',
  rootCause: 'Not enough detail yet to name a single cause.',
  impact: 'Turns a repeated comment into a decision.',
  metric: 'The theme stops recurring in the next cycle.',
});

/* ---------- Severity ----------------------------------------------------
   Volume AND share, never one alone. Eight complaints out of ten mentions
   is a problem; eight out of ninety is background noise, and a plan that
   cannot tell them apart flags everything and therefore nothing.
   ---------------------------------------------------------------------- */

function severityOf({ negative, negativeShare }) {
  if (negative >= 8 && negativeShare >= 55) return 'high';
  if (negative >= 4 && negativeShare >= 40) return 'medium';
  return 'low';
}

const BUCKET_FOR_SEVERITY = { high: 'must', medium: 'should', low: 'could' };

/** A theme that is negative but rare — worth watching, not acting on yet. */
const isWatchOnly = (row) => row.negative <= 2 && row.negativeShare < 40;

const quote = (insight) => `“${insight.evidenceText}”`;

const evidenceLine = (row) => {
  const examples = row.evidence.slice(0, 2).map(quote).join(' / ');
  const people = `${row.negative} of ${row.total} mentions of this theme were negative`;
  return examples ? `${examples} (${people})` : people;
};

/* ---------- The generator ---------------------------------------------- */

/**
 * Build a plan for one activity from its own feedback.
 *
 * `previous` is the most recent earlier activity of the same type for the
 * same partner, with its own feedback — used to answer "did the last
 * change work?", which is the whole point of keeping historical feedback
 * in the first place.
 */
export function generateActionPlan(event, feedback, previous = null) {
  const comments = feedback.filter((row) => row.overallComment?.trim());
  const responseCount = feedback.length;

  const base = {
    eventId: event.eventId,
    eventName: event.eventName,
    companyName: event.companyName,
    source: 'GENERATED',
    analysisDate: formatDateTime(new Date()),
    responseCount,
    emailDelivery: null,
  };

  /* Ratings alone give a score, not a reason. Saying so is better than
     inventing recommendations out of nine numbers. */
  if (comments.length < MIN_COMMENTS_FOR_PLAN) {
    return {
      ...base,
      generationState: 'insufficient_evidence',
      status: 'evaluating',
      overallExperience: {
        score: averageRating(feedback) ?? 0,
        summary: `Only ${comments.length} of ${responseCount} volunteers left a written comment, which is not enough to draw a conclusion from. The scores are still on the activity page.`,
      },
      whatWentWell: [],
      needsAttention: [],
      actionPlan: [],
      nextEvent: null,
      nextEventChecklist: [],
      previousActionPlanEvaluation: { available: false },
    };
  }

  const insights = feedback.flatMap((row) => row.insights ?? []);
  const themes = summariseThemes(insights);
  const scores = themeAverages(feedback);
  const score = averageRating(feedback) ?? 0;

  const concerns = themes
    .filter((row) => row.negative >= 2)
    .map((row) => ({ ...row, severity: severityOf(row) }))
    .sort((a, b) => b.negative - a.negative || b.negativeShare - a.negativeShare);

  const strengths = themes
    .filter((row) => row.positive >= 3 && row.negativeShare < 30)
    .sort((a, b) => b.positive - a.positive)
    .slice(0, 3);

  const weakestRated = scores
    .filter((row) => row.avgRating != null && row.avgRating < 3.5)
    .sort((a, b) => a.avgRating - b.avgRating);

  /* ---- What went well ---- */
  const whatWentWell = strengths.map((row) => ({
    theme: row.theme,
    observation: `Volunteers were positive about ${(INSIGHT_THEMES[row.theme] ?? row.theme).toLowerCase()}.`,
    evidence:
      row.positiveEvidence.slice(0, 2).map(quote).join(' / ') ||
      `${row.positive} positive mentions across ${responseCount} responses.`,
    impact: `${row.positive} of ${row.total} mentions were positive — safe to keep doing this.`,
  }));

  /* ---- Needs attention ---- */
  const needsAttention = concerns.map((row) => ({
    theme: row.theme,
    problem: `${INSIGHT_THEMES[row.theme] ?? row.theme} came up negatively ${row.negative} ${
      row.negative === 1 ? 'time' : 'times'
    }.`,
    evidence: evidenceLine(row),
    quotes: row.evidence.map((insight) => insight.evidenceText),
    frequency: row.negative,
    share: row.negativeShare,
    severity: row.severity,
    priority: row.severity === 'high' ? 'critical' : row.severity,
    rootCause: (PRESCRIPTION[row.theme] ?? fallbackPrescription(row.theme)).rootCause,
    ratedScore: scores.find((s) => s.themeCode === row.theme)?.avgRating ?? null,
    affectedActivities: [event.eventName],
  }));

  /* ---- The actions ---- */
  const actionPlan = concerns.map((row, index) => {
    const recipe = PRESCRIPTION[row.theme] ?? fallbackPrescription(row.theme);
    const rated = scores.find((s) => s.themeCode === row.theme)?.avgRating ?? null;

    return {
      priority: index + 1,
      bucket: isWatchOnly(row) ? 'watch' : BUCKET_FOR_SEVERITY[row.severity],
      theme: row.theme,
      themeLabel: INSIGHT_THEMES[row.theme] ?? row.theme,
      problem: `${INSIGHT_THEMES[row.theme] ?? row.theme} came up negatively ${row.negative} ${
        row.negative === 1 ? 'time' : 'times'
      }${rated != null ? `, and volunteers rated it ${rated} out of 5` : ''}.`,
      action: recipe.action,
      description: recipe.description,
      responsibleRole: recipe.role,
      deadline:
        recipe.phase === 'before_event'
          ? 'Before the next activity'
          : recipe.phase === 'during_event'
            ? 'On the day of the next activity'
            : 'Within one week',
      phase: recipe.phase,
      targetEventId: null,
      expectedImpact: recipe.impact,
      successMetric: recipe.metric,
      /* The reasons. Every card can show the words it came from. */
      evidenceQuotes: row.evidence.map((insight) => insight.evidenceText),
      frequency: row.negative,
      share: row.negativeShare,
      severity: row.severity,
      ratedScore: rated,
      status: 'upcoming',
    };
  });

  /* A theme scoring below 3.5 that nobody wrote about still needs saying —
     the number is the evidence in that case. */
  weakestRated
    .filter((row) => !actionPlan.some((item) => item.theme === row.themeCode))
    .forEach((row, index) => {
      const recipe = PRESCRIPTION[row.themeCode] ?? fallbackPrescription(row.themeCode);
      actionPlan.push({
        priority: actionPlan.length + index + 1,
        bucket: row.avgRating < 2.5 ? 'should' : 'watch',
        theme: row.themeCode,
        themeLabel: row.themeName,
        problem: `${row.themeName} scored ${row.avgRating} out of 5 across ${row.count} responses, with ${row.lowCount} volunteers scoring it 1 or 2.`,
        action: recipe.action,
        description: recipe.description,
        responsibleRole: recipe.role,
        deadline: 'Before the next activity',
        phase: recipe.phase,
        targetEventId: null,
        expectedImpact: recipe.impact,
        successMetric: recipe.metric,
        evidenceQuotes: [],
        frequency: row.lowCount,
        share: null,
        severity: row.avgRating < 2.5 ? 'medium' : 'low',
        ratedScore: row.avgRating,
        status: 'upcoming',
      });
    });

  /* Ordered the way the page groups them — must, should, could, watch —
     and renumbered, so `priority: 1` is genuinely the first thing to do
     rather than just the first theme the classifier happened to rank. */
  const bucketRank = { must: 0, should: 1, could: 2, watch: 3 };
  actionPlan.sort(
    (a, b) => bucketRank[a.bucket] - bucketRank[b.bucket] || b.frequency - a.frequency,
  );
  actionPlan.forEach((item, index) => {
    item.priority = index + 1;
  });

  /* ---- Checklist for the next one ---- */
  const nextEventChecklist = actionPlan
    .filter((item) => ['must', 'should'].includes(item.bucket))
    .map((item) => ({
      task: item.action,
      phase: item.phase,
      responsibleRole: item.responsibleRole,
      deadline: item.deadline,
    }));

  /* ---- Did the last change work? ---- */
  const previousActionPlanEvaluation = comparePrevious(event, themes, previous);

  const topConcern = concerns[0];
  const summary = topConcern
    ? `${responseCount} volunteers responded, averaging ${score} out of 5. The most common complaint is ${(
        INSIGHT_THEMES[topConcern.theme] ?? topConcern.theme
      ).toLowerCase()} — ${topConcern.negative} of its ${topConcern.total} mentions were negative. ${
        strengths.length
          ? `What is working is ${(INSIGHT_THEMES[strengths[0].theme] ?? strengths[0].theme).toLowerCase()}, which ${strengths[0].positive} volunteers named positively.`
          : ''
      }`
    : `${responseCount} volunteers responded, averaging ${score} out of 5, and nothing came up negatively more than once. Nothing here needs fixing before the next activity.`;

  return {
    ...base,
    generationState: 'generated',
    status: previousActionPlanEvaluation.improved ? 'improved' : 'generated',
    overallExperience: { score, summary },
    whatWentWell,
    needsAttention,
    actionPlan,
    nextEvent: null,
    nextEventChecklist,
    previousActionPlanEvaluation,
    commentCount: comments.length,
  };
}

/**
 * Compare this activity's themes with the last one of the same type for
 * the same partner. This is the closed loop — "we changed X, did it
 * help?" — and it is only possible because past feedback is kept.
 */
function comparePrevious(event, themes, previous) {
  if (!previous?.event || !previous.feedback?.length) {
    return { available: false };
  }

  const before = summariseThemes(previous.feedback.flatMap((row) => row.insights ?? []));
  const moved = [];

  themes.forEach((now) => {
    const then = before.find((row) => row.theme === now.theme);
    if (!then || then.negative < 2) return;
    const delta = then.negativeShare - now.negativeShare;
    if (Math.abs(delta) >= 15) {
      moved.push({ theme: now.theme, before: then.negativeShare, after: now.negativeShare, delta });
    }
  });

  if (!moved.length) {
    return {
      available: true,
      improved: false,
      result: `Nothing has moved measurably since ${previous.event.eventName} on ${formatDate(previous.event.eventDate)}.`,
      evidence: 'No theme changed by more than 15 percentage points either way.',
      comparedWith: previous.event.eventName,
      moved: [],
    };
  }

  moved.sort((a, b) => b.delta - a.delta);
  const best = moved[0];
  const improved = best.delta > 0;

  return {
    available: true,
    improved,
    result: improved
      ? `${INSIGHT_THEMES[best.theme] ?? best.theme} improved since ${previous.event.eventName}.`
      : `${INSIGHT_THEMES[best.theme] ?? best.theme} got worse since ${previous.event.eventName}.`,
    evidence: `Negative share went from ${best.before}% to ${best.after}% between ${formatDate(
      previous.event.eventDate,
    )} and ${formatDate(event.eventDate)}.`,
    comparedWith: previous.event.eventName,
    moved,
  };
}

/* ---------- Curated plans ----------------------------------------------
   A hand-written plan is used only when it is actually complete. This
   guard is the fix for the crash: `adminActionPlans.js` has a stub entry
   with no `overallExperience` and a gap where key 4 should be, and every
   screen read those fields without checking.
   ---------------------------------------------------------------------- */

export function isUsableCuratedPlan(plan) {
  return Boolean(
    plan &&
      plan.generationState === 'generated' &&
      plan.overallExperience &&
      typeof plan.overallExperience.score === 'number' &&
      Array.isArray(plan.actionPlan),
  );
}

/** Fill in the fields a curated plan may omit, so callers never guess. */
export function normaliseCuratedPlan(plan, event) {
  return {
    ...plan,
    eventId: event.eventId,
    eventName: event.eventName,
    companyName: event.companyName,
    source: 'CURATED',
    whatWentWell: plan.whatWentWell ?? [],
    needsAttention: plan.needsAttention ?? [],
    actionPlan: plan.actionPlan ?? [],
    nextEventChecklist: plan.nextEventChecklist ?? [],
    nextEvent: plan.nextEvent ?? null,
    previousActionPlanEvaluation: plan.previousActionPlanEvaluation ?? { available: false },
  };
}
