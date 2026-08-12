import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import AiHelpDrawer from "../components/AiHelpDrawer";
import { useState } from "react";

export default function MainLayout({ children }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden relative">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Navbar */}
        <Navbar
          onToggleHelp={() => setIsHelpOpen(!isHelpOpen)}
          isHelpOpen={isHelpOpen}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-900">
          {children}
        </main>

      </div>

      {/* Floating AI Help Assistant Drawer */}
      <AiHelpDrawer
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

    </div>
  );
}