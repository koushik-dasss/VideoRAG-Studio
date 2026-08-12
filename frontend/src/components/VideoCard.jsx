import { Play, Calendar, User, HardDrive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";

export default function VideoCard({ video }) {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500 transition-all duration-300 hover:-translate-y-1">

      {/* Thumbnail */}
      <div className="relative">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-52 object-cover"
        />

        <button 
          onClick={() => navigate(`/studio/${video.id}`)}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition"
        >
          <div className="bg-blue-600 p-4 rounded-full">
            <Play size={28} fill="white" className="text-white ml-1" />
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">

        <div className="flex justify-between items-start gap-3">
          <h2 className="text-lg font-semibold text-white">
            {video.title}
          </h2>

          <StatusBadge status={video.status} />
        </div>

        <div className="space-y-2 text-slate-400 text-sm">

          <div className="flex items-center gap-2">
            <Calendar size={16} />
            {video.uploadDate}
          </div>

          <div className="flex items-center gap-2">
            <HardDrive size={16} />
            {video.size}
          </div>

          <div className="flex items-center gap-2">
            <User size={16} />
            {video.uploadedBy}
          </div>

        </div>

        <div className="flex justify-between items-center pt-2">

          <span className="text-blue-400 font-medium">
            {video.duration}
          </span>

          <button 
            onClick={() => navigate(`/studio/${video.id}`)}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            View
          </button>

        </div>

      </div>

    </div>
  );
}