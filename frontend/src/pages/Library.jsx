import { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import VideoCard from "../components/VideoCard";
import videos from "../data/videos";
import { Search } from "lucide-react";

export default function Library() {
  const [search, setSearch] = useState("");

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

          <div>
            <h1 className="text-4xl font-bold text-white">
              Video Library
            </h1>

            <p className="text-slate-400 mt-2">
              Manage all uploaded videos in one place.
            </p>
          </div>

          <div className="bg-blue-600 px-5 py-3 rounded-xl font-semibold">
            {filteredVideos.length} Videos
          </div>

        </div>

        {/* Search */}
        <div className="relative max-w-md">

          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Search videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-blue-500"
          />

        </div>

        {/* Video Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {filteredVideos.length > 0 ? (
            filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
              />
            ))
          ) : (
            <div className="col-span-full bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center">

              <h2 className="text-2xl font-semibold">
                No Videos Found
              </h2>

              <p className="text-slate-400 mt-2">
                Try searching with another keyword.
              </p>

            </div>
          )}

        </div>

      </div>
    </MainLayout>
  );
}