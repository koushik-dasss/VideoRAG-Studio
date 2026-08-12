import { Event, type IEvent } from '../models/Event';
import mongoose from 'mongoose';

export class EventRepository {
  async create(data: Partial<IEvent>): Promise<IEvent> {
    const event = new Event(data);
    return await event.save();
  }

  async findRecent(limit: number = 50, filters: any = {}): Promise<IEvent[]> {
    return await Event.find(filters).sort({ createdAt: -1 }).limit(limit).lean() as unknown as IEvent[];
  }

  async findByLecture(lectureId: string): Promise<IEvent[]> {
    return await Event.find({ lectureId: new mongoose.Types.ObjectId(lectureId) })
      .sort({ createdAt: -1 }).lean() as unknown as IEvent[];
  }
}
