import { describe, it, expect } from 'vitest';

import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ProviderError,
  PipelineError,
  PipelineStageError,
  ConfigurationError,
  isAppError,
  isOperationalError,
} from '../../src/errors';
import { HTTP_STATUS } from '../../src/constants';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('sets correct properties', () => {
      const err = new AppError('test error', 400, true, { key: 'value' });
      expect(err.message).toBe('test error');
      expect(err.statusCode).toBe(400);
      expect(err.isOperational).toBe(true);
      expect(err.context).toEqual({ key: 'value' });
    });

    it('defaults to 500 status and operational', () => {
      const err = new AppError('oops');
      expect(err.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(err.isOperational).toBe(true);
    });

    it('has correct name', () => {
      expect(new AppError('x').name).toBe('AppError');
    });
  });

  describe('ValidationError', () => {
    it('has 422 status', () => {
      const err = new ValidationError('invalid', { email: ['required'] });
      expect(err.statusCode).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(err.fields).toEqual({ email: ['required'] });
    });
  });

  describe('NotFoundError', () => {
    it('formats message correctly', () => {
      const err = new NotFoundError('Video', 'abc123');
      expect(err.message).toBe('Video not found: abc123');
      expect(err.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe('ConflictError', () => {
    it('has 409 status', () => {
      expect(new ConflictError('duplicate').statusCode).toBe(HTTP_STATUS.CONFLICT);
    });
  });

  describe('ProviderError', () => {
    it('stores provider name', () => {
      const err = new ProviderError('someProvider', 'API error');
      expect(err.provider).toBe('someProvider');
      expect(err.context).toEqual({ provider: 'someProvider' });
    });

    it('links original error', () => {
      const original = new Error('network error');
      const err = new ProviderError('gemini', 'failed', original);
      expect(err.originalError).toBe(original);
    });
  });

  describe('PipelineError', () => {
    it('stores pipelineId and stage', () => {
      const err = new PipelineError('pipe-1', 'transcription', 'failed');
      expect(err.pipelineId).toBe('pipe-1');
      expect(err.stage).toBe('transcription');
    });

    it('appends cause stack', () => {
      const cause = new Error('root cause');
      const err = new PipelineError('pipe-1', 'embedding', 'failed', cause);
      expect(err.stack).toContain('Caused by:');
    });
  });

  describe('PipelineStageError', () => {
    it('formats message from cause', () => {
      const cause = new Error('timeout');
      const err = new PipelineStageError('p1', 'chunking', cause);
      expect(err.message).toContain("Stage 'chunking' failed");
      expect(err.message).toContain('timeout');
    });
  });

  describe('ConfigurationError', () => {
    it('is non-operational', () => {
      const err = new ConfigurationError('bad config');
      expect(err.isOperational).toBe(false);
    });
  });

  describe('isAppError', () => {
    it('returns true for AppError instances', () => {
      expect(isAppError(new AppError('x'))).toBe(true);
    });

    it('returns false for regular Error', () => {
      expect(isAppError(new Error('x'))).toBe(false);
    });

    it('returns false for non-errors', () => {
      expect(isAppError('string')).toBe(false);
      expect(isAppError(null)).toBe(false);
    });
  });

  describe('isOperationalError', () => {
    it('returns true for operational AppError', () => {
      expect(isOperationalError(new NotFoundError('Video', '1'))).toBe(true);
    });

    it('returns false for non-operational error', () => {
      expect(isOperationalError(new ConfigurationError('x'))).toBe(false);
    });
  });
});
