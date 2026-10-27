# Static frontend on classic LAMP (Apache DocumentRoot)

Use this when you want the **public site as static HTML** on Apache (no Node for the frontend).

Two builds:

| Command | Content source | What the LAMP host needs |
| --- | --- | --- |
| `npm run build:web:static:local` | Laptop Strapi (`cms/.tmp/data.db` + `cms/public/uploads`) | DocumentRoot only. Media is copied into `out/uploads`. |
| `npm run build:web:static` | Public CMS URL (`deploy/digitalocean/frontend.env` or `NEXT_PUBLIC_STRAPI_URL`) | DocumentRoot, plus a reachable Strapi for `/uploads` (and any live API calls). |

The remote-CMS path is documented below. The local-CMS path is the next section.

> The default production path remains **Node `next start`** (ISR + middleware). See [DEPLOY-LAMP.md](DEPLOY-LAMP.md) for reverse-proxy mode.

## Local CMS → static DocumentRoot

Use this when the content you want on the LAMP host is the **local** Strapi build (SQLite at `cms/.tmp/data.db` and files in `cms/public/uploads`), not the DigitalOcean droplet.

```bash
# From the repo root. Starts the local CMS if it is not already on :1337.
npm run build:web:static:local
```

What it does:

1. Uses Strapi at `http://127.0.0.1:1337` if it is already running (`npm run dev` or `npm start`). If nothing is listening, it runs `npm run build` in `cms/` and `npm start`, then stops that process when the export finishes.
2. Static-exports the frontend against that API (`LAMP_CMS=local`), and does **not** load `deploy/digitalocean/frontend.env`.
3. Copies `cms/public/uploads` to `frontend/out/uploads`.
4. Rewrites baked `http://127.0.0.1:1337` media URLs to same-origin `/uploads/…`.

Upload the contents of `frontend/out/` to the Apache DocumentRoot (same vhost as the next section). After CMS edits, run the command again and re-upload `out/`.

Pin a site other than the primary (localhost resolves to the primary site):

```bash
SITE_KEY=santamar npm run build:web:static:local
# or
LAMP_SITE_HOSTNAME=www.example.com npm run build:web:static:local
```

`SITE_HOSTNAME` inherited from a DigitalOcean `frontend.env` is ignored so the local database is not queried for the droplet host.

---

## Remote CMS → static DocumentRoot

Use this when the live site should keep calling a public Strapi (droplet or `cms.` subdomain) for media. `npm run build:web:static` loads `deploy/digitalocean/frontend.env` when `NEXT_PUBLIC_STRAPI_URL` is not already exported.

```
Internet
   │
   ├─ https://www.example.com     Apache DocumentRoot = frontend/out/   (static)
   └─ https://cms.example.com     Node/PM2 Strapi :1337                 (API + admin)
```

## Trade-offs

| | Node (`next start`) | Static (`build:static`) |
| --- | --- | --- |
| Hosting | Apache → proxy → Node | Apache DocumentRoot only |
| CMS updates | ISR (~60s) | **Rebuild + re-upload `out/`** |
| Locale redirect | Next middleware | `.htaccess` |
| Images | Optional optimizer | `unoptimized` |

---

## 1. Build on a machine that can reach Strapi

```bash
cd frontend
# Public CMS URL baked into HTML/JS (and used at build time to fetch pages)
export NEXT_PUBLIC_STRAPI_URL=https://cms.example.com
export NEXT_PUBLIC_ENABLE_THEME_SWITCHER=false

npm ci
npm run build:static
```

Or from the monorepo root:

```bash
NEXT_PUBLIC_STRAPI_URL=https://cms.example.com npm run build:web:static
```

Output: **`frontend/out/`** (includes `.htaccess` + `_lamp/` utilities).

The build script temporarily disables `src/middleware.ts` (required for `output: 'export'`).

---

## 2. Apache — static site vhost

```apache
<VirtualHost *:443>
  ServerName www.example.com
  DocumentRoot /var/www/santamar-web

  <Directory /var/www/santamar-web>
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted
  </Directory>
</VirtualHost>
```

```bash
sudo a2enmod rewrite headers
# upload contents of frontend/out/ → /var/www/santamar-web/
sudo systemctl reload apache2
```

Routing is provided by `out/.htaccess` (from `deploy/lamp-static/frontend.htaccess`):

- `/` → `/en/`
- `/en/about/` → `en/about/index.html`

---

## 3. Cross-origin access to the CMS subdomain

### Preferred — Strapi CORS

In `cms/.env` on the API host:

```bash
FRONTEND_URL=https://www.example.com
FRONTEND_URLS=https://www.example.com,https://example.com
PUBLIC_URL=https://cms.example.com
```

Restart Strapi. Browser requests from the static site to `https://cms.example.com/api/...` and `/uploads/...` will be allowed.

### Optional — Apache CORS on the CMS vhost

See [`deploy/lamp-static/cms-cors.htaccess`](../deploy/lamp-static/cms-cors.htaccess). Edit the `SetEnvIf Origin` patterns to match your site, then include/merge into the CMS VirtualHost (`a2enmod headers`).

### Optional — same-origin PHP proxy

If you cannot change Strapi CORS (or want `/api` on the www host):

1. Edit `out/_lamp/api-proxy.php` — set `$strapiOrigin` / `STRAPI_ORIGIN`.
2. Uncomment the `api-proxy` rewrite in `out/.htaccess`.
3. Rebuild with `NEXT_PUBLIC_STRAPI_URL=https://www.example.com` so the site calls same-origin `/api/...`.

Also ships: `cors-headers.inc.php` for any custom PHP endpoints on the frontend host.

---

## 4. Redeploy after content changes

Static HTML is generated at build time. After CMS edits:

```bash
NEXT_PUBLIC_STRAPI_URL=https://cms.example.com npm run build:web:static
# rsync frontend/out/ to the DocumentRoot
```

---

## Files

| Path | Role |
| --- | --- |
| `frontend/scripts/build-static.cjs` | Static export orchestrator (`LAMP_CMS=local` vendors uploads) |
| `deploy/lamp-static/build-local.sh` | `npm run build:web:static:local` — local CMS → `frontend/out/` |
| `deploy/lamp-static/frontend.htaccess` | Copied to `out/.htaccess` |
| `deploy/lamp-static/cms-cors.htaccess` | CMS subdomain CORS fragment |
| `deploy/lamp-static/api-proxy.php` | Optional www→cms API proxy |
| `deploy/lamp-static/cors-headers.inc.php` | PHP CORS helper |

## Multi-site note

Static export is **one site per build**. Set `SITE_KEY` and/or `SITE_HOSTNAME` at build time so Strapi queries target the correct Site. Hostname multi-tenancy requires the Node (`next start`) path — see [MULTI-SITE.md](./MULTI-SITE.md).
| `cms/config/middlewares.ts` | `FRONTEND_URL` + `FRONTEND_URLS` CORS |
