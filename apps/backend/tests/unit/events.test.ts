import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventEmitterEventBus } from '../../src/events/index';

describe('EventEmitterEventBus', () => {
  let eventBus: EventEmitterEventBus;

  beforeEach(() => {
    eventBus = new EventEmitterEventBus();
  });

  it('registers listener and emits event payload', () => {
    const handler = vi.fn();
    eventBus.on('test:event', handler);

    expect(eventBus.listenerCount('test:event')).toBe(1);

    const result = eventBus.emit('test:event', { foo: 'bar' });
    expect(result).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('handles once() listener triggering only once', () => {
    const handler = vi.fn();
    eventBus.once('test:once', handler);

    expect(eventBus.listenerCount('test:once')).toBe(1);

    eventBus.emit('test:once', { step: 1 });
    eventBus.emit('test:once', { step: 2 });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ step: 1 });
    expect(eventBus.listenerCount('test:once')).toBe(0);
  });

  it('removes specific listener with off()', () => {
    const handler = vi.fn();
    eventBus.on('test:off', handler);
    expect(eventBus.listenerCount('test:off')).toBe(1);

    eventBus.off('test:off', handler);
    expect(eventBus.listenerCount('test:off')).toBe(0);

    const emitted = eventBus.emit('test:off', { hello: 'world' });
    expect(emitted).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it('removes all listeners for an event or all events', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const h3 = vi.fn();

    eventBus.on('event:1', h1);
    eventBus.on('event:1', h2);
    eventBus.on('event:2', h3);

    expect(eventBus.listenerCount('event:1')).toBe(2);
    expect(eventBus.listenerCount('event:2')).toBe(1);

    eventBus.removeAllListeners('event:1');
    expect(eventBus.listenerCount('event:1')).toBe(0);
    expect(eventBus.listenerCount('event:2')).toBe(1);

    eventBus.removeAllListeners();
    expect(eventBus.listenerCount('event:2')).toBe(0);
  });
});
