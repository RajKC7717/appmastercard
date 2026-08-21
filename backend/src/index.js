import 'dotenv/config';
import app from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDb();
  } catch (error) {
    logger.error('Failed to connect to the database — check DATABASE_URL', {
      message: error.message,
    });
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start();
