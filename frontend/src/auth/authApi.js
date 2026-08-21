/* ============================================================
   AUTH — the seam for backend/API_ENDPOINTS.md § Auth.

     POST /api/auth/login    { email, password, loginType }
     POST /api/auth/logout
     GET  /api/auth/me       -> { id, name, email, role, companyId }

   THE TWO USER DOMAINS ARE NOT A DETAIL, THEY ARE THE SECURITY MODEL.
   The schema has two separate tables:

     ngo_users      ADMIN | STAFF     — no companyId
     company_users  SPOC  | VOLUNTEER — exactly one companyId

   An NGO admin therefore cannot be a SPOC and a company user cannot be an
   admin: it is not a rule someone remembered to check, it is a shape the
   database cannot express. `loginType` is what tells the server which
   table to search — and it is why a company user's email is unique only
   WITHIN their company, so the same person can exist under two partners.

   The real server issues an HTTP-only JWT cookie, which JavaScript cannot
   read by design. This file keeps a session object in localStorage
   instead, and says so plainly rather than pretending to be secure: the
   client-side route guards below are navigation, not authorisation. The
   authorisation that matters is the role middleware on the API, which the
   backend already has.
   ============================================================ */

import { companies, ngoUsers, spocs, volunteers } from '../shared/data/orgData.js';

const SESSION_KEY = 'seva.auth.session';
const USERS_KEY = 'seva.auth.users';

const delay = (ms = 420) => new Promise((resolve) => setTimeout(resolve, ms));

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Private mode. The session still lives in React state for this tab. */
  }
}

/* ---------- Roles ------------------------------------------------------- */

export const ROLES = {
  ADMIN: { value: 'ADMIN', label: 'Seva Sahayog admin', domain: 'NGO', home: '/admin' },
  STAFF: { value: 'STAFF', label: 'Seva Sahayog staff', domain: 'NGO', home: '/admin' },
  SPOC: { value: 'SPOC', label: 'Corporate SPOC', domain: 'COMPANY', home: '/spoc' },
  VOLUNTEER: { value: 'VOLUNTEER', label: 'Volunteer', domain: 'COMPANY', home: '/volunteer' },
};

/** What the role dropdown offers. STAFF is created by an admin, not signed up for. */
export const SIGNUP_ROLES = [
  {
    value: 'VOLUNTEER',
    label: 'Volunteer',
    hint: 'You take part in volunteering activities with your company.',
  },
  {
    value: 'SPOC',
    label: 'Corporate SPOC',
    hint: 'You coordinate volunteering for your company with Seva Sahayog.',
  },
  {
    value: 'ADMIN',
    label: 'Seva Sahayog admin',
    hint: 'You work at the Foundation and manage activities and reporting.',
  },
];

/** Company users belong to exactly one company — RULE 1. */
export const COMPANY_ROLES = ['SPOC', 'VOLUNTEER'];

export const homeForRole = (role) => ROLES[role]?.home ?? '/login';

/** Which of the two tables a role lives in — the server's `loginType`. */
export const loginTypeForRole = (role) =>
  ROLES[role]?.domain === 'NGO' ? 'ADMIN' : 'COMPANY';

/* ---------- Seeded accounts --------------------------------------------
   Everyone in the demo dataset can sign in. Passwords mirror the backend
   seed (prisma/seed.js) so the same credentials work against the real API
   once it is running.
   ---------------------------------------------------------------------- */

function seededAccounts() {
  const accounts = [
    /* The backend's own seed account, so a judge can use the credentials
       printed in API_ENDPOINTS.md without translation. */
    {
      userId: 'NGO-SEED',
      name: 'NGO Admin',
      email: 'admin@ngo.com',
      password: 'admin123',
      role: 'ADMIN',
      companyId: null,
      phone: '9822000000',
    },
  ];

  ngoUsers.forEach((user) => {
    accounts.push({
      userId: user.userId,
      name: user.name,
      email: user.email,
      password: user.role === 'ADMIN' ? 'admin123' : 'staff123',
      role: user.role,
      companyId: null,
      phone: user.phone,
    });
  });

  spocs.forEach((spoc) => {
    accounts.push({
      userId: spoc.userId,
      name: spoc.name,
      email: spoc.email,
      password: 'spoc123',
      role: 'SPOC',
      companyId: spoc.companyId,
      phone: spoc.phone,
      title: spoc.title,
    });
  });

  volunteers.forEach((person) => {
    accounts.push({
      userId: person.userId,
      name: person.name,
      email: person.email,
      password: 'volunteer123',
      role: 'VOLUNTEER',
      companyId: person.companyId,
      phone: person.phone,
    });
  });

  return accounts;
}

const SEEDED = seededAccounts();

/** Accounts created through the signup form on this device. */
const localAccounts = () => read(USERS_KEY, []);

const allAccounts = () => [...localAccounts(), ...SEEDED];

