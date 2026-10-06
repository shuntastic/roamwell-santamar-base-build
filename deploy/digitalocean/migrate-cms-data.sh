#!/usr/bin/env bash
#
# Sync Strapi SQLite DB + media uploads between this laptop and the DigitalOcean droplet.
#
# Why: deploy.sh intentionally excludes cms/.tmp/ (the database) and preserves
# remote uploads. Content authored locally therefore does not appear on the
# droplet until you run this script.
#
# Usage (from repo root):
#   ./deploy/digitalocean/migrate-cms-data.sh              # push local → DO (default)
#   ./deploy/digitalocean/migrate-cms-data.sh push
#   ./deploy/digitalocean/migrate-cms-data.sh pull          # pull DO → local
#   ./deploy/digitalocean/migrate-cms-data.sh push --db-only
#   ./deploy/digitalocean/migrate-cms-data.sh push --uploads-only
#   ./deploy/digitalocean/migrate-cms-data.sh push --dry-run
#
# Prerequisites: deploy/digitalocean/do.env, deploy/digitalocean/.deploy-state
# (from a prior deploy), SSH key at SSH_KEY_PATH, local cms/.tmp/data.db
# and/or cms/public/uploads.
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DO_DIR="${ROOT_DIR}/deploy/digitalocean"
ENV_FILE="${DO_DIR}/do.env"
STATE_FILE="${DO_DIR}/.deploy-state"
KNOWN_HOSTS_FILE="${DO_DIR}/.known_hosts"

log() { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\n\033[1;33mWARN:\033[0m %s\n' "$*" >&2; }
die() { printf '\n\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

DIRECTION="push"
SYNC_DB=1
SYNC_UPLOADS=1
DRY_RUN=0

usage() {
  sed -n '2,20p' "$0" | sed 's/^# \?//'
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    push|pull) DIRECTION="$1" ;;
    --db-only) SYNC_UPLOADS=0 ;;
    --uploads-only) SYNC_DB=0 ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help) usage 0 ;;
    *) die "Unknown argument: $1 (try --help)" ;;
  esac
  shift
done

[[ "$SYNC_DB" -eq 1 || "$SYNC_UPLOADS" -eq 1 ]] || die "Nothing to sync (both --db-only and --uploads-only?)"

[[ -f "$ENV_FILE" ]] || die "Missing ${ENV_FILE}"
[[ -f "$STATE_FILE" ]] || die "Missing ${STATE_FILE}. Run ./deploy/digitalocean/deploy.sh once first."

# shellcheck disable=SC1090
source "$ENV_FILE"
# shellcheck disable=SC1090
source "$STATE_FILE"

: "${SSH_KEY_PATH:?}"
: "${REMOTE_USER:?}"
: "${REMOTE_APP_DIR:?}"
: "${PUBLIC_IP:?}"

[[ -f "$SSH_KEY_PATH" ]] || die "SSH key not found at ${SSH_KEY_PATH}"

LOCAL_DB="${ROOT_DIR}/cms/.tmp/data.db"
LOCAL_UPLOADS="${ROOT_DIR}/cms/public/uploads"
REMOTE_CMS="${REMOTE_APP_DIR}/cms"
REMOTE_DB="${REMOTE_CMS}/.tmp/data.db"
REMOTE_UPLOADS="${REMOTE_CMS}/public/uploads"
PRIMARY_HOSTNAME="${PRIMARY_HOSTNAME:-}"

SSH_OPTS=(
  -i "$SSH_KEY_PATH"
  -o StrictHostKeyChecking=accept-new
  -o UserKnownHostsFile="$KNOWN_HOSTS_FILE"
  -o GlobalKnownHostsFile=/dev/null
  -o ConnectTimeout=10
  -o BatchMode=yes
)
RSYNC_SSH="ssh -i ${SSH_KEY_PATH} -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=${KNOWN_HOSTS_FILE} -o GlobalKnownHostsFile=/dev/null"
SSH_HOST="${REMOTE_USER}@${PUBLIC_IP}"
RSYNC_FLAGS=(-az)
[[ "$DRY_RUN" -eq 1 ]] && RSYNC_FLAGS+=(--dry-run --itemize-changes)

touch "$KNOWN_HOSTS_FILE"

log "Checking SSH to ${SSH_HOST}"
ssh "${SSH_OPTS[@]}" "$SSH_HOST" 'echo ok' >/dev/null \
  || die "Cannot SSH to ${SSH_HOST}"

