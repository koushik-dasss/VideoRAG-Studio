import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { loadConfig, resetConfig, getConfig } from '../../src/config';

describe('Config Loader', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    resetConfig();
    // Set minimal valid env
    process.env['NODE_ENV'] = 'test';
    process.env['PORT'] = '3001';
    process.env['MONGODB_URI'] = 'mongodb://localhost:27017/test_db';
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    resetConfig();
  });

  it('loads config with defaults', () => {
    const config = loadConfig();
    expect(config.app.env).toBe('test');
    expect(config.app.port).toBe(3001);
    expect(config.app.apiVersion).toBe('v1');
  });

  it('returns singleton on repeated calls', () => {
    const a = loadConfig();
    const b = loadConfig();
    expect(a).toBe(b);
  });

  it('resets singleton correctly', () => {
    const a = loadConfig();
    resetConfig();
    const b = loadConfig();
    expect(a).not.toBe(b);
  });

  it('getConfig() loads if not yet loaded', () => {
    const config = getConfig();
    expect(config).toBeDefined();
    expect(config.app.serviceName).toBe('semantic-video-search');
  });

  it('throws on invalid NODE_ENV value', () => {
    resetConfig();
    process.env['NODE_ENV'] = 'staging'; // not in valid list
    expect(() => loadConfig()).toThrow(/environment configuration validation failed/i);
  });

  it('has pipeline retry config', () => {
    const config = loadConfig();
    expect(config.pipeline.maxRetries).toBeGreaterThan(0);
    expect(config.pipeline.retryBackoffMultiplier).toBeGreaterThan(1);
  });
});
