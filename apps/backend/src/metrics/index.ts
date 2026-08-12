/**
 * Metrics Engine — in-memory collection and aggregation of operational metrics
 * (counters, gauges, and latency histograms with statistical summaries).
 */

import { ValidationError } from '../errors/index';
import type { IMetricsCollector } from '../interfaces/index';
import { nowIso } from '../utils/index';
import { createLogger } from '../utils/logger';

const log = createLogger('MetricsCollector');

export interface CounterMetric {
  name: string;
  labels: Record<string, string>;
  value: number;
}

export interface GaugeMetric {
  name: string;
  labels: Record<string, string>;
  value: number;
}

export interface HistogramMetric {
  name: string;
  labels: Record<string, string>;
  count: number;
  sum: number;
  min: number;
  max: number;
  recentObservations: number[];
}

export interface MetricsSnapshot {
  counters: CounterMetric[];
  gauges: GaugeMetric[];
  histograms: HistogramMetric[];
  timestamp: string;
}

export class MetricsCollector implements IMetricsCollector {
  private readonly counters = new Map<string, CounterMetric>();
  private readonly gauges = new Map<string, GaugeMetric>();
  private readonly histograms = new Map<string, HistogramMetric>();
  private readonly maxObservations: number;

  constructor(maxObservations = 100) {
    this.maxObservations = Math.max(1, maxObservations);
    log.info('MetricsCollector initialised', { maxObservations: this.maxObservations });
  }

  /**
   * Increment a counter metric by a given delta (default: 1).
   */
  incrementCounter(name: string, labels: Record<string, string> = {}, delta = 1): void {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('Metric name must be a non-empty string');
    }

    const key = this.makeKey(name.trim(), labels);
    const existing = this.counters.get(key);
    if (existing) {
      existing.value += delta;
    } else {
      this.counters.set(key, {
        name: name.trim(),
        labels: { ...labels },
        value: delta,
      });
    }
  }

  /**
   * Set a gauge metric to an explicit value.
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('Metric name must be a non-empty string');
    }

    const key = this.makeKey(name.trim(), labels);
    this.gauges.set(key, {
      name: name.trim(),
      labels: { ...labels },
      value,
    });
  }

  /**
   * Record a numerical observation (e.g. latency, token count) in a histogram.
   */
  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ValidationError('Metric name must be a non-empty string');
    }
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new ValidationError('Observation value must be a valid number');
    }

    const key = this.makeKey(name.trim(), labels);
    const existing = this.histograms.get(key);

    if (existing) {
      existing.count += 1;
      existing.sum += value;
      existing.min = Math.min(existing.min, value);
      existing.max = Math.max(existing.max, value);
      existing.recentObservations.push(value);
      if (existing.recentObservations.length > this.maxObservations) {
        existing.recentObservations.shift();
      }
    } else {
      this.histograms.set(key, {
        name: name.trim(),
        labels: { ...labels },
        count: 1,
        sum: value,
        min: value,
        max: value,
        recentObservations: [value],
      });
    }
  }

  /**
   * Get a point-in-time snapshot of all recorded metrics.
   */
  getSnapshot(): MetricsSnapshot {
    return {
      counters: Array.from(this.counters.values()).map((c) => ({ ...c, labels: { ...c.labels } })),
      gauges: Array.from(this.gauges.values()).map((g) => ({ ...g, labels: { ...g.labels } })),
      histograms: Array.from(this.histograms.values()).map((h) => ({
        ...h,
        labels: { ...h.labels },
        recentObservations: h.recentObservations.slice(),
      })),
      timestamp: nowIso(),
    };
  }

  /**
   * Clear all recorded metrics.
   */
  clear(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    log.info('All metrics cleared');
  }

  private makeKey(name: string, labels: Record<string, string>): string {
    const sortedLabels = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${sortedLabels}}`;
  }
}
