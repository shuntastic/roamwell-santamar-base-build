import type { Core } from '@strapi/strapi';
import * as fs from 'node:fs';
import * as path from 'node:path';

export type SiteTemplate = 'multi_page' | 'single_page';
export type SiteTheme = 'coastal' | 'harbor' | 'dune' | 'blackbox';
export type LocaleCode = 'en' | 'es' | 'pt';

export const SITE_PAGES = [
  { slug: 'home', title: 'Home', navLabel: 'Home', order: 0 },
  { slug: 'accommodations', title: 'Accommodations', navLabel: 'Accommodations', order: 1 },
  { slug: 'location', title: 'Location', navLabel: 'Location', order: 2 },
  { slug: 'things-to-do', title: 'Things To Do', navLabel: 'Things To Do', order: 3 },
  { slug: 'book-your-stay', title: 'Book Your Stay', navLabel: 'Book Your Stay', order: 4 },
  { slug: 'about', title: 'About', navLabel: 'About', order: 5 },
  { slug: 'contact', title: 'Contact', navLabel: 'Contact', order: 6 },
] as const;

export const PAGE_COPY: Record<
  string,
  Partial<Record<LocaleCode, { title: string; navLabel: string; intro: string }>>
> = {
  home: {
    en: {
      title: 'Home',
      navLabel: 'Home',
      intro: 'Welcome — coastal calm, curated stays, and local rhythm.',
    },
    es: {
      title: 'Inicio',
      navLabel: 'Inicio',
      intro: 'Bienvenido — calma costera, estancias cuidadas y ritmo local.',
    },
    pt: {
      title: 'Início',
      navLabel: 'Início',
      intro: 'Bem-vindo — calma costeira, estadias selecionadas e ritmo local.',
    },
  },
  accommodations: {
    en: {
      title: 'Accommodations',
      navLabel: 'Accommodations',
      intro: 'Discover rooms and suites designed for restful coastal living.',
    },
    es: {
      title: 'Alojamientos',
      navLabel: 'Alojamientos',
      intro: 'Descubre habitaciones y suites pensadas para un descanso costero.',
    },
    pt: {
      title: 'Acomodações',
      navLabel: 'Acomodações',
      intro: 'Conheça quartos e suítes pensados para um descanso à beira-mar.',
    },
  },
  location: {
    en: {
      title: 'Location',
      navLabel: 'Location',
      intro: 'Find us where the shoreline meets easy access to town and nature.',
    },
    es: {
      title: 'Ubicación',
      navLabel: 'Ubicación',
      intro: 'Encuéntranos donde la costa se encuentra con el pueblo y la naturaleza.',
    },
    pt: {
      title: 'Localização',
      navLabel: 'Localização',
      intro: 'Encontre-nos onde a costa encontra o acesso fácil à cidade e à natureza.',
    },
  },
  'things-to-do': {
    en: {
      title: 'Things To Do',
      navLabel: 'Things To Do',
      intro: 'Beaches, markets, trails, and experiences worth lingering for.',
    },
    es: {
      title: 'Qué Hacer',
      navLabel: 'Qué Hacer',
      intro: 'Playas, mercados, senderos y experiencias para disfrutar sin prisa.',
    },
    pt: {
      title: 'O Que Fazer',
      navLabel: 'O Que Fazer',
      intro: 'Praias, mercados, trilhas e experiências para aproveitar com calma.',
    },
  },
  'book-your-stay': {
    en: {
      title: 'Book Your Stay',
      navLabel: 'Book Your Stay',
      intro: 'Reserve your dates and settle in.',
    },
    es: {
      title: 'Reserve Su Estancia',
      navLabel: 'Reservar',
      intro: 'Reserve sus fechas y disfrute.',
    },
    pt: {
      title: 'Reserve Sua Estadia',
      navLabel: 'Reservar',
      intro: 'Reserve suas datas e aproveite.',
    },
  },
  about: {
    en: {
      title: 'About',
      navLabel: 'About',
      intro: 'Our story, hospitality philosophy, and the people behind the property.',
    },
    es: {
      title: 'Nosotros',
      navLabel: 'Nosotros',
      intro: 'Nuestra historia, filosofía de hospitalidad y el equipo.',
    },
    pt: {
      title: 'Sobre',
      navLabel: 'Sobre',
      intro: 'Nossa história, filosofia de hospitalidade e as pessoas por trás.',
    },
  },
  contact: {
    en: {
      title: 'Contact',
      navLabel: 'Contact',
      intro: 'Reach our team in English, Spanish, or Portuguese.',
    },
    es: {
      title: 'Contacto',
      navLabel: 'Contacto',
      intro: 'Contacte a nuestro equipo en inglés, español o portugués.',
    },
    pt: {
      title: 'Contato',
      navLabel: 'Contato',
      intro: 'Fale com nossa equipe em inglês, espanhol ou português.',
    },
  },
};

