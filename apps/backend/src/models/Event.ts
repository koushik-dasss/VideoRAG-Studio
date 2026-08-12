import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  type: string;
  userId: mongoose.Types.ObjectId;
  lectureId?: mongoose.Types.ObjectId;
  jobId?: string;
  status: 'info' | 'success' | 'warning' | 'error';
  metadata: Record<string, any>;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>({
  type: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lectureId: { type: Schema.Types.ObjectId, ref: 'Lecture' },
  jobId: { type: String },
  status: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

EventSchema.index({ userId: 1, createdAt: -1 });
EventSchema.index({ type: 1 });
EventSchema.index({ lectureId: 1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);
