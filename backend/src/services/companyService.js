import { companies, counters } from '../data/sampleData.js';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * COMPANY SERVICE
 * ────────────────────────────────────────────────────────────────────────────
 * Encapsulates all access to the `companies` data. Swap the array operations
 * for SQL later without changing controllers/routes.
 */

/** Shape a company for API responses. */
export function sanitizeCompany(company) {
  if (!company) return null;
  return { id: company.id, name: company.name };
}

/** List all active companies (raw records). */
export async function findAll() {
  return companies.filter((c) => c.active);
}

/** Find an active company by id (raw record) or null. */
export async function findById(id) {
  const cid = Number(id);
  return companies.find((c) => c.active && c.id === cid) || null;
}

/** Create a company. Server generates the id. */
export async function createCompany({ name }) {
  const company = { id: ++counters.companyId, name, active: true };
  companies.push(company);
  return company;
}

/** Update a company's mutable fields. */
export async function updateCompany(id, { name }) {
  const company = await findById(id);
  if (!company) return null;
  if (name !== undefined) company.name = name;
  return company;
}

/** Soft-delete (deactivate) a company. Returns true if one was deactivated. */
export async function deactivateCompany(id) {
  const company = await findById(id);
  if (!company) return false;
  company.active = false;
  return true;
}
