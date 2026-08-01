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

1. **Title**
2. **Styled copy** (Strapi Blocks)
3. **Slideshows** (images or videos + captions)
4. **Custom components** via a Dynamic Zone (`sections`)

### Available Dynamic Zone components

- `blocks.hero`
- `blocks.rich-text`
- `blocks.feature-grid`
- `blocks.media-gallery`
- `blocks.location-map`
- `blocks.booking-cta`
- `blocks.contact-form`
- `blocks.video-embed`

## Quick start

### Requirements

- Node.js **20.x** (recommended for Strapi)
- npm 10+

### 1. CMS

```bash
cd cms
cp .env.example .env   # if needed
npm install
npm run develop
```

Admin: [http://localhost:1337/admin](http://localhost:1337/admin)

On first boot the bootstrap seed:

- Creates locales `en`, `es`, `pt`
- Creates the site pages above
- Creates Navigation + Global settings
- Opens Public API permissions for pages / navigation / global

Set `SEED_CONTENT=false` to skip seeding.

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Site: [http://localhost:3000](http://localhost:3000) → redirects to `/en`.

### Theme switching (dev)

Three visual themes share the same components and layout tokens (`theme.layout`):

| ID | Character |
| --- | --- |
| `coastal` | Atlantic teal, glass header, pill CTAs (default) |
| `harbor` | Ink & brass, solid header, squared chrome |
| `dune` | Warm sand & olive, minimal header, soft editorial rhythm |

Fonts: **Ledger** (headlines) + **Instrument Sans** (body).

While developing, set `NEXT_PUBLIC_ENABLE_THEME_SWITCHER=true` in `frontend/.env.local`. Use the floating Theme dropdown (bottom-right), hide it with the ✕, and restore with **Alt+Shift+T**. Storybook exposes the same themes via the toolbar paintbrush control.

### 3. Storybook


```bash
cd frontend
npm run storybook
```

### 4. GSAP bonus

Club GreenSock package is committed as root `gsap-bonus.tgz` and installed into the frontend as the `gsap` dependency (includes `SplitText`, `ScrollSmoother`, etc.). Helpers live in `frontend/src/lib/gsap.ts`.

## LAMP deployment (CMS)

Strapi is a Node app. On a LAMP host:

1. Create MySQL DB/user — see `cms/deploy/mysql-setup.sql`
2. Set `DATABASE_CLIENT=mysql` and credentials in `cms/.env`
3. Build: `npm run build && npm run start` (or PM2 via `cms/deploy/ecosystem.config.js`)
4. Reverse-proxy with Apache — `cms/deploy/apache-strapi.conf`

Apache still serves as the public HTTP layer; Node/PM2 runs Strapi behind it; MySQL is the data store.

## Content model notes

- **Page** — localized collection; primary front-end document
- **Navigation** — localized single type of nav items
- **Global** — brand, contact, default SEO

Front-end fetches published content with deep `populate` for slideshows and dynamic sections (`frontend/src/lib/strapi.ts`). If the CMS is offline, fallback nav/pages keep the framework browsable.

## Designer / developer workflow

1. **Designer** — define section compositions in Storybook (`Hero`, `Slideshow`, `StyledCopy`, `ContactForm`)
2. **Editor** — assemble the same components in Strapi Dynamic Zone per locale
3. **Developer** — map new Strapi components in `DynamicSections.tsx` + matching `cms/src/components/blocks/*.json`
