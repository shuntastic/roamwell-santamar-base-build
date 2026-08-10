import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  /**
   * Public origin of this Strapi instance (scheme + host, no trailing slash).
   * Required behind Apache/TLS so admin cookies, resets, and absolute URLs are correct.
   * Example: https://cms.santamar.example
   */
  url: env('PUBLIC_URL', ''),
  proxy: {
    /** Trust X-Forwarded-* from Apache (or another reverse proxy). */
    koa: env.bool('PROXY_KOA', true),
  },
  app: {
    keys: env.array('APP_KEYS')!,
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});

export default config;
