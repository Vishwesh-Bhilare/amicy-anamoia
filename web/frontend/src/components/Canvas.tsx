import { useCallback, useEffect, useRef, useState } from "react";
import { Tldraw, Editor, getSnapshot, loadSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { api } from "../api/client";

const SAVE_DEBOUNCE_MS = 1000;

const STATUS_COLOR: Record<string, string> = {
  loading: "var(--ink-faint)",
  ready: "var(--ink-faint)",
  saving: "var(--pin-backlog)",
  saved: "var(--pin-active)",
  error: "var(--pin-blocked)",
};

export default function Canvas({ slug }: { slug: string }) {
  const editorRef = useRef<Editor | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "saved" | "error">(
    "loading"
  );
  const [gridMode, setGridMode] = useState(false);

  // Sync grid toggle → tldraw instance state
  const applyGridMode = useCallback((on: boolean) => {
    editorRef.current?.updateInstanceState({ isGridMode: on });
  }, []);

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      // Match the app's dark theme
      editor.user.updateUserPreferences({ colorScheme: "dark" });

      // Restore canvas from backend
      api
        .getCanvas(slug)
        .then((data) => {
          if (data && data.document) {
            loadSnapshot(editor.store, data);
          }
          setStatus("ready");
        })
        .catch(() => setStatus("ready"));

      // Autosave on every user edit
      const unsubscribe = editor.store.listen(
        () => {
          setStatus("saving");
          if (saveTimeout.current) clearTimeout(saveTimeout.current);
          saveTimeout.current = setTimeout(async () => {
            try {
              const snapshot = getSnapshot(editor.store);
              await api.saveCanvas(slug, snapshot);
              setStatus("saved");
            } catch {
              setStatus("error");
            }
          }, SAVE_DEBOUNCE_MS);
        },
        { source: "user", scope: "document" }
      );

      return () => unsubscribe();
    },
    [slug]
  );

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const handleToggleGrid = () => {
    const next = !gridMode;
    setGridMode(next);
    applyGridMode(next);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* ── HUD ─────────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Grid / snap toggle */}
        <button
          onClick={handleToggleGrid}
          title={
            gridMode
              ? "Grid snap on — shapes and arrows snap to grid (like Excalidraw). Click to turn off."
              : "Turn on grid snap — shapes and arrows will snap to a grid as you draw."
          }
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: 0.5,
            padding: "4px 10px",
            borderRadius: 3,
            background: gridMode ? "var(--pin-active)" : "var(--card-bg)",
            border: `0.5px solid ${gridMode ? "var(--pin-active)" : "var(--card-border)"}`,
            color: gridMode ? "#1c1c1e" : "var(--ink-muted)",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s, border-color 0.15s",
          }}
        >
          {gridMode ? "⊞ snap on" : "⊟ snap off"}
        </button>

        {/* Autosave pill */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: 0.5,
            padding: "4px 10px",
            borderRadius: 3,
            background: "var(--card-bg)",
            border: "0.5px solid var(--card-border)",
            color: STATUS_COLOR[status],
          }}
        >
          {status === "loading" && "loading…"}
          {status === "ready" && "ready"}
          {status === "saving" && "saving…"}
          {status === "saved" && "saved"}
          {status === "error" && "save failed"}
        </div>
      </div>

      {/* ── Canvas ────────────────────────────────────────────────────────── */}
      <div
        style={{
          height: "70vh",
          border: "0.5px solid var(--card-border)",
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
        }}
      >
        <Tldraw onMount={handleMount} />
      </div>
    </div>
  );
}
