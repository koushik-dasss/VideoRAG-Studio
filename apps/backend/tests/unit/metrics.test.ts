import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationError } from '../../src/errors/index';
import { MetricsCollector } from '../../src/metrics/index';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector(5); // small buffer for testing
  });

  it('increments counter with and without labels', () => {
    collector.incrementCounter('requests_total');
    collector.incrementCounter('requests_total');
    collector.incrementCounter('requests_total', { status: '200' }, 5);

    const snapshot = collector.getSnapshot();
    expect(snapshot.counters).toHaveLength(2);

    const noLabelCounter = snapshot.counters.find((c) => Object.keys(c.labels).length === 0);
    expect(noLabelCounter?.value).toBe(2);

    const labeledCounter = snapshot.counters.find((c) => c.labels.status === '200');
    expect(labeledCounter?.value).toBe(5);
  });

  it('sets and updates gauge values', () => {
    collector.setGauge('memory_usage_bytes', 1024);
    collector.setGauge('memory_usage_bytes', 2048);
    collector.setGauge('memory_usage_bytes', 512, { region: 'us-east' });

    const snapshot = collector.getSnapshot();
    expect(snapshot.gauges).toHaveLength(2);
    expect(snapshot.gauges.find((g) => Object.keys(g.labels).length === 0)?.value).toBe(2048);
    expect(snapshot.gauges.find((g) => g.labels.region === 'us-east')?.value).toBe(512);
  });

  it('observes histograms calculating min, max, sum, count, and rolling buffer', () => {
    collector.observeHistogram('latency_ms', 10);
    collector.observeHistogram('latency_ms', 50);
    collector.observeHistogram('latency_ms', 30);
    collector.observeHistogram('latency_ms', 20);
    collector.observeHistogram('latency_ms', 40);
    collector.observeHistogram('latency_ms', 100); // 6th item, buffer size 5 -> shifts 10

    const snapshot = collector.getSnapshot();
    const hist = snapshot.histograms.find((h) => h.name === 'latency_ms');
    expect(hist).toBeDefined();
    expect(hist?.count).toBe(6);
    expect(hist?.sum).toBe(250);
    expect(hist?.min).toBe(10);
    expect(hist?.max).toBe(100);
    expect(hist?.recentObservations).toEqual([50, 30, 20, 40, 100]);
  });

  it('throws ValidationError when metric name is invalid', () => {
    expect(() => collector.incrementCounter('')).toThrow(ValidationError);
    expect(() => collector.setGauge(' ', 10)).toThrow(ValidationError);
    expect(() => collector.observeHistogram('', 5)).toThrow(ValidationError);
  });

  it('clears all recorded metrics cleanly', () => {
    collector.incrementCounter('c1');
    collector.setGauge('g1', 1);
    collector.observeHistogram('h1', 10);
    expect(collector.getSnapshot().counters).toHaveLength(1);

    collector.clear();
    const snap = collector.getSnapshot();
    expect(snap.counters).toHaveLength(0);
    expect(snap.gauges).toHaveLength(0);
    expect(snap.histograms).toHaveLength(0);
  });
});
