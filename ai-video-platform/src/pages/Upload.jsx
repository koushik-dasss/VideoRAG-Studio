import MainLayout from "../layouts/MainLayout";
import UploadZone from "../components/UploadZone";
import { ShieldCheck, FileVideo, Cpu } from "lucide-react";

export default function Upload() {
  return (
    <MainLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">
            Upload Video
          </h1>

          <p className="text-slate-400 mt-2">
            Upload your videos and let AI automatically generate transcripts,
            chapters, summaries and semantic search.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid xl:grid-cols-3 gap-6">

          {/* Upload Area */}
          <div className="xl:col-span-2">
            <UploadZone />
          </div>

          {/* Right Panel */}
          <div className="space-y-6">

            {/* Supported Formats */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">

              <div className="flex items-center gap-3 mb-5">

                <FileVideo className="text-blue-500" />

                <h2 className="text-xl font-semibold">
                  Supported Formats
                </h2>

              </div>

              <ul className="space-y-3 text-slate-300">

                <li>• MP4</li>
                <li>• AVI</li>
                <li>• MOV</li>
                <li>• MKV</li>

              </ul>

            </div>

            {/* AI Processing */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">

              <div className="flex items-center gap-3 mb-5">

                <Cpu className="text-purple-500" />

                <h2 className="text-xl font-semibold">
                  AI Pipeline
                </h2>

              </div>

              <div className="space-y-3 text-slate-300">

                <p>✓ Speech Recognition</p>

                <p>✓ Transcript Generation</p>

                <p>✓ Chapter Detection</p>

                <p>✓ Semantic Indexing</p>

              </div>

            </div>

            {/* Security */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">

              <div className="flex items-center gap-3 mb-5">

                <ShieldCheck className="text-green-500" />

                <h2 className="text-xl font-semibold">
                  Secure Upload
                </h2>

              </div>

              <p className="text-slate-400 leading-7">

                All uploaded videos are encrypted during transfer and processing.
                Your data remains secure and private.

              </p>

            </div>

          </div>

        </div>

      </div>
    </MainLayout>
  );
}