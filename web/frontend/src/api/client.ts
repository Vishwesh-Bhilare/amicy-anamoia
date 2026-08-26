export interface ProjectSummary {
  slug: string;
  name: string;
  status: "backlog" | "active" | "blocked" | "done";
  tags: string[];
  deadline: string | null;
  open_todos: number;
  total_todos: number;
  last_updated: string;
  stale: boolean;
}

export interface Project {
  slug: string;
  name: string;
  status: string;
  tags: string[];
  deadline: string | null;
  repo_url: string | null;
  created_at: string;
  updated_at: string;
  summary: string;
}

export interface TodoItem {
  index: number;
  text: string;
  done: boolean;
}

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${detail}`);
  }
  return res.json();
}

export const api = {
  listProjects: () => request<ProjectSummary[]>("/projects"),
  getProject: (slug: string) => request<Project>(`/projects/${slug}`),
  createProject: (slug: string, name: string, tags: string[] = []) =>
    request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify({ slug, name, tags }),
    }),
  updateProject: (project: Project) =>
    request<Project>(`/projects/${project.slug}`, {
      method: "PUT",
      body: JSON.stringify(project),
    }),
  deleteProject: (slug: string) =>
    request(`/projects/${slug}`, { method: "DELETE" }),
  getNotes: (slug: string) =>
    request<{ content: string }>(`/projects/${slug}/notes`),
  logNote: (slug: string, text: string) =>
    request(`/projects/${slug}/notes/log`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  getTodos: (slug: string) => request<TodoItem[]>(`/projects/${slug}/todos`),
  addTodo: (slug: string, text: string) =>
    request(`/projects/${slug}/todos`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  toggleTodo: (slug: string, index: number, done: boolean) =>
    request(`/projects/${slug}/todos/${index}?done=${done}`, {
      method: "PATCH",
    }),
  deleteTodo: (slug: string, index: number) =>
    request(`/projects/${slug}/todos/${index}`, { method: "DELETE" }),
  getCanvas: (slug: string) => request<any>(`/projects/${slug}/canvas`),
  saveCanvas: (slug: string, payload: any) =>
    request(`/projects/${slug}/canvas`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
