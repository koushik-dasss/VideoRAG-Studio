import MainLayout from "../layouts/MainLayout";
import {
  User,
  Bell,
  Moon,
  Key,
  Save,
} from "lucide-react";

export default function Settings() {
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

            <h2 className="text-2xl font-semibold">
              Profile
            </h2>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <input
              type="text"
              placeholder="Full Name"
              className="bg-slate-900 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500"
            />

            <input
              type="email"
              placeholder="Email Address"
              className="bg-slate-900 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500"
            />

          </div>

        </div>

        {/* Notifications */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">

          <div className="flex items-center gap-3 mb-5">

            <Bell className="text-yellow-400" />

            <h2 className="text-2xl font-semibold">
              Notifications
            </h2>

          </div>

          <label className="flex items-center justify-between">

            <span>Email Notifications</span>

            <input type="checkbox" defaultChecked />

          </label>

        </div>

        {/* Appearance */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">

          <div className="flex items-center gap-3 mb-5">

            <Moon className="text-purple-400" />

            <h2 className="text-2xl font-semibold">
              Appearance
            </h2>

          </div>

          <label className="flex items-center justify-between">

            <span>Dark Mode</span>

            <input type="checkbox" defaultChecked />

          </label>

        </div>

        {/* API */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">

          <div className="flex items-center gap-3 mb-5">

            <Key className="text-green-400" />

            <h2 className="text-2xl font-semibold">
              API Configuration
            </h2>

          </div>

          <input
            type="password"
            placeholder="API Key"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500"
          />

        </div>

        {/* Save Button */}
        <div>

          <button className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold transition">

            <Save size={20} />

            Save Changes

          </button>

        </div>

      </div>
    </MainLayout>
  );
}