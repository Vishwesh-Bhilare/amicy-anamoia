"""FastAPI app entrypoint.

Run from project-tracker/ with:
    uvicorn web.backend.main:app --reload --port 8000
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from web.backend.routers import canvas, projects

app = FastAPI(title="Project Tracker API", version="0.1.0")

# vite dev server origin — tighten this once deployed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(canvas.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
