import MainLayout from "../layouts/MainLayout";
import DashboardHero from "../components/DashboardHero";
import StatCard from "../components/StatCard";
import UploadChart from "../components/UploadChart";
import SystemOverview from "../components/SystemOverview";
import RecentVideos from "../components/RecentVideos";
import ActivityFeed from "../components/ActivityFeed";
import PageWrapper from "../components/PageWrapper";

import {
  Video,
  Clock3,
  HardDrive,
  Sparkles,
} from "lucide-react";

import { motion } from "framer-motion";

export default function Dashboard() {
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
            value="248"
            subtitle="+18 this week"
            icon={Video}
            color="bg-blue-600"
          />

          <StatCard
            title="Processing"
            value="14"
            subtitle="Currently Active"
            icon={Clock3}
            color="bg-orange-500"
          />

          <StatCard
            title="Storage"
            value="1.8TB"
            subtitle="36% Used"
            icon={HardDrive}
            color="bg-green-600"
          />

          <StatCard
            title="Accuracy"
            value="98.7%"
            subtitle="Speech Recognition"
            icon={Sparkles}
            color="bg-purple-600"
          />

        </div>

        {/* Main Analytics */}
        <div className="grid xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2">

            <UploadChart />

          </div>

          <SystemOverview />

        </div>

        {/* Bottom */}
        <div className="grid xl:grid-cols-2 gap-6">

          <RecentVideos />

          <ActivityFeed />

        </div>

      </motion.div>
    </MainLayout>
  );
}