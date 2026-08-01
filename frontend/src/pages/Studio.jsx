import MainLayout from "../layouts/MainLayout";
import VideoPlayerPanel from "../components/VideoPlayerPanel";
import TranscriptPanel from "../components/TranscriptPanel";
import ChapterPanel from "../components/ChapterPanel";

export default function Studio() {
  return (
    <MainLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">
            AI Video Studio
          </h1>

          <p className="text-slate-400 mt-2">
            Analyze videos with AI-generated transcripts, chapters and playback.
          </p>
        </div>

        {/* Studio Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* Video Player */}
          <div className="xl:col-span-6">
            <VideoPlayerPanel />
          </div>

          {/* Transcript */}
          <div className="xl:col-span-3">
            <TranscriptPanel />
          </div>

          {/* Chapters */}
          <div className="xl:col-span-3">
            <ChapterPanel />
          </div>

        </div>

      </div>
    </MainLayout>
  );
}