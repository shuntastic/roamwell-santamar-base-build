import type { Core } from '@strapi/strapi';

type LocaleCode = 'en' | 'es' | 'pt';

const LOCALES: Array<{ code: LocaleCode; name: string }> = [
  { code: 'en', name: 'English (en)' },
  { code: 'es', name: 'Spanish (es)' },
  { code: 'pt', name: 'Portuguese (pt)' },
];

const PRIMARY_SITE_KEY = 'santamar';

const SITE_PAGES = [
  { slug: 'home', title: 'Home', navLabel: 'Home', order: 0 },
  { slug: 'accommodations', title: 'Accommodations', navLabel: 'Accommodations', order: 1 },
  { slug: 'location', title: 'Location', navLabel: 'Location', order: 2 },
  { slug: 'things-to-do', title: 'Things To Do', navLabel: 'Things To Do', order: 3 },
  { slug: 'book-your-stay', title: 'Book Your Stay', navLabel: 'Book Your Stay', order: 4 },
  { slug: 'about', title: 'About', navLabel: 'About', order: 5 },
  { slug: 'contact', title: 'Contact', navLabel: 'Contact', order: 6 },
] as const;

const PAGE_COPY: Record<
  string,
  Partial<Record<LocaleCode, { title: string; navLabel: string; intro: string }>>
