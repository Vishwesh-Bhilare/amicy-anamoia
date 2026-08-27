import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, ProjectSummary } from "../api/client";
import Spinner from "../components/Spinner";

const STATUS_ORDER: ProjectSummary["status"][] = ["active", "blocked", "backlog", "done"];

const PIN_COLOR: Record<ProjectSummary["status"], string> = {
  active: "var(--pin-active)",
  blocked: "var(--pin-blocked)",
  backlog: "var(--pin-backlog)",
  done: "var(--pin-done)",
};

function rotationFor(slug: string): number {
  let hash = 0;
  for (const c of slug) hash = (hash * 31 + c.charCodeAt(0)) % 360;
  return (hash % 5) - 2;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewCard, setShowNewCard] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const slugInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    api
      .listProjects()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (e.key === "n" && !typing) {
        e.preventDefault();
        setShowNewCard(true);
      }
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && typing && target === searchInputRef.current) {
        setQuery("");
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (showNewCard) slugInputRef.current?.focus();
  }, [showNewCard]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [projects, query]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlug.trim()) return;
    setCreating(true);
    try {
      await api.createProject(newSlug.trim(), newName.trim() || newSlug.trim());
      setNewSlug("");
      setNewName("");
      setShowNewCard(false);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <p style={{ color: "var(--pin-blocked)", fontFamily: "var(--font-mono)" }}>error: {error}</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-faint)",
            letterSpacing: 1,
          }}
        >
          {projects.length > 0
            ? `${filtered.length}/${projects.length} PROJECT${projects.length !== 1 ? "S" : ""}`
            : "BOARD IS EMPTY"}
          <span style={{ marginLeft: 10, opacity: 0.6 }}>"n" to pin · "/" to search</span>
        </div>

        {projects.length > 0 && (
          <input
            ref={searchInputRef}
            placeholder="search name, slug, tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              padding: "5px 10px",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              background: "var(--card-bg)",
              border: "0.5px solid var(--card-border)",
              borderRadius: 3,
              color: "var(--ink)",
              width: 200,
              marginLeft: "auto",
            }}
          />
        )}
      </div>

      {projects.length === 0 && !showNewCard && (
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            color: "var(--ink-muted)",
            marginBottom: 20,
            maxWidth: 420,
            lineHeight: 1.6,
          }}
        >
          Nothing pinned yet. Every project gets its own card with notes, a todo list, and a canvas for
          flowcharts or scribbles.
        </div>
      )}

      {projects.length > 0 && filtered.length === 0 && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)" }}>
          no matches for "{query}"
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 28 }}>
        {STATUS_ORDER.flatMap((status) =>
          filtered
            .filter((p) => p.status === status)
            .map((p) => <ProjectCard key={p.slug} project={p} />)
        )}

        {!showNewCard && (
          <button
            onClick={() => setShowNewCard(true)}
            style={{
              width: 168,
              height: 148,
              background: "transparent",
              border: "1.5px dashed var(--card-border)",
              borderRadius: 3,
              color: "var(--ink-faint)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
          >
            + pin a project
          </button>
        )}

        {showNewCard && (
          <form
            onSubmit={handleCreate}
            style={{
              width: 168,
              padding: 14,
              background: "var(--card-bg)",
              border: "0.5px solid var(--card-border)",
              borderRadius: 3,
              boxShadow: "0 3px 8px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <input
              ref={slugInputRef}
              placeholder="slug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowNewCard(false);
              }}
              style={cardInputStyle}
            />
            <input
              placeholder="name (optional)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowNewCard(false);
              }}
              style={cardInputStyle}
            />
            <div style={{ display: "flex", gap: 6 }}>
              <button
                disabled={creating}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  background: "var(--pin-active)",
                  border: "none",
                  borderRadius: 3,
                  color: "#1c1c1e",
                  fontWeight: 600,
                }}
              >
                {creating ? "…" : "pin"}
              </button>
              <button
                type="button"
                onClick={() => setShowNewCard(false)}
                style={{
                  padding: "6px 10px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  background: "transparent",
                  border: "0.5px solid var(--card-border)",
                  borderRadius: 3,
                  color: "var(--ink-muted)",
                }}
              >
                esc
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  const rotation = rotationFor(project.slug);
  return (
    <Link
      to={`/project/${project.slug}`}
      style={{
        display: "block",
        width: 168,
        padding: 14,
        background: "var(--card-bg)",
        border: "0.5px solid var(--card-border)",
        borderRadius: 3,
        boxShadow: "0 3px 8px rgba(0,0,0,0.5)",
        transform: `rotate(${rotation}deg)`,
        position: "relative",
        transition: "transform 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = `rotate(0deg) scale(1.03)`)}
      onMouseLeave={(e) => (e.currentTarget.style.transform = `rotate(${rotation}deg)`)}
    >
      <div
        style={{
          position: "absolute",
          top: -8,
          left: 60,
          width: 44,
          height: 14,
          background: "var(--tape)",
        }}
      />
      <div
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: PIN_COLOR[project.status],
          boxShadow: "0 1px 2px rgba(0,0,0,0.5)",
          position: "absolute",
          top: 10,
          right: 12,
        }}
      />
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 15,
          color: "var(--ink)",
          borderBottom: "1px solid var(--card-border)",
          paddingBottom: 6,
          paddingRight: 14,
        }}
      >
        {project.name}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-muted)", marginTop: 8 }}>
        {project.open_todos}/{project.total_todos} open
      </div>
      {project.tags.length > 0 && (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-faint)", marginTop: 4 }}>
          {project.tags.join(" · ")}
        </div>
      )}
      {project.deadline && (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-faint)", marginTop: 4 }}>
          due {new Date(project.deadline).toLocaleDateString()}
        </div>
      )}
      {project.stale && (
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--pin-blocked)", marginTop: 6 }}>
          ⚑ stale
        </div>
      )}
    </Link>
  );
}

const cardInputStyle: React.CSSProperties = {
  padding: "6px 8px",
  fontSize: 12,
  fontFamily: "var(--font-mono)",
  background: "var(--board-bg)",
  border: "0.5px solid var(--card-border)",
  borderRadius: 3,
  color: "var(--ink)",
};
