"""Shared path resolution / helpers for the FastAPI backend.

Reuses pt.core.storage so CLI and web never diverge on how project
files are read or written.
"""
from __future__ import annotations

import sys
from pathlib import Path

# make the `pt` package importable when running uvicorn from web/backend/
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from pt.core import storage  # noqa: E402

__all__ = ["storage"]
