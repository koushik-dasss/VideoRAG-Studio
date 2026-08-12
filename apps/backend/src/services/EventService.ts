import { EventRepository } from '../repositories/EventRepository';
import { IEvent } from '../models/Event';
import mongoose from 'mongoose';

export class EventService {
  private repository: EventRepository;

  constructor() {
    this.repository = new EventRepository();
  }

  async emit(
    type: string,
    userId: string,
    lectureId?: string,
    jobId?: string,
    status: 'info' | 'success' | 'warning' | 'error' = 'info',
    metadata: Record<string, any> = {}
  ): Promise<IEvent> {
    const data: Partial<IEvent> = {
      type,
      userId: new mongoose.Types.ObjectId(userId),
      status,
      metadata
    };
    if (lectureId) data.lectureId = new mongoose.Types.ObjectId(lectureId);
    if (jobId) data.jobId = jobId;

    return await this.repository.create(data);
  }

  async getRecentActivities(limit: number = 20): Promise<IEvent[]> {
    return await this.repository.findRecent(limit);
  }
}