export function blocksIntro(text: string) {
  return [
    {
      type: 'paragraph',
      children: [{ type: 'text', text }],
    },
  ];
}

export function slugifySiteKey(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return base || 'site';
}

function defaultSectionsForSlug(slug: string, siteName: string, intro: string) {
  if (slug === 'home') {
    return [
      {
        __component: 'blocks.hero' as const,
        headline: siteName,
        subheadline: intro,
        description: blocksIntro(intro) as never,
        cta: {
          label: 'Book Your Stay',
          url: '/book-your-stay',
          variant: 'primary' as const,
        },
      },
    ];
  }
  if (slug === 'contact') {
    return [
      {
        __component: 'blocks.contact-form' as const,
        title: 'Contact',
        intro,
        submitLabel: 'Send Message',
        successMessage: 'Thank you. We will be in touch soon.',
      },
    ];
  }
  if (slug === 'book-your-stay') {
    return [
      {
        __component: 'blocks.booking-cta' as const,
        headline: 'Book Your Stay',
        body: intro,
        bookingUrl: '#booking',
        buttonLabel: 'Check Availability',
      },
    ];
  }
  if (slug === 'location') {
    return [
      {
        __component: 'blocks.location-map' as const,
        title: 'Find Us',
        address: siteName,
        directionsLabel: 'Get Directions',
      },
    ];
  }
  return [];
}

/** Create multi_page starter pages + page-target navigation for a site. */
export async function createMultiPageStarter(
  strapi: Core.Strapi,
  siteDocumentId: string,
  siteName: string,
) {
  for (const page of SITE_PAGES) {
    const enCopy = PAGE_COPY[page.slug]?.en ?? {
      title: page.title,
      navLabel: page.navLabel,
      intro: '',
    };

    const created = await strapi.documents('api::page.page').create({
      locale: 'en',
      data: {
        title: enCopy.title,
        slug: page.slug,
        navLabel: enCopy.navLabel,
        site: siteDocumentId,
        sections: defaultSectionsForSlug(page.slug, siteName, enCopy.intro) as never,
        seo: {
          metaTitle: `${enCopy.title} | ${siteName}`,
          metaDescription: enCopy.intro,
        },
      },
      status: 'published',
    });

    for (const locale of ['es', 'pt'] as LocaleCode[]) {
      const localized = PAGE_COPY[page.slug]?.[locale];
      if (!localized) continue;
      await strapi.documents('api::page.page').update({
        documentId: created.documentId,
        locale,
        data: {
          title: localized.title,
          slug: page.slug,
          navLabel: localized.navLabel,
          site: siteDocumentId,
          seo: {
            metaTitle: `${localized.title} | ${siteName}`,
            metaDescription: localized.intro,
          },
        },
        status: 'published',
      });
    }
  }

  const pages = await strapi.documents('api::page.page').findMany({
    filters: { site: { documentId: siteDocumentId } },
    locale: 'en',
    status: 'published',
  });

  const items = SITE_PAGES.map((def) => {
    const page = pages.find((entry) => entry.slug === def.slug);
    return {
      label: def.navLabel,
      targetType: 'page' as const,
      url: def.slug === 'home' ? '/' : `/${def.slug}`,
      order: def.order,
      page: page?.documentId,
    };
  });

  const nav = await strapi.documents('api::navigation.navigation').create({
    locale: 'en',
    data: {
      title: 'Primary',
      site: siteDocumentId,
      items,
    },
    status: 'published',
  });

  for (const locale of ['es', 'pt'] as LocaleCode[]) {
    const localizedItems = SITE_PAGES.map((def) => ({
      label: PAGE_COPY[def.slug]?.[locale]?.navLabel ?? def.navLabel,
      targetType: 'page' as const,
      url: def.slug === 'home' ? '/' : `/${def.slug}`,
      order: def.order,
    }));
    await strapi.documents('api::navigation.navigation').update({
      documentId: nav.documentId,
      locale,
      data: {
        title: 'Primary',
        site: siteDocumentId,
        items: localizedItems,
      },
      status: 'published',
    });
  }
}

