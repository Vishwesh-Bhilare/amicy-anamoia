import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ProjectSummary } from "../api/client";

const STATUS_COLUMNS: ProjectSummary["status"][] = [
  "active",
  "blocked",
  "backlog",
  "done",
];

const STATUS_COLORS: Record<ProjectSummary["status"], string> = {
  active: "#3fb950",
  blocked: "#f85149",
  backlog: "#d29922",
  done: "#6e7681",
};

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .listProjects()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlug.trim()) return;
    setCreating(true);
    try {
      await api.createProject(newSlug.trim(), newName.trim() || newSlug.trim());
      setNewSlug("");
      setNewName("");
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <p style={{ color: "#7d8590" }}>Loading…</p>;
  if (error) return <p style={{ color: "#f85149" }}>Error: {error}</p>;

  return (
    <div>
      <form
        onSubmit={handleCreate}
        style={{ display: "flex", gap: 8, marginBottom: 24 }}
      >
        <input
          placeholder="slug (e.g. fracturelens)"
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="display name (optional)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={inputStyle}
        />
        <button disabled={creating} style={buttonStyle}>
          {creating ? "Creating…" : "+ New project"}
        </button>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {STATUS_COLUMNS.map((status) => (
          <div key={status}>
            <h3 style={{ color: STATUS_COLORS[status], fontSize: 13, textTransform: "uppercase" }}>
              {status} ({projects.filter((p) => p.status === status).length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects
                .filter((p) => p.status === status)
                .map((p) => (
                  <Link
                    key={p.slug}
                    to={`/project/${p.slug}`}
                    style={{
                      display: "block",
                      padding: 12,
                      borderRadius: 8,
                      background: "#161b22",
                      border: p.stale ? "1px solid #f85149" : "1px solid #23262e",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#7d8590", marginTop: 4 }}>
                      {p.open_todos}/{p.total_todos} open todos
                    </div>
                    {p.tags.length > 0 && (
                      <div style={{ fontSize: 11, color: "#58a6ff", marginTop: 6 }}>
                        {p.tags.join(" · ")}
                      </div>
                    )}
                    {p.stale && (
                      <div style={{ fontSize: 11, color: "#f85149", marginTop: 6 }}>
                        stale — no activity 7+ days
                      </div>
                    )}
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #23262e",
  background: "#0f1115",
  color: "#e6e6e6",
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 6,
  border: "none",
  background: "#238636",
  color: "#fff",
  fontWeight: 600,
};
