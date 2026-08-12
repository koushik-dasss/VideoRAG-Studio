import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;
  theme: 'light' | 'dark' | 'system';
  aiProvider: 'gemini' | 'local' | 'mock';
  embeddingModel: string;
  llmModel: string;
  notificationPreferences: Record<string, boolean>;
  storageProvider: string;
}

const UserSettingsSchema = new Schema<IUserSettings>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  aiProvider: { type: String, enum: ['gemini', 'local', 'mock'], default: 'gemini' },
  embeddingModel: { type: String, default: 'text-embedding-3-small' },
  llmModel: { type: String, default: 'gpt-4o' },
  notificationPreferences: { type: Schema.Types.Mixed, default: { email: true, push: false } },
  storageProvider: { type: String, default: 'local' },
}, { timestamps: true });

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
