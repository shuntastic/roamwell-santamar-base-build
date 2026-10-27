#!/usr/bin/env bash
# Build a static LAMP frontend from the local Strapi database and uploads.
#
# The public site is Apache DocumentRoot only (frontend/out/). Page HTML is
# baked from the laptop CMS. Media is copied from cms/public/uploads into
# out/uploads and referenced as same-origin /uploads/… — the LAMP host does
# not need Node or a live Strapi.
#
# Usage (from repo root):
#   npm run build:web:static:local
#   ./deploy/lamp-static/build-local.sh
#
# Optional:
#   LOCAL_CMS_URL=http://127.0.0.1:1337   CMS to read (default)
#   SITE_KEY=santamar                     pin a Site by key
#   LAMP_SITE_HOSTNAME=www.example.com    pin a Site by hostname
#   KEEP_LOCAL_CMS=1                      leave a CMS this script started running
#
# If Strapi is already listening, that process is used (develop or start).
# Otherwise this script runs `npm run build` in cms/ and `npm start`, then
# stops that process when the frontend export finishes.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

CMS_URL="${LOCAL_CMS_URL:-http://127.0.0.1:1337}"
CMS_URL="${CMS_URL%/}"
STARTED_CMS=0
CMS_PID=""
CMS_LOG="${ROOT}/cms/.tmp/lamp-static-start.log"

log() {
  printf '\n==> %s\n' "$*"
}

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  if [[ "$STARTED_CMS" -eq 1 && -n "${CMS_PID}" && "${KEEP_LOCAL_CMS:-0}" != "1" ]]; then
    log "Stopping local CMS (pid ${CMS_PID})"
    kill "$CMS_PID" 2>/dev/null || true
    wait "$CMS_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

cms_up() {
  curl -sf -o /dev/null --max-time 3 "${CMS_URL}/_health"
}

if [[ ! -f "${ROOT}/cms/.tmp/data.db" ]]; then
  die "Local CMS database missing (${ROOT}/cms/.tmp/data.db). Run npm run dev once so Strapi can create it."
fi

if cms_up; then
  log "Using CMS already running at ${CMS_URL}"
else
  [[ -d "${ROOT}/cms/node_modules" ]] || die "cms/node_modules is missing. Run npm install in cms/ first."
  log "Local CMS is not running. Building cms/ then starting Strapi."
  npm run build --prefix cms
  mkdir -p "${ROOT}/cms/.tmp"
  npm run start --prefix cms >"${CMS_LOG}" 2>&1 &
  CMS_PID=$!
  STARTED_CMS=1
  log "Waiting for ${CMS_URL} (log: ${CMS_LOG})"
  ready=0
  for _ in $(seq 1 60); do
    if cms_up; then
      ready=1
      break
    fi
    if ! kill -0 "$CMS_PID" 2>/dev/null; then
      echo "CMS exited early. Last log lines:" >&2
      tail -n 40 "${CMS_LOG}" >&2 || true
      die "Local CMS failed to start"
    fi
    sleep 2
  done
  [[ "$ready" -eq 1 ]] || die "Local CMS did not become ready at ${CMS_URL}"
fi

pages_code="$(curl -s -o /dev/null -w '%{http_code}' --globoff --max-time 15 \
  "${CMS_URL}/api/pages?locale=en&status=published&pagination[pageSize]=1" || true)"
[[ "$pages_code" == "200" ]] || die "Local CMS pages API returned HTTP ${pages_code:-000}. Publish content and check Public permissions."

# A leftover SITE_HOSTNAME from deploy/digitalocean/frontend.env would ask the
# local database for the droplet host and bake fallback pages.
if [[ -n "${SITE_HOSTNAME:-}" && -z "${LAMP_SITE_HOSTNAME:-}" ]]; then
  log "Ignoring inherited SITE_HOSTNAME=${SITE_HOSTNAME}. Local builds resolve localhost to the primary site. Set LAMP_SITE_HOSTNAME or SITE_KEY to pin another site."
fi
unset SITE_HOSTNAME
if [[ -n "${LAMP_SITE_HOSTNAME:-}" ]]; then
  export SITE_HOSTNAME="$LAMP_SITE_HOSTNAME"
fi

export LAMP_CMS=local
export LOCAL_CMS_URL="$CMS_URL"
export NEXT_PUBLIC_STRAPI_URL="$CMS_URL"
export NEXT_PUBLIC_ENABLE_THEME_SWITCHER="${NEXT_PUBLIC_ENABLE_THEME_SWITCHER:-false}"

log "Exporting static frontend from local CMS content"
node "${ROOT}/frontend/scripts/build-static.cjs"

log "Upload the contents of frontend/out/ to the Apache DocumentRoot."
