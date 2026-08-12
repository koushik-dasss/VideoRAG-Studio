import type { Document} from 'mongoose';
import mongoose, { Schema } from 'mongoose';

export interface IChunk extends Document {
  lectureId: mongoose.Types.ObjectId;
  text: string;
  startTime: number;
  endTime: number;
  embedding: number[];
  metadata: Record<string, unknown>;
}

const ChunkSchema = new Schema<IChunk>({
  lectureId: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true },
  text: { type: String, required: true },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  embedding: { type: [Number], required: true },
  metadata: { type: Schema.Types.Mixed }
});

// To use Atlas Vector Search, you must create a search index in Atlas on the 'embedding' field.
export const Chunk = mongoose.model<IChunk>('Chunk', ChunkSchema);
