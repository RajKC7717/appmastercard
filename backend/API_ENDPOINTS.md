# API Endpoints

Base URL: `http://localhost:5000/api`

Authentication uses a JWT stored in an **HTTP-only cookie** named `token`.
Send credentials/cookies with each request (in Postman, cookies are handled
automatically; in fetch use `credentials: 'include'`).

**Roles:** `ADMIN`, `STAFF` (NGO staff) · `SPOC`, `VOLUNTEER` (company users)

> **Two user tables:** NGO staff (`ADMIN`/`STAFF`) are in `ngo_users`; company employees (`SPOC`/`VOLUNTEER`) are in `company_users`. All IDs are **UUIDs**.

---

## Auth

| Method | Endpoint | Auth | Allowed Roles | Description |
|--------|----------|------|---------------|-------------|
| POST | `/api/auth/login` | Public | — | Log in; sets the HTTP-only auth cookie. |
| POST | `/api/auth/logout` | Public | — | Clears the auth cookie. |
| GET | `/api/auth/me` | Required | Any | Returns `{ id, name, email, role, companyId }`. |

**Login body**
```json
{ "email": "admin@ngo.com", "password": "admin123", "loginType": "ADMIN" }
```

| `loginType` | Searches | Use for |
|-------------|----------|---------|
| `"ADMIN"` | `ngo_users` table | NGO Admin / Staff |
| `"COMPANY"` | `company_users` table | SPOC / Volunteer |
| *(omitted)* | Both tables | Fallback |

**Response**
```json
{
  "message": "Logged in successfully",
  "user": { "id": "<uuid>", "name": "NGO Admin", "email": "admin@ngo.com", "role": "ADMIN", "companyId": null }
}
```

---

## Companies

| Method | Endpoint | Auth | Allowed Roles | Description |
|--------|----------|------|---------------|-------------|
| POST | `/api/companies` | Required | `ADMIN` | Create a company. |
| GET | `/api/companies` | Required | `ADMIN` | List all active companies. |
| GET | `/api/companies/:companyId` | Required | `ADMIN`/`STAFF` (any), `SPOC`/`VOLUNTEER` (own only) | Get a single company. |
| PATCH | `/api/companies/:companyId` | Required | `ADMIN` | Update company name. |
| DELETE | `/api/companies/:companyId` | Required | `ADMIN` | Soft-delete (sets `deletedAt`). |

**Create/Update body**
```json
{ "name": "Infosys" }
```

---

## SPOC

Nested under a company. Each company has **at most one** SPOC.

| Method | Endpoint | Auth | Allowed Roles | Description |
|--------|----------|------|---------------|-------------|
| POST | `/api/companies/:companyId/spoc` | Required | `ADMIN` | Create the company's SPOC (`409` if one exists). |
| GET | `/api/companies/:companyId/spoc` | Required | `ADMIN`/`STAFF` (any), `SPOC` (own only) | Get the company's SPOC. |
| PATCH | `/api/companies/:companyId/spoc/:spocId` | Required | `ADMIN` | Update SPOC (`name`, `email`, `phone`). |
| DELETE | `/api/companies/:companyId/spoc/:spocId` | Required | `ADMIN` | Soft-delete the SPOC (sets `deletedAt`). |

**Create body** (role & companyId are set by the server)
```json
{ "name": "Rahul Sharma", "email": "spoc@company.com", "password": "password123", "phone": "9876543210" }
```

---

## Volunteers

Nested under a company.

| Method | Endpoint | Auth | Allowed Roles | Description |
|--------|----------|------|---------------|-------------|
| POST | `/api/companies/:companyId/volunteers` | Required | `ADMIN`, `STAFF`, that company's `SPOC` | Create a volunteer. |
| GET | `/api/companies/:companyId/volunteers` | Required | `ADMIN`/`STAFF` (any), `SPOC` (own only) | List the company's volunteers. |
| GET | `/api/companies/:companyId/volunteers/:volunteerId` | Required | `ADMIN`, `STAFF`, `SPOC` (own), `VOLUNTEER` (self only) | Get a single volunteer. |
| PATCH | `/api/companies/:companyId/volunteers/:volunteerId` | Required | `ADMIN`, `STAFF`, that company's `SPOC` | Update (`name`, `email`, `phone`). |
| DELETE | `/api/companies/:companyId/volunteers/:volunteerId` | Required | `ADMIN`, `STAFF`, that company's `SPOC` | Soft-delete the volunteer. |

**Create body** (role & companyId are set by the server)
```json
{ "name": "Volunteer One", "email": "vol@company.com", "password": "password123", "phone": "9876543210" }
```

---

## Events

