/* Renders every screen through Vite's own SSR pipeline, so JSX and CSS
   modules resolve exactly as they do in the browser. Catches import
   errors, bad destructuring and broken JSX that a bundle alone will not
   surface. React effects do not run during SSR, so this exercises each
   page's initial (loading / signed-out) branch. */

import { createServer } from 'vite';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});

const load = (p) => vite.ssrLoadModule('/src/' + p);

const { AuthProvider } = await load('auth/AuthProvider.jsx');
const { ToastProvider } = await load('shared/ui/Toast.jsx');
const { ConsoleDataProvider } = await load('shared/console/ConsoleDataProvider.jsx');

const page = async (p) => (await load(p)).default;

const { VolunteerProvider } = await load('volunteer/state/VolunteerProvider.jsx');

const screens = [
  ['LoginPage', await page('auth/LoginPage.jsx'), '/login', undefined, false],
  ['SignupPage', await page('auth/SignupPage.jsx'), '/signup', undefined, false],

  ['AdminDashboard', await page('admin/pages/AdminDashboard.jsx'), '/admin', null, true],
  ['AdminActivities', await page('admin/pages/AdminActivities.jsx'), '/admin/activities', null, true],
  ['AdminActivityDetail', await page('admin/pages/AdminActivityDetail.jsx'), '/admin/activities/ACT-2026-0224', null, true],
  ['AdminFeedback', await page('admin/pages/AdminFeedback.jsx'), '/admin/feedback', null, true],
  ['AdminThemes', await page('admin/pages/AdminThemes.jsx'), '/admin/themes', null, true],
  ['AdminActionPlans', await page('admin/pages/AdminActionPlans.jsx'), '/admin/action-plans', null, true],
  ['AdminActionPlanDetail', await page('admin/pages/AdminActionPlanDetail.jsx'), '/admin/action-plans/ACT-2026-0224', null, true],
  ['AdminReports', await page('admin/pages/AdminReports.jsx'), '/admin/reports', null, true],
  ['AdminPartners', await page('admin/pages/AdminPartners.jsx'), '/admin/partners', null, true],

  ['SpocDashboard', await page('spoc/pages/SpocDashboard.jsx'), '/spoc', 'CMP-0001', true],
  ['SpocActivities', await page('spoc/pages/SpocActivities.jsx'), '/spoc/activities', 'CMP-0001', true],
  ['SpocActivityDetail', await page('spoc/pages/SpocActivityDetail.jsx'), '/spoc/activities/ACT-2026-0231', 'CMP-0001', true],
  ['SpocInsights', await page('spoc/pages/SpocInsights.jsx'), '/spoc/insights', 'CMP-0001', true],
  ['SpocRequests', await page('spoc/pages/SpocRequests.jsx'), '/spoc/requests', 'CMP-0001', true],
  ['SpocReports', await page('spoc/pages/SpocReports.jsx'), '/spoc/reports', 'CMP-0001', true],
];

const apps = [
  ['AdminApp /admin', await page('admin/AdminApp.jsx'), '/admin'],
  ['AdminApp /feedback', await page('admin/AdminApp.jsx'), '/admin/feedback'],
  ['AdminApp /reports', await page('admin/AdminApp.jsx'), '/admin/reports'],
  ['AdminApp /partners', await page('admin/AdminApp.jsx'), '/admin/partners'],
  ['SpocApp /spoc', await page('spoc/SpocApp.jsx'), '/spoc'],
  ['SpocApp /requests', await page('spoc/SpocApp.jsx'), '/spoc/requests'],
  ['SpocApp /insights', await page('spoc/SpocApp.jsx'), '/spoc/insights'],
];

let failures = 0;

function check(name, element) {
  try {
    const html = renderToStaticMarkup(element);
    if (!html || html.length < 40) throw new Error(`rendered almost nothing (${html.length} chars)`);
    console.log(`  ok   ${name.padEnd(24)} ${html.length} chars`);
  } catch (error) {
    failures += 1;
    console.error(`  FAIL ${name}: ${error.message}`);
  }
}

const wrap = (child, route) =>
  h(MemoryRouter, { initialEntries: [route] }, h(AuthProvider, null, h(ToastProvider, null, child)));

