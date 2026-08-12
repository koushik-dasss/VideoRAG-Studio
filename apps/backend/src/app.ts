import express from 'express';
import path from 'path';

import { getConfig } from './config/index';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { createLogger } from './utils/logger';
import { connectDB } from './config/db';
import lectureRoutes from './api/routes/lectures';
import userRoutes from './api/routes/users';
import healthRoutes from './api/routes/health';
import searchRoutes from './api/routes/search';
import dashboardRoutes from './api/routes/dashboard';
import assistantRoutes from './api/routes/assistant';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const log = createLogger('App');

export function createApp(): express.Application {
  const app = express();
  const config = getConfig();

  // ─── Body parsing ──────────────────────────────────────────
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── Rate Limiting ─────────────────────────────────────────
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.app.env === 'development' ? 10000 : 100, // Limit each IP
    message: { error: 'Too many requests, please try again later.' }
  });
  app.use('/api/', apiLimiter);

  // ─── Request logging ───────────────────────────────────────
  app.use(requestLogger);

  // ─── Health ping ───────────────────────────────────────────
  app.get('/ping', (_req, res) => {
    res.json({ status: 'ok', service: config.app.serviceName, timestamp: new Date().toISOString() });
  });

  // ─── Serve Static Uploads ──────────────────────────────────
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // ─── API routes will be mounted here in later phases ───────
  app.use('/api/lectures', lectureRoutes);
  app.use('/api/users', userRoutes);
  app.use('/health', healthRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/assistant', assistantRoutes);

  // Global Error Handlering ──────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  log.info(`Express app created — env=${config.app.env}, apiVersion=${config.app.apiVersion}`);

  return app;
}
