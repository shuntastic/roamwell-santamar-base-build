# Deploy Santamar on a LAMP host

Santamar is **not** a PHP application. On a classic LAMP server:

| Layer | Role |
| --- | --- |
| **Linux** | Host OS |
| **Apache** | TLS termination + reverse proxy to Node |
| **MySQL** | Strapi database |
| **Node.js 20.x + PM2** | Runs Strapi (CMS) and Next.js (site) |
| **PHP** | Not used |

```
Internet
   │
   ▼
Apache (80/443)
   ├─ https://santamar.example      → 127.0.0.1:3000  (Next.js)
   └─ https://cms.santamar.example  → 127.0.0.1:1337  (Strapi)
                                         │
                                         ▼
                                      MySQL
                                         +
                               cms/public/uploads (disk)
```

Do **not** point Apache `DocumentRoot` at `frontend/out` or `.next`. Locale middleware and ISR require `next start`.

---

## 1. Server prerequisites

```bash
# Node 20 (required by root package.json engines)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Apache proxy modules + MySQL + PM2
sudo apt-get install -y apache2 mysql-server
sudo a2enmod proxy proxy_http headers rewrite ssl
sudo npm install -g pm2
```

Clone or rsync the monorepo to the server, e.g. `/var/www/santamar`.  
Ensure `gsap-bonus.tgz` is present at the repo root (frontend depends on `file:../gsap-bonus.tgz`).

DNS:

- `santamar.example` → public site  
- `cms.santamar.example` → Strapi admin + API + `/uploads`

---

## 2. MySQL

```bash
sudo mysql < /var/www/santamar/deploy/mysql-setup.sql
```

Change the default password (`change-me`) before production, then use the same credentials in `cms/.env`.

---

## 3. Configure CMS (`cms/.env`)

```bash
cd /var/www/santamar/cms
cp .env.example .env
# edit .env — generate real secrets; never ship the example salts
```

Production essentials:

| Variable | Example |
| --- | --- |
| `HOST` | `127.0.0.1` |
| `PORT` | `1337` |
| `PUBLIC_URL` | `https://cms.santamar.example` |
| `FRONTEND_URL` | `https://santamar.example` |
| `PROXY_KOA` | `true` |
| `DATABASE_CLIENT` | `mysql` |
| `DATABASE_HOST` | `127.0.0.1` |
| `DATABASE_NAME` | `santamar_cms` |
| `DATABASE_USERNAME` | `santamar` |
| `DATABASE_PASSWORD` | *(your password)* |
| `SEED_CONTENT` | `true` on first boot, then `false` |
| `APP_KEYS` / JWT / salts | Unique values |

`PUBLIC_URL` + `proxy.koa` are required so Strapi trusts Apache’s `X-Forwarded-Proto` (admin login / cookies behind HTTPS).

Build and first start (seed once):

```bash
cd /var/www/santamar/cms
npm ci
npm run build
SEED_CONTENT=true npm start   # first run only — creates locales/pages/permissions
# Ctrl+C, set SEED_CONTENT=false in .env for subsequent starts
```

Public Content API permissions are ensured on every boot (even when seed is off).

Uploads live in `cms/public/uploads/` — back this directory up; it is not in git.

---

## 4. Configure & build frontend

```bash
cd /var/www/santamar/frontend
cp .env.example .env.production
```

Set **before** build (values are inlined into the client bundle):

```bash
# frontend/.env.production
NEXT_PUBLIC_STRAPI_URL=https://cms.santamar.example
NEXT_PUBLIC_ENABLE_THEME_SWITCHER=false
```

```bash
npm ci
npm run build
# Smoke-test locally on the server:
HOSTNAME=127.0.0.1 PORT=3000 npm start
```

If you change the CMS public URL later, **rebuild** the frontend.

---

## 5. PM2

```bash
cd /var/www/santamar
# Edit deploy/ecosystem.config.js paths/passwords if needed
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup   # follow the printed systemd command
pm2 status
```

Apps:

- `santamar-cms` → `127.0.0.1:1337`  
- `santamar-web` → `127.0.0.1:3000`

Reload after deploys:

```bash
cd /var/www/santamar/cms && npm ci && npm run build && pm2 restart santamar-cms
cd /var/www/santamar/frontend && npm ci && npm run build && pm2 restart santamar-web
```

---

## 6. Apache

```bash
sudo cp /var/www/santamar/deploy/apache-web.conf /etc/apache2/sites-available/santamar-web.conf
sudo cp /var/www/santamar/deploy/apache-cms.conf  /etc/apache2/sites-available/santamar-cms.conf
# Edit ServerName values to your domains
sudo a2ensite santamar-web santamar-cms
sudo apache2ctl configtest
sudo systemctl reload apache2

# TLS
sudo certbot --apache -d santamar.example -d cms.santamar.example
```

After TLS, set `RequestHeader X-Forwarded-Proto "https"` (see commented blocks in the conf files) and ensure `PUBLIC_URL` / `FRONTEND_URL` / `NEXT_PUBLIC_STRAPI_URL` use `https://`.

---

## 7. Verification checklist

| Check | Expect |
| --- | --- |
| `curl -I https://cms.santamar.example/admin` | 200 / admin HTML |
| `curl "https://cms.santamar.example/api/pages?locale=en&status=published"` | JSON `data` array (not 403) |
| `curl -I https://santamar.example/en` | 200 |
| Home page content | Matches Strapi (not only fallback copy) |
| Upload an image in Strapi | Appears under `/uploads/...` on the CMS host |
| Admin login over HTTPS | Session persists (`PROXY_KOA` + `PUBLIC_URL`) |

If the site shows generic fallback content, the frontend cannot reach Strapi (wrong `NEXT_PUBLIC_STRAPI_URL`, CMS down, or public permissions). Check `pm2 logs santamar-cms` and browser/network for `/api/pages` status codes.

---

## 8. Why not static export / PHP DocumentRoot?

| Constraint | Implication |
| --- | --- |
| `frontend/src/middleware.ts` locale redirects | Needs Next server |
| ISR (`revalidate: 60` in `strapi.ts`) | Needs Next server |
| Strapi admin + uploads API | Needs Node |
| Dynamic Zone pages | Fetched at request time from MySQL via Strapi |

Apache’s job is TLS and reverse proxy only.

---

## Related files

| Path | Purpose |
| --- | --- |
| `deploy/ecosystem.config.js` | PM2 for CMS + web |
| `deploy/apache-web.conf` | Site vhost → `:3000` |
| `deploy/apache-cms.conf` | CMS vhost → `:1337` |
| `deploy/mysql-setup.sql` | DB + user |
| `cms/config/server.ts` | `PUBLIC_URL` + `proxy.koa` |
| `cms/config/database.ts` | sqlite / mysql switch |
| `frontend/next.config.ts` | Strapi image host allowlist |
| `cms/.env.example` / `frontend/.env.example` | Env templates |
