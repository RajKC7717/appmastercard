import { prisma } from '../config/db.js';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * COMPANY SERVICE  (Prisma-backed)
 * ────────────────────────────────────────────────────────────────────────────
 * All access to the `companies` table lives here. The Prisma schema uses
 * soft-delete via `deletedAt`; queries always filter `deletedAt: null`.
 */

/** Shape a company for API responses. */
export function sanitizeCompany(company) {
  if (!company) return null;
  return {
    id: company.companyId,
    name: company.companyName,
    createdAt: company.createdAt,
  };
}

/** List all active companies. */
export async function findAll() {
  return prisma.company.findMany({
    where: { deletedAt: null },
    orderBy: { companyName: 'asc' },
  });
}

/** Find an active company by UUID or null. */
export async function findById(id) {
  if (!id) return null;
  return prisma.company.findFirst({
    where: { companyId: id, deletedAt: null },
  });
}

/** Find an active company by name (case-insensitive). */
export async function findByName(name) {
  if (!name) return null;
  return prisma.company.findFirst({
    where: {
      companyName: { equals: name, mode: 'insensitive' },
      deletedAt: null,
    },
  });
}

/** Create a company. Server generates the UUID. */
export async function createCompany({ name }) {
  return prisma.company.create({
    data: { companyName: name },
  });
}

/** Update a company's mutable fields. */
export async function updateCompany(id, { name }) {
  return prisma.company.update({
    where: { companyId: id },
    data: { companyName: name },
  });
}

/** Soft-delete a company by setting `deletedAt`. */
export async function deactivateCompany(id) {
  await prisma.company.update({
    where: { companyId: id },
    data: { deletedAt: new Date() },
  });
  return true;
}
