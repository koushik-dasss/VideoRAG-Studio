import { Event } from '../models/Event';
import { Chunk } from '../models/Chunk';
import { Lecture } from '../models/Lecture';

export class AnalyticsService {
  async getAnalytics(userId: string) {
    const totalEmbeddings = await Chunk.countDocuments({});

    // Calculate Average Processing Time
    const processingEvents = await Event.find({ type: 'VIDEO_COMPLETED', status: 'success' })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    let avgProcessingTime = 0;
    if (processingEvents.length > 0) {
      let totalTime = 0;
      processingEvents.forEach(e => {
        if (e.metadata?.durationMs) totalTime += e.metadata.durationMs;
      });
      avgProcessingTime = totalTime / processingEvents.length;
    }

    const failedEvents = await Event.countDocuments({ type: 'VIDEO_FAILED' });
    const successEvents = await Event.countDocuments({ type: 'VIDEO_COMPLETED' });
    const failureRate = (failedEvents + successEvents > 0) 
      ? (failedEvents / (failedEvents + successEvents)) * 100 
      : 0;

    // Weekly uploads: count lectures per day for last 7 days
    const weeklyUploads = await this.getWeeklyUploads(userId);

    return {
      totalEmbeddings,
      avgProcessingTimeMs: avgProcessingTime,
      failureRatePercentage: failureRate,
      weeklyUploads,
    };
  }

  private async getWeeklyUploads(userId: string) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Query lectures created in the last 7 days for this user
    const lectures = await Lecture.find({
      userId,
      createdAt: { $gte: sevenDaysAgo }
    }).select('createdAt').lean();

    // Build a map of day-of-week counts
    const countByDay: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dayKey = dayNames[d.getDay()];
      countByDay[dayKey] = 0;
    }

    for (const lecture of lectures) {
      const d = new Date(lecture.createdAt);
      const dayKey = dayNames[d.getDay()];
      if (dayKey in countByDay) {
        countByDay[dayKey]++;
      }
    }

    // Convert to ordered array matching the last 7 days
    const result: { day: string; uploads: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dayKey = dayNames[d.getDay()];
      result.push({ day: dayKey, uploads: countByDay[dayKey] || 0 });
    }

    return result;
  }
}