/** Create single_page home with section anchors + section-target navigation. */
export async function createSinglePageStarter(
  strapi: Core.Strapi,
  siteDocumentId: string,
  siteName: string,
) {
  const sections = [
    {
      __component: 'blocks.hero',
      headline: siteName,
      subheadline: 'A single-page stay narrative',
      description: blocksIntro(`Welcome to ${siteName}. Scroll to explore.`) as never,
      cta: { label: 'Book', url: '#book', variant: 'primary' as const },
    },
    {
      __component: 'blocks.statement',
      title: 'Stay',
      body: 'Thoughtfully designed rooms for restful coastal living.',
    },
    {
      __component: 'blocks.location-map',
      title: 'Location',
      address: siteName,
      directionsLabel: 'Get Directions',
    },
    {
      __component: 'blocks.booking-cta',
      headline: 'Book Your Stay',
      body: 'Reserve your dates and settle in.',
      bookingUrl: '#booking',
      buttonLabel: 'Check Availability',
    },
    {
      __component: 'blocks.contact-form',
      title: 'Contact',
      intro: 'Reach our team.',
      submitLabel: 'Send Message',
      successMessage: 'Thank you. We will be in touch soon.',
    },
  ];

  // Section nav order matches section order (hero included as top).
  const sectionNav = [
    { label: 'Top', sectionAnchor: 'top', order: 0 },
    { label: 'Stay', sectionAnchor: 'stay', order: 1 },
    { label: 'Location', sectionAnchor: 'location', order: 2 },
    { label: 'Book', sectionAnchor: 'book', order: 3 },
    { label: 'Contact', sectionAnchor: 'contact', order: 4 },
  ];

  const home = await strapi.documents('api::page.page').create({
    locale: 'en',
    data: {
      title: 'Home',
      slug: 'home',
      navLabel: 'Home',
      site: siteDocumentId,
      sections: sections as never,
      seo: {
        metaTitle: `${siteName}`,
        metaDescription: `Welcome to ${siteName}.`,
      },
    },
    status: 'published',
  });

  for (const locale of ['es', 'pt'] as LocaleCode[]) {
    await strapi.documents('api::page.page').update({
      documentId: home.documentId,
      locale,
      data: {
        title: locale === 'es' ? 'Inicio' : 'Início',
        slug: 'home',
        navLabel: locale === 'es' ? 'Inicio' : 'Início',
        site: siteDocumentId,
      },
      status: 'published',
    });
  }

  const items = sectionNav.map((item) => ({
    label: item.label,
    targetType: 'section' as const,
    sectionAnchor: item.sectionAnchor,
    url: `#${item.sectionAnchor}`,
    order: item.order,
  }));

  const nav = await strapi.documents('api::navigation.navigation').create({
    locale: 'en',
    data: {
      title: 'Primary',
      site: siteDocumentId,
      items,
    },
    status: 'published',
  });

  const localizedLabels: Record<LocaleCode, string[]> = {
    en: ['Top', 'Stay', 'Location', 'Book', 'Contact'],
    es: ['Inicio', 'Estancia', 'Ubicación', 'Reservar', 'Contacto'],
    pt: ['Início', 'Estadia', 'Localização', 'Reservar', 'Contato'],
  };

  for (const locale of ['es', 'pt'] as LocaleCode[]) {
    const localizedItems = sectionNav.map((item, index) => ({
      label: localizedLabels[locale][index] ?? item.label,
      targetType: 'section' as const,
      sectionAnchor: item.sectionAnchor,
      url: `#${item.sectionAnchor}`,
      order: item.order,
    }));
    await strapi.documents('api::navigation.navigation').update({
      documentId: nav.documentId,
      locale,
      data: {
        title: 'Primary',
        site: siteDocumentId,
        items: localizedItems,
      },
      status: 'published',
    });
  }
}

export function resolveSitesRoot(): string {
  if (process.env.SITES_ROOT) {
    return path.resolve(process.env.SITES_ROOT);
  }
  // Strapi usually runs with cwd = cms/
  const fromCms = path.resolve(process.cwd(), '../sites');
  const fromRepo = path.resolve(process.cwd(), 'sites');
  if (fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as {
      name?: string;
    };
    if (pkg.name === 'santamar') return fromRepo;
  }
  return fromCms;
}

export function resolveFrontendRoot(): string {
  return path.resolve(resolveSitesRoot(), '../frontend');
}

const BASE_PORT = 3100;

