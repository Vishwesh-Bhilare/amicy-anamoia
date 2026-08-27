import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import Spinner from "./Spinner";
import { renderInlineMarkdown } from "./markdown";

export default function NotesPane({ slug }: { slug: string }) {
  const [content, setContent] = useState("");
  const [newEntry, setNewEntry] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    api.getNotes(slug).then((r) => setContent(r.content)).finally(() => setLoading(false));
  };

  useEffect(load, [slug]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (e.key === "n" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.trim()) return;
    setPosting(true);
    try {
      await api.logNote(slug, newEntry.trim());
      setNewEntry("");
      load();
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <Spinner label="loading notes" />;

  const entries = content
    .split(/\n---\n/)
    .map((e) => e.trim())
    .filter(Boolean);

  return (
    <div>
      <form onSubmit={handleLog} style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <input
          ref={inputRef}
          placeholder='quick log entry… (**bold**, `code`, [text](url) supported)'
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            background: "var(--card-bg)",
            border: "0.5px solid var(--card-border)",
            borderRadius: 3,
            color: "var(--ink)",
          }}
        />
        <button
          disabled={posting}
          style={{
            padding: "8px 16px",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            borderRadius: 3,
            border: "none",
            background: "var(--pin-active)",
            color: "#1c1c1e",
            fontWeight: 600,
          }}
        >
          {posting ? "…" : "log"}
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 520, overflowY: "auto" }}>
        {entries.length === 0 && (
          <p style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
            no notes yet — first entry starts the log
          </p>
        )}
        {entries
          .slice()
          .reverse()
          .map((entry, i) => {
            const [firstLine, ...rest] = entry.split("\n");
            const timestampMatch = firstLine.match(/\*\*(.+?)\*\*/);
            const timestamp = timestampMatch ? timestampMatch[1] : firstLine;
            const body = timestampMatch ? rest.join("\n").trim() : entry;
            return (
              <div
                key={i}
                style={{
                  background: "var(--card-bg)",
                  border: "0.5px solid var(--card-border)",
                  borderRadius: 3,
                  padding: "10px 14px",
                }}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-faint)" }}>
                  {timestamp}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    color: "var(--ink)",
                    marginTop: 4,
                    lineHeight: 1.6,
                  }}
                >
                  {renderInlineMarkdown(body)}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
