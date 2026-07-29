const recentVideos = [
  {
    id: 1,
    title: "AI Conference 2026",
    duration: "15:32",
    status: "Completed",
  },
  {
    id: 2,
    title: "Machine Learning Workshop",
    duration: "22:18",
    status: "Processing",
  },
  {
    id: 3,
    title: "Deep Learning Tutorial",
    duration: "34:45",
    status: "Completed",
  },
  {
    id: 4,
    title: "Product Demo",
    duration: "08:10",
    status: "Completed",
  },
];

export default function RecentVideos() {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-xl font-semibold text-white">
          Recent Videos
        </h2>

        <button className="text-blue-400 hover:text-blue-300 text-sm">
          View All
        </button>

      </div>

      <div className="space-y-4">

        {recentVideos.map((video) => (

          <div
            key={video.id}
            className="flex justify-between items-center bg-slate-900 rounded-xl p-4 hover:bg-slate-800 transition"
          >

            <div>

              <h3 className="text-white font-medium">
                {video.title}
              </h3>

              <p className="text-slate-400 text-sm mt-1">
                {video.duration}
              </p>

            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                video.status === "Completed"
                  ? "bg-green-500/20 text-green-400"
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