import type { NextConfig } from 'next';

/**
 * Two production modes:
 *
 * 1) Node (default) — `next build` + `next start` behind Apache/Nginx reverse-proxy.
 * 2) Static LAMP — `STATIC_EXPORT=true` → `output: 'export'` into `frontend/out/`
 *    for Apache DocumentRoot. Use `npm run build:static` (disables middleware).
 *
 * Set NEXT_PUBLIC_STRAPI_URL to the *public* CMS origin before building
 * (e.g. https://cms.santamar.example).
 */
const isStaticExport = process.env.STATIC_EXPORT === 'true';
const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

let strapiHost: URL;
try {
  strapiHost = new URL(strapiUrl);
} catch {
  throw new Error(
    `Invalid NEXT_PUBLIC_STRAPI_URL="${strapiUrl}". Use an absolute URL such as https://cms.example.com`,
  );
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(isStaticExport
    ? {
        output: 'export' as const,
        /** Apache serves directories as …/about/index.html more reliably with trailing slashes. */
        trailingSlash: true,
        images: {
          unoptimized: true,
        },
      }
    : {
        images: {
          remotePatterns: [
            {
              protocol: strapiHost.protocol.replace(':', '') as 'http' | 'https',
              hostname: strapiHost.hostname,
              port: strapiHost.port || undefined,
              pathname: '/uploads/**',
            },
          ],
        },
      }),
};

export default nextConfig;
