#!/usr/bin/env bash
# Remote bootstrap — Strapi CMS only on a DigitalOcean Ubuntu droplet.
# Invoked by deploy/digitalocean/deploy.sh. Not intended to run locally.

set -euo pipefail

APP_DIR="${REMOTE_APP_DIR:-/var/www/santamar-cms}"
SEED_CONTENT="${SEED_CONTENT:-true}"
CMS_DOMAIN="${CMS_DOMAIN:-}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
PUBLIC_IP="${PUBLIC_IP:-}"
PUBLIC_URL="${PUBLIC_URL:-}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
FRONTEND_URLS="${FRONTEND_URLS:-}"
PRIMARY_HOSTNAME="${PRIMARY_HOSTNAME:-localhost}"

log() { printf '\n==> %s\n' "$*"; }

export DEBIAN_FRONTEND=noninteractive

# Fresh DO images often still run apt (cloud-init / unattended-upgrades).
wait_for_apt() {
  local i=0
  local max="${1:-300}"

  if command -v cloud-init >/dev/null 2>&1; then
    log "Waiting for cloud-init to finish"
    cloud-init status --wait >/dev/null 2>&1 || true
  fi

  log "Waiting for apt/dpkg locks (up to ${max}s)"
  while [[ "$i" -lt "$max" ]]; do
    if ! pgrep -x apt-get >/dev/null 2>&1 \
      && ! pgrep -x apt >/dev/null 2>&1 \
      && ! pgrep -x dpkg >/dev/null 2>&1 \
      && ! pgrep -f 'unattended-upgrade(s)?' >/dev/null 2>&1; then
      # flock is available on Ubuntu; non-blocking test of the frontend lock
      if command -v flock >/dev/null 2>&1; then
        if flock -n /var/lib/dpkg/lock-frontend true 2>/dev/null; then
          log "apt locks are free"
          return 0
        fi
      else
        log "apt locks are free"
        return 0
      fi
    fi
    sleep 5
    i=$((i + 5))
  done
  log "Timed out waiting for apt — attempting to continue anyway"
}

apt_get() {
  wait_for_apt 300
  apt-get "$@"
}

wait_for_apt 300

log "Updating apt and installing base packages"
apt_get update -y
apt_get install -y \
  ca-certificates \
  curl \
  gnupg \
  nginx \
  ufw \
  build-essential \
  python3 \
  git \
  openssl \
  rsync

if [[ ! -f /usr/bin/node ]] || ! node -v | grep -qE '^v20\.'; then
  log "Installing Node.js 20.x"
  wait_for_apt 180
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt_get install -y nodejs
fi

node -v
npm -v
npm install -g pm2@latest

if [[ -z "$PUBLIC_URL" ]]; then
  if [[ -n "$CMS_DOMAIN" ]]; then
    PUBLIC_URL="https://${CMS_DOMAIN}"
  elif [[ -n "$PUBLIC_IP" ]]; then
    PUBLIC_URL="http://${PUBLIC_IP}"
  else
    PUBLIC_URL="http://127.0.0.1"
  fi
fi

cd "$APP_DIR"

log "Writing cms/.env (preserving existing secrets if present)"
if [[ ! -f cms/.env ]]; then
  APP_KEYS="$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16),$(openssl rand -base64 16)"
  cat > cms/.env <<EOF
HOST=127.0.0.1
PORT=1337
NODE_ENV=production
APP_KEYS=${APP_KEYS}
API_TOKEN_SALT=$(openssl rand -base64 32)
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-32)
PUBLIC_URL=${PUBLIC_URL}
FRONTEND_URL=${FRONTEND_URL}
FRONTEND_URLS=${FRONTEND_URLS}
PROXY_KOA=true
SEED_CONTENT=${SEED_CONTENT}
STRAPI_PLUGIN_I18N_INIT_LOCALE_CODE=en
PRIMARY_HOSTNAME=${PRIMARY_HOSTNAME}
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
EOF
else
  set_env() {
    local key="$1" value="$2"
    if grep -q "^${key}=" cms/.env; then
      sed -i "s|^${key}=.*|${key}=${value}|" cms/.env
    else
      echo "${key}=${value}" >> cms/.env
    fi
  }
  set_env PUBLIC_URL "$PUBLIC_URL"
  set_env FRONTEND_URL "$FRONTEND_URL"
  set_env FRONTEND_URLS "$FRONTEND_URLS"
  set_env PRIMARY_HOSTNAME "$PRIMARY_HOSTNAME"
  set_env PROXY_KOA true
  set_env HOST 127.0.0.1
  set_env PORT 1337
fi

mkdir -p cms/.tmp cms/public/uploads

MEM_MB="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)"
# Strapi admin (Vite) needs ~1.5–2GB heap. On 1GB droplets that only fits via swap.
if [[ "$MEM_MB" -lt 1500 ]]; then
  NODE_HEAP_MB=2048
  SWAP_MB=4096
elif [[ "$MEM_MB" -lt 3600 ]]; then
  NODE_HEAP_MB=2048
  SWAP_MB=2048
else
  NODE_HEAP_MB=3072
  SWAP_MB=0
