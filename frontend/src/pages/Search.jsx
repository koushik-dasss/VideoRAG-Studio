import { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import SearchResultCard from "../components/SearchResultCard";
import { Search } from "lucide-react";
import { semanticSearch } from "../services/searchService";

export default function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && query.trim()) {
      setLoading(true);
      try {
        const res = await semanticSearch(query);
        const mappedResults = (res.data?.data?.results || []).map((chunk, i) => ({
          id: chunk._id || i,
          title: `Match in Lecture`,
          description: chunk.text,
          timestamp: chunk.startTime ? `${Math.floor(chunk.startTime / 60)}:${Math.floor(chunk.startTime % 60).toString().padStart(2, '0')}` : '0:00'
        }));
        setResults(mappedResults);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredResults = results;

  return (
    <MainLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">
            Semantic Search
          </h1>

          <p className="text-slate-400 mt-2">
            Search inside videos using AI-generated transcripts.
          </p>
        </div>

        {/* Search Box */}
        <div className="relative max-w-2xl">

          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search keywords like AI, Machine Learning..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-blue-500 transition"
          />

        </div>

        {/* Search Results */}
        <div className="space-y-5">

          {filteredResults.length > 0 ? (
            filteredResults.map((result) => (
              <SearchResultCard
                key={result.id}
                result={result}
              />
            ))
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center">

              <h2 className="text-2xl font-semibold">
                No Results Found
              </h2>

              <p className="text-slate-400 mt-3">
                Try searching with a different keyword.
              </p>

            </div>
          )}

        </div>

      </div>
    </MainLayout>
  );
}