"""CRUD endpoints for projects, notes, and todos."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from web.backend.deps import storage
from pt.core.models import Project, ProjectSummary, TodoItem

router = APIRouter(prefix="/api/projects", tags=["projects"])


class CreateProjectRequest(BaseModel):
    slug: str
    name: str
    tags: list[str] = []


class LogRequest(BaseModel):
    text: str


class TodoRequest(BaseModel):
    text: str


@router.get("", response_model=list[ProjectSummary])
def list_projects():
    return storage.summarize_all()


@router.post("", response_model=Project)
def create_project(req: CreateProjectRequest):
    try:
        return storage.create_project(req.slug, req.name, req.tags)
    except FileExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/{slug}", response_model=Project)
def get_project(slug: str):
    try:
        return storage.load_project(slug)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{slug}", response_model=Project)
def update_project(slug: str, project: Project):
    if project.slug != slug:
        raise HTTPException(status_code=400, detail="slug mismatch")
    storage.save_project(project)
    return project


@router.get("/{slug}/notes")
def get_notes(slug: str):
    path = storage.notes_md_path(slug)
    if not path.exists():
        raise HTTPException(status_code=404, detail="notes not found")
    return {"content": path.read_text()}


@router.post("/{slug}/notes/log")
def log_note(slug: str, req: LogRequest):
    try:
        storage.load_project(slug)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    entry = storage.append_log(slug, req.text)
    return {"logged": entry.text, "timestamp": entry.timestamp}


@router.get("/{slug}/todos", response_model=list[TodoItem])
def get_todos(slug: str):
    return storage.load_todos(slug)


@router.post("/{slug}/todos")
def create_todo(slug: str, req: TodoRequest):
    storage.add_todo(slug, req.text)
    return {"added": req.text}


@router.patch("/{slug}/todos/{index}")
def toggle_todo(slug: str, index: int, done: bool = True):
    try:
        storage.set_todo_done(slug, index, done)
    except IndexError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"index": index, "done": done}
