# Backend — SevaSahayog Volunteer Feedback API

Node.js + Express 5 (ES modules) with PostgreSQL via Prisma.

## Setup

```bash
npm install
cp .env.example .env      # then fill in DATABASE_URL
npm run db:push            # push schema to DB (development)
npm run db:seed            # load demo data
npm run dev
```

`.env` is gitignored — never commit real credentials.

## Database scripts

| Script | Purpose |
| --- | --- |
| `npm run db:generate` | Regenerate the Prisma client after editing `schema.prisma` |
| `npm run db:migrate` | Create + apply a new migration (development) |
| `npm run db:deploy` | Apply existing migrations (CI / teammates / production) |
| `npm run db:push` | Push schema changes directly (development — skips migration history) |
| `npm run db:seed` | Load demo companies, events, volunteers and feedback |
| `npm run db:studio` | Browse the data in Prisma Studio |
| `npm run db:reset` | Drop, re-migrate and re-seed — **destroys all data** |

The seed is idempotent, so `db:seed` is safe to re-run.

## Schema Overview

### User Domains (Separate Tables)

The system has **two distinct user domains** — they never share a table:

| Table | Roles | Purpose |
| --- | --- | --- |
| `ngo_users` | ADMIN, STAFF | NGO employees who create and manage events |
| `company_users` | SPOC, VOLUNTEER | Corporate employees who participate in events |

- An NGO ADMIN creates events.
- A STAFF user helps manage them.
- A SPOC is optionally assigned per event and must belong to the same company.
- A VOLUNTEER registers for events belonging to their own company only.

### Core Tables

```
Company ──< CompanyUser
Company ──< Event
NGOUser ──< Event (as creator/admin)
CompanyUser ──< Event (as SPOC, optional)
Event ──< EventRegistration
CompanyUser ──< EventRegistration (as volunteer)
EventRegistration ──1 Feedback (0 or 1)
Feedback ──< FeedbackRating >── FeedbackTheme
Feedback ──< FeedbackInsight >── FeedbackTheme (optional)
Feedback ──< AIAnalysisRun
```

### Tables Summary

| # | Table | Purpose |
|---|-------|---------|
| 1 | `ngo_users` | NGO employees (ADMIN / STAFF) |
| 2 | `companies` | Corporate partner organizations |
| 3 | `company_users` | Corporate employees (SPOC / VOLUNTEER) |
| 4 | `events` | Volunteering events |
| 5 | `event_registrations` | Volunteer registrations for events |
| 6 | `feedback` | Volunteer feedback submissions |
| 7 | `feedback_themes` | Rating dimension catalog (6 mandatory + extensible) |
| 8 | `feedback_ratings` | Normalized ratings (one row per theme per feedback) |
| 9 | `feedback_insights` | AI-classified aspect-level sentiment from free text |
| 10 | `ai_analysis_runs` | Audit trail for AI processing runs |

## Ratings are normalized

`feedback` has **no rating columns**. Every rating is a `feedback_ratings` row pointing at a
`feedback_themes` row, so adding a seventh question is an INSERT, not a migration:

```text
Feedback ──< FeedbackRating >── FeedbackTheme
```

Six mandatory themes drive the form. They are inserted by the seed script and must not be
deleted — retire one with `isActive = false`.

| # | themeCode | Question | Scale |
| --- | --- | --- | --- |
| 1 | `OVERALL_EXPERIENCE` | How would you rate your overall volunteering experience? | Very Poor → Excellent |
| 2 | `PUNCTUALITY` | How well was the activity conducted according to the planned schedule? | Very Poor → Excellent |
| 3 | `ORGANIZATION` | How well was the activity organized and managed? | Very Poor → Excellent |
| 4 | `COMMUNICATION` | How clear and effective was the communication before and during the activity? | Very Poor → Excellent |
| 5 | `IMPACT` | How meaningful and impactful did you find this activity? | Very Poor → Excellent |
| 6 | `PARTICIPATION_LIKELIHOOD` | How likely are you to participate in a similar volunteering activity again? | Very Unlikely → Very Likely |

