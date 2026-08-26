import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function NotesPane({ slug }: { slug: string }) {
  const [content, setContent] = useState("");
  const [newEntry, setNewEntry] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const load = () => {
    api.getNotes(slug).then((r) => setContent(r.content)).finally(() => setLoading(false));
  };

  useEffect(load, [slug]);

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

  if (loading) return <p style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)", fontSize: 12 }}>loading…</p>;

  // split raw markdown log into entries on the "---" separator written by storage.append_log
  const entries = content
    .split(/\n---\n/)
    .map((e) => e.trim())
    .filter(Boolean);

  return (
    <div>
      <form onSubmit={handleLog} style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <input
          placeholder="quick log entry…"
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
          <p style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)", fontSize: 12 }}>no notes yet</p>
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
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {body}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
