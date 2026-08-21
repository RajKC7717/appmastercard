/* Verifies the action plan end to end, against the real dataset.
 *
 * This targets the exact defect the Action plans tab had: a plan object
 * that existed but was half-built, so a screen reading
 * `plan.overallExperience.summary` threw the moment data arrived. The
 * render check could not catch it, because React effects do not run
 * during SSR and the pages only ever reached their loading branch there.
 *
 * Run with: node scripts/action-plan-check.mjs
 */

import { createServer } from 'vite';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});
const load = (p) => vite.ssrLoadModule('/src/' + p);

const org = await load('shared/data/orgData.js');
const { classifyComment } = await load('shared/lib/insights.js');
const { rowAverage, summariseEvent } = await load('shared/lib/analytics.js');
const {
  CURATED_PLAN_FOR_EVENT,
  findPreviousActivity,
  planEligibility,
  resolveActionPlan,
} = await load('admin/data/actionPlanIndex.js');
const { generateActionPlan } = await load('admin/data/actionPlanEngine.js');
const ActionItemCard = (await load('admin/components/ActionItemCard.jsx')).default;
const ChecklistGroup = (await load('admin/components/ChecklistGroup.jsx')).default;

let failures = 0;
const fail = (m) => {
  failures += 1;
  console.error('  FAIL', m);
};
const pass = (m) => console.log('  ok  ', m);

/* ---- Rebuild what the provider builds ------------------------------- */

const eventsById = new Map(org.events.map((e) => [e.eventId, e]));
const enriched = org.feedbackSeed.map((row) => {
  const ev = eventsById.get(row.eventId);
  const insights = classifyComment(row.overallComment, { feedbackId: row.feedbackId });
  return {
    ...row,
    eventName: ev.eventName,
    eventDate: ev.eventDate,
    companyName: org.companyName(ev.companyId),
    activityType: ev.activityType,
    average: rowAverage(row),
    insights,
    themes: [...new Set(insights.map((i) => i.detectedTheme))],
  };
});

const summarised = org.events.map((e) => summariseEvent(e, enriched));
const byEvent = new Map();
enriched.forEach((row) => {
  const b = byEvent.get(row.eventId);
  if (b) b.push(row);
  else byEvent.set(row.eventId, [row]);
});
const feedbackFor = (id) => byEvent.get(id) ?? [];

/* ---- 1. The two defects that broke the tab --------------------------- */

console.log('\nThe defects that broke the Action plans tab');

const stubEvent = summarised.find((e) => e.eventId === 'ACT-2026-0218');
const missingEvent = summarised.find((e) => e.eventId === 'ACT-2026-0221');

if (CURATED_PLAN_FOR_EVENT['ACT-2026-0218']?.overallExperience) {
  fail('expected the curated entry for ACT-2026-0218 to be the incomplete stub');
} else {
  pass('curated entry for ACT-2026-0218 is a stub with no overallExperience');
}

const stubResolved = resolveActionPlan({
  event: stubEvent,
  feedback: feedbackFor(stubEvent.eventId),
  previous: null,
  generatedAt: null,
});
if (stubResolved !== null) fail('a stub curated plan must resolve to null, not a half-plan');
else pass('stub curated plan resolves to null instead of a broken object');

const missingResolved = resolveActionPlan({
  event: missingEvent,
  feedback: feedbackFor(missingEvent.eventId),
  previous: null,
  generatedAt: null,
});
if (missingResolved !== null) fail('a missing curated key must resolve to null');
else pass('missing curated key (there is no actionPlans[4]) resolves to null');

/* ---- 2. Every resolvable plan is COMPLETE ---------------------------- */

console.log('\nEvery plan is complete, for every activity');

const required = ['overallExperience', 'whatWentWell', 'needsAttention', 'actionPlan', 'nextEventChecklist'];

let generatedCount = 0;
let curatedCount = 0;

