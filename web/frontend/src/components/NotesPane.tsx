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

  if (loading) return <p style={{ color: "#7d8590" }}>Loading notes…</p>;

  return (
    <div>
      <form onSubmit={handleLog} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Quick log entry…"
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #23262e",
            background: "#0f1115",
            color: "#e6e6e6",
          }}
        />
        <button
          disabled={posting}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            background: "#238636",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          {posting ? "Logging…" : "Log"}
        </button>
      </form>

      <pre
        style={{
          whiteSpace: "pre-wrap",
          fontFamily: "inherit",
          background: "#161b22",
          padding: 16,
          borderRadius: 8,
          lineHeight: 1.6,
          maxHeight: 500,
          overflowY: "auto",
        }}
      >
        {content || "No notes yet."}
      </pre>
    </div>
  );
}
