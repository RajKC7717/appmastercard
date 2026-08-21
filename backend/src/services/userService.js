import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { ROLES, NGO_ROLES, COMPANY_ROLES } from '../constants/roles.js';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * USER SERVICE  (Prisma-backed, two-table model)
 * ────────────────────────────────────────────────────────────────────────────
 * Domain rules from the schema:
 *   NgoUser    → role ADMIN | STAFF, no companyId
 *   CompanyUser → role SPOC | VOLUNTEER, has companyId
 *
 * All functions normalise the result into a unified "user" shape so that
 * controllers and middleware don't care which table the row came from.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Map a raw NgoUser row into the unified user shape.
 * companyId is null for every NgoUser by definition.
 */
function fromNgoUser(u) {
  if (!u) return null;
  return {
    id: u.userId,
    name: u.name,
    email: u.email,
    phone: u.phone,
    passwordHash: u.passwordHash,
    role: u.role,           // 'ADMIN' | 'STAFF'
    companyId: null,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    lastLoginAt: u.lastLoginAt,
  };
}

/**
 * Map a raw CompanyUser row into the unified user shape.
 */
function fromCompanyUser(u) {
  if (!u) return null;
  return {
    id: u.userId,
    name: u.name,
    email: u.email,
    phone: u.phone,
    passwordHash: u.passwordHash,
    role: u.role,           // 'SPOC' | 'VOLUNTEER'
    companyId: u.companyId,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    lastLoginAt: u.lastLoginAt,
  };
}

// ── Sanitize (safe DTO for API responses) ────────────────────────────────────

/** Remove sensitive fields before sending a user to the client. */
export function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    companyId: user.companyId ?? null,
  };
}

// ── Lookup ────────────────────────────────────────────────────────────────────

/**
 * Find a user by email.
 * For NGO login flows, searches NgoUser.
 * For company login flows, searches CompanyUser (email + companyId).
 *
 * @param {string} email
 * @param {{ loginType?: 'ADMIN'|'COMPANY', companyId?: string }} opts
 */
export async function findByEmail(email, { loginType, companyId } = {}) {
  if (!email) return null;
  const lower = String(email).toLowerCase();

  // If the caller specifies COMPANY (or passes a companyId), search CompanyUser.
  if (loginType === 'COMPANY' || companyId) {
    const where = { email: lower, deletedAt: null };
    if (companyId) where.companyId = companyId;
    const u = await prisma.companyUser.findFirst({ where });
    return fromCompanyUser(u);
  }

  // Default / ADMIN: search NgoUser first, fallback to CompanyUser.
  const ngo = await prisma.ngoUser.findUnique({ where: { email: lower } });
  if (ngo) return fromNgoUser(ngo);

  const cu = await prisma.companyUser.findFirst({
    where: { email: lower, deletedAt: null },
  });
  return fromCompanyUser(cu);
}

/**
 * Find a user by their UUID.
 * Checks NgoUser first, then CompanyUser.
 */
export async function findById(id) {
  if (!id) return null;
  const ngo = await prisma.ngoUser.findUnique({ where: { userId: id } });
  if (ngo) return fromNgoUser(ngo);

  const cu = await prisma.companyUser.findUnique({
    where: { userId: id, deletedAt: null },
  });
  return fromCompanyUser(cu);
}

/** Verify a plaintext password against a user's stored hash. */
export async function verifyPassword(user, plainPassword) {
  if (!user || !plainPassword || !user.passwordHash) return false;
  return bcrypt.compare(plainPassword, user.passwordHash);
}

/** Get the SPOC for a company (there is at most one). */
export async function findSpocByCompany(companyId) {
  if (!companyId) return null;
  const u = await prisma.companyUser.findFirst({
    where: { companyId, role: 'SPOC', deletedAt: null },
  });
  return fromCompanyUser(u);
}

/** List active volunteers for a company. */
export async function findVolunteersByCompany(companyId) {
  if (!companyId) return [];
  const rows = await prisma.companyUser.findMany({
    where: { companyId, role: 'VOLUNTEER', deletedAt: null },
    orderBy: { name: 'asc' },
  });
  return rows.map(fromCompanyUser);
}

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Create a user. Writes to the correct table based on role.
 * Role and companyId are ALWAYS supplied by the server — never from client input.
 *
 * @param {{ name: string, email: string, password: string, phone?: string, role: string, companyId?: string|null }} data
 */
export async function createUser({ name, email, password, phone = '', role, companyId }) {
  const hash = await bcrypt.hash(password, 10);
  const emailLower = String(email).toLowerCase();

  if (NGO_ROLES.includes(role)) {
    const u = await prisma.ngoUser.create({
      data: {
        name,
        email: emailLower,
        phone: phone || '',
        passwordHash: hash,
        role, // 'ADMIN' | 'STAFF'
      },
    });
    return fromNgoUser(u);
  }

  // SPOC or VOLUNTEER
  const u = await prisma.companyUser.create({
    data: {
      name,
      email: emailLower,
      phone: phone || '',
      passwordHash: hash,
      role, // 'SPOC' | 'VOLUNTEER'
      companyId,
    },
  });
  return fromCompanyUser(u);
}

// ── Update ────────────────────────────────────────────────────────────────────

/**
 * Update mutable fields (name, email, phone) for any user.
 * role and companyId are intentionally NOT updatable here.
 */
export async function updateUser(id, { name, email, phone, lastLoginAt }) {
  // Determine which table by looking up first.
  const existing = await findById(id);
  if (!existing) return null;

  const data = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = String(email).toLowerCase();
  if (phone !== undefined) data.phone = phone;
  if (lastLoginAt !== undefined) data.lastLoginAt = lastLoginAt;

  if (NGO_ROLES.includes(existing.role)) {
    const u = await prisma.ngoUser.update({ where: { userId: id }, data });
    return fromNgoUser(u);
  }

  const u = await prisma.companyUser.update({ where: { userId: id }, data });
  return fromCompanyUser(u);
}

// ── Soft-delete ───────────────────────────────────────────────────────────────

/**
 * Soft-delete a CompanyUser (sets deletedAt).
 * NgoUsers use a different off-boarding process — not supported here yet.
 * Returns true if the user was deactivated.
 */
export async function deactivateUser(id) {
  const existing = await findById(id);
  if (!existing) return false;

  if (COMPANY_ROLES.includes(existing.role)) {
    await prisma.companyUser.update({
      where: { userId: id },
      data: { deletedAt: new Date() },
    });
    return true;
  }

  // NgoUser — not supported via this path, return false
  return false;
}
