"""Core data models shared by CLI and web backend."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ProjectStatus(str, Enum):
    BACKLOG = "backlog"
    ACTIVE = "active"
    BLOCKED = "blocked"
    DONE = "done"


class Project(BaseModel):
    """Maps 1:1 to project.yaml"""
    slug: str
    name: str
    status: ProjectStatus = ProjectStatus.ACTIVE
    tags: list[str] = Field(default_factory=list)
    deadline: Optional[datetime] = None
    repo_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    summary: str = ""


class LogEntry(BaseModel):
    """A single timestamped entry appended to notes.md"""
    timestamp: datetime = Field(default_factory=datetime.now)
    text: str


class TodoItem(BaseModel):
    """Parsed from a single '- [ ] ...' / '- [x] ...' line in todo.md"""
    index: int
    text: str
    done: bool = False

    def to_markdown(self) -> str:
        box = "x" if self.done else " "
        return f"- [{box}] {self.text}"


class ProjectSummary(BaseModel):
    """Lightweight cross-project view used by `pt status` and the dashboard."""
    slug: str
    name: str
    status: ProjectStatus
    tags: list[str]
    deadline: Optional[datetime]
    open_todos: int
    total_todos: int
    last_updated: datetime
    stale: bool = False  # true if no log/todo activity in N days
