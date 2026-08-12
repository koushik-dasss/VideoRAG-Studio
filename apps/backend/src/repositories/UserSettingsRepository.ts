import { UserSettings, type IUserSettings } from '../models/UserSettings';

export class UserSettingsRepository {
  async findByUserId(userId: string): Promise<IUserSettings | null> {
    return await UserSettings.findOne({ userId });
  }

  async upsert(userId: string, data: Partial<IUserSettings>): Promise<IUserSettings> {
    return await UserSettings.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, upsert: true }
    );
  }
}
