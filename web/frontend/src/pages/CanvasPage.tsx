import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Tldraw, Editor, getSnapshot, loadSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { api } from "../api/client";

const SAVE_MS = 1000;
type Status = "loading" | "ready" | "saving" | "saved" | "error";

export default function CanvasPage() {
  const { slug }    = useParams<{ slug: string }>();
  const editorRef   = useRef<Editor | null>(null);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.location.href = `/project/${slug}`;
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slug]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
    editor.user.updateUserPreferences({ colorScheme: "dark" });
    if (!slug) return;

    api.getCanvas(slug)
      .then((data) => { if (data?.document) loadSnapshot(editor.store, data); setStatus("ready"); })
      .catch(() => setStatus("ready"));

    const unsub = editor.store.listen(() => {
      setStatus("saving");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try { await api.saveCanvas(slug!, getSnapshot(editor.store)); setStatus("saved"); }
        catch { setStatus("error"); }
      }, SAVE_MS);
    }, { source: "user", scope: "document" });

    return unsub;
  }, [slug]);

  if (!slug) return null;

  return (
    <div className="canvas-fullscreen">
      <div className="canvas-fullscreen-hud">
        <Link to={`/project/${slug}`} className="hud-btn" style={{ textDecoration: "none" }}>
          ← {slug}
        </Link>
        {status !== "ready" && (
          <div className="hud-pill">
            <span className="save-dot" data-s={status} />
            {status === "saving" ? "saving" : status === "saved" ? "saved" : status === "error" ? "error" : "…"}
          </div>
        )}
      </div>
      <Tldraw onMount={handleMount} />
    </div>
  );
}