summarised.forEach((event) => {
  const eligibility = planEligibility(event);
  const previous = findPreviousActivity(event, summarised, feedbackFor);
  const feedback = feedbackFor(event.eventId);

  /* As if an admin had pressed Generate on everything eligible. */
  const plan = resolveActionPlan({
    event,
    feedback,
    previous,
    generatedAt: eligibility.eligible ? '2026-08-21T12:00:00+05:30' : null,
  });

  if (!plan) {
    if (eligibility.eligible) fail(`${event.eventId} is eligible but resolved to null`);
    return;
  }

  if (plan.source === 'CURATED') curatedCount += 1;
  else generatedCount += 1;

  required.forEach((field) => {
    if (plan[field] == null) fail(`${event.eventId} (${plan.source}) has no ${field}`);
  });

  if (typeof plan.overallExperience?.score !== 'number') {
    fail(`${event.eventId} has a non-numeric score`);
  }
  if (!Array.isArray(plan.actionPlan)) fail(`${event.eventId} actionPlan is not an array`);
  if (!plan.overallExperience?.summary) fail(`${event.eventId} has no summary`);

  plan.actionPlan.forEach((item) => {
    if (!item.action) fail(`${event.eventId} has an action item with no action text`);
    if (!item.responsibleRole) fail(`${event.eventId} item "${item.action}" has no owner`);
    if (!item.deadline) fail(`${event.eventId} item "${item.action}" has no deadline`);
    if (!['must', 'should', 'could', 'watch'].includes(item.bucket)) {
      fail(`${event.eventId} item has an unknown bucket: ${item.bucket}`);
    }
  });
});

pass(`${curatedCount} curated + ${generatedCount} generated plans, all complete`);

/* ---- 3. Eligibility is honest --------------------------------------- */

console.log('\nEligibility');

summarised
  .filter((e) => e.status === 'ONGOING')
  .forEach((e) => {
    const { eligible, reason } = planEligibility(e);
    if (eligible) fail(`${e.eventId} is ONGOING and should not be analysable yet`);
    else if (!reason) fail(`${e.eventId} is blocked with no reason given`);
  });
pass('activities still collecting feedback are blocked, with a stated reason');

const cancelled = summarised.find((e) => e.status === 'CANCELLED');
if (cancelled && planEligibility(cancelled).eligible) fail('a cancelled activity should not be analysable');
else pass('a cancelled activity is not analysable');

/* ---- 4. The generated plan is actually evidence-backed --------------- */

console.log('\nThe generated plan carries its reasons');

const target = summarised.find(
  (e) => e.status === 'COMPLETED' && e.comments >= 10 && !CURATED_PLAN_FOR_EVENT[e.eventId],
);
const plan = generateActionPlan(
  target,
  feedbackFor(target.eventId),
  findPreviousActivity(target, summarised, feedbackFor),
);

console.log(`   activity: ${target.eventName} (${target.responses} responses)`);
console.log(`   score:    ${plan.overallExperience.score}`);
console.log(`   summary:  ${plan.overallExperience.summary.slice(0, 140)}…`);
console.log(`   buckets:  ${['must', 'should', 'could', 'watch']
  .map((b) => `${b}=${plan.actionPlan.filter((i) => i.bucket === b).length}`)
  .join(' ')}`);

if (!plan.actionPlan.length) fail('generated plan has no actions at all');
else pass(`${plan.actionPlan.length} actions generated`);

const withEvidence = plan.actionPlan.filter((i) => (i.evidenceQuotes ?? []).length > 0);
if (!withEvidence.length) fail('no action item carries the words it came from');
else pass(`${withEvidence.length} of ${plan.actionPlan.length} actions quote real feedback`);

const top = plan.actionPlan[0];
console.log(`   top item: [${top.bucket}] ${top.action}`);
console.log(`             because: ${top.problem}`);
if (top.evidenceQuotes?.[0]) console.log(`             evidence: "${top.evidenceQuotes[0]}"`);

if (!plan.needsAttention.every((n) => n.frequency > 0 && n.evidence)) {
  fail('a needs-attention row is missing its frequency or evidence');
} else {
  pass('every needs-attention row states how many volunteers and quotes them');
}

