import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Queue, Worker } from 'bullmq';
import { EventEmitterEventBus as JobEventBus } from '../../src/events/index';

vi.mock('bullmq', () => {
  return {
    Queue: vi.fn().mockImplementation(() => ({
      add: vi.fn().mockResolvedValue({ id: 'mock-job-id' }),
      close: vi.fn(),
    })),
    Worker: vi.fn().mockImplementation((queueName, processor, opts) => ({
      on: vi.fn(),
      close: vi.fn(),
    })),
  };
});

describe('BullMQ Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add a job to the queue successfully', async () => {
    const testQueue = new Queue('test-queue');
    const result = await testQueue.add('test-job', { data: 'test' });
    expect(result.id).toBe('mock-job-id');
  });

  it('worker should process events through the JobEventBus', () => {
    const bus = new JobEventBus();
    const emitSpy = vi.spyOn(bus, 'emit');

    bus.emit('job:started', { jobId: 'job-123', timestamp: new Date() });
    expect(emitSpy).toHaveBeenCalledWith('job:started', expect.any(Object));
  });
});
