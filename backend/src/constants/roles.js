/**
 * Canonical role names used across the whole application.
 *
 * Using a single source of truth avoids typo bugs (e.g. "Admin" vs "ADMIN")
 * in controllers, middleware and sample data.
 */
export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  SPOC: 'SPOC',
  VOLUNTEER: 'VOLUNTEER',
});

export const ALL_ROLES = Object.values(ROLES);
