import { Clock3, Play } from "lucide-react";

export default function SearchResultCard({ result }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-blue-500 transition-all duration-300">

      <div className="flex justify-between items-start">

        <div>

          <h2 className="text-lg font-semibold text-white">
            {result.title}
          </h2>

          <p className="text-slate-400 mt-2">
            {result.description}
          </p>

        </div>

        <button className="bg-blue-600 hover:bg-blue-700 p-3 rounded-xl transition">
          <Play size={18} />
        </button>

      </div>

      <div className="flex items-center gap-2 mt-5 text-blue-400">

        <Clock3 size={16} />

        <span>{result.timestamp}</span>

      </div>

    </div>
  );
}