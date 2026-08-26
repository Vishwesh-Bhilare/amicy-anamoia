"""Read/write layer for project.yaml, notes.md, todo.md, canvas.json.

Single source of truth used by both the CLI and the FastAPI backend so
there's no divergence in how files get parsed or written.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timedelta
from pathlib import Path

import yaml

from pt.core.models import (
    LogEntry,
    Project,
    ProjectStatus,
    ProjectSummary,
    TodoItem,
)

STALE_DAYS = 7
TODO_LINE_RE = re.compile(r"^-\s\[( |x|X)\]\s(.*)$")


def projects_root() -> Path:
    """Resolves the centralized projects/ dir relative to repo root.

    Override by setting PT_PROJECTS_DIR env var if you later move to
    per-repo storage or symlinked external folders.
    """
    import os

    if env_path := os.environ.get("PT_PROJECTS_DIR"):
        return Path(env_path).expanduser().resolve()
    # default: project-tracker/projects relative to this file's package
    return Path(__file__).resolve().parents[2] / "projects"


def project_dir(slug: str) -> Path:
    return projects_root() / slug


def project_yaml_path(slug: str) -> Path:
    return project_dir(slug) / "project.yaml"


def notes_md_path(slug: str) -> Path:
    return project_dir(slug) / "notes.md"


def todo_md_path(slug: str) -> Path:
    return project_dir(slug) / "todo.md"


def canvas_json_path(slug: str) -> Path:
    return project_dir(slug) / "canvas.json"


# ---------- project.yaml ----------

def load_project(slug: str) -> Project:
    path = project_yaml_path(slug)
    if not path.exists():
        raise FileNotFoundError(f"No project found: {slug}")
    data = yaml.safe_load(path.read_text()) or {}
    return Project(**data)


def save_project(project: Project) -> None:
    path = project_yaml_path(project.slug)
    path.parent.mkdir(parents=True, exist_ok=True)
    project.updated_at = datetime.now()
    data = json.loads(project.model_dump_json())
    path.write_text(yaml.safe_dump(data, sort_keys=False))


def create_project(slug: str, name: str, tags: list[str] | None = None) -> Project:
    d = project_dir(slug)
    if d.exists():
        raise FileExistsError(f"Project already exists: {slug}")
    d.mkdir(parents=True)

    project = Project(slug=slug, name=name, tags=tags or [])
    save_project(project)

    notes_md_path(slug).write_text(f"# {name}\n\n")
    todo_md_path(slug).write_text("")
    canvas_json_path(slug).write_text(json.dumps({"nodes": [], "edges": []}, indent=2))

    return project


def list_project_slugs() -> list[str]:
    root = projects_root()
    if not root.exists():
        return []
    return sorted(p.name for p in root.iterdir() if p.is_dir() and (p / "project.yaml").exists())


# ---------- notes.md (log entries) ----------

def append_log(slug: str, text: str) -> LogEntry:
    entry = LogEntry(text=text)
    path = notes_md_path(slug)
    path.parent.mkdir(parents=True, exist_ok=True)
    line = f"\n---\n**{entry.timestamp.strftime('%Y-%m-%d %H:%M')}**  \n{entry.text}\n"
    with path.open("a") as f:
        f.write(line)
    return entry


# ---------- todo.md ----------

def load_todos(slug: str) -> list[TodoItem]:
    path = todo_md_path(slug)
    if not path.exists():
        return []
    items = []
    for i, line in enumerate(path.read_text().splitlines()):
        m = TODO_LINE_RE.match(line)
        if m:
            done = m.group(1).lower() == "x"
            items.append(TodoItem(index=i, text=m.group(2), done=done))
    return items


def add_todo(slug: str, text: str) -> None:
    path = todo_md_path(slug)
    path.parent.mkdir(parents=True, exist_ok=True)
    item = TodoItem(index=-1, text=text, done=False)
    with path.open("a") as f:
        f.write(item.to_markdown() + "\n")


def set_todo_done(slug: str, index: int, done: bool = True) -> None:
    path = todo_md_path(slug)
    lines = path.read_text().splitlines()
    todo_line_positions = [i for i, l in enumerate(lines) if TODO_LINE_RE.match(l)]
    if index >= len(todo_line_positions):
        raise IndexError(f"No todo at index {index}")
    line_no = todo_line_positions[index]
    m = TODO_LINE_RE.match(lines[line_no])
    box = "x" if done else " "
    lines[line_no] = f"- [{box}] {m.group(2)}"
    path.write_text("\n".join(lines) + "\n")


# ---------- cross-project summary ----------

def summarize_project(slug: str) -> ProjectSummary:
    project = load_project(slug)
    todos = load_todos(slug)
    open_count = sum(1 for t in todos if not t.done)

    notes_path = notes_md_path(slug)
    todo_path = todo_md_path(slug)
    last_updated = project.updated_at
    for p in (notes_path, todo_path):
        if p.exists():
            mtime = datetime.fromtimestamp(p.stat().st_mtime)
            last_updated = max(last_updated, mtime)

    stale = (datetime.now() - last_updated) > timedelta(days=STALE_DAYS)

    return ProjectSummary(
        slug=project.slug,
        name=project.name,
        status=project.status,
        tags=project.tags,
        deadline=project.deadline,
        open_todos=open_count,
        total_todos=len(todos),
        last_updated=last_updated,
        stale=stale,
    )


def summarize_all() -> list[ProjectSummary]:
    return [summarize_project(slug) for slug in list_project_slugs()]


def delete_todo(slug: str, index: int) -> None:
    path = todo_md_path(slug)
    lines = path.read_text().splitlines()
    todo_line_positions = [i for i, l in enumerate(lines) if TODO_LINE_RE.match(l)]
    if index >= len(todo_line_positions):
        raise IndexError(f"No todo at index {index}")
    line_no = todo_line_positions[index]
    del lines[line_no]
    path.write_text("\n".join(lines) + ("\n" if lines else ""))
