function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function TranscriptPanel({ timeline = [], onSeek }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 h-full">

      <h2 className="text-xl font-semibold text-white mb-5">
        Transcript
      </h2>

      <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">

        {timeline.length === 0 && (
          <p className="text-slate-500 text-sm italic">No transcript available.</p>
        )}

        {timeline.map((segment, index) => {
          const startTime = typeof segment.start === 'number' ? segment.start : segment.startTime || 0;
          return (
            <div
              key={index}
              onClick={() => onSeek && onSeek(startTime)}
              className="border-l-2 border-blue-500 pl-4 hover:bg-slate-900 rounded-lg p-2 transition cursor-pointer group"
            >
              <p className="text-blue-400 group-hover:text-blue-300 text-sm font-semibold">
                {formatTime(startTime)}
              </p>

              <p className="text-slate-300 group-hover:text-white mt-1 leading-7">
                {segment.text}
              </p>
            </div>
          );
        })}

      </div>

    </div>
  );
}