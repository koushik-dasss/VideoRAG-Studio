import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import VideoCard from "../components/VideoCard";
import { Search } from "lucide-react";
import { getAllLectures } from "../services/lectureService";

export default function Library() {
  const [search, setSearch] = useState("");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const userId = '64a1b2c3d4e5f6a7b8c9d0e1'; // mock user
        const res = await getAllLectures(userId);
        
        // Map backend fields to VideoCard expected format
        const mappedVideos = (res.data?.data || []).map(v => ({
          id: v._id,
          title: v.title,
          status: v.status,
          thumbnail: v.thumbnailUrl ? `http://localhost:3000${v.thumbnailUrl}` : 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80',
          uploadDate: new Date(v.createdAt).toLocaleDateString(),
          size: v.fileType,
          uploadedBy: 'You',
          duration: v.duration ? `${Math.round(v.duration / 60)}m` : '0m'
        }));
        
        setVideos(mappedVideos);
      } catch (err) {
        console.error("Failed to load lectures:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const filteredVideos = videos.filter((video) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase().trim();
    const titleLower = video.title.toLowerCase();
    if (titleLower.includes(query)) return true;

    // Handle common search typos (e.g., 'nural' -> 'neural')
    const queryWords = query.split(/\s+/);
    return queryWords.every((word) => {
      const fixedWord = word.replace('nural', 'neural').replace('learing', 'learning');
      return titleLower.includes(word) || titleLower.includes(fixedWord);
    });
  });

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