> = {
  home: {
    en: {
      title: 'Home',
      navLabel: 'Home',
      intro: 'Welcome to Santamar — coastal calm, curated stays, and local rhythm.',
    },
    es: {
      title: 'Inicio',
      navLabel: 'Inicio',
      intro: 'Bienvenido a Santamar — calma costera, estancias cuidadas y ritmo local.',
    },
    pt: {
      title: 'Início',
      navLabel: 'Início',
      intro: 'Bem-vindo à Santamar — calma costeira, estadias selecionadas e ritmo local.',
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
      intro: 'Reserve your dates and settle into Santamar.',
    },
    es: {
      title: 'Reserve Su Estancia',
      navLabel: 'Reservar',
      intro: 'Reserve sus fechas y disfrute de Santamar.',
    },
    pt: {
      title: 'Reserve Sua Estadia',
      navLabel: 'Reservar',
      intro: 'Reserve suas datas e aproveite a Santamar.',
    },
  },
  about: {
    en: {
      title: 'About',
      navLabel: 'About',
      intro: 'Our story, hospitality philosophy, and the people behind Santamar.',
    },
    es: {
      title: 'Nosotros',
      navLabel: 'Nosotros',
      intro: 'Nuestra historia, filosofía de hospitalidad y el equipo de Santamar.',
    },
    pt: {
      title: 'Sobre',
      navLabel: 'Sobre',
      intro: 'Nossa história, filosofia de hospitalidade e as pessoas por trás da Santamar.',
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

function blocksIntro(text: string): Array<{
  type: 'paragraph';
  children: Array<{ type: 'text'; text: string }>;
}> {
  return [
    {
      type: 'paragraph',
      children: [{ type: 'text', text }],
    },
  ];
}

function primaryHostname(): string {
  const raw = (process.env.PRIMARY_HOSTNAME || 'localhost').trim().toLowerCase();
  return raw.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '') || 'localhost';
}

async function ensureLocales(strapi: Core.Strapi) {
  for (const locale of LOCALES) {
    const existing = await strapi.db.query('plugin::i18n.locale').findOne({
      where: { code: locale.code },
    });

    if (!existing) {
      await strapi.db.query('plugin::i18n.locale').create({
        data: {
          code: locale.code,
          name: locale.name,
        },
      });
      strapi.log.info(`[seed] Created locale ${locale.code}`);
    }
  }
}

async function ensurePrimarySite(strapi: Core.Strapi) {
  const hostname = primaryHostname();
  const existing = await strapi.documents('api::site.site').findMany({
    filters: { key: PRIMARY_SITE_KEY },
    locale: 'en',
    limit: 1,
    populate: ['logo', 'defaultSeo'],
  });

  let globalBrand: Record<string, unknown> | null = null;
  try {
    globalBrand = await strapi.documents('api::global.global').findFirst({
      locale: 'en',
      populate: ['logo', 'defaultSeo'],
    });
  } catch {
    globalBrand = null;
  }

  const brandFromGlobal = globalBrand
    ? {
        siteName: (globalBrand.siteName as string) || 'Santamar',
        tagline: (globalBrand.tagline as string) || 'Coastal calm, curated stays',
        contactEmail: (globalBrand.contactEmail as string) || 'hello@santamar.example',
        contactPhone: (globalBrand.contactPhone as string) || '+1 000 000 0000',
        address: (globalBrand.address as string) || 'Santamar',
        instagramUrl: (globalBrand.instagramUrl as string) || 'https://www.instagram.com/',
        defaultSeo: globalBrand.defaultSeo || {
          metaTitle: 'Santamar',
          metaDescription:
            'Coastal hospitality with accommodations, local experiences, and easy booking.',
        },
        logo: (globalBrand.logo as { id?: number } | null)?.id,
      }
    : {
        siteName: 'Santamar',
        tagline: 'Coastal calm, curated stays',
        contactEmail: 'hello@santamar.example',
        contactPhone: '+1 000 000 0000',
        address: 'Santamar',
        instagramUrl: 'https://www.instagram.com/',
        defaultSeo: {
          metaTitle: 'Santamar',
          metaDescription:
            'Coastal hospitality with accommodations, local experiences, and easy booking.',
        },
      };

  if (existing.length > 0) {
    const site = existing[0];
    const needsBrand = !site.contactEmail && Boolean(globalBrand);
    const aliases =
      hostname === 'localhost'
        ? ['127.0.0.1']
        : Array.from(
            new Set(
              [
                ...((Array.isArray(site.hostnames) ? site.hostnames : []) as string[]),
                'localhost',
                '127.0.0.1',
              ]
                .map((h) => String(h || '').trim().toLowerCase())
                .filter((h) => h && h !== hostname),
            ),
          );

    await strapi.documents('api::site.site').update({
      documentId: site.documentId,
      locale: 'en',
      data: {
        hostname,
        hostnames: aliases,
        isPrimary: true,
        template: site.template === 'single_page' ? 'single_page' : 'multi_page',
        theme:
          site.theme === 'harbor' || site.theme === 'dune' ? site.theme : 'coastal',
        ...(needsBrand
          ? {
              siteName: brandFromGlobal.siteName,
              tagline: brandFromGlobal.tagline,
              contactEmail: brandFromGlobal.contactEmail,
              contactPhone: brandFromGlobal.contactPhone,
              address: brandFromGlobal.address,
              instagramUrl: brandFromGlobal.instagramUrl,
              defaultSeo: brandFromGlobal.defaultSeo as never,
              ...(brandFromGlobal.logo ? { logo: brandFromGlobal.logo } : {}),
            }
          : {}),
      },
      status: 'published',
    });

    // Localized site rows are required before pages can link `site` in es/pt.
    await ensureSiteLocales(strapi, site.documentId as string, brandFromGlobal);

    strapi.log.info(`[seed] Ensured primary site ${PRIMARY_SITE_KEY} → ${hostname}`);
    return site.documentId as string;
  }

  const created = await strapi.documents('api::site.site').create({
    locale: 'en',
    data: {
      name: 'Santamar',
      key: PRIMARY_SITE_KEY,
      hostname,
      hostnames: hostname === 'localhost' ? ['127.0.0.1'] : [],
      isPrimary: true,
      template: 'multi_page',
      theme: 'coastal',
      siteName: brandFromGlobal.siteName,
      tagline: brandFromGlobal.tagline,
      contactEmail: brandFromGlobal.contactEmail,
      contactPhone: brandFromGlobal.contactPhone,
      address: brandFromGlobal.address,
      instagramUrl: brandFromGlobal.instagramUrl,
      defaultSeo: brandFromGlobal.defaultSeo as never,
      ...(brandFromGlobal.logo ? { logo: brandFromGlobal.logo } : {}),
    },
    status: 'published',
  });

  await ensureSiteLocales(strapi, created.documentId as string, brandFromGlobal);

  strapi.log.info(`[seed] Created primary site ${PRIMARY_SITE_KEY} → ${hostname}`);
  return created.documentId as string;
}

async function ensureSiteLocales(
  strapi: Core.Strapi,
  siteDocumentId: string,
  brandFromGlobal: Record<string, unknown>,
) {
  for (const locale of ['es', 'pt'] as LocaleCode[]) {
    const existingLocale = await strapi.documents('api::site.site').findMany({
      filters: { key: PRIMARY_SITE_KEY },
      locale,
      limit: 1,
    });
    if (existingLocale.length > 0) continue;

    const tagline =
      locale === 'es'
        ? 'Calma costera, estancias cuidadas'
        : 'Calma costeira, estadias selecionadas';

    let localizedGlobal: Record<string, unknown> | null = null;
    try {
      localizedGlobal = await strapi.documents('api::global.global').findFirst({
        locale,
      });
    } catch {
      localizedGlobal = null;
    }

    await strapi.documents('api::site.site').update({
      documentId: siteDocumentId,
      locale,
      data: {
        name: 'Santamar',
        key: PRIMARY_SITE_KEY,
        siteName: (localizedGlobal?.siteName as string) || 'Santamar',
        tagline: (localizedGlobal?.tagline as string) || tagline,
        address:
          (localizedGlobal?.address as string) ||
          (brandFromGlobal.address as string) ||
          'Santamar',
      },
      status: 'published',
    });
    strapi.log.info(`[seed] Ensured site locale ${locale} for ${PRIMARY_SITE_KEY}`);
  }
}

async function attachOrphanPages(strapi: Core.Strapi, siteDocumentId: string) {
  const pages = await strapi.documents('api::page.page').findMany({
    locale: 'en',
    status: 'published',
    populate: ['site'],
    limit: 200,
  });

  for (const page of pages) {
    const linked = (page as { site?: { documentId?: string } | null }).site;
    if (linked?.documentId) continue;

    await strapi.documents('api::page.page').update({
      documentId: page.documentId,
      locale: 'en',
      data: { site: siteDocumentId },
      status: 'published',
    });
    strapi.log.info(`[seed] Attached page /${page.slug} to site ${PRIMARY_SITE_KEY}`);
  }
}

async function ensurePages(strapi: Core.Strapi, siteDocumentId: string) {
  for (const page of SITE_PAGES) {
    const existing = await strapi.documents('api::page.page').findMany({
      filters: {
        slug: page.slug,
        site: { documentId: siteDocumentId },
      },
      locale: 'en',
      limit: 1,
    });

    if (existing.length > 0) {
      continue;
    }

    // Also skip if an unscoped page with this slug already exists (attach handled separately)
    const bySlug = await strapi.documents('api::page.page').findMany({
      filters: { slug: page.slug },
      locale: 'en',
      limit: 1,
      populate: ['site'],
    });
    if (bySlug.length > 0) {
      const linked = (bySlug[0] as { site?: { documentId?: string } | null }).site;
      if (!linked?.documentId) {
        await strapi.documents('api::page.page').update({
          documentId: bySlug[0].documentId,
          locale: 'en',
          data: { site: siteDocumentId },
          status: 'published',
        });
      }
      continue;
    }

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
        sections:
          page.slug === 'home'
            ? [
                {
                  __component: 'blocks.hero',
                  headline: 'Santamar',
                  subheadline: enCopy.intro,
                  description: blocksIntro(enCopy.intro) as never,
                  cta: {
                    label: 'Book Your Stay',
                    url: '/book-your-stay',
                    variant: 'primary',
                  },
                },
              ]
            : page.slug === 'contact'
              ? [
                  {
                    __component: 'blocks.contact-form',
                    title: 'Contact',
                    intro: enCopy.intro,
                    submitLabel: 'Send Message',
                    successMessage: 'Thank you. We will be in touch soon.',
                  },
                ]
              : page.slug === 'book-your-stay'
                ? [
                    {
                      __component: 'blocks.booking-cta',
                      headline: 'Book Your Stay',
                      body: enCopy.intro,
                      bookingUrl: '#booking',
                      buttonLabel: 'Check Availability',
                    },
                  ]
                : page.slug === 'location'
                  ? [
                      {
                        __component: 'blocks.location-map',
                        title: 'Find Us',
                        address: 'Santamar',
                        directionsLabel: 'Get Directions',
                      },
                    ]
                  : [],
        seo: {
          metaTitle: `${enCopy.title} | Santamar`,
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
          // Required when i18n creates a new locale entry.
          site: siteDocumentId,
          seo: {
            metaTitle: `${localized.title} | Santamar`,
            metaDescription: localized.intro,
          },
        },
        status: 'published',
      });
    }

    strapi.log.info(`[seed] Created page /${page.slug} for site ${PRIMARY_SITE_KEY}`);
  }
}