fi

ensure_swap() {
  local want_mb="$1"
  [[ "$want_mb" -gt 0 ]] || return 0
  local have_mb=0
  if swapon --show=SIZE --noheadings --bytes 2>/dev/null | grep -q .; then
    have_mb="$(swapon --show=SIZE --noheadings --bytes | awk '{s+=$1} END {print int(s/1024/1024)}')"
  fi
  if [[ "${have_mb:-0}" -ge "$want_mb" ]]; then
    log "Swap already ${have_mb}MB (need ${want_mb}MB)"
    return 0
  fi
  if swapon --show | grep -q .; then
    log "Expanding swap to ${want_mb}MB"
    swapoff -a || true
    rm -f /swapfile
  else
    log "Creating ${want_mb}MB swapfile (${MEM_MB}MB RAM)"
  fi
  fallocate -l "${want_mb}M" /swapfile 2>/dev/null \
    || dd if=/dev/zero of=/swapfile bs=1M count="$want_mb" status=none
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  if ! grep -q '^/swapfile ' /etc/fstab 2>/dev/null; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
}

ensure_swap "$SWAP_MB"

if [[ "${NODE_OPTIONS:-}" != *max-old-space-size* ]]; then
  export NODE_OPTIONS="${NODE_OPTIONS:+${NODE_OPTIONS} }--max-old-space-size=${NODE_HEAP_MB}"
fi
# Keep the Vite/admin build from spawning too many workers on small boxes
export UV_THREADPOOL_SIZE="${UV_THREADPOOL_SIZE:-2}"
export NODE_OPTIONS="${NODE_OPTIONS} --no-warnings"
log "Build memory: RAM=${MEM_MB}MB heap=${NODE_HEAP_MB}MB swap=$(swapon --show=SIZE --noheadings 2>/dev/null | head -1 || echo none)"

log "Installing CMS dependencies and building Strapi admin"
cd "$APP_DIR/cms"
npm ci --no-audit --no-fund
# Single-threaded-ish admin build to reduce peak RAM (slower, safer on 1GB)
export CI=true
npm run build

log "Configuring Nginx (CMS reverse-proxy)"
SERVER_NAME="_"
if [[ -n "$CMS_DOMAIN" ]]; then
  SERVER_NAME="${CMS_DOMAIN}"
elif [[ -n "$PUBLIC_IP" ]]; then
  SERVER_NAME="${PUBLIC_IP}"
fi

sed "s/__SERVER_NAME__/${SERVER_NAME}/g" \
  "$APP_DIR/deploy/digitalocean/nginx-cms.conf" \
  > /etc/nginx/sites-available/santamar-cms

rm -f /etc/nginx/sites-enabled/default
ln -sfn /etc/nginx/sites-available/santamar-cms /etc/nginx/sites-enabled/santamar-cms
nginx -t
systemctl enable --now nginx
systemctl reload nginx

log "Starting Strapi with PM2"
cd "$APP_DIR"
# Do not inherit deploy-shell PRIMARY_HOSTNAME/SEED_CONTENT into PM2 —
# dotenv loads those from cms/.env, and a stale PM2 env would override it.
unset PRIMARY_HOSTNAME SEED_CONTENT FRONTEND_URL FRONTEND_URLS PUBLIC_URL CMS_DOMAIN || true
cat > /tmp/santamar-cms-ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: 'santamar-cms',
      cwd: '${APP_DIR}/cms',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 1337,
        PROXY_KOA: 'true',
      },
    },
  ],
};
EOF

pm2 delete santamar-cms >/dev/null 2>&1 || true
pm2 start /tmp/santamar-cms-ecosystem.config.js
pm2 save
STARTUP_CMD="$(pm2 startup systemd -u root --hp /root | tail -n 1 || true)"
if [[ "$STARTUP_CMD" == sudo* ]] || [[ "$STARTUP_CMD" == *systemctl* ]]; then
  eval "$STARTUP_CMD" || true
fi

log "Firewall (UFW): OpenSSH + Nginx"
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable || true

if [[ -n "$CMS_DOMAIN" && -n "$LETSENCRYPT_EMAIL" ]]; then
  log "Attempting Let's Encrypt for ${CMS_DOMAIN}"
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx \
    -d "$CMS_DOMAIN" \
    --non-interactive \
    --agree-tos \
    -m "$LETSENCRYPT_EMAIL" \
    --redirect || log "Certbot skipped/failed — confirm DNS A record ${CMS_DOMAIN} → ${PUBLIC_IP}"
  nginx -t && systemctl reload nginx
fi

if [[ "$SEED_CONTENT" == "true" ]]; then
  log "Waiting for Strapi seed, then disabling SEED_CONTENT for subsequent boots"
  sleep 15
  sed -i 's/^SEED_CONTENT=.*/SEED_CONTENT=false/' "$APP_DIR/cms/.env" || true
  pm2 restart santamar-cms --update-env || true
fi

log "Bootstrap complete"
pm2 status
curl -sS -o /dev/null -w "CMS /admin -> %{http_code}\n" http://127.0.0.1:1337/admin || true
