import {
  Cpu,
  Database,
  HardDrive,
  CheckCircle2,
} from "lucide-react";

const items = [
  {
    icon: Cpu,
    title: "AI Engine",
    value: "Running",
    color: "text-green-400",
  },
  {
    icon: Database,
    title: "Database",
    value: "Healthy",
    color: "text-blue-400",
  },
  {
    icon: HardDrive,
    title: "Storage",
    value: "36% Used",
    color: "text-cyan-400",
  },
];

export default function SystemOverview() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 h-full">

      <h2 className="text-xl font-bold mb-6">
        System Overview
      </h2>

      <div className="space-y-5">

        {items.map((item) => {

          const Icon = item.icon;

          return (

            <div
              key={item.title}
              className="flex justify-between items-center rounded-2xl bg-slate-900/60 p-4"
            >

              <div className="flex items-center gap-4">

                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">

                  <Icon
                    size={22}
                    className={item.color}
                  />

                </div>

                <div>

                  <p className="font-semibold">
                    {item.title}
                  </p>

                  <p className="text-slate-400 text-sm">
                    {item.value}
                  </p>

                </div>

              </div>

              <CheckCircle2
                className="text-green-400"
                size={20}
              />

            </div>

          );

        })}

      </div>

      <div className="mt-8 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-5">

        <p className="text-sm opacity-80">
          AI Processing Accuracy
        </p>

        <h1 className="text-5xl font-black mt-2">
          98.7%
        </h1>

      </div>

    </div>
  );
}