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
const doFrontendEnv = path.join(repoRoot, 'deploy', 'digitalocean', 'frontend.env');

function log(message) {
  console.log(`\n==> ${message}`);
}

function warn(message) {
  console.warn(`\nWARN: ${message}`);
}

/** Parse KEY=VALUE lines (ignores comments/blank). Does not expand $vars. */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
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

  // frontend/.env.local points at local Strapi for `next dev`. Next will not
  // override keys already present in the process env, so we inject
  // deploy/digitalocean/frontend.env here (shell exports still win).
  const fromDoEnv = parseEnvFile(doFrontendEnv);
  const buildEnv = {
    ...process.env,
    STATIC_EXPORT: 'true',
  };
  for (const [key, value] of Object.entries(fromDoEnv)) {
    if (process.env[key] === undefined || process.env[key] === '') {
      buildEnv[key] = value;
    }
  }

  const strapiUrl = (buildEnv.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
  log(
    `Building static export → Strapi ${strapiUrl || '(unset)'} · SITE_HOSTNAME=${
      buildEnv.SITE_HOSTNAME || '(unset)'
    } · SITE_KEY=${buildEnv.SITE_KEY || '(unset)'}`,
  );

  if (!strapiUrl || /localhost|127\.0\.0\.1/.test(strapiUrl)) {
    warn(
      'NEXT_PUBLIC_STRAPI_URL looks local. Static pages will bake fallback/seed content if the droplet CMS is not used. Set deploy/digitalocean/frontend.env or export NEXT_PUBLIC_STRAPI_URL to the CMS.',
    );
  }

  // Drop previous Data Cache so CMS edits are not served from `.next/cache`.
  const nextDir = path.join(frontendRoot, '.next');
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    log('Cleared frontend/.next (avoids stale Strapi fetch cache)');
  }

  const result = spawnSync('npx', ['next', 'build'], {
    cwd: frontendRoot,
    stdio: 'inherit',
    env: buildEnv,
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    restoreMiddleware();
    process.exit(result.status ?? 1);
  }

  if (!fs.existsSync(outDir)) {
    throw new Error(`Expected static output at ${outDir}`);
  }

  const homeHtml = path.join(outDir, 'en', 'index.html');
  if (fs.existsSync(homeHtml)) {
    const html = fs.readFileSync(homeHtml, 'utf8');
    if (html.includes('Welcome to Santamar — coastal calm')) {
      warn(
        'frontend/out/en/index.html still contains fallback home copy. CMS fetch likely failed or pointed at the wrong Strapi. Fix NEXT_PUBLIC_STRAPI_URL / SITE_HOSTNAME and rebuild before FTP.',
      );
    } else {
      log('Home HTML does not look like fallback seed copy');
    }
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
