"""pt — local-first project tracker CLI.

Commands:
    pt new <slug> --name "..." [--tags a,b,c]
    pt log <slug> "note text"
    pt todo <slug> add "task text"
    pt todo <slug> done <index>
    pt todo <slug> list
    pt status
    pt open <slug>          # prints web URL (assumes backend running)
"""
from __future__ import annotations

import webbrowser
from datetime import datetime
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table

from pt.core import storage
from pt.core.models import ProjectStatus

app = typer.Typer(help="Local-first CLI project tracker.")
todo_app = typer.Typer(help="Manage todos for a project.")
app.add_typer(todo_app, name="todo")

console = Console()

WEB_URL = "http://localhost:5173"  # vite dev server; adjust once deployed


@app.command()
def new(
    slug: str = typer.Argument(..., help="Short unique id, e.g. 'fracturelens'"),
    name: str = typer.Option(None, "--name", "-n", help="Display name"),
    tags: str = typer.Option("", "--tags", "-t", help="Comma-separated tags"),
):
    """Scaffold a new project folder."""
    display_name = name or slug
    tag_list = [t.strip() for t in tags.split(",") if t.strip()]
    try:
        project = storage.create_project(slug, display_name, tag_list)
    except FileExistsError as e:
        console.print(f"[red]{e}[/red]")
        raise typer.Exit(1)
    console.print(f"[green]Created[/green] project '{project.slug}' at {storage.project_dir(slug)}")


@app.command()
def log(
    slug: str = typer.Argument(...),
    text: str = typer.Argument(..., help="Note text to append"),
):
    """Append a timestamped log entry to a project's notes.md."""
    try:
        storage.load_project(slug)
    except FileNotFoundError as e:
        console.print(f"[red]{e}[/red]")
        raise typer.Exit(1)
    entry = storage.append_log(slug, text)
    console.print(f"[green]Logged[/green] to {slug}: {entry.text}")


@todo_app.command("add")
def todo_add(slug: str = typer.Argument(...), text: str = typer.Argument(...)):
    storage.add_todo(slug, text)
    console.print(f"[green]Added todo[/green] to {slug}: {text}")


@todo_app.command("done")
def todo_done(slug: str = typer.Argument(...), index: int = typer.Argument(...)):
    try:
        storage.set_todo_done(slug, index, done=True)
    except IndexError as e:
        console.print(f"[red]{e}[/red]")
        raise typer.Exit(1)
    console.print(f"[green]Marked done[/green]: todo #{index} in {slug}")


@todo_app.command("undo")
def todo_undo(slug: str = typer.Argument(...), index: int = typer.Argument(...)):
    try:
        storage.set_todo_done(slug, index, done=False)
    except IndexError as e:
        console.print(f"[red]{e}[/red]")
        raise typer.Exit(1)
    console.print(f"[yellow]Marked open[/yellow]: todo #{index} in {slug}")


@todo_app.command("list")
def todo_list(slug: str = typer.Argument(...)):
    todos = storage.load_todos(slug)
    if not todos:
        console.print(f"[dim]No todos for {slug}[/dim]")
        return
    table = Table(title=f"Todos — {slug}")
    table.add_column("#", justify="right")
    table.add_column("Done")
    table.add_column("Task")
    for t in todos:
        table.add_row(str(t.index), "✅" if t.done else "⬜", t.text)
    console.print(table)


@app.command()
def status(
    tag: Optional[str] = typer.Option(None, "--tag", help="Filter by tag"),
    stale_only: bool = typer.Option(False, "--stale", help="Only show stale projects"),
):
    """Cross-project dashboard: status, open todos, staleness."""
    summaries = storage.summarize_all()
    if tag:
        summaries = [s for s in summaries if tag in s.tags]
    if stale_only:
        summaries = [s for s in summaries if s.stale]

    if not summaries:
        console.print("[dim]No projects found.[/dim]")
        return

    status_order = {
        ProjectStatus.ACTIVE: 0,
        ProjectStatus.BLOCKED: 1,
        ProjectStatus.BACKLOG: 2,
        ProjectStatus.DONE: 3,
    }
    summaries.sort(key=lambda s: (status_order.get(s.status, 9), -s.open_todos))

    table = Table(title="Project Status")
    table.add_column("Project")
    table.add_column("Status")
    table.add_column("Todos")
    table.add_column("Deadline")
    table.add_column("Last updated")
    table.add_column("")

    status_colors = {
        ProjectStatus.ACTIVE: "green",
        ProjectStatus.BLOCKED: "red",
        ProjectStatus.BACKLOG: "yellow",
        ProjectStatus.DONE: "dim",
    }

    for s in summaries:
        color = status_colors.get(s.status, "white")
        deadline_str = s.deadline.strftime("%Y-%m-%d") if s.deadline else "-"
        updated_str = s.last_updated.strftime("%Y-%m-%d %H:%M")
        flag = "[red]STALE[/red]" if s.stale else ""
        table.add_row(
            f"{s.name} [dim]({s.slug})[/dim]",
            f"[{color}]{s.status.value}[/{color}]",
            f"{s.open_todos}/{s.total_todos} open",
            deadline_str,
            updated_str,
            flag,
        )

    console.print(table)


@app.command()
def open(slug: str = typer.Argument(...)):
    """Open the project in the web UI (backend must be running)."""
    try:
        storage.load_project(slug)
    except FileNotFoundError as e:
        console.print(f"[red]{e}[/red]")
        raise typer.Exit(1)
    url = f"{WEB_URL}/project/{slug}"
    webbrowser.open(url)
    console.print(f"Opening {url}")


if __name__ == "__main__":
    app()
