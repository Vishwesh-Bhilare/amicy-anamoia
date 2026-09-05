import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import Spinner from "./Spinner";
import { renderInlineMarkdown } from "./markdown";

export default function NotesPane({ slug }: { slug: string }) {
  const [content, setContent]   = useState("");
  const [draft, setDraft]       = useState("");
  const [loading, setLoading]   = useState(true);
  const [posting, setPosting]   = useState(false);
  const [focused, setFocused]   = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const load = () => {
    api.getNotes(slug).then((r) => setContent(r.content)).finally(() => setLoading(false));
  };
  useEffect(load, [slug]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "n" && t.tagName !== "INPUT" && t.tagName !== "TEXTAREA") {
        e.preventDefault(); ref.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const submit = async () => {
    const text = draft.trim();
    if (!text || posting) return;
    setPosting(true);
    try { await api.logNote(slug, text); setDraft(""); setFocused(false); load(); }
    finally { setPosting(false); }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); }
    if (e.key === "Escape") { setDraft(""); setFocused(false); ref.current?.blur(); }
  };

  if (loading) return <Spinner label="loading" />;

  const entries = content.split(/\n---\n/).map((e) => e.trim()).filter(Boolean);

  return (
    <div>
      <div className="notes-editor">
        <textarea
          ref={ref}
          className="notes-textarea"
          placeholder={"New entry… (⌘↵ to save)\n**bold**, `code`, [links](url)"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          rows={focused ? 4 : 2}
        />
        {(focused || draft.trim()) && (
          <div className="notes-actions">
            <button className="btn-ghost" onClick={() => { setDraft(""); setFocused(false); }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={submit} disabled={posting || !draft.trim()}>
              {posting ? "…" : "Save  ⌘↵"}
            </button>
          </div>
        )}
      </div>

      {entries.length === 0 && (
        <p style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.6 }}>
          Nothing logged yet. Press <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>n</kbd> to start.
        </p>
      )}

      {entries.slice().reverse().map((entry, i) => {
        const [first, ...rest] = entry.split("\n");
        const tsMatch = first.match(/\*\*(.+?)\*\*/);
        const ts   = tsMatch ? tsMatch[1] : first;
        const body = tsMatch ? rest.join("\n").trim() : entry;
        return (
          <div key={i} className="note-entry">
            <div className="note-ts">{ts}</div>
            {body && <div className="note-body">{renderInlineMarkdown(body)}</div>}
          </div>
        );
      })}
    </div>
  );
}
