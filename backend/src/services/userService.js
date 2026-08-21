import bcrypt from 'bcryptjs';

import { config } from '../config/index.js';
import { users, counters } from '../data/sampleData.js';
import { ROLES } from '../constants/roles.js';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * USER SERVICE
 * ────────────────────────────────────────────────────────────────────────────
 * All access to the `users` data lives here. Controllers never touch the
 * in-memory array directly. To migrate to PostgreSQL later, only this file
 * (and companyService) needs to change — replace the array operations with
 * SQL queries and keep the same function signatures.
 *
 * All functions are async so the public contract already matches a real DB.
 */

/** Remove sensitive fields before sending a user to the client. */
export function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  };
}

/** Find an active user by email (case-insensitive). Returns the raw record. */
export async function findByEmail(email) {
  if (!email) return null;
  const lower = String(email).toLowerCase();
  return users.find((u) => u.active && u.email === lower) || null;
}

/** Find an active user by id. Returns the raw record. */
export async function findById(id) {
  const numId = Number(id);
  return users.find((u) => u.active && u.id === numId) || null;
}

/** Verify a plaintext password against a user's stored hash. */
export async function verifyPassword(user, plainPassword) {
  if (!user || !plainPassword) return false;
  return bcrypt.compare(plainPassword, user.password);
}

/** Get the SPOC for a company (there is at most one). Raw record or null. */
export async function findSpocByCompany(companyId) {
  const cid = Number(companyId);
  return users.find((u) => u.active && u.role === ROLES.SPOC && u.companyId === cid) || null;
}

/** List active volunteers for a company. Raw records. */
export async function findVolunteersByCompany(companyId) {
  const cid = Number(companyId);
  return users.filter((u) => u.active && u.role === ROLES.VOLUNTEER && u.companyId === cid);
}

/**
 * Create a user with a server-controlled role. The caller (controller) is
 * responsible for authorization; this function trusts the role/companyId it
 * is given and never reads them from client input.
 *
 * @param {{ name: string, email: string, password: string, role: string, companyId: number|null }} data
 */
export async function createUser({ name, email, password, role, companyId }) {
  const hash = await bcrypt.hash(password, config.bcryptSaltRounds);
  const user = {
    id: ++counters.userId,
    name,
    email: String(email).toLowerCase(),
    password: hash,
    role,
    companyId: companyId ?? null,
    active: true,
  };
  users.push(user);
  return user;
}

/**
 * Update mutable fields of a user. Only `name` and `email` may be changed —
 * `role` and `companyId` are intentionally NOT updatable here.
 */
export async function updateUser(id, { name, email }) {
  const user = await findById(id);
  if (!user) return null;
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = String(email).toLowerCase();
  return user;
}

/** Soft-delete (deactivate) a user. Returns true if a user was deactivated. */
export async function deactivateUser(id) {
  const user = await findById(id);
  if (!user) return false;
  user.active = false;
  return true;
}
