import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ProjectView from "./pages/ProjectView";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <header
          style={{
            padding: "12px 24px",
            borderBottom: "1px solid #23262e",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Link to="/" style={{ fontWeight: 700, fontSize: 18 }}>
            pt
          </Link>
          <span style={{ color: "#7d8590", fontSize: 13 }}>project tracker</span>
        </header>
        <main style={{ flex: 1, padding: 24 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:slug" element={<ProjectView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
