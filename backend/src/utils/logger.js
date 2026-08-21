const log = (level, message, meta = {}) => {
  console[level](`[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`, meta);
};

export const logger = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
};
