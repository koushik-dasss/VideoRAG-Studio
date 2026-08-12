import { loadConfig } from './config/index';
import { createApp } from './app';
import { logger } from './utils/logger';
import { startWorker } from './workers/videoProcessor';
import { Worker } from 'bullmq';
import { getBullMqConnectionOptions } from './utils/redis';
import path from 'path';
import { connectDB } from './config/db';
import transcriptionProcessor from './workers/transcriptionProcessor';

async function bootstrap(): Promise<void> {
  try {
    // 1. Validate all environment variables before anything else starts
    const config = loadConfig();

    // 2. Connect to MongoDB Atlas first
    await connectDB();

    // 3. Build the Express application
    const app = createApp();

    // 4. Start listening
    const server = app.listen(config.app.port, () => {
      logger.info(`🚀 ${config.app.serviceName} running on port ${config.app.port}`, {
        env: config.app.env,
        apiVersion: config.app.apiVersion,
      });
    });

    // Start background worker
    const worker = startWorker();
    
    // Start isolated transcription worker using normal BullMQ worker
    // The actual processor logic spawns a native worker_threads Worker to keep event loop free
    const { connection } = getBullMqConnectionOptions(config.cache.redisUrl);
    
    const transcriptionWorker = new Worker(
      'transcription',
      transcriptionProcessor,
      { connection }
    );

    // 4. Graceful shutdown
    const shutdown = (signal: string): void => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(() => {
        logger.info('HTTP server closed');
        void worker.close();
        void transcriptionWorker.close();
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

bootstrap();
