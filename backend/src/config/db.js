import { PrismaClient } from '@prisma/client';

import { config } from './index.js';
import { logger } from '../utils/logger.js';

/**
 * Shared Prisma client.
 *
 * Cached on globalThis so nodemon's hot restarts reuse one instance instead of
 * opening a new connection pool on every reload.
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: config.nodeEnv === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (config.nodeEnv !== 'production') {
  globalForPrisma.__prisma = prisma;
}

/**
 * Verifies the database is reachable. Called on boot so a bad DATABASE_URL
 * fails loudly at startup rather than on the first request.
 */
export const connectDb = async () => {
  await prisma.$connect();
  logger.info('Database connected');
};

/**
 * Closes the connection pool during graceful shutdown.
 */
export const disconnectDb = async () => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};

/**
 * Lightweight liveness probe for the health endpoint.
 */
export const isDbHealthy = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed', { message: error.message });
    return false;
  }
};

export default prisma;
