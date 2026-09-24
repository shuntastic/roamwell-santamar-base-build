#!/usr/bin/env node
/**
 * Static LAMP frontend build.
 *
 * - Sets STATIC_EXPORT=true (Next `output: 'export'`)
 * - Temporarily moves `src/middleware.ts` aside (incompatible with static export)
 * - Builds into `frontend/out/`
 * - Copies Apache `.htaccess` + CORS utility files into `out/`
 *
 * Usage (from repo root or frontend/):
 *   npm run build:static --prefix frontend
 *   NEXT_PUBLIC_STRAPI_URL=https://cms.example.com npm run build:static --prefix frontend
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const frontendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(frontendRoot, '..');
const middlewarePath = path.join(frontendRoot, 'src', 'middleware.ts');
const middlewareBackup = path.join(frontendRoot, 'src', 'middleware.ts.staticbak');
const outDir = path.join(frontendRoot, 'out');
const lampStaticDir = path.join(repoRoot, 'deploy', 'lamp-static');

function log(message) {
  console.log(`\n==> ${message}`);
}

function restoreMiddleware() {
  if (fs.existsSync(middlewareBackup)) {
    fs.renameSync(middlewareBackup, middlewarePath);
    log('Restored src/middleware.ts');
  }
}

process.on('SIGINT', () => {
  restoreMiddleware();
  process.exit(130);
});
process.on('uncaughtException', (error) => {
  console.error(error);
  restoreMiddleware();
  process.exit(1);
});

try {
  if (fs.existsSync(middlewarePath)) {
    fs.renameSync(middlewarePath, middlewareBackup);
    log('Disabled src/middleware.ts for static export');
  }

  log('Building static export (STATIC_EXPORT=true)');
  const result = spawnSync('npx', ['next', 'build'], {
    cwd: frontendRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      STATIC_EXPORT: 'true',
    },
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    restoreMiddleware();
    process.exit(result.status ?? 1);
  }

  if (!fs.existsSync(outDir)) {
    throw new Error(`Expected static output at ${outDir}`);
  }

  const htaccessSrc = path.join(lampStaticDir, 'frontend.htaccess');
  if (fs.existsSync(htaccessSrc)) {
    fs.copyFileSync(htaccessSrc, path.join(outDir, '.htaccess'));
    log('Copied deploy/lamp-static/frontend.htaccess → out/.htaccess');
  }

  const utilitiesDir = path.join(outDir, '_lamp');
  fs.mkdirSync(utilitiesDir, { recursive: true });
  for (const file of ['api-proxy.php', 'cors-headers.inc.php', 'README.txt']) {
    const src = path.join(lampStaticDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(utilitiesDir, file));
    }
  }
  log('Copied LAMP CORS / proxy utilities → out/_lamp/');

  log(`Static site ready: ${outDir}`);
  log('Upload the contents of frontend/out/ to your Apache DocumentRoot.');
} finally {
  restoreMiddleware();
}
