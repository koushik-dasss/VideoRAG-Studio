function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ChapterPanel({ chapters = [], onSeek }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 h-full">

      <h2 className="text-xl font-semibold text-white mb-5">
        AI Chapters
      </h2>

      <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">

        {chapters.length === 0 && (
          <p className="text-slate-500 text-sm italic">No chapters available.</p>
        )}

        {chapters.map((chapter, index) => {
          const startTime = typeof chapter.startTime === 'number' ? chapter.startTime : 0;
          return (
            <div
              key={index}
              onClick={() => onSeek && onSeek(startTime)}
              className="bg-slate-900 rounded-xl p-4 hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-blue-500 group"
            >
              <p className="text-blue-400 group-hover:text-blue-300 font-semibold">
                {formatTime(startTime)}
              </p>

              <h3 className="text-white group-hover:text-blue-100 font-medium mt-2">
                {chapter.title}
              </h3>
              
              <p className="text-slate-400 group-hover:text-slate-300 text-sm mt-1">
                {chapter.summary}
              </p>
            </div>
          );
        })}

      </div>

    </div>
  );
}