import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ProjectView from "./pages/ProjectView";
import CanvasPage from "./pages/CanvasPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Completely bare fullscreen canvas — no shell at all */}
        <Route path="/project/:slug/canvas" element={<CanvasPage />} />

        <Route
          path="*"
          element={
            <div className="app-shell">
              <header className="app-header">
                <Link to="/" className="app-header-logo">pt</Link>
                <span className="app-header-sub">project board</span>
              </header>
              <Routes>
                <Route path="/"               element={<div className="dashboard-main"><Dashboard /></div>} />
                <Route path="/project/:slug"  element={<ProjectView />} />
              </Routes>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
