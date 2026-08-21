/**
 * GET /api/health
 * Returns service health status.
 */
export const getHealth = (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};
