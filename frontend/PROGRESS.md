# Project progress log

Instructions for Claude: after finishing each component, page, or feature, add a new entry below in the format shown, with the newest entry at the top. Keep entries short (3-5 lines). This file is the single source of truth for "what's already built" — always check it before starting new work, and never rebuild something already marked Done here.

If a new chat/session is started (e.g. because a usage limit was hit), the next message will paste this file's current contents in as context — continue exactly from the last entry, don't restart.

---

**[21 Aug 2026] Action plan fixed and made real, plus seven admin refinements — Done**
Files: new `admin/data/actionPlanEngine.js`, `admin/components/DeleteActivityDialog.jsx`, `shared/ui/DateRangeFilter.jsx`, `scripts/action-plan-check.mjs`; rewrote `admin/data/actionPlanIndex.js`, `admin/pages/AdminActionPlans.jsx`, `admin/pages/AdminActionPlanDetail.jsx`, `admin/components/ActionItemCard(.module.css)`, `shared/console/ThemeExplorer.jsx`; edited `shared/console/ConsoleDataProvider.jsx`, `shared/lib/orgApi.js`, `shared/lib/insights.js`, `admin/components/ActivityFormDialog.jsx`, `admin/pages/AdminActivityDetail.jsx`, `admin/pages/AdminActivities.jsx`, all six filtered pages, `shared/ui/DataTable(.jsx/.module.css)`, `shared/console/console.module.css`, `shared/console/pieces.module.css`.

**Why the Action plans tab was broken.** Two defects, both in the mock wiring. (1) `adminActionPlans.js` defines keys 1, 2, 3 and 5 — there is no 4 — so `ACTION_PLAN_FOR_EVENT['ACT-2026-0221']` was `undefined` while its key still existed: the list silently dropped that activity and its detail route was a dead link. (2) Key 3 is a stub (`generationState: 'pending'`, no `overallExperience`, no `actionPlan`), and both screens read `plan.overallExperience.summary` and `plan.actionPlan.filter(...)` unguarded, so the page threw `Cannot read properties of undefined` the moment data arrived. It rendered fine while loading, which is why it looked intermittent — and why the SSR render check missed it, since React effects never run during SSR.

What it does now: plans come from one resolver that returns a COMPLETE plan or `null`, never a half-built object. A hand-written plan is used where one exists and is complete; otherwise the plan is GENERATED from the activity's own feedback — score, what went well, what needs attention, must/should/could/watch actions with an owner and a deadline, and a checklist for the next activity of the same kind. Every item carries how many volunteers raised it, the negative share, and their verbatim words. It also compares against the last activity of the same type for the same partner to answer "did the last change work?". Generation is offered only once the feedback window has closed, and anything not yet analysable states why instead of showing a dead button.
Also: activity form now has a "Keep feedback open for" window (6h–7d, default 12h) that drives `feedbackEnd`; new activities cannot be dated before today (`min` on the input plus a server-side check); delete for admin-created activities with nobody registered, behind a type-the-name confirmation (anything with history is cancelled instead — RESTRICT foreign keys would refuse the delete); from/to date pairs across all seven filtered screens now move together so From can never exceed To; theme evidence is an inline collapse with a rotating chevron instead of a Close button; count tiles and data tables reworked (label-first tiles with reserved hint height, zebra rows, tabular numerals, sticky-header rule, on-table row counts).
Depends on: nothing new. `POST /api/events/:eventId/action-plan` is still PROPOSED — the generator is local and will be replaced by the AI service's output, which is why its output shape matches the contract field for field.
TODO / known issues: CLAUDE.md says generation is backend-triggered and no Generate button should exist. That was overridden on request — the button runs the same analysis the backend job would and records when it ran. If the backend job lands, remove the button and keep the resolver.
Verified: `npm run verify` (render check: 17 screens + volunteer portal + both console shells + every loaded-state component + the new dialogs; action-plan check: both original defects reproduce as `null` rather than a crash, 3 curated + 9 generated plans all complete, eligibility blocked with reasons for ongoing/cancelled, 9/9 generated actions quote real feedback, the worst activity at 3.3/5 yields a must-have backed by 9 volunteers at 90% negative). `npm run build` clean, `npx oxlint src` zero errors.

