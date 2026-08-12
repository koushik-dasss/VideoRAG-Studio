import { useState, useEffect, useRef } from "react";
import MainLayout from "../layouts/MainLayout";
import { Cpu, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { getUserJobs } from "../services/lectureService";

const POLL_INTERVAL_MS = 5000; // 5 seconds

export default function Processing() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const userId = '64a1b2c3d4e5f6a7b8c9d0e1';
        const res = await getUserJobs(userId);
        const fetchedJobs = res.data?.data || [];
        setJobs(fetchedJobs);

        // Stop polling when no active jobs exist
        const hasActiveJobs = fetchedJobs.some(
          (j) => j.status !== 'Completed' && j.status !== 'Failed'
        );
        if (!hasActiveJobs && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } catch (err) {
        console.error("Failed to load jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
    intervalRef.current = setInterval(fetchJobs, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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
          {jobs.length === 0 && !loading && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
              No processing jobs found.
            </div>
          )}

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
                    ) : job.status === "Failed" ? (
                      <AlertTriangle className="text-red-400" size={18} />
                    ) : (
                      <Cpu className="text-blue-400" size={18} />
                    )}

                    <span>{job.status}</span>
                  </div>
                </div>

                <Clock className="text-blue-400" />
              </div>

              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-3 rounded-full ${job.status === 'Failed' ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${job.progress}%`, transition: 'width 0.5s' }}
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