REMOTE_CLIENT="$(ssh "${SSH_OPTS[@]}" "$SSH_HOST" \
  "grep -E '^DATABASE_CLIENT=' '${REMOTE_CMS}/.env' 2>/dev/null | cut -d= -f2- || echo sqlite")"
[[ "$REMOTE_CLIENT" == "sqlite" ]] || die "Remote DATABASE_CLIENT=${REMOTE_CLIENT}; expected sqlite"

if [[ "$DIRECTION" == "push" ]]; then
  [[ "$SYNC_DB" -eq 1 && ! -f "$LOCAL_DB" ]] && die "Local DB missing: ${LOCAL_DB} (start Strapi locally once, or use --uploads-only)"
  [[ "$SYNC_UPLOADS" -eq 1 && ! -d "$LOCAL_UPLOADS" ]] && die "Local uploads missing: ${LOCAL_UPLOADS}"

  log "Direction: local → DigitalOcean (${PUBLIC_IP})"
  echo "  DB:      $([[ $SYNC_DB -eq 1 ]] && echo yes || echo skip)  ${LOCAL_DB}"
  echo "  Uploads: $([[ $SYNC_UPLOADS -eq 1 ]] && echo yes || echo skip)  ${LOCAL_UPLOADS}"
  [[ -n "$PRIMARY_HOSTNAME" ]] && echo "  Host:    will set Site.hostname → ${PRIMARY_HOSTNAME}"
  [[ "$DRY_RUN" -eq 1 ]] && warn "Dry run — no remote changes"

  if [[ "$DRY_RUN" -eq 0 ]]; then
    STAMP="$(date +%Y%m%d%H%M%S)"
    log "Backing up remote CMS data → ~/cms-backups/cms-data-${STAMP}.tgz"
    ssh "${SSH_OPTS[@]}" "$SSH_HOST" bash -s <<EOF
set -euo pipefail
mkdir -p "\$HOME/cms-backups" '${REMOTE_CMS}/.tmp' '${REMOTE_UPLOADS}'
tar czf "\$HOME/cms-backups/cms-data-${STAMP}.tgz" \
  -C '${REMOTE_CMS}' \
  --ignore-failed-read \
  .tmp public/uploads
ls -lh "\$HOME/cms-backups/cms-data-${STAMP}.tgz"
EOF

    log "Stopping remote santamar-cms (SQLite must be idle while copying)"
    ssh "${SSH_OPTS[@]}" "$SSH_HOST" 'pm2 stop santamar-cms >/dev/null 2>&1 || true'
  fi

  if [[ "$SYNC_DB" -eq 1 ]]; then
    log "Syncing SQLite database"
    ssh "${SSH_OPTS[@]}" "$SSH_HOST" "mkdir -p '${REMOTE_CMS}/.tmp'"
    rsync "${RSYNC_FLAGS[@]}" -e "$RSYNC_SSH" \
      "$LOCAL_DB" "${SSH_HOST}:${REMOTE_DB}"
  fi

  if [[ "$SYNC_UPLOADS" -eq 1 ]]; then
    log "Syncing uploads (additive; remote-only files kept)"
    ssh "${SSH_OPTS[@]}" "$SSH_HOST" "mkdir -p '${REMOTE_UPLOADS}'"
    # No --delete: keep any files that exist only on the server.
    rsync "${RSYNC_FLAGS[@]}" -e "$RSYNC_SSH" \
      "${LOCAL_UPLOADS}/" "${SSH_HOST}:${REMOTE_UPLOADS}/"
  fi

  if [[ "$DRY_RUN" -eq 0 ]]; then
    log "Disabling SEED_CONTENT on remote (keep imported data)"
    ssh "${SSH_OPTS[@]}" "$SSH_HOST" bash -s <<EOF
set -euo pipefail
if grep -q '^SEED_CONTENT=' '${REMOTE_CMS}/.env' 2>/dev/null; then
  sed -i 's/^SEED_CONTENT=.*/SEED_CONTENT=false/' '${REMOTE_CMS}/.env'
else
  echo 'SEED_CONTENT=false' >> '${REMOTE_CMS}/.env'
fi
EOF

    if [[ -n "$PRIMARY_HOSTNAME" && "$SYNC_DB" -eq 1 ]]; then
      log "Patching Site.hostname → ${PRIMARY_HOSTNAME} (local DB usually has localhost)"
      ssh "${SSH_OPTS[@]}" "$SSH_HOST" \
        PRIMARY_HOSTNAME="$PRIMARY_HOSTNAME" \
        REMOTE_DB="$REMOTE_DB" \
        bash -s <<'EOF'
