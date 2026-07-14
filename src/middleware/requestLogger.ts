import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { createLogger } from '../utils/logger.js';

const log = createLogger('RequestLogger');

/** Attaches a unique request-id and logs each HTTP request/response. */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';

    log[level](`${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`, {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
}
