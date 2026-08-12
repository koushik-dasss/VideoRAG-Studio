import { Bell, Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Navbar({ onToggleHelp, isHelpOpen }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate("/search");
    }
  };

  return (
    <header className="h-20 bg-[#020617] border-b border-slate-800 flex items-center justify-between px-8">

      {/* Left */}
      <div>

        <h2 className="text-2xl font-bold text-white">
          Welcome back 👋
        </h2>

        <p className="text-slate-400 text-sm mt-1">
          {today}
        </p>

      </div>

      {/* Right */}
      <div className="flex items-center gap-5">

        {/* Search */}
        <div className="relative hidden lg:block">

          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-72 bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white outline-none focus:border-blue-500 transition"
          />

        </div>

        {/* AI Help Button */}
        <button
          onClick={onToggleHelp}
          title="AI Help"
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition ${
            isHelpOpen
              ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
              : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-blue-500"
          }`}
        >
          <Sparkles size={18} className={isHelpOpen ? "text-white" : "text-blue-400"} />
          <span className="text-sm font-semibold hidden sm:inline">AI Help</span>
        </button>

        {/* Notification */}
        <button className="relative w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center hover:border-blue-500 transition">

          <Bell size={20} className="text-white" />

          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500"></span>

        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2">

          <img
            src="https://i.pravatar.cc/100?img=12"
            alt="profile"
            className="w-10 h-10 rounded-full"
          />

          <div className="hidden md:block">

            <h3 className="text-white text-sm font-semibold">
              Admin
            </h3>

            <p className="text-slate-400 text-xs">
              Administrator
            </p>

          </div>

        </div>

      </div>

    </header>
  );
}