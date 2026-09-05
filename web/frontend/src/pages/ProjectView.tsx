import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, Project } from "../api/client";
import TodoList   from "../components/TodoList";
import NotesPane  from "../components/NotesPane";
import Canvas     from "../components/Canvas";
import Spinner    from "../components/Spinner";

type PanelTab = "notes" | "todo";

const STATUSES = ["active", "blocked", "backlog", "done"] as const;
type StatusVal = typeof STATUSES[number];

// Which CSS class to apply to the active status button
const statusClass: Record<StatusVal, string> = {
  active:  "active-status",
  blocked: "blocked-status",
  backlog: "backlog-status",
  done:    "done-status",
};

export default function ProjectView() {
  const { slug }   = useParams<{ slug: string }>();
  const navigate   = useNavigate();
  const [project, setProject]               = useState<Project | null>(null);
  const [tab, setTab]                       = useState<PanelTab>("notes");
  const [error, setError]                   = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete]   = useState(false);
  const [newTag, setNewTag]                 = useState("");
  const [addingTag, setAddingTag]           = useState(false);
  const tagRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slug) return;
    api.getProject(slug).then(setProject).catch((e) => setError(e.message));
  }, [slug]);

  useEffect(() => { if (addingTag) tagRef.current?.focus(); }, [addingTag]);

  const persist = async (updated: Project) => {
    try { await api.updateProject(updated); setProject(updated); }
    catch (e: any) { setError(e.message); }
  };

  const handleDelete = async () => {
    if (!slug) return;
    await api.deleteProject(slug);
    navigate("/");
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newTag.trim()) return;
    const tag = newTag.trim();
    if (!project.tags.includes(tag)) await persist({ ...project, tags: [...project.tags, tag] });
    setNewTag(""); setAddingTag(false);
  };

  if (!slug) return null;
  if (error)  return <div style={{ padding: 24, fontSize: 12, color: "var(--s-blocked)", fontFamily: "var(--font-mono)" }}>error: {error}</div>;
  if (!project) return <div style={{ padding: 24 }}><Spinner label="loading" /></div>;

  const deadlineVal = project.deadline ? project.deadline.slice(0, 10) : "";

  return (
    <div className="project-layout">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="project-sidebar">
        <Link to="/" className="sidebar-back">← board</Link>

        <div className="sidebar-name">{project.name}</div>
        {project.summary && <div className="sidebar-summary">{project.summary}</div>}

        {/* Status */}
        <div className="sidebar-section">
          <div className="sidebar-label">Status</div>
          <div className="status-grid">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => persist({ ...project, status: s })}
                className={`status-btn${project.status === s ? " " + statusClass[s] : ""}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Deadline */}
        <div className="sidebar-section">
          <div className="sidebar-label">Deadline</div>
          <input
            type="date"
            className="sidebar-date"
            value={deadlineVal}
            onChange={(e) =>
              persist({ ...project, deadline: e.target.value ? new Date(e.target.value).toISOString() : null })
            }
          />
        </div>

        {/* Tags */}
        <div className="sidebar-section">
          <div className="sidebar-label">Tags</div>
          <div className="tags-wrap">
            {project.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
                <button
                  className="tag-remove"
                  onClick={() => persist({ ...project, tags: project.tags.filter((t) => t !== tag) })}
                >×</button>
              </span>
            ))}
            {!addingTag ? (
              <button className="tag-add-btn" onClick={() => setAddingTag(true)}>+ add</button>
            ) : (
              <form onSubmit={handleAddTag}>
                <input
                  ref={tagRef}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onBlur={() => !newTag && setAddingTag(false)}
                  onKeyDown={(e) => e.key === "Escape" && setAddingTag(false)}
                  className="tag-input"
                  placeholder="tag…"
                />
              </form>
            )}
          </div>
        </div>

        <div className="sidebar-spacer" />

        {/* Delete */}
        {!confirmDelete ? (
          <button className="delete-btn" onClick={() => setConfirmDelete(true)}>Delete project</button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <button className="delete-btn confirm" onClick={handleDelete}>Confirm delete</button>
            <button className="delete-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
          </div>
        )}
      </aside>

      {/* ── Notes / Todo panel ───────────────────────────────────────── */}
      <div className="project-panel">
        <div className="panel-tabs">
          {(["notes", "todo"] as PanelTab[]).map((t) => (
            <button
              key={t}
              className={`panel-tab${tab === t ? " active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "notes" ? "Notes" : "Tasks"}
            </button>
          ))}
        </div>
        <div className="panel-body">
          {tab === "notes" && <NotesPane slug={slug} />}
          {tab === "todo"  && <TodoList  slug={slug} />}
        </div>
      </div>

      {/* ── Canvas — fills remaining space ───────────────────────────── */}
      <Canvas slug={slug} />
    </div>
  );
}
