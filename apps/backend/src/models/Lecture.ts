import type { Document} from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface ITimelineSegment {
  start: number;
  end: number;
  text: string;
  topic?: string;
  isKeyPoint?: boolean;
}

export interface IChapter {
  title: string;
  summary: string;
  startTime: number;
  endTime: number;
}

export interface ILecture extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subject?: string;
  language?: string;
  fileType: 'video' | 'audio' | 'pdf' | 'pptx' | 'youtube';
  fileUrl?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  
  // Metadata
  duration?: number;
  width?: number;
  height?: number;
  resolution?: string;
  videoCodec?: string;
  audioCodec?: string;
  fps?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  container?: string;
  mimeType?: string;
  sizeBytes?: number;

  status: 'uploading' | 'transcribing' | 'processing' | 'done' | 'failed';
  rawTranscript?: string;
  timeline: ITimelineSegment[];
  chapters: IChapter[];
  summaryShort?: string;
  summaryDetailed?: string;
  notes?: string;
  keyTopics?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const timelineSegmentSchema = new Schema<ITimelineSegment>({
  start: { type: Number, required: true },
  end: { type: Number, required: true },
  text: { type: String, required: true },
  topic: { type: String, default: '' },
  isKeyPoint: { type: Boolean, default: false },
});

const chapterSchema = new Schema<IChapter>({
  title: { type: String, required: true },
  summary: { type: String, required: true },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
});

const LectureSchema = new Schema<ILecture>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  subject: { type: String, default: '' },
  language: { type: String, default: 'English' },
  fileType: { type: String, enum: ['video', 'audio', 'pdf', 'pptx', 'youtube'], required: true },
  fileUrl: { type: String, default: '' },
  youtubeUrl: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  
  // Metadata
  duration: { type: Number, default: 0 },
  width: { type: Number },
  height: { type: Number },
  resolution: { type: String },
  videoCodec: { type: String },
  audioCodec: { type: String },
  fps: { type: Number },
  bitrate: { type: Number },
  sampleRate: { type: Number },
  channels: { type: Number },
  container: { type: String },
  mimeType: { type: String },
  sizeBytes: { type: Number },

  status: { type: String, enum: ['uploading', 'transcribing', 'processing', 'done', 'failed'], default: 'uploading' },
  rawTranscript: { type: String, default: '' },
  timeline: [timelineSegmentSchema],
  chapters: [chapterSchema],
  summaryShort: { type: String, default: '' },
  summaryDetailed: { type: String, default: '' },
  notes: { type: String, default: '' },
  keyTopics: [{ type: String }],
}, { timestamps: true });

LectureSchema.index({ userId: 1, createdAt: -1 });
LectureSchema.index({ status: 1 });

export const Lecture = mongoose.model<ILecture>('Lecture', LectureSchema);
