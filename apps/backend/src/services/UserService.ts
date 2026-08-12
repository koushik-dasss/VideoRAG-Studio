import { UserSettingsRepository } from '../repositories/UserSettingsRepository';
import { IUserSettings } from '../models/UserSettings';

export class UserService {
  private settingsRepository: UserSettingsRepository;

  constructor() {
    this.settingsRepository = new UserSettingsRepository();
  }

  async getSettings(userId: string): Promise<IUserSettings> {
    let settings = await this.settingsRepository.findByUserId(userId);
    if (!settings) {
      settings = await this.settingsRepository.upsert(userId, {}); // Create default settings
    }
    return settings;
  }

  async updateSettings(userId: string, data: Partial<IUserSettings>): Promise<IUserSettings> {
    return await this.settingsRepository.upsert(userId, data);
  }
}
