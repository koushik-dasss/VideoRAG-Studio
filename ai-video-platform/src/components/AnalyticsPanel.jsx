export default function AnalyticsPanel() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">

      {/* Processing Overview */}
      <div className="xl:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            Processing Overview
          </h2>

          <span className="text-green-400 text-sm">
            Live
          </span>
        </div>

        <div className="space-y-5">

          <div>
            <div className="flex justify-between mb-2">
              <span>Speech To Text</span>
              <span>92%</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full w-[92%]"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span>Frame Analysis</span>
              <span>78%</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-3">
              <div className="bg-purple-500 h-3 rounded-full w-[78%]"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span>Chapter Detection</span>
              <span>64%</span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-3">
              <div className="bg-green-500 h-3 rounded-full w-[64%]"></div>
            </div>
          </div>

        </div>

      </div>

      {/* System Status */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-semibold mb-6">
          System Status
        </h2>

        <div className="space-y-5">

          <div className="flex justify-between">
            <span>GPU Usage</span>
            <span className="text-blue-400">81%</span>
          </div>

          <div className="flex justify-between">
            <span>CPU Load</span>
            <span className="text-green-400">42%</span>
          </div>

          <div className="flex justify-between">
            <span>RAM Usage</span>
            <span className="text-yellow-400">68%</span>
          </div>

          <div className="flex justify-between">
            <span>Server</span>
            <span className="text-green-400">
              ● Online
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}