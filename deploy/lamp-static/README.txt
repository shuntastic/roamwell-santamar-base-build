Santamar — static LAMP frontend utilities
========================================

This folder is copied into DocumentRoot/_lamp/ by `npm run build:static`.

Files
-----
- api-proxy.php        Optional same-origin proxy to Strapi on another subdomain
- cors-headers.inc.php Helper for custom PHP endpoints that need CORS
- README.txt           This file

Preferred CORS setup (no PHP proxy)
-----------------------------------
On the CMS host, set in cms/.env:

  FRONTEND_URL=https://www.your-site.example
  FRONTEND_URLS=https://www.your-site.example,https://your-site.example

Rebuild/restart Strapi. The static site calls NEXT_PUBLIC_STRAPI_URL directly.

Optional Apache CORS on the CMS vhost
-------------------------------------
See deploy/lamp-static/cms-cors.htaccess

Optional same-origin /api proxy
-------------------------------
1. Edit _lamp/api-proxy.php — set STRAPI_ORIGIN (or Apache SetEnv STRAPI_ORIGIN).
2. In DocumentRoot .htaccess uncomment:

     RewriteRule ^api/(.*)$ /_lamp/api-proxy.php?path=$1 [QSA,L]

3. Point the frontend build at the *site* origin instead of the CMS host:

     NEXT_PUBLIC_STRAPI_URL=https://www.your-site.example npm run build:static

   (Strapi paths are /api/... so the proxy must live on that same host.)
