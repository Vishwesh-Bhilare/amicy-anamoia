import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, Project } from "../api/client";
import TodoList from "../components/TodoList";
import NotesPane from "../components/NotesPane";
import Canvas from "../components/Canvas";

type Tab = "notes" | "todo" | "canvas";

export default function ProjectView() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<Tab>("notes");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    api.getProject(slug).then(setProject).catch((e) => setError(e.message));
  }, [slug]);

  if (!slug) return null;
  if (error) return <p style={{ color: "#f85149" }}>Error: {error}</p>;
  if (!project) return <p style={{ color: "#7d8590" }}>Loading…</p>;

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>{project.name}</h2>
      <div style={{ color: "#7d8590", fontSize: 13, marginBottom: 20 }}>
        {project.status} {project.tags.length > 0 && `· ${project.tags.join(", ")}`}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #23262e" }}>
        {(["notes", "todo", "canvas"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px",
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid #58a6ff" : "2px solid transparent",
              color: tab === t ? "#e6e6e6" : "#7d8590",
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "notes" && <NotesPane slug={slug} />}
      {tab === "todo" && <TodoList slug={slug} />}
      {tab === "canvas" && <Canvas slug={slug} />}
    </div>
  );
}
