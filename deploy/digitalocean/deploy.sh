#!/usr/bin/env bash
#
# Deploy Santamar Strapi CMS to a DigitalOcean droplet (create if missing).
# Frontend is NOT deployed here — build/upload it separately via FTP using the
# generated frontend.env that points NEXT_PUBLIC_STRAPI_URL at this droplet.
#
# Prerequisites and walkthrough: docs/DEPLOY-DIGITALOCEAN.md
#
# Usage (from repo root):
#   cp deploy/digitalocean/do.env.example deploy/digitalocean/do.env
#   # edit do.env — set DO_SSH_KEY_ID, FRONTEND_URL(S), optional CMS_DOMAIN
#   ./deploy/digitalocean/deploy.sh
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DO_DIR="${ROOT_DIR}/deploy/digitalocean"
ENV_FILE="${DO_DIR}/do.env"
STATE_FILE="${DO_DIR}/.deploy-state"
FRONTEND_ENV_FILE="${DO_DIR}/frontend.env"
KNOWN_HOSTS_FILE="${DO_DIR}/.known_hosts"

log() { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\n\033[1;33mWARN:\033[0m %s\n' "$*" >&2; }
die() { printf '\n\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1 (see docs/DEPLOY-DIGITALOCEAN.md)"
}

[[ -f "$ENV_FILE" ]] || die "Missing ${ENV_FILE}. Copy do.env.example → do.env and fill values."

# shellcheck disable=SC1090
source "$ENV_FILE"

: "${DROPLET_NAME:?}"
: "${REGION:?}"
: "${SIZE:?}"
: "${IMAGE:?}"
: "${SSH_KEY_PATH:?}"
: "${DO_SSH_KEY_ID:?Set DO_SSH_KEY_ID — run: doctl compute ssh-key list}"
: "${REMOTE_USER:?}"
: "${REMOTE_APP_DIR:?}"

need_cmd doctl
need_cmd jq
need_cmd ssh
need_cmd rsync
need_cmd openssl

DOCTL=(doctl)
if [[ -n "${DOCTL_CONTEXT:-}" ]]; then
  DOCTL+=( --context "$DOCTL_CONTEXT" )
fi

log "Checking DigitalOcean auth"
ACCOUNT="$("${DOCTL[@]}" account get --format Email --no-header 2>/dev/null)" \
  || die "doctl is not authenticated. Run: doctl auth init"
log "Authenticated as ${ACCOUNT}"

# Expand ~ /$HOME if present in do.env
SSH_KEY_PATH="${SSH_KEY_PATH/#\~/$HOME}"
SSH_KEY_PATH="${SSH_KEY_PATH/#\$HOME/$HOME}"
[[ -f "$SSH_KEY_PATH" ]] || die "SSH private key missing at ${SSH_KEY_PATH}"
SSH_PUB_PATH="${SSH_KEY_PATH}.pub"
[[ -f "$SSH_PUB_PATH" ]] || die "SSH public key missing at ${SSH_PUB_PATH} (needed to verify DigitalOcean key match)"

# Resolve DO_SSH_KEY_ID (numeric id or fingerprint) → fingerprint + verify it matches local .pub
resolve_do_ssh_fingerprint() {
  local want="$1"
  local id name fp
  while IFS=$'\t' read -r id name fp; do
    [[ -z "$id" ]] && continue
    if [[ "$want" == "$id" || "$want" == "$fp" ]]; then
      echo "$fp"
      return 0
    fi
  done < <("${DOCTL[@]}" compute ssh-key list --format ID,Name,FingerPrint --no-header | awk '{print $1"\t"$2"\t"$3}')
  return 1
}

DO_SSH_FINGERPRINT="$(resolve_do_ssh_fingerprint "$DO_SSH_KEY_ID")" \
  || die "DO_SSH_KEY_ID=${DO_SSH_KEY_ID} not found. Run: doctl compute ssh-key list
Import this machine's key: doctl compute ssh-key import santamar --public-key-file ${SSH_PUB_PATH}"

LOCAL_MD5="$(ssh-keygen -E md5 -lf "$SSH_PUB_PATH" | awk '{print $2}' | sed 's/^MD5://')"
if [[ "$LOCAL_MD5" != "$DO_SSH_FINGERPRINT" ]]; then
  die "SSH key mismatch.
  Local ${SSH_PUB_PATH} MD5:  ${LOCAL_MD5}
  DigitalOcean key MD5:       ${DO_SSH_FINGERPRINT} (DO_SSH_KEY_ID=${DO_SSH_KEY_ID})
Fix: set DO_SSH_KEY_ID to the ID whose fingerprint matches, or:
  doctl compute ssh-key import santamar --public-key-file ${SSH_PUB_PATH}"
fi
log "SSH key OK — local pubkey matches DO fingerprint ${DO_SSH_FINGERPRINT}"

# cloud-init that always installs our pubkey for root (belt-and-suspenders with --ssh-keys)
USER_DATA_FILE="$(mktemp)"
trap 'rm -f "$USER_DATA_FILE"' EXIT
{
  echo '#cloud-config'
  echo 'disable_root: false'
  echo 'ssh_pwauth: false'
  echo 'users:'
  echo '  - name: root'
  echo '    lock_passwd: true'
  echo '    ssh_authorized_keys:'
  # Indent pubkey line for YAML list under ssh_authorized_keys
  printf '      - %s\n' "$(tr -d '\r\n' <"$SSH_PUB_PATH")"
} >"$USER_DATA_FILE"

save_state() {
  local key="$1" value="$2"
  touch "$STATE_FILE"
  if grep -q "^${key}=" "$STATE_FILE" 2>/dev/null; then
    local tmp
    tmp="$(mktemp)"
    grep -v "^${key}=" "$STATE_FILE" >"$tmp" || true
    echo "${key}=${value}" >>"$tmp"
    mv "$tmp" "$STATE_FILE"
  else
    echo "${key}=${value}" >>"$STATE_FILE"
  fi
}

load_state() {
  local key="$1"
  [[ -f "$STATE_FILE" ]] || return 0
  grep "^${key}=" "$STATE_FILE" 2>/dev/null | tail -n1 | cut -d= -f2- || true
}

# --- Find or create droplet ---
DROPLET_ID="$(load_state DROPLET_ID)"
if [[ -n "$DROPLET_ID" ]]; then
  EXISTS="$("${DOCTL[@]}" compute droplet get "$DROPLET_ID" --format ID --no-header 2>/dev/null || true)"
  if [[ -z "$EXISTS" ]]; then
    warn "Stored DROPLET_ID ${DROPLET_ID} no longer exists — will recreate"
    DROPLET_ID=""
  fi
fi

if [[ -z "$DROPLET_ID" ]]; then
  BY_NAME="$("${DOCTL[@]}" compute droplet list --format ID,Name --no-header \
    | awk -v n="$DROPLET_NAME" '$2==n {print $1; exit}')"
  if [[ -n "$BY_NAME" ]]; then
    DROPLET_ID="$BY_NAME"
    log "Found existing droplet ${DROPLET_NAME} (id=${DROPLET_ID})"
  fi
fi

if [[ -z "$DROPLET_ID" ]]; then
  log "Creating droplet ${DROPLET_NAME} (${SIZE} / ${REGION} / ${IMAGE})"
  log "Attaching SSH key fingerprint ${DO_SSH_FINGERPRINT} + cloud-init authorized_keys"
  TAG_ARGS=()
  if [[ -n "${TAGS:-}" ]]; then
    TAG_ARGS=( --tag-names "$TAGS" )
  fi
  # Prefer fingerprint over numeric id — and inject pubkey via user-data as well.
  CREATE_OUT="$("${DOCTL[@]}" compute droplet create "$DROPLET_NAME" \
    --region "$REGION" \
    --size "$SIZE" \
    --image "$IMAGE" \
    --ssh-keys "$DO_SSH_FINGERPRINT" \
    --user-data-file "$USER_DATA_FILE" \
    "${TAG_ARGS[@]}" \
    --wait \
    --format ID,PublicIPv4 \
    --no-header)"
  DROPLET_ID="$(echo "$CREATE_OUT" | awk '{print $1}')"
  PUBLIC_IP="$(echo "$CREATE_OUT" | awk '{print $2}')"
  [[ -n "$DROPLET_ID" && -n "$PUBLIC_IP" ]] || die "Droplet create did not return id/ip: ${CREATE_OUT}"
  log "Created droplet id=${DROPLET_ID} ip=${PUBLIC_IP}"
else
  PUBLIC_IP="$("${DOCTL[@]}" compute droplet get "$DROPLET_ID" --format PublicIPv4 --no-header)"
  log "Using droplet id=${DROPLET_ID} ip=${PUBLIC_IP}"
fi

save_state DROPLET_ID "$DROPLET_ID"
save_state PUBLIC_IP "$PUBLIC_IP"
save_state DROPLET_NAME "$DROPLET_NAME"

# Resolve public CMS URL
if [[ -n "${CMS_DOMAIN:-}" ]]; then
  PUBLIC_URL="https://${CMS_DOMAIN}"
else
  PUBLIC_URL="http://${PUBLIC_IP}"
fi

# Write frontend env for the separate FTP/static build step
cat > "$FRONTEND_ENV_FILE" <<EOF
# Generated by deploy/digitalocean/deploy.sh — do not commit secrets here.
# Use before building the static frontend for FTP upload:
#   set -a && source deploy/digitalocean/frontend.env && set +a
#   npm run build:web:static
# Or copy into frontend/.env.production before \`next build\` / \`build:static\`.

NEXT_PUBLIC_STRAPI_URL=${PUBLIC_URL}
NEXT_PUBLIC_ENABLE_THEME_SWITCHER=false
SITE_HOSTNAME=${PRIMARY_HOSTNAME:-}
EOF
log "Wrote ${FRONTEND_ENV_FILE} (NEXT_PUBLIC_STRAPI_URL=${PUBLIC_URL})"

# SSH known_hosts for this droplet
PREV_ID="$(load_state SSH_DROPLET_ID)"
if [[ "$PREV_ID" != "$DROPLET_ID" ]]; then
  log "Refreshing SSH host key for ${PUBLIC_IP}"
  ssh-keygen -R "$PUBLIC_IP" -f "$KNOWN_HOSTS_FILE" >/dev/null 2>&1 || true
  ssh-keygen -R "$PUBLIC_IP" >/dev/null 2>&1 || true
  touch "$KNOWN_HOSTS_FILE"
fi

SSH_OPTS=(
  -i "$SSH_KEY_PATH"
  -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=accept-new
  -o UserKnownHostsFile="$KNOWN_HOSTS_FILE"
  -o GlobalKnownHostsFile=/dev/null
  -o ConnectTimeout=10
  -o BatchMode=yes
)
SSH_HOST="${REMOTE_USER}@${PUBLIC_IP}"
RSYNC_SSH="ssh -i ${SSH_KEY_PATH} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=${KNOWN_HOSTS_FILE} -o GlobalKnownHostsFile=/dev/null"

log "Waiting for SSH on ${SSH_HOST}"
SSH_LAST_ERR=""
for i in $(seq 1 36); do
  if SSH_LAST_ERR="$(ssh "${SSH_OPTS[@]}" "$SSH_HOST" 'echo ok' 2>&1)"; then
    save_state SSH_DROPLET_ID "$DROPLET_ID"
    break
  fi
  sleep 5
  if [[ "$i" -eq 36 ]]; then
    die "SSH never became available for ${SSH_HOST}.
Last error: ${SSH_LAST_ERR}

This usually means the droplet was created without your current pubkey in
authorized_keys (key mismatch at create time). Recreate the droplet:

  doctl compute droplet delete ${DROPLET_ID} --force
  rm -f ${STATE_FILE}
  # Confirm DO_SSH_KEY_ID fingerprint matches:
  #   ssh-keygen -E md5 -lf ${SSH_PUB_PATH}
  #   doctl compute ssh-key list
  ./deploy/digitalocean/deploy.sh

Or add ${SSH_PUB_PATH} via the DigitalOcean web console → Droplet → Access → Recovery."
  fi
done

log "Preparing remote directories"
ssh "${SSH_OPTS[@]}" "$SSH_HOST" "mkdir -p '${REMOTE_APP_DIR}/cms' '${REMOTE_APP_DIR}/deploy/digitalocean'"

log "Syncing CMS + DigitalOcean deploy helpers to ${SSH_HOST}:${REMOTE_APP_DIR}"
rsync -az --delete \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  --exclude '.tmp/' \
  --exclude '.cache/' \
  --exclude '.strapi/' \
  --exclude 'public/uploads/' \
  --exclude '.env' \
  --exclude '.env.production' \
  -e "$RSYNC_SSH" \
  "${ROOT_DIR}/cms/" "${SSH_HOST}:${REMOTE_APP_DIR}/cms/"

rsync -az \
  -e "$RSYNC_SSH" \
  "${DO_DIR}/bootstrap-remote.sh" \
  "${DO_DIR}/nginx-cms.conf" \
  "${SSH_HOST}:${REMOTE_APP_DIR}/deploy/digitalocean/"

log "Running remote bootstrap (Node 20, Nginx, PM2, Strapi build)"
ssh "${SSH_OPTS[@]}" "$SSH_HOST" \
  env \
    REMOTE_APP_DIR="$REMOTE_APP_DIR" \
    SEED_CONTENT="${SEED_CONTENT:-true}" \
    CMS_DOMAIN="${CMS_DOMAIN:-}" \
    LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}" \
    PUBLIC_IP="$PUBLIC_IP" \
    PUBLIC_URL="$PUBLIC_URL" \
    FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}" \
    FRONTEND_URLS="${FRONTEND_URLS:-}" \
    PRIMARY_HOSTNAME="${PRIMARY_HOSTNAME:-localhost}" \
    bash -s <"${DO_DIR}/bootstrap-remote.sh"

cat <<EOF

────────────────────────────────────────────────────────────
DigitalOcean CMS deploy finished

  Droplet:     ${DROPLET_NAME} (${DROPLET_ID})
  Region/Size: ${REGION} / ${SIZE}
  Public IP:   ${PUBLIC_IP}
  Strapi URL:  ${PUBLIC_URL}
  Admin:       ${PUBLIC_URL}/admin
  API:         ${PUBLIC_URL}/api

State:         ${STATE_FILE}
Frontend env:  ${FRONTEND_ENV_FILE}
SSH:           ssh -i ${SSH_KEY_PATH} ${SSH_HOST}

Next steps (frontend via FTP — separate from this droplet):
  1. Open ${PUBLIC_URL}/admin and create the first Strapi admin user
  2. Set FRONTEND_URL / FRONTEND_URLS in do.env to your live site origin(s),
     then re-run this script (updates CORS) or edit cms/.env on the droplet
  3. Build the static frontend pointed at this CMS:

       set -a && source deploy/digitalocean/frontend.env && set +a
       npm run build:web:static

  4. Upload frontend/out/ to your FTP/static host DocumentRoot
  5. (Optional) Point DNS ${CMS_DOMAIN:-cms.example.com} → ${PUBLIC_IP}
     and set CMS_DOMAIN + LETSENCRYPT_EMAIL in do.env, then re-deploy for TLS
────────────────────────────────────────────────────────────
EOF