| Method | Endpoint | Auth | Allowed Roles | Description |
|--------|----------|------|---------------|-------------|
| POST | `/api/events` | Required | `ADMIN` | Create a new event. |
| GET | `/api/events` | Required | Any | List events. `ADMIN`/`STAFF` see all; `SPOC`/`VOLUNTEER` see their company's only. |
| GET | `/api/events/:eventId` | Required | Any | Get a single event. |
| PATCH | `/api/events/:eventId` | Required | `ADMIN` | Update event details. |
| PATCH | `/api/events/:eventId/status` | Required | `ADMIN` | Change event lifecycle status. |
| PATCH | `/api/events/:eventId/spoc` | Required | `ADMIN` | Assign or unassign the event's SPOC. |
| DELETE | `/api/events/:eventId` | Required | `ADMIN` | Cancel the event (sets status = `CANCELLED`; never hard-deleted). |

**Query params for `GET /api/events`**

| Param | Type | Description |
|-------|------|-------------|
| `companyId` | UUID | Filter by company (`ADMIN`/`STAFF` only) |
| `status` | string | Filter by status (see below) |
| `page` | number | Page number (default `1`) |
| `limit` | number | Results per page (default `20`) |

**Event statuses:** `UPCOMING` · `REGISTRATION_OPEN` · `ONGOING` · `COMPLETED` · `CANCELLED`

**Create body**
```json
{
  "companyId": "<uuid>",
  "spocId": "<uuid>",
  "eventName": "Tree Plantation Drive",
  "description": "Plant 500 trees at Sanjay Gandhi National Park",
  "location": "Borivali, Mumbai",
  "eventDate": "2026-09-15T08:00:00.000Z",
  "feedbackStart": "2026-09-15T18:00:00.000Z",
  "feedbackEnd": "2026-09-22T23:59:59.000Z"
}
```

**Status update body**
```json
{ "status": "REGISTRATION_OPEN" }
```

**SPOC assignment body**
```json
{ "spocId": "<uuid>" }
```
> Pass `null` to unassign the SPOC.

---

## Event Registrations

Nested under an event (`/api/events/:eventId/registrations`).

| Method | Endpoint | Auth | Allowed Roles | Description |
|--------|----------|------|---------------|-------------|
| POST | `/api/events/:eventId/registrations` | Required | `VOLUNTEER` | Register self for the event. |
| GET | `/api/events/:eventId/registrations` | Required | `ADMIN`, `STAFF`, `SPOC` | List all registrations for the event. |
| GET | `/api/events/:eventId/registrations/me` | Required | `VOLUNTEER` | Get my own registration for this event. |
| PATCH | `/api/events/:eventId/registrations/:registrationId/attendance` | Required | `ADMIN`, `STAFF`, `SPOC` | Mark attendance. |
| DELETE | `/api/events/:eventId/registrations/:registrationId` | Required | `VOLUNTEER` (own), `ADMIN`, `STAFF`, `SPOC` | Cancel a registration (sets `attendanceStatus = CANCELLED`). |

**Attendance body**
```json
{ "attendanceStatus": "ATTENDED" }
```
Allowed values: `REGISTERED` · `ATTENDED` · `ABSENT`

**Business rules enforced:**
- `RULE 12` — volunteer can only register for their **own company's** event
- `RULE 13` — one registration per (event, volunteer) → `409` on duplicate
- Event must have status `REGISTRATION_OPEN` to accept new registrations

---

## Feedback

### Submit (nested under registration)

| Method | Endpoint | Auth | Allowed Roles | Description |
|--------|----------|------|---------------|-------------|
| POST | `/api/events/:eventId/registrations/:registrationId/feedback` | Required | `VOLUNTEER` (own registration) | Submit feedback with ratings for all 9 mandatory themes. |

**Submit body**
```json
{
  "overallComment": "Great event, very impactful!",
  "language": "EN",
  "ratings": [
    { "themeId": "<uuid>", "rating": 5 },
    { "themeId": "<uuid>", "rating": 4 }
  ]
}
```
> `language`: `EN` (default) · `MR` · `HI`  
> `ratings` must include **all 9 mandatory themes** (get their IDs from `GET /api/themes`). Each `rating` must be `1–5`.

**Business rules enforced:**
- `RULE 15` — one feedback per registration (`409` if already submitted)
- `RULE 16` — ratings must be `1–5`
- `RULE 17` — one rating per (feedback, theme)
- `RULE 18` — all mandatory themes must be rated
- `RULE 19/20` — `overallComment` stored verbatim, never modified
- Feedback window checked against event's `feedbackStart` / `feedbackEnd`

### Read (nested under event)

