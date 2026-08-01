const transcript = [
  {
    id: 1,
    time: "00:00",
    text: "Welcome everyone to today's AI Conference 2026.",
  },
  {
    id: 2,
    time: "00:12",
    text: "In this session we'll discuss recent advancements in Generative AI.",
  },
  {
    id: 3,
    time: "00:38",
    text: "Large Language Models are changing the software industry rapidly.",
  },
  {
    id: 4,
    time: "01:05",
    text: "Let's understand how AI can automate video processing.",
  },
  {
    id: 5,
    time: "01:42",
    text: "The first stage is speech recognition followed by transcription.",
  },
];

export default function TranscriptPanel() {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 h-full">

      <h2 className="text-xl font-semibold text-white mb-5">
        Transcript
      </h2>

      <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">

        {transcript.map((line) => (
          <div
            key={line.id}
            className="border-l-2 border-blue-500 pl-4 hover:bg-slate-900 rounded-lg p-2 transition cursor-pointer"
          >
            <p className="text-blue-400 text-sm font-semibold">
              {line.time}
            </p>

            <p className="text-slate-300 mt-1 leading-7">
              {line.text}
            </p>
          </div>
        ))}

      </div>

    </div>
  );
}