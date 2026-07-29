import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { day: "Mon", uploads: 12 },
  { day: "Tue", uploads: 18 },
  { day: "Wed", uploads: 14 },
  { day: "Thu", uploads: 22 },
  { day: "Fri", uploads: 30 },
  { day: "Sat", uploads: 24 },
  { day: "Sun", uploads: 19 },
];

export default function UploadChart() {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">

      <h2 className="text-xl font-semibold mb-6 text-white">
        Weekly Upload Analytics
      </h2>

      <div style={{ width: "100%", height: 320 }}>

        <ResponsiveContainer>

          <AreaChart data={data}>

            <defs>

              <linearGradient
                id="uploadGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#2563eb"
                  stopOpacity={0.8}
                />

                <stop
                  offset="95%"
                  stopColor="#2563eb"
                  stopOpacity={0}
                />

              </linearGradient>

            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

            <XAxis
              dataKey="day"
              stroke="#94a3b8"
            />

            <YAxis stroke="#94a3b8" />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="uploads"
              stroke="#2563eb"
              fill="url(#uploadGradient)"
              strokeWidth={3}
            />

          </AreaChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}