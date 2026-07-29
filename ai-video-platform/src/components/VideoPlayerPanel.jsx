import ReactPlayer from "react-player";

export default function VideoPlayerPanel() {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 h-full">

      <h2 className="text-xl font-semibold text-white mb-4">
        Video Preview
      </h2>

      <div className="overflow-hidden rounded-xl">

        <ReactPlayer
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          controls
          width="100%"
          height="420px"
        />

      </div>

      <div className="mt-5 space-y-2">

        <h3 className="text-lg font-semibold">
          AI Conference 2026
        </h3>

        <p className="text-slate-400">
          Duration: 15 min 32 sec
        </p>

      </div>

    </div>
  );
}