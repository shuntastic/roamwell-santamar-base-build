#!/usr/bin/env node
/**
 * Static LAMP frontend build.
 *
 * - Sets STATIC_EXPORT=true (Next `output: 'export'`)
 * - Temporarily moves `src/middleware.ts` aside (incompatible with static export)
 * - Builds into `frontend/out/`
 * - Copies Apache `.htaccess` + CORS utility files into `out/`
 *
 * Remote CMS (DigitalOcean / public Strapi URL):
 *   NEXT_PUBLIC_STRAPI_URL=https://cms.example.com npm run build:static --prefix frontend
 *   Loads deploy/digitalocean/frontend.env when those vars are unset.
 *
 * Local CMS (LAMP_CMS=local — set by deploy/lamp-static/build-local.sh):
 *   Fetches the laptop Strapi, copies cms/public/uploads into out/uploads,
 *   and rewrites media URLs to same-origin /uploads/… for Apache.
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
const localUploadsDir = path.join(repoRoot, 'cms', 'public', 'uploads');

const TEXT_EXTENSIONS = new Set([
  '.html',
  '.js',
  '.css',
  '.json',
  '.txt',
  '.xml',
  '.svg',
  '.map',
  '.webmanifest',
]);

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

function copyLocalUploads() {
  if (!fs.existsSync(localUploadsDir)) {
    warn(`No local uploads at ${localUploadsDir}. Media references may 404 on Apache.`);
    return;
  }
  const dest = path.join(outDir, 'uploads');
  fs.cpSync(localUploadsDir, dest, { recursive: true, force: true });
  log('Copied cms/public/uploads → out/uploads');
}

/**
 * Next inlines NEXT_PUBLIC_STRAPI_URL into HTML and JS. After the build,
 * drop the local origin so /uploads/… is served by Apache from DocumentRoot.
 */
function rewriteLocalMediaOrigins(origin) {
  const bare = origin.replace(/\/$/, '');
  const needles = [
    bare,
    bare.replace(/\//g, '\\/'),
    bare.replace('127.0.0.1', 'localhost'),
    bare.replace('127.0.0.1', 'localhost').replace(/\//g, '\\/'),
  ];
  const unique = [...new Set(needles.filter(Boolean))];
  let files = 0;
  let replacements = 0;

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'uploads' || entry.name === '_lamp') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
      let text = fs.readFileSync(full, 'utf8');
      let changed = 0;
      for (const needle of unique) {
        if (!text.includes(needle)) continue;
        const parts = text.split(needle);
        changed += parts.length - 1;
        text = parts.join('');
      }
      if (changed > 0) {
        fs.writeFileSync(full, text);
        files += 1;
        replacements += changed;
      }
    }
  }

  walk(outDir);
  log(`Rewrote ${replacements} local CMS origin reference(s) in ${files} file(s) → same-origin /uploads/`);
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

const localCms = process.env.LAMP_CMS === 'local';

try {
  if (fs.existsSync(middlewarePath)) {
    fs.renameSync(middlewarePath, middlewareBackup);
    log('Disabled src/middleware.ts for static export');
  }

  const buildEnv = {
    ...process.env,
    STATIC_EXPORT: 'true',
  };

  if (localCms) {
    // Do not load deploy/digitalocean/frontend.env — that file points at the droplet.
    const localUrl = (process.env.LOCAL_CMS_URL || 'http://127.0.0.1:1337').replace(/\/$/, '');
    buildEnv.NEXT_PUBLIC_STRAPI_URL = localUrl;
    if (!buildEnv.NEXT_PUBLIC_ENABLE_THEME_SWITCHER) {
      buildEnv.NEXT_PUBLIC_ENABLE_THEME_SWITCHER = 'false';
    }
    log('Local CMS mode: ignoring deploy/digitalocean/frontend.env');
  } else {
    // frontend/.env.local points at local Strapi for `next dev`. Next will not
    // override keys already present in the process env, so we inject
    // deploy/digitalocean/frontend.env here (shell exports still win).
    const fromDoEnv = parseEnvFile(doFrontendEnv);
    for (const [key, value] of Object.entries(fromDoEnv)) {
      if (process.env[key] === undefined || process.env[key] === '') {
        buildEnv[key] = value;
      }
    }
  }

  const strapiUrl = (buildEnv.NEXT_PUBLIC_STRAPI_URL || '').replace(/\/$/, '');
  log(
    `Building static export → Strapi ${strapiUrl || '(unset)'} · SITE_HOSTNAME=${
      buildEnv.SITE_HOSTNAME || '(unset)'
    } · SITE_KEY=${buildEnv.SITE_KEY || '(unset)'}`,
  );

  if (!localCms && (!strapiUrl || /localhost|127\.0\.0\.1/.test(strapiUrl))) {
    warn(
      'NEXT_PUBLIC_STRAPI_URL looks local. Static pages will bake fallback/seed content if the droplet CMS is not used. Set deploy/digitalocean/frontend.env or export NEXT_PUBLIC_STRAPI_URL to the CMS. For a self-contained LAMP site from the laptop CMS, use npm run build:web:static:local.',
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

  const homeHtmlPath = path.join(outDir, 'en', 'index.html');
  if (fs.existsSync(homeHtmlPath)) {
    const html = fs.readFileSync(homeHtmlPath, 'utf8');
    const failedRender =
      html.includes('__next_error__') || html.includes('NEXT_HTTP_ERROR_FALLBACK');
    const fallbackCopy = html.includes('Welcome to Santamar — coastal calm');
    if (failedRender || fallbackCopy) {
      const message = failedRender
        ? 'frontend/out/en/index.html is an error shell (CMS fetch bailed out during static generation).'
        : 'frontend/out/en/index.html still contains fallback home copy. CMS fetch likely failed or pointed at the wrong Strapi.';
      if (localCms) {
        throw new Error(
          `${message} Confirm the local CMS is running and SITE_KEY / LAMP_SITE_HOSTNAME match a published site.`,
        );
      }
      warn(`${message} Fix NEXT_PUBLIC_STRAPI_URL / SITE_HOSTNAME and rebuild before FTP.`);
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

  if (localCms) {
    copyLocalUploads();
    if (strapiUrl) rewriteLocalMediaOrigins(strapiUrl);
    if (fs.existsSync(homeHtmlPath)) {
      const html = fs.readFileSync(homeHtmlPath, 'utf8');
      if (/127\.0\.0\.1:1337|localhost:1337/.test(html)) {
        warn('Home HTML still references the local CMS origin after rewrite. Check media URLs before upload.');
      }
    }
    log('Self-contained static site: Apache serves pages and /uploads/ with no Node process.');
  }

  log(`Static site ready: ${outDir}`);
  log('Upload the contents of frontend/out/ to your Apache DocumentRoot.');
} finally {
  restoreMiddleware();
}
