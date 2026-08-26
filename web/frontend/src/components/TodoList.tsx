import { useEffect, useState } from "react";
import { api, TodoItem } from "../api/client";

export default function TodoList({ slug }: { slug: string }) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.getTodos(slug).then(setTodos).finally(() => setLoading(false));
  };

  useEffect(load, [slug]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    await api.addTodo(slug, newText.trim());
    setNewText("");
    load();
  };

  const handleToggle = async (todo: TodoItem) => {
    await api.toggleTodo(slug, todo.index, !todo.done);
    load();
  };

  const handleDelete = async (todo: TodoItem) => {
    await api.deleteTodo(slug, todo.index);
    load();
  };

  if (loading)
    return <p style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)", fontSize: 12 }}>loading…</p>;

  const open = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <div>
      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <input
          placeholder="add a task…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
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
          add
        </button>
      </form>

      {todos.length === 0 && (
        <p style={{ color: "var(--ink-faint)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
          no todos yet
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {open.map((t) => (
          <TodoRow key={t.index} todo={t} onToggle={() => handleToggle(t)} onDelete={() => handleDelete(t)} />
        ))}
      </div>

      {done.length > 0 && (
        <>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: 1,
              color: "var(--ink-faint)",
              margin: "18px 0 8px",
            }}
          >
            DONE ({done.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {done.map((t) => (
              <TodoRow key={t.index} todo={t} onToggle={() => handleToggle(t)} onDelete={() => handleDelete(t)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TodoRow({
  todo,
  onToggle,
  onDelete,
}: {
  todo: TodoItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        borderRadius: 3,
        background: "var(--card-bg)",
        border: "0.5px solid var(--card-border)",
      }}
    >
      <label style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={todo.done}
          onChange={onToggle}
          style={{ accentColor: "var(--pin-active)" }}
        />
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            textDecoration: todo.done ? "line-through" : "none",
            color: todo.done ? "var(--ink-faint)" : "var(--ink)",
          }}
        >
          {todo.text}
        </span>
      </label>
      <button
        onClick={onDelete}
        title="delete"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--ink-faint)",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          padding: "2px 6px",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--pin-blocked)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-faint)")}
      >
        ×
      </button>
    </div>
  );
}
