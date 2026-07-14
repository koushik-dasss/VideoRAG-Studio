import type { Request, Response, NextFunction } from 'express';

import { HTTP_STATUS } from '../constants/index.js';
import { AppError, isAppError } from '../errors/index.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('ErrorHandler');

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    fields?: Record<string, string[]>;
    context?: Record<string, unknown>;
  };
  requestId?: string;
}

/** Central Express error-handling middleware — must be registered last. */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const requestId = req.headers['x-request-id'] as string | undefined;

  if (isAppError(err)) {
    if (!err.isOperational) {
      log.error('Non-operational error — potential bug', {
        error: err.message,
        stack: err.stack,
        requestId,
      });
    } else {
      log.warn('Operational error', {
        code: err.name,
        message: err.message,
        statusCode: err.statusCode,
        requestId,
      });
    }

    const body: ErrorResponse = {
      success: false,
      error: {
        code: err.name,
        message: err.message,
        statusCode: err.statusCode,
        context: err.context,
      },
      requestId,
    };

    // Include validation field errors when present
    if ('fields' in err && typeof err.fields === 'object') {
      body.error.fields = err.fields as Record<string, string[]>;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // Unknown / programming error
  const unknownError = err instanceof Error ? err : new Error(String(err));
  log.error('Unhandled error', {
    message: unknownError.message,
    stack: unknownError.stack,
    requestId,
  });

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: 'InternalServerError',
      message: 'An unexpected error occurred',
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    },
    requestId,
  } satisfies ErrorResponse);
}

/** 404 handler — register after all routes, before errorHandler */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.path}`, HTTP_STATUS.NOT_FOUND));
}
