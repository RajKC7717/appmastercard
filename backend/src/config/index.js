export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // ── Auth / JWT ──────────────────────────────────────────────────────────
  jwtSecret: process.env.JWT_SECRET || 'dev_super_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',

  // How long the auth cookie lives, in milliseconds (default 1 day).
  cookieMaxAge: Number(process.env.COOKIE_MAX_AGE_MS) || 24 * 60 * 60 * 1000,

  // bcrypt cost factor used when hashing sample/seed passwords.
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
};

export const isProd = config.nodeEnv === 'production';
