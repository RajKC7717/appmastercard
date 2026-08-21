import { asyncHandler } from '../utils/asyncHandler.js';
import * as companyService from '../services/companyService.js';

/**
 * POST /api/companies                 (ADMIN)
 * Create a company. Client may only supply `name`.
 */
export const createCompany = asyncHandler(async (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Company name is required' });
  }

  // Prevent duplicate company names.
  const existing = await companyService.findByName(String(name).trim());
  if (existing) {
    return res.status(409).json({ message: 'A company with that name already exists' });
  }

  const company = await companyService.createCompany({ name: String(name).trim() });
  return res.status(201).json({ company: companyService.sanitizeCompany(company) });
});

/**
 * GET /api/companies                  (ADMIN)
 * List all active companies.
 */
export const listCompanies = asyncHandler(async (_req, res) => {
  const companies = await companyService.findAll();
  return res.status(200).json({ companies: companies.map(companyService.sanitizeCompany) });
});

/**
 * GET /api/companies/:companyId       (ADMIN any; SPOC/VOLUNTEER own only)
 * `resolveCompany` has already loaded + authorized the company into req.company.
 */
export const getCompany = asyncHandler(async (req, res) => {
  return res.status(200).json({ company: companyService.sanitizeCompany(req.company) });
});

/**
 * PATCH /api/companies/:companyId     (ADMIN)
 * Update company name.
 */
export const updateCompany = asyncHandler(async (req, res) => {
  const { name } = req.body || {};
  if (name !== undefined && !String(name).trim()) {
    return res.status(400).json({ message: 'Company name cannot be empty' });
  }

  const updated = await companyService.updateCompany(req.company.companyId, {
    name: name !== undefined ? String(name).trim() : undefined,
  });
  return res.status(200).json({ company: companyService.sanitizeCompany(updated) });
});

/**
 * DELETE /api/companies/:companyId    (ADMIN)
 * Soft-deletes (deactivates) the company via `deletedAt`.
 */
export const deleteCompany = asyncHandler(async (req, res) => {
  await companyService.deactivateCompany(req.company.companyId);
  return res.status(200).json({ message: 'Company deleted successfully' });
});
