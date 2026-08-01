const activities = [
  {
    id: 1,
    action: "AI Conference 2026 uploaded",
    time: "2 min ago",
    color: "bg-green-500",
  },
  {
    id: 2,
    action: "Transcript generated",
    time: "15 min ago",
    color: "bg-blue-500",
  },
  {
    id: 3,
    action: "Chapter detection completed",
    time: "35 min ago",
    color: "bg-purple-500",
  },
  {
    id: 4,
    action: "Semantic indexing started",
    time: "1 hour ago",
    color: "bg-orange-500",
  },
];

export default function ActivityFeed() {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-xl font-semibold text-white">
          Recent Activity
        </h2>

        <span className="text-green-400 text-sm">
          Live
        </span>

      </div>

      <div className="space-y-5">

        {activities.map((activity) => (

          <div
            key={activity.id}
            className="flex items-start gap-4"
          >

            <div
              className={`w-3 h-3 rounded-full mt-2 ${activity.color}`}
            />

            <div>

              <p className="text-white">
                {activity.action}
              </p>

              <p className="text-slate-400 text-sm mt-1">
                {activity.time}
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}