set -euo pipefail
cd "$(dirname "$REMOTE_DB")/.."
node <<'JS'
const Database = require('better-sqlite3');
const host = (process.env.PRIMARY_HOSTNAME || '').trim().toLowerCase()
  .replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '');
if (!host) process.exit(0);
const db = new Database(process.env.REMOTE_DB);
const aliases = JSON.stringify(
  host === 'localhost' ? ['127.0.0.1'] : ['localhost', '127.0.0.1']
);
const info = db.prepare(
  `UPDATE sites SET hostname = ?, hostnames = ?, updated_at = ? WHERE key = 'santamar'`
).run(host, aliases, Date.now());
console.log(`updated ${info.changes} site row(s) → ${host}`);
JS
EOF
    fi

    log "Starting remote santamar-cms"
    ssh "${SSH_OPTS[@]}" "$SSH_HOST" 'pm2 start santamar-cms || pm2 restart santamar-cms'
    sleep 5
    ssh "${SSH_OPTS[@]}" "$SSH_HOST" 'pm2 status santamar-cms || true'
    log "Smoke checks"
    ssh "${SSH_OPTS[@]}" "$SSH_HOST" bash -s <<EOF
curl -sS -o /dev/null -w "CMS /admin -> %{http_code}\\n" http://127.0.0.1:1337/admin || true
curl -sS -o /dev/null -w "API pages  -> %{http_code}\\n" "http://127.0.0.1:1337/api/pages?locale=en&pagination[pageSize]=1" || true
if [[ -n '${PRIMARY_HOSTNAME}' ]]; then
  curl -sS -o /dev/null -w "resolve    -> %{http_code}\\n" \
    "http://127.0.0.1:1337/api/sites/resolve?host=${PRIMARY_HOSTNAME}&locale=en" || true
fi
EOF
  fi

  cat <<EOF

────────────────────────────────────────────────────────────
CMS data push complete

  Admin:  http://${PUBLIC_IP}/admin
  API:    http://${PUBLIC_IP}/api
  Backup: ${REMOTE_USER}@${PUBLIC_IP}:~/cms-backups/

Next: rebuild the static frontend and FTP-upload frontend/out/

  set -a && source deploy/digitalocean/frontend.env && set +a
  npm run build:web:static

Note: Remote cms/.env (secrets + PUBLIC_URL) was left unchanged.
Local admin users ride along with the SQLite file.
────────────────────────────────────────────────────────────
EOF

else
  # pull
  log "Direction: DigitalOcean → local"
  echo "  DB:      $([[ $SYNC_DB -eq 1 ]] && echo yes || echo skip)"
  echo "  Uploads: $([[ $SYNC_UPLOADS -eq 1 ]] && echo yes || echo skip)"
  [[ "$DRY_RUN" -eq 1 ]] && warn "Dry run — no local changes"

  if [[ "$DRY_RUN" -eq 0 ]]; then
    STAMP="$(date +%Y%m%d%H%M%S)"
    mkdir -p "${ROOT_DIR}/cms/.tmp" "${ROOT_DIR}/cms/public/uploads" "${ROOT_DIR}/cms/.migrate-backups"
    if [[ -f "$LOCAL_DB" || -d "$LOCAL_UPLOADS" ]]; then
      log "Backing up local CMS data → cms/.migrate-backups/cms-data-${STAMP}.tgz"
      tar czf "${ROOT_DIR}/cms/.migrate-backups/cms-data-${STAMP}.tgz" \
        -C "${ROOT_DIR}/cms" \
        --ignore-failed-read \
        .tmp public/uploads
    fi
    warn "Stop local Strapi before pull if it is running, so SQLite is consistent."
  fi

  if [[ "$SYNC_DB" -eq 1 ]]; then
    log "Pulling SQLite database"
    mkdir -p "$(dirname "$LOCAL_DB")"
    rsync "${RSYNC_FLAGS[@]}" -e "$RSYNC_SSH" \
      "${SSH_HOST}:${REMOTE_DB}" "$LOCAL_DB"
  fi

  if [[ "$SYNC_UPLOADS" -eq 1 ]]; then
    log "Pulling uploads"
    mkdir -p "$LOCAL_UPLOADS"
    rsync "${RSYNC_FLAGS[@]}" -e "$RSYNC_SSH" \
      "${SSH_HOST}:${REMOTE_UPLOADS}/" "${LOCAL_UPLOADS}/"
  fi

  cat <<EOF

────────────────────────────────────────────────────────────
CMS data pull complete

  Local DB:      ${LOCAL_DB}
  Local uploads: ${LOCAL_UPLOADS}
────────────────────────────────────────────────────────────
EOF
fi
