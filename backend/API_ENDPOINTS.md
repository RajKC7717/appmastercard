# API Endpoints

Base URL: `http://localhost:5000/api`

Authentication uses a JWT stored in an **HTTP-only cookie** named `token`.
Send credentials/cookies with each request (in Postman, cookies are handled
automatically; in fetch use `credentials: 'include'`).

**Roles:** `ADMIN`, `SPOC`, `VOLUNTEER`

---

## Auth

| Method | Endpoint | Auth | Allowed Roles | Description |
|--------|----------|------|---------------|-------------|
| POST | `/api/auth/login` | Public | — | Log in with email + password; sets the auth cookie. |
| POST | `/api/auth/logout` | Public | — | Clears the auth cookie. |
| GET | `/api/auth/me` | Required | Any authenticated | Returns the current user's safe info. |

**Login body**
```json
{ "email": "admin@ngo.com", "password": "admin123" }
```

---

## Companies

| Method | Endpoint | Auth | Allowed Roles | Description |
|--------|----------|------|---------------|-------------|
| POST | `/api/companies` | Required | `ADMIN` | Create a company. |
| GET | `/api/companies` | Required | `ADMIN` | List all companies. |
| GET | `/api/companies/:companyId` | Required | `ADMIN` (any), `SPOC`/`VOLUNTEER` (own only) | Get a single company. |
| PATCH | `/api/companies/:companyId` | Required | `ADMIN` | Update a company. |
| DELETE | `/api/companies/:companyId` | Required | `ADMIN` | Soft-delete (deactivate) a company. |

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
| GET | `/api/companies/:companyId/spoc` | Required | `ADMIN` (any), `SPOC` (own only) | Get the company's SPOC. |
| PATCH | `/api/companies/:companyId/spoc/:spocId` | Required | `ADMIN` | Update SPOC (`name`, `email` only). |
| DELETE | `/api/companies/:companyId/spoc/:spocId` | Required | `ADMIN` | Soft-delete (deactivate) the SPOC. |

**Create body** (role & companyId are set by the server)
```json
{ "name": "New SPOC", "email": "spoc@company.com", "password": "password123" }
```

---

## Volunteers

Nested under a company.

| Method | Endpoint | Auth | Allowed Roles | Description |
|--------|----------|------|---------------|-------------|
| POST | `/api/companies/:companyId/volunteers` | Required | `ADMIN`, that company's `SPOC` | Create a volunteer. |
| GET | `/api/companies/:companyId/volunteers` | Required | `ADMIN` (any), `SPOC` (own only) | List the company's volunteers. |
| GET | `/api/companies/:companyId/volunteers/:volunteerId` | Required | `ADMIN`, `SPOC` (own), `VOLUNTEER` (self only) | Get a single volunteer. |
| PATCH | `/api/companies/:companyId/volunteers/:volunteerId` | Required | `ADMIN`, that company's `SPOC` | Update volunteer (`name`, `email` only). |
| DELETE | `/api/companies/:companyId/volunteers/:volunteerId` | Required | `ADMIN`, that company's `SPOC` | Soft-delete (deactivate) the volunteer. |

**Create body** (role & companyId are set by the server)
```json
{ "name": "New Volunteer", "email": "newvolunteer@company.com", "password": "password123" }
```

---

## Test / Verification

| Method | Endpoint | Auth | Allowed Roles | Description |
|--------|----------|------|---------------|-------------|
| GET | `/api/test/protected` | Required | Any authenticated | Confirms authentication works. |
| GET | `/api/test/admin` | Required | `ADMIN` | Confirms role authorization (admin-only). |
| GET | `/api/test/company` | Required | `SPOC`, `VOLUNTEER` | Confirms role authorization (company users). |

---

## Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | Public | Basic liveness check (`{ "status": "ok" }`). |
| GET | `/api/health` | Public | Detailed health (status, timestamp, uptime). |

---

## Response / Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request / validation error |
| `401` | Not authenticated (missing/invalid/expired token, or user not found) |
| `403` | Authenticated but not authorized for this role/company |
| `404` | Resource not found |
| `409` | Conflict (duplicate email, or company already has a SPOC) |

---

## Test Accounts

| Role | Email | Password | Company |
|------|-------|----------|---------|
| ADMIN | `admin@ngo.com` | `admin123` | — |
| SPOC | `rahul@mastercard.com` | `spoc123` | Mastercard (id 1) |
| VOLUNTEER | `volunteer1@mastercard.com` | `volunteer123` | Mastercard (id 1) |
| VOLUNTEER | `volunteer2@mastercard.com` | `volunteer123` | Mastercard (id 1) |
| SPOC | `priya@tcs.com` | `spoc123` | TCS (id 2) |
| VOLUNTEER | `volunteer@tcs.com` | `volunteer123` | TCS (id 2) |
