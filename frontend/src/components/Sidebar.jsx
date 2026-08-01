import {
  LayoutDashboard,
  Upload,
  FolderOpen,
  Cpu,
  Clapperboard,
  Search,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    title: "Upload",
    icon: Upload,
    path: "/upload",
  },
  {
    title: "Library",
    icon: FolderOpen,
    path: "/library",
  },
  {
    title: "Processing",
    icon: Cpu,
    path: "/processing",
  },
  {
    title: "Studio",
    icon: Clapperboard,
    path: "/studio",
  },
  {
    title: "Search",
    icon: Search,
    path: "/search",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-72 min-h-screen bg-[#020617] border-r border-slate-800 flex flex-col">

      {/* Logo */}
      <div className="h-20 flex items-center px-7 border-b border-slate-800">

        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xl font-bold shadow-lg">
          AI
        </div>

        <div className="ml-4">

          <h1 className="text-white text-lg font-bold">
            AI Video
          </h1>

          <p className="text-slate-400 text-xs">
            Processing Platform
          </p>

        </div>

      </div>

      {/* Navigation */}
      <nav className="flex-1 px-5 py-8">

        <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">
          Navigation
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.title}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl mb-3 transition-all duration-300 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`
              }
            >
              <Icon size={20} />

              <span className="font-medium">
                {item.title}
              </span>
            </NavLink>
          );
        })}

      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 px-6 py-5">

        <p className="text-slate-500 text-xs">
          AI Video Platform
        </p>

        <p className="text-slate-600 text-xs mt-1">
          Version 1.0.0
        </p>

      </div>

    </aside>
  );
}