/* ---------- The three demo doors ---------------------------------------
   Surfaced on the sign-in screen. A demo that starts with someone typing
   an email address from memory is a demo that starts badly.
   ---------------------------------------------------------------------- */

export const DEMO_ACCOUNTS = [
  {
    role: 'VOLUNTEER',
    label: 'Volunteer',
    name: 'Rajesh Kulkarni',
    detail: 'Amdocs · gives feedback',
    email: 'rajesh.kulkarni@amdocs.com',
    password: 'volunteer123',
  },
  {
    role: 'SPOC',
    label: 'Corporate SPOC',
    name: 'Anjali Mehta',
    detail: 'Amdocs · sees her company',
    email: 'anjali.mehta@amdocs.com',
    password: 'spoc123',
  },
  {
    role: 'ADMIN',
    label: 'Seva Sahayog admin',
    name: 'Sunita Deshpande',
    detail: 'Foundation · sees everything',
    email: 'sunita.deshpande@sevasahayog.org',
    password: 'admin123',
  },
];

/* ---------- The session object ------------------------------------------ */

function toSession(account) {
  const company = companies.find((row) => row.companyId === account.companyId) ?? null;
  const parts = account.name.trim().split(/\s+/);

  return {
    userId: account.userId,
    name: account.name,
    shortName: parts[0],
    initials: `${parts[0][0]}${parts.length > 1 ? parts.at(-1)[0] : ''}`.toUpperCase(),
    email: account.email,
    phone: account.phone,
    role: account.role,
    companyId: account.companyId ?? null,
    companyName: company?.companyName ?? null,
    title: account.title ?? null,
    issuedAt: new Date().toISOString(),
  };
}

/* ---------- The API ----------------------------------------------------- */

/** GET /api/auth/me — reads the cookie on the server; the session here. */
export function currentSession() {
  const session = read(SESSION_KEY, null);
  return session && ROLES[session.role] ? session : null;
}

/**
 * POST /api/auth/login.
 *
 * `role` picks the table, exactly as `loginType` does on the server. A
 * SPOC's credentials will not open the admin console even if the password
 * is right, because the lookup never leaves company_users.
 */
export async function login({ email, password, role }) {
  await delay();

  const wanted = String(email).trim().toLowerCase();
  const domain = ROLES[role]?.domain;

  const account = allAccounts().find(
    (candidate) =>
      candidate.email.toLowerCase() === wanted &&
      (!domain || ROLES[candidate.role]?.domain === domain),
  );

  if (!account || account.password !== password) {
    /* One message for both cases. Saying "no such account" tells an
       attacker which addresses are real. */
    const error = new Error('That email and password do not match an account.');
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  if (role && account.role !== role) {
    const error = new Error(
      `This account is registered as ${ROLES[account.role].label.toLowerCase()}. Choose that role and try again.`,
    );
    error.code = 'WRONG_ROLE';
    throw error;
  }

  const session = toSession(account);
  write(SESSION_KEY, session);
  return { success: true, data: { user: session } };
}

/**
 * Sign-up. There is no public registration endpoint on the backend yet —
 * an admin creates SPOCs and volunteers through
 * POST /api/companies/:companyId/{spoc,volunteers}. This form posts the
 * same body, and is the request the backend will grow an endpoint for.
 */
export async function signup({ name, email, phone, password, role, companyId }) {
  await delay(600);

  const wanted = String(email).trim().toLowerCase();
  const needsCompany = COMPANY_ROLES.includes(role);

  if (needsCompany && !companyId) {
    const error = new Error('Choose the company you work for.');
    error.code = 'VALIDATION';
    error.field = 'companyId';
    throw error;
  }

  /* Uniqueness follows the schema, not intuition: an NGO email is unique
     globally, a company email only within its own company. */
  const clash = allAccounts().some((candidate) => {
    if (candidate.email.toLowerCase() !== wanted) return false;
    if (!needsCompany) return ROLES[candidate.role].domain === 'NGO';
    return candidate.companyId === companyId;
  });

  if (clash) {
    const error = new Error('An account with this email already exists. Sign in instead.');
    error.code = 'DUPLICATE';
    error.field = 'email';
    throw error;
  }

  const existing = localAccounts();
  const prefix = needsCompany ? (role === 'SPOC' ? 'SPOC' : 'VOL') : 'NGO';
  const account = {
    userId: `${prefix}-2026-${String(9000 + existing.length).padStart(4, '0')}`,
    name: name.trim(),
    email: wanted,
    phone: phone.trim(),
    password,
    role,
    companyId: needsCompany ? companyId : null,
  };

  write(USERS_KEY, [account, ...existing]);

  const session = toSession(account);
  write(SESSION_KEY, session);
  return { success: true, data: { user: session } };
}

/** POST /api/auth/logout — clears the cookie on the server, the key here. */
export async function logout() {
  await delay(120);
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing to do */
  }
  return { success: true };
}
