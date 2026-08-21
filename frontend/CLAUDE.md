# Project: SevaSahayog Volunteer Experience Platform (working title)

## Problem statement
THEME: Volunteer Feedback Collection & Experience Tracking System

**Business need**
SevaSahayog Foundation conducts approximately 30-35 volunteering activities every month with corporate employees. Volunteer feedback is essential to improve activity design, engagement and stakeholder reporting, but today it is largely shared through verbal conversations, phone calls, emails, WhatsApp messages and occasional manual notes.

Roles involved typically are:
- Volunteers – corporate employees who participate in the volunteering events
- Corporate SPOC – coordinators at the corporate offices who work with SevaSahayog for planning, managing the activities
- Admin – SevaSahayog employees managing the volunteering activities

**Current challenges**
Because there is no formal, centralized process, feedback is not consistently captured or easy to retrieve. The Foundation cannot reliably compare experiences across activities and companies, identify recurring themes, surface urgent concerns or reuse historical learning when planning future activities.

**Expectation**
A quick digital feedback solution that allows volunteers to submit feedback within a minute after each activity and enables the SevaSahayog team to maintain a centralized record, view feedback by activity or corporate partner, track common improvement areas, and access past inputs for reporting and planning.

A quick survey alone may collect more responses, but the deeper challenge is to convert fragmented, multilingual and unstructured human feedback into evidence-backed decisions without adding operational burden for volunteers or NGO teams.

**Usecase definition**
- A. Design and build a Volunteer Experience Platform that allows SevaSahayog to configure volunteering activities
- B. Volunteers should be able to submit feedback immediately after an activity and enable SevaSahayog users to review, track, and use feedback for future planning and reporting
- C. Classify feedback and discover themes from the feedback provided by the volunteers for reporting
- D. Multilingual support for feedback submission can be considered to make the experience more inclusive for volunteers

Volunteer role:
- E. Create a quick and guided experience for volunteers to submit feedback after an activity
- F. Capture basic activity details, ratings, comments, suggestions, and volunteer contact information where required
- G. Provide confirmation after feedback submission and avoid duplicate submissions for the same activity where possible

Admin role:
- H. Create and maintain activity records so feedback can be mapped to the correct volunteering event and corporate partner
- I. View feedback filtered by activity, date, corporate partner, rating, and common improvement themes
- J. Export feedback summaries and reports into files such as Excel or PDF for internal review and stakeholder sharing

Corporate SPOC role:
- K. View upcoming activities and volunteering needs for the same
- L. View feedback themes and details for the activities conducted for their company
- M. View and extract reports of the activities conducted showcasing volunteer-experience outcomes

Participant roles within the team: Role 1 Frontend Developer, Role 2 Backend Developer, Role 3 Database Developer, Role 4 QA Engineer (Test & Validate), Role 5 Product Analyst (Acceptance).

> Note: the source sheet lists **G** in both MUST HAVES and GOOD TO HAVES — flagging this, treating it as must-have (duplicate-submission handling belongs with the core submit flow) unless told otherwise.

## Core features (must-have, from MoSCoW cut)
- [ ] A — Volunteer Experience Platform: SevaSahayog can configure volunteering activities
- [ ] B — Volunteers submit feedback post-activity; SevaSahayog reviews/tracks/uses it for planning & reporting
- [ ] C — Classify feedback and surface themes from volunteer feedback for reporting
- [ ] E — Quick, guided volunteer feedback submission flow
- [ ] F — Capture activity details, ratings, comments, suggestions, volunteer contact info (where required)
- [ ] G — Submission confirmation + avoid duplicate submissions for the same activity
- [ ] H — Admin creates/maintains activity records mapped to event + corporate partner
- [ ] I — Admin views feedback filtered by activity, date, corporate partner, rating, improvement themes
- [ ] L — Corporate SPOC views feedback themes/details for their company's activities

## Should-have (only if time remains)
- [ ] D — Multilingual support for feedback submission
- [ ] J — Admin exports feedback summaries/reports as Excel or PDF
- [ ] K — Corporate SPOC views upcoming activities and volunteering needs
- [ ] M — Corporate SPOC views/extracts reports of volunteer-experience outcomes

## AI Action Plan / Insights (elaboration of C + I, added 21 Aug 2026)
Instead of a manual "Themes" dashboard, feedback closure automatically triggers an AI-generated Action Plan (structured MUST HAVE / SHOULD HAVE / COULD HAVE / WATCH recommendations) shown in NGO Admin → Insights. Full spec lives in the conversation that requested it; the frontend contract is in API_CONTRACT.md under "AI Action Plan shape".
**Frontend scope:** the Insights page (`pages/AdminInsights.jsx`) rendering this structured data, reading-only.
**NOT frontend scope** (backend/`ai` folders): the scheduled job that detects feedback-period closure, the AI analysis call itself, PDF report generation, and the automated admin email. There is deliberately no "Generate Action Plan" button anywhere in the UI — generation is backend-triggered only.

## Tech stack
- Frontend: React with plain JavaScript. NO TypeScript — never generate .ts/.tsx files, never add type annotations, never suggest converting to TS.
- Styling: Plain CSS with CSS Modules (one Component.module.css per component) plus shared CSS custom properties in styles/variables.css for design tokens. NO Tailwind CSS, NO CSS-in-JS libraries (no styled-components, no emotion).
- React Router for navigation
- Charts (if needed): Recharts
- Backend: Node.js + Express (built by teammates — see API_CONTRACT.md)
- Database: MongoDB via Mongoose (backend-owned)

## Folder structure
```
src/
  components/
    Button/
      Button.jsx
      Button.module.css
    (same pattern: one folder per component, .jsx + .module.css together)
  pages/          -> route-level components (Home, Dashboard, Login)
  hooks/          -> custom React hooks
  services/       -> API call functions, one file per resource (e.g. donationService.js)
  context/        -> React Context providers, only if global state is needed
  styles/
    variables.css -> shared design tokens as CSS custom properties, imported once globally
  assets/         -> images, icons
```

## Conventions
- Functional components with hooks only. No class components.
- One component per file, plain JavaScript (.jsx), PascalCase filenames (e.g. DonationCard.jsx). No TypeScript syntax anywhere.
- Styling: each component gets its own Component.module.css, imported as `import styles from './Component.module.css'` and used as `className={styles.card}`. This avoids class-name collisions across 4 people working in the same repo.
- Follow DESIGN.md for every color, spacing, and typography choice — reference the CSS variables from styles/variables.css (e.g. `color: var(--color-primary)`), never a hardcoded hex value or px number that isn't a token.
- All API calls go through services/ — never an inline fetch() call inside a component.
- Follow API_CONTRACT.md exactly for request and response shapes. If something doesn't match what the backend actually built, flag it instead of guessing.

## Working rules for every session
1. Before starting new work, check PROGRESS.md for what's already built — never rebuild something marked Done.
2. After finishing any component, page, or feature, append a short entry to PROGRESS.md (what was built, files touched, anything left TODO or broken) BEFORE moving to the next task.
3. Keep components small and composable — prefer three small components over one giant one.
4. If unsure which design token to use, ask rather than inventing a new color/spacing value.
