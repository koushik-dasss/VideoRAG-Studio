const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};

const getColorForStatus = (status) => {
  switch (status) {
    case 'success': return 'bg-green-500';
    case 'error': return 'bg-red-500';
    case 'warning': return 'bg-yellow-500';
    default: return 'bg-blue-500';
  }
};

export default function ActivityFeed({ activities = [] }) {
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

        {activities.length === 0 && (
          <p className="text-slate-500 text-sm py-4 text-center">No recent activity.</p>
        )}

        {activities.map((activity) => (

          <div
            key={activity._id}
            className="flex items-start gap-4"
          >

            <div
              className={`w-3 h-3 rounded-full mt-2 ${getColorForStatus(activity.status)}`}
            />

            <div>

              <p className="text-white">
                {activity.type.replace(/_/g, ' ')}
              </p>

              <p className="text-slate-400 text-sm mt-1">
                {getRelativeTime(activity.createdAt)}
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}