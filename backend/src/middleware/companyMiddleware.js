import { ROLES } from '../constants/roles.js';
import * as companyService from '../services/companyService.js';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * COMPANY OWNERSHIP MIDDLEWARE — `resolveCompany`
 * ────────────────────────────────────────────────────────────────────────────
 * For any route that has a `:companyId` param, this middleware:
 *   1. Validates the param.
 *   2. Loads the company from the data layer (404 if missing).
 *   3. Enforces tenant isolation:
 *        - ADMIN                → may access ANY company.
 *        - SPOC / VOLUNTEER     → may access ONLY their own `req.user.companyId`.
 *      A Mastercard SPOC hitting /api/companies/2 (TCS) therefore gets 403.
 *   4. Attaches the loaded company to `req.company` for downstream handlers.
 *
 * Must run AFTER `protect`.
 */
export async function resolveCompany(req, res, next) {
  try {
    const companyId = Number(req.params.companyId);

    if (!Number.isInteger(companyId) || companyId <= 0) {
      return res.status(400).json({ message: 'Invalid companyId' });
    }

    const company = await companyService.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const { role, companyId: ownCompanyId } = req.user;

    // Non-admins are locked to their own company regardless of the URL.
    if (role !== ROLES.ADMIN && ownCompanyId !== companyId) {
      return res.status(403).json({ message: "Forbidden: cannot access another company's data" });
    }

    req.company = company;
    return next();
  } catch (err) {
    return next(err);
  }
}