console.log('\nScreens');
for (const [name, Page, route, companyId, needsData] of screens) {
  check(
    name,
    wrap(needsData ? h(ConsoleDataProvider, { companyId }, h(Page)) : h(Page), route),
  );
}

/* The volunteer portal, which shares the AuthProvider with the consoles. */
const volunteerScreens = [
  ['VolunteerLayout', await page('volunteer/VolunteerLayout.jsx'), '/volunteer'],
  ['HomePage', await page('volunteer/pages/HomePage.jsx'), '/volunteer'],
  ['EventsPage', await page('volunteer/pages/EventsPage.jsx'), '/volunteer/events'],
  ['HistoryPage', await page('volunteer/pages/HistoryPage.jsx'), '/volunteer/history'],
  ['ProfilePage', await page('volunteer/pages/ProfilePage.jsx'), '/volunteer/profile'],
  ['FeedbackPage', await page('volunteer/pages/FeedbackPage.jsx'), '/volunteer/feedback/ACT-2026-0231'],
];

console.log('\nVolunteer portal');
for (const [name, Page, route] of volunteerScreens) {
  check(name, wrap(h(VolunteerProvider, null, h(Page)), route));
}

console.log('\nWhole console apps (shell + routing)');
for (const [name, App, route] of apps) {
  /* Mounted the way App.jsx mounts them: under a splat parent, so the
     console's own <Routes> resolve relative to /admin or /spoc. */
  const base = route.startsWith('/admin') ? '/admin/*' : '/spoc/*';
  check(name, wrap(h(Routes, null, h(Route, { path: base, element: h(App) })), route));
}

console.log(failures ? `\n*** ${failures} RENDER FAILURES ***` : '\nEVERY SCREEN RENDERS');

/* ---------------------------------------------------------------------
   Loaded-state check. SSR never runs effects, so the pages above only
   exercised their loading branch. These are the components that render
   the data itself — pushed real rows from the seed dataset.
   --------------------------------------------------------------------- */

const org = await load('shared/data/orgData.js');
const { classifyComment } = await load('shared/lib/insights.js');
const { rowAverage, summariseEvent } = await load('shared/lib/analytics.js');

const FeedbackCard = await page('shared/console/FeedbackCard.jsx');
const EventListCard = await page('shared/console/EventListCard.jsx');
const ThemeAverages = await page('shared/console/ThemeAverages.jsx');
const ThemeExplorer = await page('shared/console/ThemeExplorer.jsx');
const BarList = await page('shared/ui/BarList.jsx');
const DataTable = await page('shared/ui/DataTable.jsx');
const ActionItemCard = await page('admin/components/ActionItemCard.jsx');
const ChecklistGroup = await page('admin/components/ChecklistGroup.jsx');
const EmailDeliveryStatus = await page('admin/components/EmailDeliveryStatus.jsx');
const ScoreGauge = await page('shared/ui/ScoreGauge.jsx');
const { CURATED_PLAN_FOR_EVENT } = await load('admin/data/actionPlanIndex.js');

const eventsById = new Map(org.events.map((e) => [e.eventId, e]));
const enrich = (row) => {
  const ev = eventsById.get(row.eventId);
  const insights = classifyComment(row.overallComment, { feedbackId: row.feedbackId });
  return {
    ...row,
    eventName: ev.eventName,
    eventDate: ev.eventDate,
    companyName: org.companyName(ev.companyId),
    activityType: ev.activityType,
    area: ev.area,
    average: rowAverage(row),
    insights,
    themes: [...new Set(insights.map((i) => i.detectedTheme))],
    themeCommentText: '',
  };
};

const enriched = org.feedbackSeed.map(enrich);
const summarisedEvents = org.events.map((e) => summariseEvent(e, enriched));
const plan = CURATED_PLAN_FOR_EVENT['ACT-2026-0224'];

console.log('\nLoaded-state components (real rows)');

/* Rajesh's own three, plus one Marathi and one with no comment at all. */
const samples = [
  enriched.find((r) => r.source === 'VOLUNTEER_APP'),
  enriched.find((r) => r.language === 'MR'),
  enriched.find((r) => !r.overallComment),
  enriched.find((r) => Object.values(r.ratings).some((v) => v <= 2)),
];
samples.forEach((row, i) => {
  check(`FeedbackCard #${i + 1}`, wrap(h(FeedbackCard, { feedback: row }), '/admin/feedback'));
});

