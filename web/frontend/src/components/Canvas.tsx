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

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      // match the app's dark theme — background goes near-black, strokes/text light
      editor.user.updateUserPreferences({ colorScheme: "dark" });

      api
        .getCanvas(slug)
        .then((data) => {
          if (data && data.document) {
            loadSnapshot(editor.store, data);
          }
          setStatus("ready");
        })
        .catch(() => setStatus("ready"));

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

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 10,
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
