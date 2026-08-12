import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Library from "./pages/Library";
import Processing from "./pages/Processing";
import Studio from "./pages/Studio";
import Search from "./pages/Search";
import Settings from "./pages/Settings";

function App() {
  return (
    <>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/library" element={<Library />} />
          <Route path="/processing" element={<Processing />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/studio/:id" element={<Studio />} />
          <Route path="/search" element={<Search />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;