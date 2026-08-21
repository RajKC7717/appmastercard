import { isDbHealthy } from '../config/db.js';

/**
 * GET /api/health
 * Returns service health status, including database reachability.
 */
export const getHealth = async (_req, res) => {
  const dbUp = await isDbHealthy();

  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? 'ok' : 'degraded',
    database: dbUp ? 'up' : 'down',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};
