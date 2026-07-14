import express from 'express';

import { getConfig } from '../config/index.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';
import { requestLogger } from '../middleware/requestLogger.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('App');

export function createApp(): express.Application {
  const app = express();
  const config = getConfig();

  // ─── Body parsing ──────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── Request logging ───────────────────────────────────────
  app.use(requestLogger);

  // ─── Health ping ───────────────────────────────────────────
  app.get('/ping', (_req, res) => {
    res.json({ status: 'ok', service: config.app.serviceName, timestamp: new Date().toISOString() });
  });

  // ─── API routes will be mounted here in later phases ───────
  // app.use(`/api/${config.app.apiVersion}/videos`, videoRouter);
  // app.use(`/api/${config.app.apiVersion}/pipeline`, pipelineRouter);

  // ─── 404 + Error handling ──────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  log.info(`Express app created — env=${config.app.env}, apiVersion=${config.app.apiVersion}`);

  return app;
}