---

**[21 Aug 2026] Auth, role-based routing, and the NGO Admin + Corporate SPOC consoles — Done**
Files: new `auth/` (authApi, AuthProvider, RequireAuth, LoginPage, SignupPage, AuthPage.module.css); new `shared/lib/` (date, insights, analytics, exports, orgApi); new `shared/data/orgData.js`; new `shared/console/` (ConsoleLayout, ConsoleDataProvider, console.module.css, pieces.module.css, FeedbackCard, EventListCard, ThemeAverages, ThemeExplorer); new `shared/ui/` (DataTable, Form, Modal, Toast, BarList) + console tones added to Badge; new `admin/` (AdminApp, AdminLayout, 9 pages, ActivityFormDialog, AttendanceSheet, data/actionPlanIndex.js); new `spoc/` (SpocApp, SpocLayout, 6 pages); rewrote App.jsx (merge conflict resolved); edited volunteer/state/VolunteerProvider.jsx + volunteer/pages/ProfilePage.jsx; new scripts/render-check.mjs.
What it does: One sign-in/sign-up front door with a role dropdown (Volunteer / Corporate SPOC / Seva Sahayog admin, mapping to the schema's two user tables via `loginType`), then role-gated routes into three separate apps. Admin console covers H (activity CRUD), I (feedback filtered by activity/date/partner/rating/theme + comment search), J (CSV + print-to-PDF), plus theme discovery (C) and the existing AI action plans. SPOC console covers K (upcoming activities + volunteering needs), L (their company's themes and feedback details) and M (reports/exports) — scoped to one companyId in the data provider. Feedback classification runs in the browser (`shared/lib/insights.js`) into the `InsightTheme` enum with sentiment, confidence and the exact evidence fragment, matching `feedback_insights` row-for-row; it matches English, Hindi and Marathi cues. `shared/data/orgData.js` imports the volunteer app's own demo data, so Rajesh Kulkarni's activities and his three feedbacks are literally the same rows on both sides, and anything submitted live in the portal shows up in the admin console.
Depends on: nothing new. Every API-shaped call lives in `shared/lib/orgApi.js` and `auth/authApi.js` and matches `backend/API_ENDPOINTS.md`; swapping in `fetch(..., { credentials: 'include' })` is a change to those two files only.
TODO / known issues: (1) Route guards are navigation, not authorisation — the real check is the backend role middleware; say so in the pitch. (2) There is no public signup endpoint on the backend yet (admins create SPOCs/volunteers); the signup form posts the same body the create endpoints take. (3) The volunteer app's duplicate-submission storage keys are per-device, not per-user, so signing in as a second volunteer on the same browser inherits the first one's submitted flags — only matters if you demo two volunteer accounts on one machine. (4) No chart library added (CLAUDE.md names Recharts): the one chart type is a directly-labelled bar list in `shared/ui/BarList.jsx`, which prints in black and white and adds no bundle weight — swap it if the team wants Recharts. (5) CLAUDE.md still says MongoDB/Mongoose; the actual backend is PostgreSQL + Prisma and this work follows `backend/prisma/schema.prisma`.
Verified: `npm run build` clean, `npx oxlint src` zero errors, `node scripts/render-check.mjs` renders all 17 screens + both console shells + every loaded-state component against the real dataset, and a data/logic smoke pass confirming 9-of-9 ratings in range on all 682 seeded rows, one feedback per (event, volunteer), and Devanagari surviving both the classifier and the CSV export.

---

## Example entry (delete once real entries start)
**[14:05] Donation list page — Done**
Files: src/pages/Donations.jsx, src/services/donationService.js, src/components/DonationCard.jsx
What it does: Fetches GET /api/donations, renders a card per donation using DESIGN.md card style.
Depends on: backend /api/donations endpoint (see API_CONTRACT.md)
TODO / known issues: Loading and empty states not styled yet.

---

