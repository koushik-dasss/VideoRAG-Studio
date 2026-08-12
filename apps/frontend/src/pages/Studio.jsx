import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import MainLayout from "../layouts/MainLayout";
import VideoPlayerPanel from "../components/VideoPlayerPanel";
import TranscriptPanel from "../components/TranscriptPanel";
import ChapterPanel from "../components/ChapterPanel";
import { Loader2 } from "lucide-react";

export default function Studio() {
  const { id } = useParams();
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const fetchLecture = async () => {
      try {
        const res = await api.get(`/lectures/${id}`);
        setLecture(res.data?.data || null);
      } catch (err) {
        console.error("Failed to fetch lecture", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLecture();
  }, [id]);

  const handleSeek = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-blue-500" size={48} />
        </div>
      </MainLayout>
    );
  }

  if (!lecture) {
    return (
      <MainLayout>
        <div className="text-center mt-20 text-slate-400">
          <h2 className="text-2xl font-semibold mb-2">Video Not Found</h2>
          <p>The requested video does not exist or has been deleted.</p>
        </div>
      </MainLayout>
    );
  }

  const timeline = lecture.transcriptTimeline || lecture.timeline || [];

  return (
    <MainLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">
            AI Video Studio
          </h1>

          <p className="text-slate-400 mt-2">
            Analyze videos with AI-generated transcripts, chapters and interactive playback.
          </p>
        </div>

        {/* Studio Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* Video Player */}
          <div className="xl:col-span-6">
            <VideoPlayerPanel lecture={lecture} videoRef={videoRef} />
          </div>

          {/* Transcript */}
          <div className="xl:col-span-3">
            <TranscriptPanel timeline={timeline} onSeek={handleSeek} />
          </div>

          {/* Chapters */}
          <div className="xl:col-span-3">
            <ChapterPanel chapters={lecture.chapters || []} onSeek={handleSeek} />
          </div>

        </div>

      </div>
    </MainLayout>
  );
}