function collectUsedPorts(sitesRoot: string): Set<number> {
  const used = new Set<number>([3000]);
  if (!fs.existsSync(sitesRoot)) return used;

  for (const entry of fs.readdirSync(sitesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const eco = path.join(sitesRoot, entry.name, 'ecosystem.config.js');
    if (!fs.existsSync(eco)) continue;
    const text = fs.readFileSync(eco, 'utf8');
    const match = text.match(/PORT:\s*(\d+)/);
    if (match) used.add(Number(match[1]));
  }
  return used;
}

export function nextAvailablePort(sitesRoot: string): number {
  const used = collectUsedPorts(sitesRoot);
  let port = BASE_PORT;
  while (used.has(port)) port += 1;
  return port;
}

export type DeployPackResult = {
  key: string;
  port: number;
  dir: string;
  files: string[];
};

export function writeDeployPack(options: {
  key: string;
  hostname: string;
  theme: SiteTheme;
  template: SiteTemplate;
  strapiPublicUrl: string;
}): DeployPackResult {
  const sitesRoot = resolveSitesRoot();
  const frontendRoot = resolveFrontendRoot();
  const dir = path.join(sitesRoot, options.key);
  fs.mkdirSync(dir, { recursive: true });

  const port = nextAvailablePort(sitesRoot);
  const files: string[] = [];

  const envBody = [
    `# Generated by Strapi Provision site — do not put secrets here`,
    `SITE_KEY=${options.key}`,
    `SITE_HOSTNAME=${options.hostname}`,
    `PORT=${port}`,
    `HOSTNAME=127.0.0.1`,
    `NEXT_PUBLIC_STRAPI_URL=${options.strapiPublicUrl}`,
    `# Theme is read from the CMS Site document (theme=${options.theme})`,
    `# Template: ${options.template}`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(dir, '.env'), envBody);
  files.push('.env');

  const ecosystem = `/**
 * PM2 process for site "${options.key}"
 * Usage (from repo root):
 *   pm2 start sites/${options.key}/ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: 'santamar-web-${options.key}',
      cwd: ${JSON.stringify(frontendRoot)},
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        PORT: ${port},
        SITE_KEY: ${JSON.stringify(options.key)},
        SITE_HOSTNAME: ${JSON.stringify(options.hostname)},
        NEXT_PUBLIC_STRAPI_URL: ${JSON.stringify(options.strapiPublicUrl)},
      },
    },
  ],
};
`;
  fs.writeFileSync(path.join(dir, 'ecosystem.config.js'), ecosystem);
  files.push('ecosystem.config.js');

  const apache = `# Apache VirtualHost — site ${options.key}
# Install: copy into sites-available, a2ensite, reload apache2
# TLS: certbot --apache -d ${options.hostname}

<VirtualHost *:80>
  ServerName ${options.hostname}

  ProxyPreserveHost On
  ProxyPass / http://127.0.0.1:${port}/
  ProxyPassReverse / http://127.0.0.1:${port}/

  RequestHeader set X-Forwarded-Proto "http"
  RequestHeader set X-Forwarded-Port "80"

  ErrorLog \${APACHE_LOG_DIR}/santamar-${options.key}-error.log
  CustomLog \${APACHE_LOG_DIR}/santamar-${options.key}-access.log combined
</VirtualHost>
`;
  fs.writeFileSync(path.join(dir, 'apache.conf'), apache);
  files.push('apache.conf');

  const nginx = `# Nginx server — site ${options.key}
# Include from your nginx sites-enabled; then reload nginx.
# TLS: certbot --nginx -d ${options.hostname}

server {
  listen 80;
  server_name ${options.hostname};

  location / {
    proxy_pass http://127.0.0.1:${port};
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
`;
  fs.writeFileSync(path.join(dir, 'nginx.conf'), nginx);
  files.push('nginx.conf');

  const httpsOrigin = `https://${options.hostname}`;
  const readme = `Site deployment pack: ${options.key}
================================

Hostname:  ${options.hostname}
Template:  ${options.template}
Theme:     ${options.theme}
Port:      ${port}
SITE_KEY:  ${options.key}

This pack pins a separate Next.js process to this Site. The shared app lives in
frontend/; do not copy the Next source tree.

1. CORS — add this origin to cms/.env FRONTEND_URLS (comma-separated), then restart Strapi:
   FRONTEND_URLS=${httpsOrigin}

2. Production (PM2, from repo root):
   pm2 start sites/${options.key}/ecosystem.config.js
   pm2 save

3. Reverse proxy:
   - Apache: install apache.conf (see comments inside)
   - Nginx:  install nginx.conf

4. Local dev against this site only:
   set -a && source sites/${options.key}/.env && set +a
   cd frontend && npm run dev
   # Or: PORT=${port} SITE_KEY=${options.key} npm run start --prefix frontend

DNS must point ${options.hostname} at this host. TLS is operator-managed (certbot).
`;
  fs.writeFileSync(path.join(dir, 'README.txt'), readme);
  files.push('README.txt');

  return { key: options.key, port, dir, files };
}
