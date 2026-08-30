#!/usr/bin/env bash
# Remote bootstrap for Santamar on a Free Tier EC2 instance (Ubuntu 22.04).
# Invoked by deploy/aws/deploy.sh after code sync. Not intended to run locally.

set -euo pipefail

APP_DIR="${REMOTE_APP_DIR:-/home/ubuntu/santamar}"
DB_MODE="${DB_MODE:-sqlite}"
SEED_CONTENT="${SEED_CONTENT:-true}"
SITE_DOMAIN="${SITE_DOMAIN:-}"
CMS_DOMAIN="${CMS_DOMAIN:-}"
LETSENCRYPT_EMAIL="${LETSENCRYPT_EMAIL:-}"
PUBLIC_IP="${PUBLIC_IP:-}"
NEXT_PUBLIC_STRAPI_URL="${NEXT_PUBLIC_STRAPI_URL:-}"

log() { printf '\n==> %s\n' "$*"; }

export DEBIAN_FRONTEND=noninteractive

log "Updating apt and installing base packages"
sudo apt-get update -y
sudo apt-get install -y \
  ca-certificates \
  curl \
  gnupg \
  nginx \
  ufw \
  build-essential \
  python3 \
  git \
  openssl

if [[ ! -f /usr/bin/node ]] || ! node -v | grep -qE '^v20\.'; then
  log "Installing Node.js 20.x"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

node -v
npm -v
sudo npm install -g pm2@latest

if [[ "$DB_MODE" == "mysql" ]]; then
  log "Installing MariaDB (MySQL-compatible) on-instance"
  sudo apt-get install -y mariadb-server
  sudo systemctl enable --now mariadb
  sudo mysql -e "CREATE DATABASE IF NOT EXISTS santamar_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  sudo mysql -e "CREATE USER IF NOT EXISTS 'santamar'@'localhost' IDENTIFIED BY 'change-me-now';"
  sudo mysql -e "GRANT ALL PRIVILEGES ON santamar_cms.* TO 'santamar'@'localhost'; FLUSH PRIVILEGES;"
  warn_mysql=1
fi

cd "$APP_DIR"

if [[ ! -f gsap-bonus.tgz ]]; then
  echo "ERROR: gsap-bonus.tgz missing at repo root ($APP_DIR). Frontend depends on file:../gsap-bonus.tgz" >&2
  exit 1
fi

# --- Resolve public URLs ---
if [[ -z "$NEXT_PUBLIC_STRAPI_URL" ]]; then
  if [[ -n "$CMS_DOMAIN" ]]; then
    NEXT_PUBLIC_STRAPI_URL="https://${CMS_DOMAIN}"
  elif [[ -n "$PUBLIC_IP" ]]; then
    NEXT_PUBLIC_STRAPI_URL="http://${PUBLIC_IP}"
  else
    NEXT_PUBLIC_STRAPI_URL="http://127.0.0.1"
  fi
fi

FRONTEND_ORIGIN="http://${PUBLIC_IP:-127.0.0.1}"
if [[ -n "$SITE_DOMAIN" ]]; then
  FRONTEND_ORIGIN="https://${SITE_DOMAIN}"
fi

# --- CMS env ---
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
PUBLIC_URL=${NEXT_PUBLIC_STRAPI_URL}
FRONTEND_URL=${FRONTEND_ORIGIN}
PROXY_KOA=true
SEED_CONTENT=${SEED_CONTENT}
STRAPI_PLUGIN_I18N_INIT_LOCALE_CODE=en
EOF

  if [[ "$DB_MODE" == "mysql" ]]; then
    cat >> cms/.env <<EOF
DATABASE_CLIENT=mysql
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_NAME=santamar_cms
DATABASE_USERNAME=santamar
DATABASE_PASSWORD=change-me-now
DATABASE_SSL=false
EOF
  else
    cat >> cms/.env <<EOF
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
EOF
  fi
else
  grep -q '^PUBLIC_URL=' cms/.env && sed -i "s|^PUBLIC_URL=.*|PUBLIC_URL=${NEXT_PUBLIC_STRAPI_URL}|" cms/.env || echo "PUBLIC_URL=${NEXT_PUBLIC_STRAPI_URL}" >> cms/.env
  grep -q '^FRONTEND_URL=' cms/.env && sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=${FRONTEND_ORIGIN}|" cms/.env || echo "FRONTEND_URL=${FRONTEND_ORIGIN}" >> cms/.env
fi

mkdir -p cms/.tmp cms/public/uploads

# --- Build memory headroom ---
# Strapi admin (Vite) and Next builds routinely exceed Node's default ~1GiB heap.
# On small EC2 sizes, also add swap so the kernel doesn't OOM-kill mid-build.
MEM_MB="$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)"
if [[ "$MEM_MB" -lt 1500 ]]; then
  NODE_HEAP_MB=768
  SWAP_MB=2048
elif [[ "$MEM_MB" -lt 3600 ]]; then
  NODE_HEAP_MB=1536
  SWAP_MB=2048
else
  NODE_HEAP_MB=3072
  SWAP_MB=0
fi

if [[ "$SWAP_MB" -gt 0 ]] && ! swapon --show | grep -q .; then
  log "Creating ${SWAP_MB}MB swapfile for Node builds (${MEM_MB}MB RAM)"
  sudo fallocate -l "${SWAP_MB}M" /swapfile 2>/dev/null \
    || sudo dd if=/dev/zero of=/swapfile bs=1M count="$SWAP_MB" status=none
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  if ! grep -q '^/swapfile ' /etc/fstab 2>/dev/null; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  fi
fi