['ONGOING', 'REGISTRATION_OPEN', 'COMPLETED', 'CANCELLED', 'UPCOMING'].forEach((status) => {
  const ev = summarisedEvents.find((e) => e.status === status);
  if (ev) {
    check(
      `EventListCard ${status}`,
      wrap(h(EventListCard, { event: ev, basePath: '/admin/activities' }), '/admin'),
    );
  }
});

check('ThemeAverages (many)', wrap(h(ThemeAverages, { feedback: enriched }), '/admin'));
check('ThemeAverages (empty)', wrap(h(ThemeAverages, { feedback: [] }), '/admin'));
check('ThemeExplorer', wrap(h(ThemeExplorer, { feedback: enriched, feedbackPath: '/admin/feedback' }), '/admin/themes'));
check('ThemeExplorer selected', wrap(h(ThemeExplorer, { feedback: enriched }), '/admin/themes?theme=TIMELINE_PLANNING'));
check('ThemeExplorer (empty)', wrap(h(ThemeExplorer, { feedback: [] }), '/admin/themes'));

check(
  'BarList',
  wrap(h(BarList, { rows: [{ key: 'a', label: 'A', value: 3.2, display: '3.2 / 5' }], max: 5, caption: 'x' }), '/admin'),
);
check(
  'DataTable',
  wrap(
    h(DataTable, {
      columns: [
        { key: 'eventName', label: 'Activity', sortable: true },
        { key: 'responses', label: 'Responses', align: 'right', sortable: true },
      ],
      rows: summarisedEvents,
      getRowKey: (r) => r.eventId,
      onRowClick: () => {},
      sort: { key: 'responses', direction: 'desc' },
      onSort: () => {},
      empty: h('p', null, 'none'),
    }),
    '/admin/activities',
  ),
);

check('ScoreGauge', wrap(h(ScoreGauge, { score: 4.2, caption: 'x' }), '/admin'));
check('ActionItemCard', wrap(h(ActionItemCard, { item: plan.actionPlan[0] }), '/admin'));
check('ChecklistGroup', wrap(h(ChecklistGroup, { items: plan.nextEventChecklist }), '/admin'));
check('EmailDeliveryStatus', wrap(h(EmailDeliveryStatus, { delivery: plan.emailDelivery }), '/admin'));


/* ---- Admin dialogs and the shared date-range filter ---------------- */

const ActivityFormDialog = await page('admin/components/ActivityFormDialog.jsx');
const DeleteActivityDialog = await page('admin/components/DeleteActivityDialog.jsx');
const DateRangeFilter = await page('shared/ui/DateRangeFilter.jsx');
const companiesList = org.companies.filter((c) => !c.deletedAt);
const localEvent = { ...summarisedEvents[0], createdLocally: true, volunteersRegistered: 0 };
const noop = async () => ({ ok: true });

console.log('\nAdmin dialogs and filters');
check(
  'ActivityFormDialog create',
  wrap(
    h(ActivityFormDialog, { open: true, onClose: () => {}, onSubmit: noop, companies: companiesList }),
    '/admin/activities',
  ),
);
check(
  'ActivityFormDialog edit',
  wrap(
    h(ActivityFormDialog, {
      open: true,
      onClose: () => {},
      onSubmit: noop,
      companies: companiesList,
      initial: summarisedEvents[0],
    }),
    '/admin/activities',
  ),
);
check(
  'DeleteActivityDialog',
  wrap(
    h(DeleteActivityDialog, { open: true, onClose: () => {}, onConfirm: noop, event: localEvent }),
    '/admin/activities',
  ),
);
check(
  'DateRangeFilter',
  wrap(
    h(DateRangeFilter, { idPrefix: 'x', from: '2026-08-01', to: '2026-08-31', onChange: () => {} }),
    '/admin/themes',
  ),
);

console.log(failures ? `\n*** ${failures} RENDER FAILURES ***` : '\nLOADED-STATE COMPONENTS RENDER');
process.exitCode = failures ? 1 : 0;
await vite.close();
