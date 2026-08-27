import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, Project } from "../api/client";
import TodoList from "../components/TodoList";
import NotesPane from "../components/NotesPane";
import Canvas from "../components/Canvas";
import Spinner from "../components/Spinner";

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
  const [newTag, setNewTag] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slug) return;
    api.getProject(slug).then(setProject).catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => {
    if (addingTag) tagInputRef.current?.focus();
  }, [addingTag]);

  const persist = async (updated: Project) => {
    try {
      await api.updateProject(updated);
      setProject(updated);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!project) return;
    setSavingStatus(true);
    await persist({ ...project, status });
    setSavingStatus(false);
  };

  const handleDeadlineChange = async (value: string) => {
    if (!project) return;
    await persist({ ...project, deadline: value ? new Date(value).toISOString() : null });
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newTag.trim()) return;
    const tag = newTag.trim();
    if (project.tags.includes(tag)) {
      setNewTag("");
      setAddingTag(false);
      return;
    }
    await persist({ ...project, tags: [...project.tags, tag] });
    setNewTag("");
    setAddingTag(false);
  };

  const handleRemoveTag = async (tag: string) => {
    if (!project) return;
    await persist({ ...project, tags: project.tags.filter((t) => t !== tag) });
  };

  const handleDelete = async () => {
    if (!slug) return;
    await api.deleteProject(slug);
    navigate("/");
  };

  if (!slug) return null;
  if (error)
    return <p style={{ color: "var(--pin-blocked)", fontFamily: "var(--font-mono)" }}>error: {error}</p>;
  if (!project) return <Spinner label="loading project" />;

  const deadlineValue = project.deadline ? project.deadline.slice(0, 10) : "";

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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--ink)" }}>
              {project.name}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--ink-muted)",
                    border: "0.5px solid var(--card-border)",
                    borderRadius: 3,
                    padding: "2px 6px",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--ink-faint)",
                      cursor: "pointer",
                      fontSize: 10,
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}

              {!addingTag ? (
                <button
                  onClick={() => setAddingTag(true)}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--ink-faint)",
                    background: "transparent",
                    border: "0.5px dashed var(--card-border)",
                    borderRadius: 3,
                    padding: "2px 6px",
                  }}
                >
                  + tag
                </button>
              ) : (
                <form onSubmit={handleAddTag} style={{ display: "inline-flex" }}>
                  <input
                    ref={tagInputRef}
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onBlur={() => !newTag && setAddingTag(false)}
                    onKeyDown={(e) => e.key === "Escape" && setAddingTag(false)}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      background: "var(--board-bg)",
                      border: "0.5px solid var(--card-border)",
                      borderRadius: 3,
                      color: "var(--ink)",
                      padding: "2px 6px",
                      width: 70,
                    }}
                  />
                </form>
              )}
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-faint)", marginRight: 6 }}>
                deadline
              </label>
              <input
                type="date"
                value={deadlineValue}
                onChange={(e) => handleDeadlineChange(e.target.value)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  background: "var(--board-bg)",
                  border: "0.5px solid var(--card-border)",
                  borderRadius: 3,
                  color: "var(--ink)",
                  padding: "3px 6px",
                }}
              />
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