# Preserve any pre-set NODE_OPTIONS, but ensure max-old-space-size is present.
if [[ "${NODE_OPTIONS:-}" != *max-old-space-size* ]]; then
  export NODE_OPTIONS="${NODE_OPTIONS:+${NODE_OPTIONS} }--max-old-space-size=${NODE_HEAP_MB}"
fi
# Keep Vite/esbuild from spawning too many parallel workers on 1–2 vCPU boxes.
export UV_THREADPOOL_SIZE="${UV_THREADPOOL_SIZE:-2}"
log "Build memory: RAM=${MEM_MB}MB heap=${NODE_HEAP_MB}MB NODE_OPTIONS=${NODE_OPTIONS}"

# --- Frontend env (build-time) ---
log "Writing frontend/.env.production"
cat > frontend/.env.production <<EOF
NEXT_PUBLIC_STRAPI_URL=${NEXT_PUBLIC_STRAPI_URL}
NEXT_PUBLIC_ENABLE_THEME_SWITCHER=false
HOSTNAME=127.0.0.1
PORT=3000
EOF

log "Installing CMS dependencies and building (Strapi admin can take 5–15+ min on small instances)"
cd "$APP_DIR/cms"
npm ci
npm run build

log "Installing frontend dependencies and building"
cd "$APP_DIR/frontend"
npm ci
npm run build

log "Configuring Nginx"
sudo rm -f /etc/nginx/sites-enabled/default

if [[ -n "$SITE_DOMAIN" && -n "$CMS_DOMAIN" ]]; then
  log "Installing dual-host Nginx (site=${SITE_DOMAIN}, cms=${CMS_DOMAIN})"
  sed \
    -e "s/__SITE_DOMAIN__/${SITE_DOMAIN}/g" \
    -e "s/__CMS_DOMAIN__/${CMS_DOMAIN}/g" \
    -e "s/__PUBLIC_IP__/${PUBLIC_IP:-_}/g" \
    "$APP_DIR/deploy/aws/nginx-dual.conf" | sudo tee /etc/nginx/sites-available/santamar >/dev/null
else
  log "Installing single-host Nginx (path-based Strapi routes)"
  sudo cp "$APP_DIR/deploy/aws/nginx.conf" /etc/nginx/sites-available/santamar
  if [[ -n "$SITE_DOMAIN" ]]; then
    sudo sed -i "s/server_name _;/server_name ${SITE_DOMAIN} ${PUBLIC_IP};/" /etc/nginx/sites-available/santamar
  fi
fi

sudo ln -sfn /etc/nginx/sites-available/santamar /etc/nginx/sites-enabled/santamar
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx

log "Starting apps with PM2"
cd "$APP_DIR"
sed "s|/home/ubuntu/santamar|${APP_DIR}|g" deploy/aws/ecosystem.config.js > /tmp/santamar-ecosystem.config.js
pm2 delete santamar-cms santamar-web >/dev/null 2>&1 || true
pm2 start /tmp/santamar-ecosystem.config.js
pm2 save
# Enable PM2 on boot (idempotent)
STARTUP_CMD="$(pm2 startup systemd -u "$USER" --hp "$HOME" | tail -n 1 || true)"
if [[ "$STARTUP_CMD" == sudo* ]]; then
  eval "$STARTUP_CMD" || true
fi

log "Firewall (UFW): allow OpenSSH + Nginx"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
echo "y" | sudo ufw enable || true

if [[ -n "$SITE_DOMAIN" && -n "$CMS_DOMAIN" && -n "$LETSENCRYPT_EMAIL" ]]; then
  log "Attempting Let's Encrypt for ${SITE_DOMAIN} and ${CMS_DOMAIN}"
  sudo apt-get install -y certbot python3-certbot-nginx
  # Expand each server block separately so certbot does not copy site routing onto the CMS host.
  sudo certbot --nginx \
    -d "$SITE_DOMAIN" \
    --non-interactive \
    --agree-tos \
    -m "$LETSENCRYPT_EMAIL" \
    --redirect || log "Certbot for ${SITE_DOMAIN} skipped/failed — confirm DNS A records"
  sudo certbot --nginx \
    -d "$CMS_DOMAIN" \
    --non-interactive \
    --agree-tos \
    -m "$LETSENCRYPT_EMAIL" \
    --redirect || log "Certbot for ${CMS_DOMAIN} skipped/failed — confirm DNS A records"
  sudo nginx -t && sudo systemctl reload nginx
elif [[ -n "$SITE_DOMAIN" && -n "$LETSENCRYPT_EMAIL" ]]; then
  log "Attempting Let's Encrypt for ${SITE_DOMAIN}"
  sudo apt-get install -y certbot python3-certbot-nginx
  sudo certbot --nginx \
    -d "$SITE_DOMAIN" \
    --non-interactive \
    --agree-tos \
    -m "$LETSENCRYPT_EMAIL" \
    --redirect || log "Certbot skipped/failed — confirm DNS A records"
fi

if [[ "$SEED_CONTENT" == "true" ]]; then
  log "Waiting for Strapi seed, then disabling SEED_CONTENT for subsequent boots"
  sleep 12
  sed -i 's/^SEED_CONTENT=.*/SEED_CONTENT=false/' "$APP_DIR/cms/.env" || true
  pm2 restart santamar-cms --update-env || true
fi

log "Bootstrap complete"
pm2 status
curl -sS -o /dev/null -w "CMS /admin -> %{http_code}\n" http://127.0.0.1:1337/admin || true
curl -sS -o /dev/null -w "Web /en    -> %{http_code}\n" http://127.0.0.1:3000/en || true

if [[ "${warn_mysql:-0}" == "1" ]]; then
  echo "NOTE: MariaDB user password is change-me-now — update cms/.env DATABASE_PASSWORD and MySQL user ASAP."
fi