| Method | Endpoint | Auth | Allowed Roles | Description |
|--------|----------|------|---------------|-------------|
| GET | `/api/events/:eventId/feedback` | Required | `ADMIN`, `STAFF`, `SPOC` | All feedback submissions for the event (with ratings + AI insights). |
| GET | `/api/events/:eventId/feedback/stats` | Required | `ADMIN`, `STAFF`, `SPOC` | Aggregated average rating per theme, ordered by `displayOrder`. |
| GET | `/api/events/:eventId/feedback/me` | Required | `VOLUNTEER` | My own feedback for this event. |
| GET | `/api/feedback/:feedbackId` | Required | Owner (`VOLUNTEER`), `ADMIN`, `STAFF`, `SPOC` (own company) | Get a single feedback by ID. |

**Stats response**
```json
{
  "stats": [
    { "themeCode": "IMPACT", "themeName": "Impact", "avgRating": 4.67, "count": 12, "displayOrder": 1 },
    { "themeCode": "TIMELINE_PLANNING", "themeName": "Timeline Planning", "avgRating": 3.92, "count": 12, "displayOrder": 2 }
  ]
}
```

---

## Feedback Themes

The 9 mandatory themes that must be rated on every feedback submission.

| Method | Endpoint | Auth | Allowed Roles | Description |
|--------|----------|------|---------------|-------------|
| GET | `/api/themes` | Required | Any | Active themes ordered by `displayOrder` (use to render the feedback form). |
| GET | `/api/themes/all` | Required | `ADMIN`, `STAFF` | All themes including retired ones (for admin dashboards). |

**Theme object**
```json
{
  "id": "<uuid>",
  "themeCode": "IMPACT",
  "themeName": "Impact",
  "question": "How meaningful was the impact of this event on the community you served?",
  "scaleLabels": { "1": "Not meaningful at all", "5": "Extremely meaningful" },
  "isMandatory": true,
  "isActive": true,
  "displayOrder": 1
}
```

**The 9 mandatory themes (in order):**

| Order | Code | Question summary |
|-------|------|-----------------|
| 1 | `IMPACT` | How meaningful was the community impact? |
| 2 | `TIMELINE_PLANNING` | How well was the event timeline planned? |
| 3 | `REQUIREMENTS_PLANNING` | How well were requirements planned? |
| 4 | `FINANCIAL_PLANNING` | How well was the financial planning handled? |
| 5 | `PRE_EVENT_COMMUNICATION` | How clear was communication before the event? |
| 6 | `DAY_OF_COMMUNICATION` | How clear was on-site communication? |
| 7 | `SKILL_UTILIZATION` | How well were your skills utilised? |
| 8 | `STAFF_SUPPORT` | How would you rate NGO staff support? |
| 9 | `PARTICIPATION_LIKELIHOOD` | How likely are you to recommend participation? |

---

## Test / Verification

| Method | Endpoint | Auth | Allowed Roles | Description |
|--------|----------|------|---------------|-------------|
| GET | `/api/test/protected` | Required | Any | Confirms authentication works. |
| GET | `/api/test/admin` | Required | `ADMIN` | Confirms admin-only authorization. |
| GET | `/api/test/company` | Required | `SPOC`, `VOLUNTEER` | Confirms company-user authorization. |

---

## Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | Public | Basic liveness check (`{ "status": "ok" }`). |
| GET | `/api/health` | Public | Detailed health (status, timestamp, uptime, DB). |

---

## Response / Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request / validation error (e.g. missing mandatory theme ratings) |
| `401` | Not authenticated (missing/invalid/expired token) |
| `403` | Authenticated but not authorized for this role or company |
| `404` | Resource not found |
| `409` | Conflict (duplicate registration, feedback already submitted, SPOC already exists) |

---

## Test Accounts

> Credentials match the seed file (`prisma/seed.js`). Run `npm run db:seed` to populate.

| Role | Email | Password | Company |
|------|-------|----------|---------|
| `ADMIN` | `admin@ngo.com` | `admin123` | — |
| `SPOC` | `rahul@mastercard.com` | `spoc123` | Mastercard |
| `VOLUNTEER` | `volunteer1@mastercard.com` | `volunteer123` | Mastercard |
| `VOLUNTEER` | `volunteer2@mastercard.com` | `volunteer123` | Mastercard |
| `SPOC` | `priya@tcs.com` | `spoc123` | TCS |
| `VOLUNTEER` | `volunteer@tcs.com` | `volunteer123` | TCS |

---

## Typical Workflow

```
1. Login (ADMIN)          POST /api/auth/login          → get cookie
2. Create company         POST /api/companies
3. Create SPOC            POST /api/companies/:id/spoc
4. Create volunteers      POST /api/companies/:id/volunteers
5. Create event           POST /api/events
6. Open registrations     PATCH /api/events/:id/status  { "status": "REGISTRATION_OPEN" }
7. Volunteer registers    POST /api/events/:id/registrations
8. Mark attendance        PATCH /api/events/:id/registrations/:rid/attendance
9. Get theme IDs          GET /api/themes
10. Submit feedback       POST /api/events/:id/registrations/:rid/feedback
11. View stats            GET /api/events/:id/feedback/stats
```
