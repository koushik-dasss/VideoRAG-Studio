import MainLayout from "../layouts/MainLayout";
import { Cpu, Clock, CheckCircle2 } from "lucide-react";

const jobs = [
  {
    id: 1,
    name: "AI Conference 2026.mp4",
    status: "Processing",
    progress: 68,
  },
  {
    id: 2,
    name: "Product Demo.mp4",
    status: "Completed",
    progress: 100,
  },
  {
    id: 3,
    name: "Lecture Recording.mp4",
    status: "Queued",
    progress: 15,
  },
];

export default function Processing() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white">
            AI Processing
          </h1>

          <p className="text-slate-400 mt-2">
            Monitor AI processing jobs in real time.
          </p>
        </div>

        <div className="space-y-5">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {job.name}
                  </h2>

                  <div className="flex items-center gap-2 text-slate-400 mt-2">
                    {job.status === "Completed" ? (
                      <CheckCircle2 className="text-green-400" size={18} />
                    ) : (
                      <Cpu className="text-blue-400" size={18} />
                    )}

                    <span>{job.status}</span>
                  </div>
                </div>

                <Clock className="text-blue-400" />
              </div>

              <div className="w-full h-3 bg-slate-800 rounded-full">
                <div
                  className="h-3 rounded-full bg-blue-500"
                  style={{ width: `${job.progress}%` }}
                ></div>
              </div>

              <p className="text-right text-sm text-slate-400 mt-2">
                {job.progress}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}