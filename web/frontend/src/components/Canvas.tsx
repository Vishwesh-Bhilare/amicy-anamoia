import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Tldraw, Editor, getSnapshot, loadSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { api } from "../api/client";

const SAVE_MS = 1000;
type Status = "loading" | "ready" | "saving" | "saved" | "error";

export default function Canvas({ slug }: { slug: string }) {
  const editorRef = useRef<Editor | null>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [grid, setGrid]     = useState(false);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
    editor.user.updateUserPreferences({ colorScheme: "dark" });

    api.getCanvas(slug)
      .then((data) => {
        if (data?.document) loadSnapshot(editor.store, data);
        setStatus("ready");
      })
      .catch(() => setStatus("ready"));

    const unsub = editor.store.listen(() => {
      setStatus("saving");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          await api.saveCanvas(slug, getSnapshot(editor.store));
          setStatus("saved");
        } catch {
          setStatus("error");
        }
      }, SAVE_MS);
    }, { source: "user", scope: "document" });

    return unsub;
  }, [slug]);

  const toggleGrid = () => {
    const next = !grid;
    setGrid(next);
    editorRef.current?.updateInstanceState({ isGridMode: next });
  };

  return (
    /* .project-canvas-pane: flex:1, position:relative, overflow:hidden — defined in CSS */
    <div className="project-canvas-pane">

      {/* HUD sits above tldraw at z-index:300, top-left to avoid tldraw's own panels */}
      <div className="canvas-hud">
        <button
          className={`hud-btn${grid ? " on" : ""}`}
          onClick={toggleGrid}
          title={grid ? "Grid snap on — click to disable" : "Enable grid snap"}
        >
          {grid ? "grid on" : "grid"}
        </button>

        <Link
          to={`/project/${slug}/canvas`}
          className="hud-btn"
          style={{ textDecoration: "none" }}
          title="Fullscreen canvas"
        >
          ⤢
        </Link>

        <SavePill status={status} />
      </div>

      {/* tldraw fills the entire pane; overflow:hidden on parent clips its side panels */}
      <div className="canvas-inner">
        <Tldraw onMount={handleMount} />
      </div>
    </div>
  );
}

function SavePill({ status }: { status: Status }) {
  if (status === "ready" || status === "loading") return null;
  const label: Partial<Record<Status, string>> = {
    saving: "saving", saved: "saved", error: "error",
  };
  return (
    <div className="hud-pill">
      <span className="save-dot" data-s={status} />
      {label[status]}
    </div>
  );
}
