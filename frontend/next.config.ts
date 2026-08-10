import type { NextConfig } from 'next';

/**
 * Production on LAMP runs `next start` behind Apache (not static export).
 * Locale middleware + ISR against Strapi require a long-lived Node process.
 *
 * Set NEXT_PUBLIC_STRAPI_URL to the *public* CMS origin before `next build`
 * (e.g. https://cms.santamar.example) so server and client fetch the same host.
 */
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
  // Bind explicitly when started via PM2 / systemd on the LAMP host.
  // Override with HOSTNAME / PORT env at runtime (`next start`).
  poweredByHeader: false,
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
};

export default nextConfig;
