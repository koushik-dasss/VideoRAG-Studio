import { loadConfig } from './config/index.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

async function bootstrap(): Promise<void> {
  try {
    // 1. Validate all environment variables before anything else starts
    const config = loadConfig();

    // 2. Build the Express application
    const app = createApp();

    // 3. Start listening
    const server = app.listen(config.app.port, () => {
      logger.info(`🚀 ${config.app.serviceName} running on port ${config.app.port}`, {
        env: config.app.env,
        apiVersion: config.app.apiVersion,
      });
    });

    // 4. Graceful shutdown
    const shutdown = (signal: string): void => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force exit if graceful shutdown hangs
      setTimeout(() => {
        logger.error('Graceful shutdown timed out — forcing exit');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error('Fatal error during bootstrap', { error: (err as Error).message });
    process.exit(1);
  }
}

bootstrap().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled bootstrap error:', err);
  process.exit(1);
});
