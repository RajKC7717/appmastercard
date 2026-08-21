/**
 * 404 handler — catches requests that didn't match any route.
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found — ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler.
 * Supports a custom `statusCode` property on thrown Error objects
 * so service-layer errors can set their own HTTP status.
 */
export const errorHandler = (err, _req, res, _next) => {
  // Use statusCode from the error if set, otherwise fall back to response's
  // status (set before calling next(error)), or default to 500.
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  res.status(statusCode).json({
    message: err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
