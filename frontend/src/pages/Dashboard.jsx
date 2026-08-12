import MainLayout from "../layouts/MainLayout";
import DashboardHero from "../components/DashboardHero";
import StatCard from "../components/StatCard";
import UploadChart from "../components/UploadChart";
import SystemOverview from "../components/SystemOverview";
import RecentVideos from "../components/RecentVideos";
import ActivityFeed from "../components/ActivityFeed";
import { useState, useEffect, useCallback, useRef } from "react";
import { getDashboardStats } from "../services/dashboardService";

import {
  Video,
  Clock3,
  HardDrive,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { motion } from "framer-motion";

const POLL_INTERVAL_MS = 30000; // 30 seconds

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVideos: 0,
    processingVideos: 0,
    completedVideos: 0,
    failedVideos: 0,
    totalStorageBytes: 0,
    totalDurationSeconds: 0
  });
  const [analytics, setAnalytics] = useState({});
  const [recentVideos, setRecentVideos] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);

  const fetchStats = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const userId = '64a1b2c3d4e5f6a7b8c9d0e1';
      const res = await getDashboardStats(userId);
      if (res.data?.success && res.data?.data) {
        setStats(res.data.data.statistics);
        setAnalytics(res.data.data.analytics || {});
        setRecentVideos(res.data.data.recentVideos || []);
        setRecentActivities(res.data.data.recentActivities || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      setError(err.response?.data?.message || err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(true);

    // Set up polling
    intervalRef.current = setInterval(() => fetchStats(false), POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStats]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <Loader2 className="animate-spin text-blue-500" size={48} />
          <p className="text-slate-400 text-lg">Loading dashboard...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md text-center">
            <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-semibold text-white mb-2">Dashboard Error</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => fetchStats(true)}
              className="flex items-center justify-center gap-2 mx-auto bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold transition"
            >
              <RefreshCw size={18} />
              Retry
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: .5 }}
        className="space-y-8"
      >

        {/* Hero */}
        <DashboardHero />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

          <StatCard
            title="Videos"
            value={stats.totalVideos.toString()}
            subtitle="Total uploaded"
            icon={Video}
            color="bg-blue-600"
          />

          <StatCard
            title="Processing"
            value={stats.processingVideos.toString()}
            subtitle="Currently Active"
            icon={Clock3}
            color="bg-orange-500"
          />

          <StatCard
            title="Storage"
            value={formatBytes(stats.totalStorageBytes)}
            subtitle="Storage Used"
            icon={HardDrive}
            color="bg-green-600"
          />

          <StatCard
            title="Accuracy"
            value={(100 - (analytics.failureRatePercentage || 0)).toFixed(1) + "%"}
            subtitle="Processing Success Rate"
            icon={Sparkles}
            color="bg-purple-600"
          />

        </div>

        {/* Main Analytics */}
        <div className="grid xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2">
            <UploadChart data={analytics?.weeklyUploads || []} />
          </div>

          <SystemOverview 
            accuracy={100 - (analytics.failureRatePercentage || 0)}
            totalVideos={stats.totalVideos}
            totalStorageBytes={stats.totalStorageBytes}
          />

        </div>

        {/* Bottom */}
        <div className="grid xl:grid-cols-2 gap-6">

          <RecentVideos videos={recentVideos} />

          <ActivityFeed activities={recentActivities} />

        </div>

      </motion.div>
    </MainLayout>
  );
}