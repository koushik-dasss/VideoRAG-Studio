import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function DashboardHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-blue-600/20 via-slate-900 to-cyan-600/20 p-10"
    >
      {/* Background Glow */}
      <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

        {/* Left */}
        <div>

          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-blue-300 mb-6">

            <Sparkles size={18} />

            AI Powered Video Intelligence

          </div>

          <h1 className="text-5xl font-black leading-tight">

            Welcome Back,

            <br />

            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Arpan 👋
            </span>

          </h1>

          <p className="mt-6 max-w-2xl text-slate-300 text-lg leading-8">

            Monitor uploads, generate AI transcripts, detect chapters,
            perform semantic search and manage your entire video library
            from one intelligent dashboard.

          </p>

        </div>

        {/* Right */}
        <div className="flex flex-col gap-4">

          <button className="flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 font-semibold transition hover:bg-blue-700">

            Upload New Video

            <ArrowRight size={20} />

          </button>

          <button className="rounded-2xl border border-slate-700 bg-slate-900/70 px-8 py-4 font-medium transition hover:border-blue-500">

            View Library

          </button>

        </div>

      </div>
    </motion.div>
  );
}