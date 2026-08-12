import { CheckCircle2, Cpu, Database, Server } from "lucide-react";

const systems = [
  {
    name: "AI Engine",
    status: "Online",
    icon: Cpu,
    color: "text-green-400",
  },
  {
    name: "Database",
    status: "Healthy",
    icon: Database,
    color: "text-green-400",
  },
  {
    name: "Storage",
    status: "99.8%",
    icon: Server,
    color: "text-blue-400",
  },
];

export default function SystemHealth() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">

      <h2 className="text-xl font-semibold mb-6">
        System Health
      </h2>

      <div className="space-y-5">

        {systems.map((system) => {
          const Icon = system.icon;

          return (
            <div
              key={system.name}
              className="flex justify-between items-center"
            >
              <div className="flex items-center gap-4">

                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">

                  <Icon
                    size={22}
                    className={system.color}
                  />

                </div>

                <div>

                  <p className="font-medium">
                    {system.name}
                  </p>

                  <p className="text-slate-400 text-sm">
                    {system.status}
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

    </div>
  );
}