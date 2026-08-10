/**
 * PM2 process file for Santamar on a LAMP host (Apache reverse-proxy + MySQL).
 *
 * Usage (from repo root on the server):
 *   pm2 start deploy/ecosystem.config.js
 *   pm2 save && pm2 startup
 *
 * Prefer putting secrets in cms/.env and frontend/.env.production rather than
 * hard-coding passwords here. Values below are sane defaults / placeholders.
 */
module.exports = {
  apps: [
    {
      name: 'santamar-cms',
      cwd: '/var/www/santamar/cms',
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
        // Override in cms/.env — keep in sync with Apache ServerName
        // PUBLIC_URL: 'https://cms.santamar.example',
        // FRONTEND_URL: 'https://santamar.example',
        DATABASE_CLIENT: 'mysql',
        DATABASE_HOST: '127.0.0.1',
        DATABASE_PORT: 3306,
        DATABASE_NAME: 'santamar_cms',
        DATABASE_USERNAME: 'santamar',
        DATABASE_PASSWORD: 'change-me',
        SEED_CONTENT: 'false',
      },
    },
    {
      name: 'santamar-web',
      cwd: '/var/www/santamar/frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        PORT: 3000,
        // Must match the public CMS URL used at `next build` time
        // NEXT_PUBLIC_STRAPI_URL is baked in at build — set before building
      },
    },
  ],
};
