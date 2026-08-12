import type { Document} from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface IProcessingJob extends Document {
  jobId: string;
  lectureId: mongoose.Types.ObjectId;
  currentStage: string;
  progressPercentage: number;
  status: 'pending' | 'uploading' | 'queued' | 'processing' | 'transcribing' | 'cleaning' | 'chunking' | 'embedding' | 'generating_chapters' | 'saving' | 'completed' | 'failed' | 'cancelled';
  startedTime?: Date;
  finishedTime?: Date;
  errorMessages: string[];
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProcessingJobSchema = new Schema<IProcessingJob>({
  jobId: { type: String, required: true, unique: true },
  lectureId: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true },
  currentStage: { type: String, default: 'uploading' },
  progressPercentage: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'uploading', 'queued', 'processing', 'transcribing', 'cleaning', 'chunking', 'embedding', 'generating_chapters', 'saving', 'completed', 'failed', 'cancelled'],
    default: 'pending' 
  },
  startedTime: { type: Date },
  finishedTime: { type: Date },
  errorMessages: [{ type: String }],
  retryCount: { type: Number, default: 0 },
}, { timestamps: true });

export const ProcessingJob = mongoose.model<IProcessingJob>('ProcessingJob', ProcessingJobSchema);
