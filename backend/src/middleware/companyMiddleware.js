import { ROLES } from '../constants/roles.js';
import * as companyService from '../services/companyService.js';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * COMPANY OWNERSHIP MIDDLEWARE — `resolveCompany`
 * ────────────────────────────────────────────────────────────────────────────
 * For any route that has a `:companyId` param, this middleware:
 *   1. Validates the param (must be a non-empty string — UUIDs from Prisma).
 *   2. Loads the company from Prisma (404 if missing or soft-deleted).
 *   3. Enforces tenant isolation:
 *        - ADMIN / STAFF       → may access ANY company.
 *        - SPOC / VOLUNTEER    → may access ONLY their own companyId.
 *      A Mastercard SPOC hitting /api/companies/<TCS-UUID> gets 403.
 *   4. Attaches the loaded company to `req.company` for downstream handlers.
 *
 * Must run AFTER `protect`.
 */
export async function resolveCompany(req, res, next) {
  try {
    const companyId = req.params.companyId;

    if (!companyId || typeof companyId !== 'string') {
      return res.status(400).json({ message: 'Invalid companyId' });
    }

    const company = await companyService.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const { role, companyId: ownCompanyId } = req.user;

    // Non-admins are locked to their own company regardless of the URL.
    if (role !== ROLES.ADMIN && role !== ROLES.STAFF && ownCompanyId !== companyId) {
      return res
        .status(403)
        .json({ message: "Forbidden: cannot access another company's data" });
    }

    req.company = company;
    return next();
  } catch (err) {
    return next(err);
  }
}
