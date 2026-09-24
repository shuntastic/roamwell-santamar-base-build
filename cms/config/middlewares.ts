import type { Core } from '@strapi/strapi';

function corsOrigins(): string[] {
  const fromList = (process.env.FRONTEND_URLS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const single = process.env.FRONTEND_URL?.trim();
  const origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(single ? [single] : []),
    ...fromList,
  ];
  return [...new Set(origins)];
}

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:', 'http:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https:', 'http:'],
          'media-src': ["'self'", 'data:', 'blob:', 'https:', 'http:'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: corsOrigins(),
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
