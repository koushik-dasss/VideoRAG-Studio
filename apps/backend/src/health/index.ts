/**
 * Health Monitor Module — composite health checker capable of auditing
 * and aggregating health status (`healthy`, `degraded`, `unhealthy`) across all
 * registered services, databases, and AI providers.
 */

import { ValidationError } from '../errors/index';
import type { HealthCheckResult, IHealthChecker } from '../interfaces/index';
import { nowIso } from '../utils/index';
import { createLogger } from '../utils/logger';

const log = createLogger('HealthMonitor');

export interface AggregatedHealthReport {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  results: HealthCheckResult[];
  timestamp: string;
}

export class HealthMonitor implements IHealthChecker {
  private readonly checkers = new Map<string, IHealthChecker>();
  private readonly serviceName: string;

  constructor(serviceName = 'system-health-monitor') {
    this.serviceName = serviceName;
    log.info('HealthMonitor initialised', { serviceName: this.serviceName });
  }

  /**
   * Register a health checker under a unique service identifier.
   */
  registerChecker(name: string, checker: IHealthChecker): void {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('Service name must be a non-empty string');
    }
    if (!checker || typeof checker.check !== 'function') {
      throw new ValidationError('Invalid health checker provided');
    }

    const cleanName = name.trim();
    this.checkers.set(cleanName, checker);
    log.debug('Registered health checker', { service: cleanName });
  }

  /**
   * Unregister a health checker by name.
   */
  unregisterChecker(name: string): boolean {
    if (!name || typeof name !== 'string' || !name.trim()) {
      return false;
    }
    return this.checkers.delete(name.trim());
  }

  /**
   * Execute all registered health checks in parallel and return aggregated report.
   */
  async checkAll(): Promise<AggregatedHealthReport> {
    const entries = Array.from(this.checkers.entries());
    if (entries.length === 0) {
      return {
        overall: 'healthy',
        results: [],
        timestamp: nowIso(),
      };
    }

    const startMs = Date.now();
    const outcomes = await Promise.allSettled(
      entries.map(async ([name, checker]) => {
        const checkStart = Date.now();
        try {
          const res = await checker.check();
          return res;
        } catch (err) {
          const latencyMs = Date.now() - checkStart;
          const message = err instanceof Error ? err.message : String(err);
          log.warn('Health check threw exception', { service: name, error: message });
          const failedRes: HealthCheckResult = {
            status: 'unhealthy',
            service: name,
            latencyMs,
            message: `Health check failed with error: ${message}`,
            timestamp: nowIso(),
          };
          return failedRes;
        }
      }),
    );

    const results: HealthCheckResult[] = outcomes.map((outcome, idx) => {
      if (outcome.status === 'fulfilled') {
        return outcome.value;
      }
      const entryName = entries[idx]?.[0] ?? 'unknown';
      const reason = outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
      return {
        status: 'unhealthy',
        service: entryName,
        latencyMs: Date.now() - startMs,
        message: `Unhandled rejection: ${reason}`,
        timestamp: nowIso(),
      };
    });

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (results.some((r) => r.status === 'unhealthy')) {
      overall = 'unhealthy';
    } else if (results.some((r) => r.status === 'degraded')) {
      overall = 'degraded';
    }

    return {
      overall,
      results,
      timestamp: nowIso(),
    };
  }

  /**
   * Implements `IHealthChecker.check()` so HealthMonitor can itself be nested.
   */
  async check(): Promise<HealthCheckResult> {
    const startMs = Date.now();
    const report = await this.checkAll();
    const latencyMs = Date.now() - startMs;

    return {
      status: report.overall,
      service: this.serviceName,
      latencyMs,
      message: `Checked ${report.results.length} services (${report.overall})`,
      timestamp: report.timestamp,
    };
  }
}
