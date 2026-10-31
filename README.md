# Santamar — Website Framework

Monorepo for a custom CMS-driven hospitality site.

| App | Stack | Role |
| --- | --- | --- |
| `cms/` | Strapi 5 + SQLite (local) / MySQL (LAMP) | Content API, admin, i18n |
| `frontend/` | Next.js 16 + React + MUI + Storybook + GSAP Club | Public site |

## Site map (CMS pages)

- Home (`/`)
- Accommodations
- Location
- Things To Do
- Book Your Stay
- About
- Contact — localized **EN / ES / PT**

Each page supports:

1. **Title** + SEO
2. **Dynamic Zone `sections`** (hero, statement, image-text, contact form, etc.)
3. Optional media via section components (e.g. media-gallery)

### Available Dynamic Zone components

- `blocks.hero`
- `blocks.rich-text` (optional 0–3 CTA buttons below the copy)
- `blocks.statement` (optional 0–3 CTA buttons below the copy)
- `blocks.image-text`
- `blocks.feature-grid`
- `blocks.media-gallery`
- `blocks.media-grid` (filterable image and video grid with lightbox)
- `blocks.location-map`
- `blocks.booking-cta`
- `blocks.booking-calendar` (paste Hostaway calendar embed)
- `blocks.booking-search` (paste Hostaway search bar embed)
- `blocks.contact-form`
- `blocks.production-inquiry-form` (emails each submission to the block's recipients and saves it under **Production Inquiries**; configure `EMAIL_FROM` / `SMTP_*` in `cms/.env`)
- `blocks.cta-buttons` (centered row of 1–3 buttons: label, URL, new tab, size, style — the same `shared.cta-button` component used by Statement and Rich Text)
- `blocks.modal-button`
- `blocks.video-embed`

## Quick start

### Requirements

- Node.js **20.x** (recommended for Strapi)
- npm 10+

### Start everything (recommended)

From the repo root:

```bash
npm run dev
# or: ./scripts/dev.sh
# optional: npm run dev:all   # also Storybook on :6006
# optional: ./scripts/dev.sh --install
```

That script copies missing env files from the examples, installs `cms/` + `frontend/` deps when needed, then starts:

| App | URL |
| --- | --- |
| Strapi CMS | [http://localhost:1337](http://localhost:1337) — admin at `/admin` |
| Next.js site | [http://localhost:3000](http://localhost:3000) → `/en` |
| Storybook (with `--storybook` / `dev:all`) | [http://localhost:6006](http://localhost:6006) |

Ctrl+C stops all processes.

### Manual (one app at a time)

```bash
# CMS
cd cms && cp .env.example .env   # if needed
npm install && npm run develop

# Frontend (separate terminal)
cd frontend && cp .env.example .env.local
npm install && npm run dev
```

On first CMS boot the bootstrap seed:

- Creates locales `en`, `es`, `pt`
- Creates the primary **Site** (`santamar`, hostname from `PRIMARY_HOSTNAME`, default `localhost`)
- Creates site-scoped pages + Navigation (brand fields live on Site; Global is deprecated)
- Opens Public API permissions for pages / navigation / sites

See [docs/MULTI-SITE.md](docs/MULTI-SITE.md) for secondary sites, hostnames, CORS, and `single_page` templates.

Set `SEED_CONTENT=false` to skip seeding.

### Theme switching (dev)

Three visual themes share the same components and layout tokens (`theme.layout`):

| ID | Character |
| --- | --- |
| `coastal` | Atlantic teal, glass header, pill CTAs (default) |
| `harbor` | Ink & brass, solid header, squared chrome |
| `dune` | Warm sand & olive, minimal header, soft editorial rhythm |

Fonts: **[Bentham](https://fonts.google.com/specimen/Bentham)** (headlines) + **Instrument Sans** (body).

While developing, set `NEXT_PUBLIC_ENABLE_THEME_SWITCHER=true` in `frontend/.env.local`. Use the floating Theme dropdown (bottom-right), hide it with the ✕, and restore with **Alt+Shift+T**. Storybook exposes the same themes via the toolbar paintbrush control.

### 3. Storybook


```bash
cd frontend
npm run storybook
```

### 4. GSAP bonus

Club GreenSock package is committed as root `gsap-bonus.tgz` and installed into the frontend as the `gsap` dependency (includes `SplitText`, `ScrollSmoother`, etc.). Helpers live in `frontend/src/lib/gsap.ts`.

## Deployment

| Target | Guide |
| --- | --- |
| **Multi-site (hosts + templates)** | **[docs/MULTI-SITE.md](docs/MULTI-SITE.md)** — Sites, CORS, `multi_page` / `single_page` |
| **DigitalOcean (CMS only)** | **[docs/DEPLOY-DIGITALOCEAN.md](docs/DEPLOY-DIGITALOCEAN.md)** — `./deploy/digitalocean/deploy.sh` + FTP frontend |
| **AWS Free Tier (EC2)** | **[docs/DEPLOY-AWS.md](DEPLOY-AWS.md)** — `./deploy/aws/deploy.sh` |
| **LAMP (Node reverse-proxy)** | **[docs/DEPLOY-LAMP.md](docs/DEPLOY-LAMP.md)** — Apache → PM2 Next + Strapi |
| **LAMP (static DocumentRoot)** | **[docs/DEPLOY-LAMP-STATIC.md](docs/DEPLOY-LAMP-STATIC.md)** — `npm run build:web:static` (remote CMS) or `npm run build:web:static:local` (laptop CMS + uploads) → `frontend/out/` |

### Static frontend on Apache (no Node for the site)

From a **remote** CMS (DigitalOcean `frontend.env` or an explicit URL):

```bash
NEXT_PUBLIC_STRAPI_URL=https://cms.example.com npm run build:web:static
# upload frontend/out/ (includes .htaccess) to the site DocumentRoot
# set cms/.env FRONTEND_URL / FRONTEND_URLS to the www origin for CORS
```

From the **local** CMS database and uploads (self-contained DocumentRoot; no live Strapi on the server):

```bash
npm run build:web:static:local
# upload frontend/out/ — pages plus /uploads/ from cms/public/uploads
```

### AWS Free Tier (quick start)

```bash
# Prerequisites: AWS CLI v2, jq, rsync, SSH; `aws configure` completed
cp deploy/aws/aws.env.example deploy/aws/aws.env
# edit deploy/aws/aws.env (region, SSH_CIDR, etc.)
chmod +x deploy/aws/deploy.sh deploy/aws/bootstrap-remote.sh
./deploy/aws/deploy.sh
```

### LAMP Node reverse-proxy (quick path)

1. MySQL — `deploy/mysql-setup.sql`
2. CMS `.env` — `DATABASE_CLIENT=mysql`, `PUBLIC_URL`, `FRONTEND_URL`, secrets
3. `cd cms && npm ci && npm run build` then PM2
4. Frontend — set `NEXT_PUBLIC_STRAPI_URL` to the **public** CMS URL, then `npm ci && npm run build`
5. `pm2 start deploy/ecosystem.config.js`
6. Apache — `deploy/apache-web.conf` + `deploy/apache-cms.conf` (+ certbot)

Artifacts: [`deploy/`](deploy/), [`deploy/lamp-static/`](deploy/lamp-static/), [`deploy/aws/`](deploy/aws/).

## Content model notes

- **Site** — hostname-keyed tenant; brand/contact/SEO; `multi_page` or `single_page` template; `coastal` / `harbor` / `dune` theme
- **Page** — localized collection scoped to a Site; primary front-end document
- **Navigation** — localized collection scoped to a Site (nav items support page or section targets)
- **Global** — deprecated; brand fields live on Site

Use **Provision site** in the Strapi admin to create a secondary Site (template + theme), starter content, and a Next deployment pack under `sites/<key>/`. See [docs/MULTI-SITE.md](docs/MULTI-SITE.md).

Front-end resolves the Site from `Host` (or pinned `SITE_KEY`), then fetches published content with deep `populate` for dynamic sections (`frontend/src/lib/strapi.ts`). Populate keys must match the page schema — unknown keys make Strapi 5 return 400. If the CMS is offline, fallback nav/pages keep the framework browsable.

## Designer / developer workflow

1. **Designer** — define section compositions in Storybook (`Hero`, `Slideshow`, `StyledCopy`, `ContactForm`)
2. **Editor** — assemble the same components in Strapi Dynamic Zone per locale
3. **Developer** — map new Strapi components in `DynamicSections.tsx` + matching `cms/src/components/blocks/*.json`
