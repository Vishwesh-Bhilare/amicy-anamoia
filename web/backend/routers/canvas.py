"""Read/write endpoints for a project's canvas.json (flowchart/scribble data)."""
from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from web.backend.deps import storage

router = APIRouter(prefix="/api/projects", tags=["canvas"])


class CanvasPayload(BaseModel):
    # intentionally loose — shape is owned by the frontend canvas lib (tldraw)
    nodes: list[dict] = []
    edges: list[dict] = []
    # allow arbitrary extra keys (e.g. tldraw's own document snapshot)
    class Config:
        extra = "allow"


@router.get("/{slug}/canvas")
def get_canvas(slug: str):
    path = storage.canvas_json_path(slug)
    if not path.exists():
        raise HTTPException(status_code=404, detail="canvas not found")
    return json.loads(path.read_text())


@router.put("/{slug}/canvas")
def save_canvas(slug: str, payload: dict):
    path = storage.canvas_json_path(slug)
    if not path.parent.exists():
        raise HTTPException(status_code=404, detail="project not found")
    path.write_text(json.dumps(payload, indent=2))
    return {"saved": True}
