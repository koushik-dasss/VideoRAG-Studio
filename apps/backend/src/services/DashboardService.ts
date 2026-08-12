import { Lecture } from '../models/Lecture';
import { EventService } from './EventService';
import { AnalyticsService } from './AnalyticsService';

export class DashboardService {
  private eventService: EventService;
  private analyticsService: AnalyticsService;

  constructor() {
    this.eventService = new EventService();
    this.analyticsService = new AnalyticsService();
  }

  async getDashboardData(userId: string) {
    const totalVideos = await Lecture.countDocuments({ userId });
    const processingVideos = await Lecture.countDocuments({ userId, status: 'processing' });
    const completedVideos = await Lecture.countDocuments({ userId, status: 'done' });
    const failedVideos = await Lecture.countDocuments({ userId, status: 'failed' });

    // Aggregate storage used
    const lectures = await Lecture.find({ userId }).select('sizeBytes duration');
    let totalStorageBytes = 0;
    let totalDurationSeconds = 0;
    for (const lecture of lectures) {
      totalStorageBytes += (lecture as any).sizeBytes || 0;
      totalDurationSeconds += lecture.duration || 0;
    }

    const recentVideos = await Lecture.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status duration createdAt thumbnailUrl');

    const recentActivities = await this.eventService.getRecentActivities(10);
    const analytics = await this.analyticsService.getAnalytics(userId);

    return {
      statistics: {
        totalVideos,
        processingVideos,
        completedVideos,
        failedVideos,
        totalStorageBytes,
        totalDurationSeconds
      },
      recentVideos,
      recentActivities,
      analytics,
    };
  }
}
