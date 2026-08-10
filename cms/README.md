# Santamar CMS (Strapi 5)

Content API and admin for the Santamar hospitality site.

## Local development

```bash
cp .env.example .env
npm install
npm run develop
```

Admin: http://localhost:1337/admin

Default database is **SQLite** (`.tmp/data.db`). Set `SEED_CONTENT=false` to skip bootstrap seed content.

## Production (LAMP)

Use **MySQL** + Apache reverse-proxy + PM2. Full instructions:

→ **[../docs/DEPLOY-LAMP.md](../docs/DEPLOY-LAMP.md)**

Key production env vars: `DATABASE_CLIENT=mysql`, `PUBLIC_URL`, `FRONTEND_URL`, `PROXY_KOA=true`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run develop` | Dev server with reload |
| `npm run build` | Build admin panel |
| `npm run start` | Production server |

## Deploy helpers

Canonical copies live in [`../deploy/`](../deploy/). Legacy paths under `deploy/` in this folder still work for MySQL SQL and Apache CMS vhost.
