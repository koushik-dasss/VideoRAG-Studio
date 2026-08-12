import { useNavigate } from "react-router-dom";

const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function RecentVideos({ videos = [] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-xl font-semibold text-white">
          Recent Videos
        </h2>

        <button
          onClick={() => navigate('/library')}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          View All
        </button>

      </div>

      <div className="space-y-4">

        {videos.length === 0 && (
          <p className="text-slate-500 text-sm py-4 text-center">No recent videos.</p>
        )}

        {videos.map((video) => (

          <div
            key={video._id}
            onClick={() => navigate(`/studio/${video._id}`)}
            className="flex justify-between items-center bg-slate-900 rounded-xl p-4 hover:bg-slate-800 transition cursor-pointer"
          >

            <div className="flex items-center space-x-4">
              {video.thumbnailUrl && (
                <img src={video.thumbnailUrl} alt="Thumbnail" className="w-16 h-10 object-cover rounded" />
              )}
              <div>
                <h3 className="text-white font-medium">
                  {video.title}
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  {formatDuration(video.duration)}
                </p>
              </div>

            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                video.status === "done"
                  ? "bg-green-500/20 text-green-400"
                  : video.status === "failed" 
                  ? "bg-red-500/20 text-red-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {video.status}
            </span>

          </div>

        ))}

      </div>

    </div>
  );
}