function formatDuration(seconds) {
  if (!seconds) return "0 sec";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) return `${m} min ${s} sec`;
  return `${s} sec`;
}

export default function VideoPlayerPanel({ lecture, videoRef }) {
  const videoUrl = lecture.fileUrl?.startsWith('http')
    ? lecture.fileUrl
    : `http://localhost:3000${lecture.fileUrl?.startsWith('/') ? '' : '/'}${lecture.fileUrl?.replace(/\\/g, '/')}`;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 h-full">

      <h2 className="text-xl font-semibold text-white mb-4">
        Video Preview
      </h2>

      <div className="overflow-hidden rounded-xl bg-black">

        <video
          ref={videoRef}
          src={videoUrl}
          controls
          preload="metadata"
          crossOrigin="anonymous"
          className="w-full h-[420px] rounded-xl object-contain bg-black"
        />

      </div>

      <div className="mt-5 space-y-2">

        <h3 className="text-lg font-semibold text-white">
          {lecture.title}
        </h3>

        <p className="text-slate-400 text-sm">
          Duration: {formatDuration(lecture.duration)}
        </p>

      </div>

    </div>
  );
}