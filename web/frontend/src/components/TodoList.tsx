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

  if (loading) return <p style={{ color: "#7d8590" }}>Loading todos…</p>;

  const open = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <div>
      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Add a task…"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
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
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            background: "#238636",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Add
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {open.map((t) => (
          <TodoRow key={t.index} todo={t} onToggle={() => handleToggle(t)} />
        ))}
      </div>

      {done.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: "#7d8590", margin: "16px 0 6px" }}>
            Done ({done.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {done.map((t) => (
              <TodoRow key={t.index} todo={t} onToggle={() => handleToggle(t)} />
            ))}
          </div>
        </>
      )}

      {todos.length === 0 && (
        <p style={{ color: "#7d8590", fontSize: 13 }}>No todos yet.</p>
      )}
    </div>
  );
}

function TodoRow({ todo, onToggle }: { todo: TodoItem; onToggle: () => void }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 6,
        background: "#161b22",
        cursor: "pointer",
      }}
    >
      <input type="checkbox" checked={todo.done} onChange={onToggle} />
      <span style={{ textDecoration: todo.done ? "line-through" : "none", color: todo.done ? "#7d8590" : "#e6e6e6" }}>
        {todo.text}
      </span>
    </label>
  );
}
