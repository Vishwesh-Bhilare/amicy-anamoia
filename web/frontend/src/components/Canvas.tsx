import { useCallback, useEffect, useRef, useState } from "react";
import { Tldraw, Editor, getSnapshot, loadSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { api } from "../api/client";

const SAVE_DEBOUNCE_MS = 1000;

export default function Canvas({ slug }: { slug: string }) {
  const editorRef = useRef<Editor | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "saved" | "error">(
    "loading"
  );

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      api
        .getCanvas(slug)
        .then((data) => {
          // only load if it looks like a real tldraw snapshot (has a "document" key);
          // fresh projects start with our placeholder {nodes: [], edges: []} shape
          if (data && data.document) {
            loadSnapshot(editor.store, data);
          }
          setStatus("ready");
        })
        .catch(() => setStatus("ready")); // no canvas yet — start blank

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
          top: 8,
          right: 8,
          zIndex: 10,
          fontSize: 12,
          padding: "4px 10px",
          borderRadius: 6,
          background: "#161b22",
          color:
            status === "error" ? "#f85149" : status === "saving" ? "#d29922" : "#7d8590",
        }}
      >
        {status === "loading" && "loading…"}
        {status === "ready" && "ready"}
        {status === "saving" && "saving…"}
        {status === "saved" && "saved"}
        {status === "error" && "save failed"}
      </div>
      <div style={{ height: "70vh", border: "1px solid #23262e", borderRadius: 8, overflow: "hidden" }}>
        <Tldraw onMount={handleMount} />
      </div>
    </div>
  );
}
