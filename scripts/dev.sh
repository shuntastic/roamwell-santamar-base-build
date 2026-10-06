#!/usr/bin/env bash
# Start the local Santamar stack: Strapi CMS + Next.js frontend.
# Usage (from repo root):
#   ./scripts/dev.sh
#   ./scripts/dev.sh --storybook
#   ./scripts/dev.sh --install   # npm install in cms + frontend first
#   npm run dev

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WITH_STORYBOOK=0
DO_INSTALL=0

for arg in "$@"; do
  case "$arg" in
    --storybook|-s) WITH_STORYBOOK=1 ;;
    --install|-i) DO_INSTALL=1 ;;
    --help|-h)
      cat <<'EOF'
Start local Santamar development apps.

  ./scripts/dev.sh              CMS (1337) + frontend (3000)
  ./scripts/dev.sh --storybook  Also Storybook (6006)
  ./scripts/dev.sh --install    Run npm install in cms/ and frontend/ first

Env files are created from *.example when missing.
Ctrl+C stops all started processes.
EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (try --help)" >&2
      exit 1
      ;;
  esac
done

node_major="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)"
if [[ "$node_major" != "20" ]]; then
  echo "Warning: Node $(node -v 2>/dev/null || echo '?') detected; Strapi expects Node 20.x." >&2
fi

ensure_env() {
  local example="$1"
  local target="$2"
  if [[ ! -f "$target" && -f "$example" ]]; then
    cp "$example" "$target"
    echo "Created $target from $(basename "$example")"
  fi
}

ensure_env "$ROOT/cms/.env.example" "$ROOT/cms/.env"
ensure_env "$ROOT/frontend/.env.example" "$ROOT/frontend/.env.local"

if [[ "$DO_INSTALL" -eq 1 ]] \
  || [[ ! -d "$ROOT/cms/node_modules" ]] \
  || [[ ! -d "$ROOT/frontend/node_modules" ]]; then
  echo "Installing dependencies…"
  (cd "$ROOT/cms" && npm install)
  (cd "$ROOT/frontend" && npm install)
fi

PIDS=()

cleanup() {
  trap - INT TERM EXIT
  echo ""
  echo "Stopping local apps…"
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done
  # Catch npm child trees that outlive the parent
  pkill -P $$ 2>/dev/null || true
  echo "Done."
}

trap cleanup INT TERM EXIT

# Stop leftover / wedged Next.js listeners on :3000 for this project.
free_frontend_port() {
  local pid=""
  if ! command -v lsof >/dev/null 2>&1; then
    return 0
  fi
  for pid in $(lsof -tiTCP:3000 -sTCP:LISTEN 2>/dev/null || true); do
    local cmd=""
    cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
    if echo "$cmd" | grep -qE 'next-server|next dev|node.*next'; then
      echo "Stopping existing Next.js on :3000 (pid $pid)…"
      kill "$pid" 2>/dev/null || true
      sleep 1
      # Wedged servers sometimes ignore SIGTERM
      if kill -0 "$pid" 2>/dev/null; then
        kill -9 "$pid" 2>/dev/null || true
      fi
    else
      echo "Warning: port 3000 is in use by pid $pid ($cmd). Next may pick another port." >&2
    fi
  done
}

free_frontend_port

echo "Starting CMS  → http://localhost:1337  (admin: /admin)"
(cd "$ROOT/cms" && npm run develop) &
PIDS+=($!)

# Give Strapi a head start so the first frontend fetches are less noisy
sleep 2

echo "Starting web  → http://localhost:3000"
(cd "$ROOT/frontend" && npm run dev) &
PIDS+=($!)
if [[ "$WITH_STORYBOOK" -eq 1 ]]; then
  echo "Starting Storybook → http://localhost:6006"
  (cd "$ROOT/frontend" && npm run storybook) &
  PIDS+=($!)
fi

echo ""
echo "Local stack running. Press Ctrl+C to stop."
echo ""

# Wait until any child exits (Bash 3.2–compatible; macOS /bin/bash has no wait -n).
while true; do
  for pid in "${PIDS[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      wait "$pid" 2>/dev/null || true
      echo "A local app exited (pid $pid). Shutting down the rest…" >&2
      cleanup
      exit 1
    fi
  done
  sleep 1
done