Theme 6 is a behavioural-intention metric, so its scale wording differs. Both scales live in
`feedback_themes.scale_labels` as JSON (`{"1":"Very Poor",…}`) — **render labels from the API,
don't hardcode them in the frontend**, or the two will drift apart.

## AI Feedback Classification

Free-text feedback (`Feedback.overallComment`) is analyzed using aspect-based sentiment analysis.

### FeedbackInsight

Each insight captures one detected aspect with:
- **detectedTheme** — the normalized theme name (e.g., `PUNCTUALITY`, `VENUE`)
- **sentiment** — 5-level scale: `VERY_NEGATIVE`, `NEGATIVE`, `NEUTRAL`, `POSITIVE`, `VERY_POSITIVE`
- **confidence** — decimal 0–1
- **evidenceText** — exact fragment from the volunteer's text that led to the classification
- **extractionMethod** — `AI` (confidence ≥ 0.75), `HEURISTIC` (< 0.75), or `HYBRID`
- **themeId** — links to `FeedbackTheme` if the theme matches a known one; NULL for ad-hoc themes like `VENUE`

### AIAnalysisRun

Audit trail tracking which model + prompt version processed each feedback, with timing and status.

## Delete Strategy

Historical feedback data is protected:

| Entity | On Delete | Rationale |
| --- | --- | --- |
| Company → Event | **RESTRICT** | Never lose historical events |
| Company → CompanyUser | **RESTRICT** | Never lose historical user records |
| Event → EventRegistration | **RESTRICT** | Never lose registration history |
| EventRegistration → Feedback | **RESTRICT** | Never lose submitted feedback |
| Feedback → FeedbackRating | **CASCADE** | Owned child data |
| Feedback → FeedbackInsight | **CASCADE** | Owned child data |
| Feedback → AIAnalysisRun | **CASCADE** | Owned child data |
| FeedbackTheme → FeedbackRating | **RESTRICT** | Never orphan historical ratings |
| FeedbackTheme → FeedbackInsight | **SET NULL** | Insight keeps detectedTheme string |
| Event → SPOC (CompanyUser) | **SET NULL** | Event survives if SPOC is removed |

**Do not delete Companies or Users with existing data.** Deactivate them instead.

## Business Rules

### Database-Enforced (constraints)

| Rule | Mechanism |
| --- | --- |
| NGOUser roles: ADMIN or STAFF only | `NgoRole` enum |
| CompanyUser roles: SPOC or VOLUNTEER only | `CompanyRole` enum |
| Separate user domains | Two distinct tables |
| One email per company | `@@unique([companyId, email])` on `company_users` |
| NGOUser email globally unique | `@unique` on `ngo_users.email` |
| Company name unique | `@unique` on `companies.company_name` |
| One registration per volunteer per event | `@@unique([eventId, userId])` on `event_registrations` |
| One feedback per registration | `@unique` on `feedback.registration_id` |
| One rating per theme per feedback | `@@unique([feedbackId, themeId])` on `feedback_ratings` |
| Rating 1–5 | CHECK constraint (add in migration SQL) |

### Service-Layer Enforced

| Rule | Why not DB-enforced |
| --- | --- |
| Only ADMIN can create events | Role check requires application logic |
| Event SPOC must belong to same company as event | Cross-table check on two FKs |
| Volunteer can only register for own company's events | Cross-table check |
| All 6 mandatory ratings required per feedback | Rows don't exist at validation time |
| Feedback within feedback window | Business time logic |
| feedbackStart < feedbackEnd | Cross-column check (can add CHECK constraint) |
| SPOC can only see own company's data | Authorization logic |

## Security

- Never store plaintext passwords — use `passwordHash`.
- Never expose `passwordHash` in API responses.
- Never log passwords.
- NGO user email is globally unique; corporate user email is unique per company.

## Local gotcha: port 5000 on macOS

macOS AirPlay Receiver (ControlCenter) listens on port 5000 and answers with HTTP 403,
which shadows this server. Either turn it off in *System Settings → General → AirDrop &
Handoff → AirPlay Receiver*, or set `PORT=5055` in `.env` and update `CORS_ORIGIN` plus the
frontend's API base URL to match.
