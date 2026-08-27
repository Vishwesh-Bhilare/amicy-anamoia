#!/usr/bin/env bash
# Runs the FastAPI backend and Vite frontend together.
# Ctrl+C stops both.
set -e
cd "$(dirname "$0")"

cleanup() {
  echo ""
  echo "stopping…"
  kill $(jobs -p) 2>/dev/null
  wait 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "starting backend on :8000"
uvicorn web.backend.main:app --reload --port 8000 &

echo "starting frontend on :5173"
(cd web/frontend && npm run dev) &

wait
