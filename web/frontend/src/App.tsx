import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ProjectView from "./pages/ProjectView";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <header
          style={{
            padding: "14px 28px",
            borderBottom: "0.5px solid var(--card-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Link
            to="/"
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--ink)",
              letterSpacing: 0.5,
            }}
          >
            pt
          </Link>
          <span style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
            project board
          </span>
        </header>
        <main style={{ flex: 1, padding: "28px 32px" }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:slug" element={<ProjectView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