async function ensureNavigation(strapi: Core.Strapi, siteDocumentId: string) {
  const existing = await strapi.documents('api::navigation.navigation').findMany({
    filters: { site: { documentId: siteDocumentId } },
    locale: 'en',
    limit: 1,
  });

  if (existing.length > 0) return;

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

  const created = await strapi.documents('api::navigation.navigation').create({
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
      documentId: created.documentId,
      locale,
      data: {
        title: 'Primary',
        // Required relation must be present when i18n creates a new locale entry.
        site: siteDocumentId,
        items: localizedItems,
      },
      status: 'published',
    });
  }

  strapi.log.info(`[seed] Created navigation for site ${PRIMARY_SITE_KEY}`);
}

async function ensurePublicPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  if (!publicRole) return;

  const actions = [
    'api::page.page.find',
    'api::page.page.findOne',
    'api::navigation.navigation.find',
    'api::navigation.navigation.findOne',
    'api::site.site.find',
    'api::site.site.findOne',
    'api::global.global.find',
  ];

  for (const action of actions) {
    const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
      where: {
        action,
        role: publicRole.id,
      },
    });

    if (!existing) {
      await strapi.db.query('plugin::users-permissions.permission').create({
        data: {
          action,
          role: publicRole.id,
        },
      });
    }
  }

  strapi.log.info('[seed] Ensured public Content API permissions');
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Always ensure public Content API access — required even when seed is skipped in prod.
    await ensurePublicPermissions(strapi);

    if (process.env.SEED_CONTENT === 'false') {
      return;
    }

    try {
      await ensureLocales(strapi);
      const siteDocumentId = await ensurePrimarySite(strapi);
      await attachOrphanPages(strapi, siteDocumentId);
      await ensurePages(strapi, siteDocumentId);
      await ensureNavigation(strapi, siteDocumentId);
    } catch (error) {
      strapi.log.error('[seed] Failed to seed CMS framework content');
      strapi.log.error(error);
    }
  },
};
