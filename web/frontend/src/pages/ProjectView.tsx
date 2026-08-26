import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, Project } from "../api/client";
import TodoList from "../components/TodoList";
import NotesPane from "../components/NotesPane";
import Canvas from "../components/Canvas";

type Tab = "notes" | "todo" | "canvas";

const STATUSES = ["active", "blocked", "backlog", "done"] as const;

const PIN_COLOR: Record<string, string> = {
  active: "var(--pin-active)",
  blocked: "var(--pin-blocked)",
  backlog: "var(--pin-backlog)",
  done: "var(--pin-done)",
};

export default function ProjectView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<Tab>("notes");
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.getProject(slug).then(setProject).catch((e) => setError(e.message));
  }, [slug]);

  const handleStatusChange = async (status: string) => {
    if (!project) return;
    setSavingStatus(true);
    const updated = { ...project, status };
    try {
      await api.updateProject(updated);
      setProject(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!slug) return;
    await api.deleteProject(slug);
    navigate("/");
  };

  if (!slug) return null;
  if (error)
    return <p style={{ color: "var(--pin-blocked)", fontFamily: "var(--font-mono)" }}>error: {error}</p>;
  if (!project)
    return <p style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>loading…</p>;

  return (
    <div>
      <Link
        to="/"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--ink-faint)",
          display: "inline-block",
          marginBottom: 16,
        }}
      >
        ← board
      </Link>

      <div
        style={{
          background: "var(--card-bg)",
          border: "0.5px solid var(--card-border)",
          borderRadius: 4,
          boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
          padding: "20px 24px",
          position: "relative",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -8,
            left: 80,
            width: 56,
            height: 16,
            background: "var(--tape)",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--ink)" }}>
              {project.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--ink-muted)",
                marginTop: 6,
              }}
            >
              {project.tags.length > 0 ? project.tags.join(", ") : "no tags"}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: PIN_COLOR[project.status] ?? "var(--pin-backlog)",
                display: "inline-block",
              }}
            />
            <select
              value={project.status}
              disabled={savingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                background: "var(--board-bg)",
                border: "0.5px solid var(--card-border)",
                borderRadius: 3,
                color: "var(--ink)",
                padding: "5px 8px",
              }}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {!confirmingDelete ? (
              <button
                onClick={() => setConfirmingDelete(true)}
                title="delete project"
                style={{
                  background: "transparent",
                  border: "0.5px solid var(--card-border)",
                  borderRadius: 3,
                  color: "var(--ink-faint)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  padding: "5px 8px",
                }}
              >
                delete
              </button>
            ) : (
              <span style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={handleDelete}
                  style={{
                    background: "var(--pin-blocked)",
                    border: "none",
                    borderRadius: 3,
                    color: "#1c1c1e",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "5px 8px",
                  }}
                >
                  confirm
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  style={{
                    background: "transparent",
                    border: "0.5px solid var(--card-border)",
                    borderRadius: 3,
                    color: "var(--ink-faint)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    padding: "5px 8px",
                  }}
                >
                  cancel
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["notes", "todo", "canvas"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 14px",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: 0.5,
              background: tab === t ? "var(--card-bg)" : "transparent",
              border: tab === t ? "0.5px solid var(--pin-active)" : "0.5px solid var(--card-border)",
              borderRadius: 3,
              color: tab === t ? "var(--ink)" : "var(--ink-faint)",
            }}
          >
            [ {t} ]
          </button>
        ))}
      </div>

      {tab === "notes" && <NotesPane slug={slug} />}
      {tab === "todo" && <TodoList slug={slug} />}
      {tab === "canvas" && <Canvas slug={slug} />}
    </div>
  );
}
