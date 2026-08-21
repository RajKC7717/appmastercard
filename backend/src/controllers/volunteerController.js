import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLES } from '../constants/roles.js';
import * as userService from '../services/userService.js';

/**
 * True if the requester may MANAGE (create/update/delete) volunteers for this
 * company: ADMIN, or the SPOC of this exact company.
 * (resolveCompany already guaranteed a SPOC/VOLUNTEER can only reach their own
 * company, but we re-check role explicitly for clarity.)
 */
function canManage(user, companyId) {
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.SPOC && user.companyId === companyId) return true;
  return false;
}

/**
 * POST /api/companies/:companyId/volunteers     (ADMIN or that company's SPOC)
 * role & companyId are server-controlled.
 */
export const createVolunteer = asyncHandler(async (req, res) => {
  const companyId = req.company.id;
  if (!canManage(req.user, companyId)) {
    return res.status(403).json({ message: 'Forbidden: cannot manage volunteers for this company' });
  }

  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }

  const emailTaken = await userService.findByEmail(email);
  if (emailTaken) {
    return res.status(409).json({ message: 'Email is already in use' });
  }

  const volunteer = await userService.createUser({
    name,
    email,
    password,
    role: ROLES.VOLUNTEER, // server-controlled
    companyId,             // from URL, never from body
  });

  return res.status(201).json({ volunteer: userService.sanitizeUser(volunteer) });
});

/**
 * GET /api/companies/:companyId/volunteers      (ADMIN any; SPOC own)
 * A plain VOLUNTEER may not list the whole roster.
 */
export const listVolunteers = asyncHandler(async (req, res) => {
  if (req.user.role === ROLES.VOLUNTEER) {
    return res.status(403).json({ message: 'Forbidden: volunteers cannot list the company roster' });
  }

  const volunteers = await userService.findVolunteersByCompany(req.company.id);
  return res.status(200).json({ volunteers: volunteers.map(userService.sanitizeUser) });
});

/**
 * GET /api/companies/:companyId/volunteers/:volunteerId
 * ADMIN: any volunteer in the company.
 * SPOC:  any volunteer in their company.
 * VOLUNTEER: only themselves.
 */
export const getVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await userService.findById(req.params.volunteerId);

  if (!volunteer || volunteer.role !== ROLES.VOLUNTEER || volunteer.companyId !== req.company.id) {
    return res.status(404).json({ message: 'Volunteer not found for this company' });
  }

  if (req.user.role === ROLES.VOLUNTEER && req.user.id !== volunteer.id) {
    return res.status(403).json({ message: 'Forbidden: you may only view your own profile' });
  }

  return res.status(200).json({ volunteer: userService.sanitizeUser(volunteer) });
});

/**
 * PATCH /api/companies/:companyId/volunteers/:volunteerId  (ADMIN or company SPOC)
 * role/companyId cannot be changed.
 */
export const updateVolunteer = asyncHandler(async (req, res) => {
  const companyId = req.company.id;
  if (!canManage(req.user, companyId)) {
    return res.status(403).json({ message: 'Forbidden: cannot manage volunteers for this company' });
  }

  const volunteer = await userService.findById(req.params.volunteerId);
  if (!volunteer || volunteer.role !== ROLES.VOLUNTEER || volunteer.companyId !== companyId) {
    return res.status(404).json({ message: 'Volunteer not found for this company' });
  }

  const { name, email } = req.body || {};
  const updated = await userService.updateUser(volunteer.id, { name, email });
  return res.status(200).json({ volunteer: userService.sanitizeUser(updated) });
});

/**
 * DELETE /api/companies/:companyId/volunteers/:volunteerId (ADMIN or company SPOC)
 */
export const deleteVolunteer = asyncHandler(async (req, res) => {
  const companyId = req.company.id;
  if (!canManage(req.user, companyId)) {
    return res.status(403).json({ message: 'Forbidden: cannot manage volunteers for this company' });
  }

  const volunteer = await userService.findById(req.params.volunteerId);
  if (!volunteer || volunteer.role !== ROLES.VOLUNTEER || volunteer.companyId !== companyId) {
    return res.status(404).json({ message: 'Volunteer not found for this company' });
  }

  await userService.deactivateUser(volunteer.id);
  return res.status(200).json({ message: 'Volunteer deleted successfully' });
});
