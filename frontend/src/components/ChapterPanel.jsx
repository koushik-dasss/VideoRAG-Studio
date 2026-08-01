const chapters = [
  {
    id: 1,
    title: "Introduction",
    time: "00:00",
  },
  {
    id: 2,
    title: "Generative AI Overview",
    time: "02:15",
  },
  {
    id: 3,
    title: "Speech Recognition",
    time: "05:48",
  },
  {
    id: 4,
    title: "Video Intelligence",
    time: "09:10",
  },
  {
    id: 5,
    title: "Future Scope",
    time: "13:02",
  },
];

export default function ChapterPanel() {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 h-full">

      <h2 className="text-xl font-semibold text-white mb-5">
        AI Chapters
      </h2>

      <div className="space-y-4">

        {chapters.map((chapter) => (

          <div
            key={chapter.id}
            className="bg-slate-900 rounded-xl p-4 hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-blue-500"
          >
            <p className="text-blue-400 font-semibold">
              {chapter.time}
            </p>

            <h3 className="text-white mt-2">
              {chapter.title}
            </h3>
          </div>

        ))}

      </div>

    </div>
  );
}