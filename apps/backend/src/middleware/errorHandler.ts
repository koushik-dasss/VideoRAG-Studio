import type { Request, Response, NextFunction } from 'express';

import { HTTP_STATUS } from '../constants';
import { AppError, isAppError } from '../errors';
import { createLogger } from '../utils/logger';

const log = createLogger('ErrorHandler');

interface ErrorResponse {
  success: false;
  message: string;
  data: null;
  errors: Array<{
    code: string;
    message: string;
    statusCode: number;
    fields?: Record<string, string[]>;
    context?: Record<string, unknown>;
  }>;
  timestamp: string;
  requestId: string;
}

/** Central Express error-handling middleware — must be registered last. */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  const timestamp = new Date().toISOString();

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

    const errorDetail: any = {
      code: err.name,
      message: err.message,
      statusCode: err.statusCode,
      context: err.context,
    };

    // Include validation field errors when present
    if ('fields' in err && typeof err.fields === 'object') {
      errorDetail.fields = err.fields as Record<string, string[]>;
    }

    const body: ErrorResponse = {
      success: false,
      message: err.message,
      data: null,
      errors: [errorDetail],
      timestamp,
      requestId,
    };

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
    message: 'An unexpected error occurred',
    data: null,
    errors: [{
      code: 'InternalServerError',
      message: 'An unexpected error occurred',
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    }],
    timestamp,
    requestId,
  } satisfies ErrorResponse);
}

/** 404 handler — register after all routes, before errorHandler */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.path}`, HTTP_STATUS.NOT_FOUND));
}
