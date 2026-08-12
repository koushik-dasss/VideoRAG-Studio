import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { User, Bell, Moon, Key, Save, Loader2 } from "lucide-react";
import { getUser, getUserSettings, updateUserSettings } from "../services/userService";
import { NotificationService } from "../services/NotificationService";

export default function Settings() {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [settings, setSettings] = useState({
    emailNotifications: true,
    darkMode: true,
    apiConfiguration: { provider: 'mock', apiKey: '' }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const userId = '64a1b2c3d4e5f6a7b8c9d0e1'; // Demo user ID

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, settingsRes] = await Promise.all([
          getUser(userId),
          getUserSettings(userId)
        ]);
        if (userRes.data?.success) {
          setProfile({ name: userRes.data.data.name, email: userRes.data.data.email });
        }
        if (settingsRes.data?.success && settingsRes.data?.data) {
          setSettings(settingsRes.data.data);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        NotificationService.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real app, we'd also update the user profile. Here we focus on settings.
      const res = await updateUserSettings(userId, settings);
      if (res.data?.success) {
        NotificationService.success("Settings updated successfully!");
      }
    } catch (err) {
      console.error("Failed to update settings:", err);
      NotificationService.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">
            Settings
          </h1>

          <p className="text-slate-400 mt-2">
            Manage your profile, notifications and application preferences.
          </p>
        </div>

        {/* Profile */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="text-blue-500" />
            <h2 className="text-2xl font-semibold text-white">
              Profile
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <input
              type="text"
              placeholder="Full Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 text-white"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 text-white"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Bell className="text-yellow-400" />
            <h2 className="text-2xl font-semibold text-white">
              Notifications
            </h2>
          </div>

          <label className="flex items-center justify-between text-slate-300 cursor-pointer">
            <span>Email Notifications</span>
            <input 
              type="checkbox" 
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
              className="w-5 h-5 accent-blue-500"
            />
          </label>
        </div>

        {/* Appearance */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Moon className="text-purple-400" />
            <h2 className="text-2xl font-semibold text-white">
              Appearance
            </h2>
          </div>

          <label className="flex items-center justify-between text-slate-300 cursor-pointer">
            <span>Dark Mode</span>
            <input 
              type="checkbox" 
              checked={settings.darkMode}
              onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
              className="w-5 h-5 accent-blue-500"
            />
          </label>
        </div>

        {/* API */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Key className="text-green-400" />
            <h2 className="text-2xl font-semibold text-white">
              API Configuration
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">AI Provider</label>
              <select 
                value={settings.apiConfiguration?.provider || 'mock'}
                onChange={(e) => setSettings({
                  ...settings,
                  apiConfiguration: { ...settings.apiConfiguration, provider: e.target.value }
                })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 text-white"
              >
                <option value="mock">Mock Provider (Local)</option>
                <option value="gemini">Google Gemini AI</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-2">API Key</label>
              <input
                type="password"
                placeholder="Leave blank to use server environment variables"
                value={settings.apiConfiguration?.apiKey || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  apiConfiguration: { ...settings.apiConfiguration, apiKey: e.target.value }
                })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 text-white"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-3 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 px-8 py-3 rounded-xl font-semibold text-white transition"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </MainLayout>
  );
}