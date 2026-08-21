/**
 * Canonical role names used across the whole application.
 *
 * NgoRole values  : ADMIN, STAFF  (NgoUser table)
 * CompanyRole values: SPOC, VOLUNTEER  (CompanyUser table)
 *
 * Using a single source of truth avoids typo bugs (e.g. "Admin" vs "ADMIN")
 * in controllers, middleware and sample data.
 */
export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  SPOC: 'SPOC',
  VOLUNTEER: 'VOLUNTEER',
});

export const NGO_ROLES = Object.freeze([ROLES.ADMIN, ROLES.STAFF]);
export const COMPANY_ROLES = Object.freeze([ROLES.SPOC, ROLES.VOLUNTEER]);
export const ALL_ROLES = Object.values(ROLES);
