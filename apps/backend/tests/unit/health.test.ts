import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationError } from '../../src/errors/index';
import { HealthMonitor } from '../../src/health/index';
import type { HealthCheckResult, IHealthChecker } from '../../src/interfaces/index';
import { nowIso } from '../../src/utils/index';

describe('HealthMonitor', () => {
  let monitor: HealthMonitor;

  beforeEach(() => {
    monitor = new HealthMonitor();
  });

  it('returns healthy status when no checkers are registered', async () => {
    const report = await monitor.checkAll();
    expect(report.overall).toBe('healthy');
    expect(report.results).toHaveLength(0);
  });

  it('returns healthy status when all registered checkers report healthy', async () => {
    const checkerA: IHealthChecker = {
      check: vi.fn().mockResolvedValue({
        status: 'healthy',
        service: 'service-a',
        latencyMs: 10,
        timestamp: nowIso(),
      } satisfies HealthCheckResult),
    };
    const checkerB: IHealthChecker = {
      check: vi.fn().mockResolvedValue({
        status: 'healthy',
        service: 'service-b',
        latencyMs: 15,
        timestamp: nowIso(),
      } satisfies HealthCheckResult),
    };

    monitor.registerChecker('service-a', checkerA);
    monitor.registerChecker('service-b', checkerB);

    const report = await monitor.checkAll();
    expect(report.overall).toBe('healthy');
    expect(report.results).toHaveLength(2);

    const singleCheck = await monitor.check();
    expect(singleCheck.status).toBe('healthy');
  });

  it('aggregates to degraded when at least one checker is degraded and none unhealthy', async () => {
    const checkerOk: IHealthChecker = {
      check: vi.fn().mockResolvedValue({
        status: 'healthy',
        service: 'ok-service',
        latencyMs: 5,
        timestamp: nowIso(),
      }),
    };
    const checkerSlow: IHealthChecker = {
      check: vi.fn().mockResolvedValue({
        status: 'degraded',
        service: 'slow-service',
        latencyMs: 800,
        message: 'High latency',
        timestamp: nowIso(),
      }),
    };

    monitor.registerChecker('ok', checkerOk);
    monitor.registerChecker('slow', checkerSlow);

    const report = await monitor.checkAll();
    expect(report.overall).toBe('degraded');
  });

  it('aggregates to unhealthy when any checker throws or reports unhealthy', async () => {
    const checkerOk: IHealthChecker = {
      check: vi.fn().mockResolvedValue({
        status: 'healthy',
        service: 'ok',
        latencyMs: 5,
        timestamp: nowIso(),
      }),
    };
    const checkerBroken: IHealthChecker = {
      check: vi.fn().mockRejectedValue(new Error('Database connection refused')),
    };

    monitor.registerChecker('ok', checkerOk);
    monitor.registerChecker('broken', checkerBroken);

    const report = await monitor.checkAll();
    expect(report.overall).toBe('unhealthy');
    expect(report.results.find((r) => r.service === 'broken')?.status).toBe('unhealthy');
  });

  it('throws ValidationError for invalid registration parameters', () => {
    // @ts-expect-error missing check method
    expect(() => monitor.registerChecker('bad', {})).toThrow(ValidationError);
    expect(() => monitor.registerChecker('', { check: vi.fn() })).toThrow(ValidationError);
  });
});
