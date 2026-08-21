import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../constants/roles.js';
import * as userService from '../services/userService.js';

/**
 * POST /api/companies/:companyId/spoc          (ADMIN)
 * Creates the SPOC for a company. Role/companyId are set by the server.
 * Each company may have only ONE SPOC → 409 if one already exists.
 */
export const createSpoc = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }

  const companyId = req.company.id;

  const existingSpoc = await userService.findSpocByCompany(companyId);
  if (existingSpoc) {
    return res.status(409).json({ message: 'This company already has a SPOC' });
  }

  const emailTaken = await userService.findByEmail(email);
  if (emailTaken) {
    return res.status(409).json({ message: 'Email is already in use' });
  }

  const spoc = await userService.createUser({
    name,
    email,
    password,
    role: ROLES.SPOC,       // server-controlled — never from client
    companyId,              // from the URL, validated by resolveCompany
  });

  return res.status(201).json({ spoc: userService.sanitizeUser(spoc) });
});

/**
 * GET /api/companies/:companyId/spoc           (ADMIN any; SPOC own)
 */
export const getSpoc = asyncHandler(async (req, res) => {
  const spoc = await userService.findSpocByCompany(req.company.id);
  if (!spoc) {
    return res.status(404).json({ message: 'This company has no SPOC' });
  }
  return res.status(200).json({ spoc: userService.sanitizeUser(spoc) });
});

/**
 * PATCH /api/companies/:companyId/spoc/:spocId (ADMIN)
 * Only `name`/`email` may change; role & companyId are immutable here.
 */
export const updateSpoc = asyncHandler(async (req, res) => {
  const spoc = await userService.findById(req.params.spocId);

  if (!spoc || spoc.role !== ROLES.SPOC || spoc.companyId !== req.company.id) {
    return res.status(404).json({ message: 'SPOC not found for this company' });
  }

  const { name, email } = req.body || {};
  const updated = await userService.updateUser(spoc.id, { name, email });
  return res.status(200).json({ spoc: userService.sanitizeUser(updated) });
});

/**
 * DELETE /api/companies/:companyId/spoc/:spocId (ADMIN)
 */
export const deleteSpoc = asyncHandler(async (req, res) => {
  const spoc = await userService.findById(req.params.spocId);

  if (!spoc || spoc.role !== ROLES.SPOC || spoc.companyId !== req.company.id) {
    return res.status(404).json({ message: 'SPOC not found for this company' });
  }

  await userService.deactivateUser(spoc.id);
  return res.status(200).json({ message: 'SPOC deleted successfully' });
});
