import bcrypt from 'bcryptjs';

import { config } from '../config/index.js';
import { ROLES } from '../constants/roles.js';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * IN-MEMORY DATA LAYER (TEMPORARY)
 * ────────────────────────────────────────────────────────────────────────────
 * This module simulates the database using plain JS arrays.
 *
 * IMPORTANT:
 *   - This is temporary. Later `companies` and `users` will be backed by
 *     PostgreSQL. Controllers must NOT touch these arrays directly — they go
 *     through the service layer (see src/services/*). That keeps the migration
 *     to a real DB isolated to the services.
 *   - Passwords are NEVER stored in plaintext. Plaintext dev credentials live
 *     only in `seedCredentials` below and are hashed by `seed()` at startup.
 */

/** @type {{ id: number, name: string, active: boolean }[]} */
export const companies = [
  { id: 1, name: 'Mastercard', active: true },
  { id: 2, name: 'TCS', active: true },
];

/**
 * @type {{
 *   id: number,
 *   name: string,
 *   email: string,
 *   password: string,   // bcrypt hash (populated by seed())
 *   role: 'ADMIN' | 'SPOC' | 'VOLUNTEER',
 *   companyId: number | null,
 *   active: boolean
 * }[]}
 */
export const users = [];

/**
 * Auto-increment counters. Kept here so the service layer can generate new
 * ids the same way a DB sequence would.
 */
export const counters = {
  companyId: companies.length, // next id = ++counters.companyId
  userId: 0,
};

/**
 * Plaintext dev credentials — used ONLY at seed time to produce hashes.
 * These match the credentials documented for Postman testing.
 */
const seedUsers = [
  { name: 'NGO Admin',       email: 'admin@ngo.com',            plain: 'admin123',     role: ROLES.ADMIN,     companyId: null },
  { name: 'Rahul Sharma',    email: 'rahul@mastercard.com',     plain: 'spoc123',      role: ROLES.SPOC,      companyId: 1 },
  { name: 'Volunteer One',   email: 'volunteer1@mastercard.com', plain: 'volunteer123', role: ROLES.VOLUNTEER, companyId: 1 },
  { name: 'Volunteer Two',   email: 'volunteer2@mastercard.com', plain: 'volunteer123', role: ROLES.VOLUNTEER, companyId: 1 },
  { name: 'Priya Sharma',    email: 'priya@tcs.com',            plain: 'spoc123',      role: ROLES.SPOC,      companyId: 2 },
  { name: 'TCS Volunteer',   email: 'volunteer@tcs.com',        plain: 'volunteer123', role: ROLES.VOLUNTEER, companyId: 2 },
];

let seeded = false;

/**
 * Hashes the sample passwords and fills the in-memory `users` array.
 * Safe to call multiple times — it only seeds once.
 */
export async function seed() {
  if (seeded) return;

  for (const u of seedUsers) {
    const hash = await bcrypt.hash(u.plain, config.bcryptSaltRounds);
    users.push({
      id: ++counters.userId,
      name: u.name,
      email: u.email.toLowerCase(),
      password: hash,
      role: u.role,
      companyId: u.companyId,
      active: true,
    });
  }

  seeded = true;
}