if (plan.nextEventChecklist.length === 0 && plan.actionPlan.some((i) => ['must', 'should'].includes(i.bucket))) {
  fail('must/should actions exist but the next-event checklist is empty');
} else {
  pass(`checklist for the next activity has ${plan.nextEventChecklist.length} items`);
}

/* Insufficient evidence must degrade gracefully, not crash. */
const thin = generateActionPlan(target, feedbackFor(target.eventId).slice(0, 1), null);
if (thin.generationState !== 'insufficient_evidence') {
  fail('one response should not be enough to generate a plan');
} else if (!thin.overallExperience?.summary || !Array.isArray(thin.actionPlan)) {
  fail('the insufficient-evidence plan is not shaped like a plan');
} else {
  pass('too little written feedback returns a complete, honest "not enough" plan');
}

/* A genuinely badly-run activity must produce must-haves. A generator
   that only ever returns "could have" is not making decisions. */
console.log('\nAn activity that went badly');

const worst = summarised
  .filter((e) => e.status === 'COMPLETED' && e.comments >= 10 && !CURATED_PLAN_FOR_EVENT[e.eventId])
  .map((e) => ({ e, plan: generateActionPlan(e, feedbackFor(e.eventId), null) }))
  .sort((a, b) => a.plan.overallExperience.score - b.plan.overallExperience.score)[0];

console.log(`   activity: ${worst.e.eventName} · scored ${worst.plan.overallExperience.score}/5`);
console.log(`   buckets:  ${['must', 'should', 'could', 'watch']
  .map((b) => `${b}=${worst.plan.actionPlan.filter((i) => i.bucket === b).length}`)
  .join(' ')}`);
worst.plan.actionPlan
  .filter((i) => i.bucket === 'must')
  .forEach((i) => console.log(`   MUST: ${i.action} (${i.frequency} volunteers, ${i.share}% negative)`));

if (!worst.plan.actionPlan.some((i) => i.bucket === 'must')) {
  fail('the worst-scoring activity produced no must-have actions');
} else {
  pass('the worst-scoring activity produces must-have actions');
}

if (worst.plan.actionPlan[0].bucket !== 'must') {
  fail('actions are not ordered must-first');
} else {
  pass('actions are ordered must, should, could, watch');
}

/* ---- 5. It renders ---------------------------------------------------- */

console.log('\nRendering the generated plan');

const wrap = (child) => h(MemoryRouter, { initialEntries: ['/admin'] }, child);

try {
  const html = plan.actionPlan
    .map((item) => renderToStaticMarkup(wrap(h(ActionItemCard, { item }))))
    .join('');
  if (html.length < 200) throw new Error('action cards rendered almost nothing');
  pass(`${plan.actionPlan.length} action cards render (${html.length} chars)`);
} catch (error) {
  fail(`action cards: ${error.message}`);
}

try {
  const html = renderToStaticMarkup(wrap(h(ChecklistGroup, { items: plan.nextEventChecklist })));
  if (html.length < 100) throw new Error('checklist rendered almost nothing');
  pass(`next-activity checklist renders (${html.length} chars)`);
} catch (error) {
  fail(`checklist: ${error.message}`);
}

/* A curated plan's items have no evidence array — the card must cope. */
try {
  const curated = CURATED_PLAN_FOR_EVENT['ACT-2026-0224'];
  const html = curated.actionPlan
    .map((item) => renderToStaticMarkup(wrap(h(ActionItemCard, { item }))))
    .join('');
  if (html.length < 200) throw new Error('curated action cards rendered almost nothing');
  pass('curated action items (no evidence array) still render');
} catch (error) {
  fail(`curated action cards: ${error.message}`);
}

console.log(failures ? `\n*** ${failures} ACTION PLAN FAILURES ***` : '\nACTION PLAN WORKS END TO END');
process.exitCode = failures ? 1 : 0;
await vite.close();
