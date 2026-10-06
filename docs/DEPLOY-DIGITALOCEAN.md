# Deploy Strapi CMS to DigitalOcean

This guide deploys **only the Strapi backend** to a DigitalOcean droplet using [`deploy/digitalocean/`](../deploy/digitalocean/). The **frontend is built locally** (pointed at the droplet CMS URL) and uploaded **via FTP** to your static host.

```
You (laptop)
   │  doctl + rsync + ssh
   ▼
DigitalOcean droplet (Ubuntu 22.04)
   ├─ Nginx :80/:443  →  Strapi :1337
   ├─ PM2: santamar-cms
   └─ SQLite (default)

Frontend (separate)
   npm run build:web:static   ← NEXT_PUBLIC_STRAPI_URL from deploy/digitalocean/frontend.env
   FTP upload frontend/out/   ← your web host DocumentRoot
```

## Prerequisites (local machine)

### 1. Install tools

| Tool | macOS | Notes |
| --- | --- | --- |
| **doctl** | `brew install doctl` | [DigitalOcean CLI](https://docs.digitalocean.com/reference/doctl/how-to/install/) |
| **jq** | `brew install jq` | JSON parsing |
| **rsync** / **ssh** / **openssl** | built-in | Sync + remote bootstrap |

```bash
doctl version
jq --version
rsync --version
ssh -V
```

### 2. Authenticate with DigitalOcean

1. Create a [DigitalOcean account](https://cloud.digitalocean.com/).
2. Create an API token: **API → Tokens → Generate New Token** (read/write).
3. Authenticate locally:

```bash
doctl auth init
# paste the API token when prompted
doctl account get
```

Optional named context:

```bash
doctl auth init --context santamar
# then set DOCTL_CONTEXT=santamar in do.env
```

### 3. SSH key on DigitalOcean

Generate a key if you do not have one:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -C "santamar-do"
```

Upload the **public** key to DigitalOcean:

```bash
doctl compute ssh-key import santamar --public-key-file ~/.ssh/id_ed25519.pub
doctl compute ssh-key list
```

Copy the key **ID** or **Fingerprint** into `DO_SSH_KEY_ID` in `do.env`.

Set `SSH_KEY_PATH` to the matching **private** key (`~/.ssh/id_ed25519`) and `chmod 400` it.

### 4. Configure deploy env

```bash
cp deploy/digitalocean/do.env.example deploy/digitalocean/do.env
# edit deploy/digitalocean/do.env
```

Important fields:

| Variable | Purpose |
| --- | --- |
| `DO_SSH_KEY_ID` | SSH key id/fingerprint from `doctl compute ssh-key list` |
| `DROPLET_NAME` | Reused across deploys; created if missing |
| `REGION` / `SIZE` | e.g. `nyc3` / `s-1vcpu-1gb` |
| `FRONTEND_URL` / `FRONTEND_URLS` | Public site origin(s) for Strapi CORS (your FTP host) |
| `CMS_DOMAIN` | Optional DNS name for the CMS (enables HTTPS with certbot) |
| `PRIMARY_HOSTNAME` | Hostname for the seeded primary Site (usually your public site host) |

`do.env` and deploy state are gitignored — do not commit them.

## Deploy CMS

From the **repo root**:

```bash
chmod +x deploy/digitalocean/deploy.sh
./deploy/digitalocean/deploy.sh
```

Or:

```bash
npm run deploy:do-cms
```

What the script does:

1. Authenticates with `doctl`
2. Finds droplet by saved id / name, or **creates** one
3. Waits for SSH
4. `rsync`s `cms/` (+ nginx/bootstrap helpers)
5. On the droplet: Node 20, Nginx, PM2, `npm ci && npm run build`, start Strapi
6. Writes [`deploy/digitalocean/frontend.env`](../deploy/digitalocean/frontend.env) with `NEXT_PUBLIC_STRAPI_URL` pointing at the droplet

First run: open `http://<DROPLET_IP>/admin` and create the Strapi admin user.

## Push local CMS content (SQLite + uploads)

`deploy.sh` syncs **code only** — it excludes `cms/.tmp/` (the database). The droplet therefore starts with thin bootstrap seed pages, not the authored content and media from your laptop.

To copy your local Strapi data up:

```bash
# Preview
./deploy/digitalocean/migrate-cms-data.sh push --dry-run

# Push DB + uploads (backs up remote first, stops PM2, patches Site.hostname
# from PRIMARY_HOSTNAME in do.env, then restarts)
./deploy/digitalocean/migrate-cms-data.sh push
```

Then rebuild and FTP the frontend so the static site bakes the imported content:

```bash
npm run build:web:static
# Confirm before upload:
#   rg 'Palm trees|Welcome to Santamar' frontend/out/en/index.html
# upload frontend/out/ to your FTP DocumentRoot
```

`build:static` loads `deploy/digitalocean/frontend.env` (so `frontend/.env.local` cannot point the bake at localhost) and clears `frontend/.next` so a prior fetch cache cannot keep serving seed/fallback HTML.

## Point the frontend at the droplet (FTP path)

The CMS deploy does **not** upload the Next app. After a successful deploy:

```bash
# Load the generated CMS URL
set -a && source deploy/digitalocean/frontend.env && set +a

# Build static export for Apache/FTP DocumentRoot
npm run build:web:static
```

Then upload the contents of `frontend/out/` to your FTP host (see [DEPLOY-LAMP-STATIC.md](./DEPLOY-LAMP-STATIC.md)).

`frontend.env` looks like:

```bash
NEXT_PUBLIC_STRAPI_URL=http://203.0.113.10   # or https://cms.example.com
NEXT_PUBLIC_ENABLE_THEME_SWITCHER=false
```

Update `FRONTEND_URL` / `FRONTEND_URLS` in `do.env` to that live site origin and re-run `./deploy/digitalocean/deploy.sh` so Strapi CORS allows browser calls from the FTP host.

## Optional HTTPS for the CMS

1. Create a DNS **A** record: `cms.example.com` → droplet public IP  
2. Set in `do.env`:

```bash
CMS_DOMAIN=cms.example.com
LETSENCRYPT_EMAIL=you@example.com
```

3. Re-run `./deploy/digitalocean/deploy.sh`  
4. Rebuild the static frontend so `NEXT_PUBLIC_STRAPI_URL` becomes `https://cms.example.com`

## Useful commands

```bash
# Droplet status
doctl compute droplet list

# SSH in
ssh -i ~/.ssh/id_ed25519 root@$(grep PUBLIC_IP= deploy/digitalocean/.deploy-state | cut -d= -f2)

# On the droplet
pm2 status
pm2 logs santamar-cms
tail -f /var/log/nginx/error.log

# Re-deploy after CMS code changes (same droplet)
./deploy/digitalocean/deploy.sh
```

## Notes

- Default DB is **SQLite** on the droplet (`cms/.tmp/data.db`). Uploads live in `cms/public/uploads` (preserved across rsync).
- Small droplets get a swapfile during bootstrap so the Strapi admin build does not OOM.
- Destroying the droplet deletes the SQLite DB unless you back it up first (`scp` the `.tmp` and `uploads` directories).
- This path is **CMS-only**. For full-stack AWS single-host deploys, see [DEPLOY-AWS.md](./DEPLOY-AWS.md).