**[Setup] Design system + problem statement locked in — Done**
Files: DESIGN.md, styles/variables.css, CLAUDE.md
What it does: PS from the printed sheet transcribed into CLAUDE.md (Problem statement, Core features Must/Should-have). DESIGN.md and variables.css filled with the team's 4 brand hex codes (#016B61, #70B2B2, #9ECFD4, #E5E9C5) mapped to primary/secondary/tint/accent, plus derived background/surface/text/border tokens, Inter as the font (loaded via @import in variables.css), and agreed button/card/input/navbar/icon-set styles.
Depends on: nothing — no app scaffolded yet.
TODO / known issues: PS sheet lists item G under both Must-have and Good-to-have — treated as must-have, flagged to the team. App not scaffolded yet (Vite vs CRA still to confirm). No components built yet.

---

**[Setup] Frontend scaffolded, Admin dashboard + activity detail built — Done**
Files: App.jsx, main.jsx, index.css, styles/variables.css, components/AdminLayout, AdminSidebar, AdminTopbar, SummaryCard, ActivityFilterBar, ActivityCard, ProgressBar, StarRating, AlertBox, FeedbackItem, Button; pages/AdminDashboard(.module.css), pages/AdminActivityDetail(.module.css); data/mockActivities.js
What it does: Confirmed Vite (matches team's origin/main scaffold, merged into this branch). Installed react-router-dom + lucide-react. Built /admin (KPI summary cards computed from mock data, category filter, activity grid) and /admin/activities/:activityId (stats, feedback themes with progress bars, attention/success alert box, recent feedback list) — layout matches the reference dashboard from Shreyans's prototype folder, fully recolored to the locked palette (no colors outside DESIGN.md tokens), split into CSS-Modules components per CLAUDE.md conventions, emoji icons swapped for lucide-react. Added 3 low-opacity tint tokens (--color-tint-bg/--color-success-bg/--color-error-bg) to variables.css + DESIGN.md for badge/banner backgrounds — still zero new hues.
Depends on: no real backend yet — activities/feedback data is local mock data in src/data/mockActivities.js, since API_CONTRACT.md has no rows for those resources. Swap for src/services/activityService.js once the backend adds them.
TODO / known issues: Sidebar items other than Dashboard (Activities, Feedback, Volunteers, Insights, Reports, Settings) are visual-only placeholders, no pages/routes built for them yet. "Create Activity" and "Export Report"/"Filter" buttons are not wired to anything yet. Repo's root claude.md/documentation.md are still empty — this file and DESIGN.md/CLAUDE.md/API_CONTRACT.md now live in frontend/ instead; flagged to the team, may need reconciling.

---

**[21 Aug 2026] AI Action Plan / Insights page built — Done**
Files: pages/AdminInsights(.module.css); components/Badge, ActionItemCard, ChecklistGroup, InsightsEventSwitcher; data/mockActionPlans.js; edited pages/AdminActivityDetail.jsx (removed Feedback Themes card + old alert/recommendation), components/ActivityCard.jsx (removed theme-pill preview, added feedback-open/closed badge), components/AdminSidebar.jsx (Insights now a real link), App.jsx (new /admin/insights and /admin/insights/:eventId routes), mockActivities.js (added feedbackStatus/feedbackDeadline, removed themes/alert/recommendation)
What it does: Dedicated Insights page per event showing an AI-generated Action Plan grouped into Must Have / Should Have / Could Have / Watch (spec section 21), with Overall Experience score, AI Summary, What Went Well, Next Event Preparation checklist, and Previous Action Plan comparison. No "Themes" dashboard anywhere per the spec — theme-equivalent content now lives as evidence inside each Action Plan item. No "Generate" button anywhere — the page is purely a reader of backend-generated data. Built and verified all 5 states: generated-with-issues (event 1), generated-clean (event 2), pending/analysing (event 3), feedback-still-open/no-plan-yet (event 4), generated-with-improvement-history (event 5).
Depends on: PROPOSED backend endpoint `GET /api/events/:eventId/action-plan` — see API_CONTRACT.md "AI Action Plan shape". Mock data in src/data/mockActionPlans.js matches that shape exactly for an easy swap.
TODO / known issues: The scheduled feedback-closure job, the actual AI analysis, PDF report generation, and the automated admin email (spec sections 1, 13, 16-20) are backend/AI team scope — not built here, not attempted here. Flagged so they land on the right teammates' plates via `backend/` and `ai/`.

---

**[21 Aug 2026] Insights page cut down to essentials — Done**
Files: pages/AdminInsights(.module.css), components/ActionItemCard(.module.css); new components/ScoreGauge(.module.css)
What it does: Per direct feedback ("no theory, crisp points and visualizations"), removed AI Summary paragraph, What Went Well, Could Have, Watch, and Previous Action Plan Result sections entirely from the page. Kept only: Overall Experience (now a circular SVG gauge instead of a text block — visual, not prose), Automated Action Plan (Must Have + Should Have only), and Next Event Preparation checklist unchanged. Action items rewritten from paragraph cards (description + why + 4-row meta grid) to 2-line crisp cards: title, one-line "why", who/when. Re-verified events 1 and 5 in-browser, zero console errors, gauge fill % confirmed correct via computed SVG attributes.
Depends on: same as above.
TODO / known issues: whatWentWell/previousActionPlanEvaluation fields still exist in mockActionPlans.js / the proposed API shape (backend may still return them) — just not rendered. Fine to leave as-is since unused data doesn't hurt; flag if the contract should drop them entirely too.

---

**[21 Aug 2026] Email delivery status shown on Insights page — Done**
Files: new components/EmailDeliveryStatus(.module.css); edited pages/AdminInsights.jsx, data/mockActionPlans.js (added `emailDelivery` per generated plan), API_CONTRACT.md (added `emailDelivery` to the proposed shape)
What it does: Frontend-only representation that the PDF Action Plan report was auto-emailed to the admin — filename, recipient, sent timestamp, sent/failed badge, shown right under the header on Insights. Failed status shows a "Resend" button (verified working — flips to sent + "Just now"). This does NOT send a real email or generate a real PDF — pure UI, per explicit instruction to keep this quick and frontend-only.
Depends on: backend/AI actually implementing PDF generation + email sending (spec sections 16-20) and returning `emailDelivery` on the action-plan endpoint. Resend button has no real endpoint to call yet — it's a local-state placeholder.
TODO / known issues: none for the frontend piece; real backend wiring is out of scope here as agreed.

---

**[21 Aug 2026] Activity Detail richer feedback view + Insights visual pass — Done**
Files: new components/FeedbackResponseCard(.module.css), SectionRatings(.module.css); new data/categoryIcons.js (shared, also now used by ActivityCard); edited pages/AdminActivityDetail(.module.css) (category icon avatar in header, added FeedbackResponseCard + SectionRatings), data/mockActivities.js (added `sectionRatings` per activity: Activity Organization/Volunteer Coordination/Activity Timing/Overall Experience), components/ActionItemCard.jsx (dropped the "why" sentence — title + who/when only), pages/AdminInsights(.module.css) (added Must/Should count tiles next to the score gauge), components/ChecklistGroup(.module.css) (added a Before→During→After phase stepper)
What it does: Activity Detail now matches the requested reference screenshot — response-tracking card with a "Message Pending Volunteers" button and a conditional (responseRate < 50%) low-response warning, plus a per-section star-rating breakdown with progress bars. Insights page trimmed further per "no theory" — action cards are now 2 lines, and two new visualizations added (count tiles, phase stepper) alongside the existing score gauge.
Depends on: same mock-data caveat as before.
TODO / known issues: the reference screenshot showed a 34%/"below 50%" warning for Tree Plantation, but our existing mock data for that activity is 80/91 = 88% (already established, used elsewhere) — kept it accurate rather than copying the screenshot's number, so the warning banner is correctly implemented but doesn't fire for any of the 5 current mock activities. Say the word if you want one activity's numbers lowered to demo it. "Message Pending Volunteers" button is visual-only, no WhatsApp/email wiring yet.

---

(new entries go above this line, newest on top)
