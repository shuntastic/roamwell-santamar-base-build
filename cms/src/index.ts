import type { Core } from '@strapi/strapi';

type LocaleCode = 'en' | 'es' | 'pt';

const LOCALES: Array<{ code: LocaleCode; name: string }> = [
  { code: 'en', name: 'English (en)' },
  { code: 'es', name: 'Spanish (es)' },
  { code: 'pt', name: 'Portuguese (pt)' },
];

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

async function ensurePages(strapi: Core.Strapi) {
  for (const page of SITE_PAGES) {
    const existing = await strapi.documents('api::page.page').findMany({
      filters: { slug: page.slug },
      locale: 'en',
      limit: 1,
    });

    if (existing.length > 0) {
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
        styledCopy: blocksIntro(enCopy.intro) as never,
        sections:
          page.slug === 'home'
            ? [
                {
                  __component: 'blocks.hero',
                  headline: 'Santamar',
                  subheadline: enCopy.intro,
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
          styledCopy: blocksIntro(localized.intro) as never,
          seo: {
            metaTitle: `${localized.title} | Santamar`,
            metaDescription: localized.intro,
          },
        },
        status: 'published',
      });
    }

    strapi.log.info(`[seed] Created page /${page.slug}`);
  }
}

async function ensureNavigation(strapi: Core.Strapi) {
  const existing = await strapi.documents('api::navigation.navigation').findFirst({
    locale: 'en',
  });

  if (existing) return;

  const pages = await strapi.documents('api::page.page').findMany({
    locale: 'en',
    status: 'published',
  });

  const items = SITE_PAGES.map((def) => {
    const page = pages.find((entry) => entry.slug === def.slug);
    return {
      label: def.navLabel,
      url: def.slug === 'home' ? '/' : `/${def.slug}`,
      order: def.order,
      page: page?.documentId,
    };
  });

  await strapi.documents('api::navigation.navigation').create({
    locale: 'en',
    data: { items },
    status: 'published',
  });

  for (const locale of ['es', 'pt'] as LocaleCode[]) {
    const localizedItems = SITE_PAGES.map((def) => ({
      label: PAGE_COPY[def.slug]?.[locale]?.navLabel ?? def.navLabel,
      url: def.slug === 'home' ? '/' : `/${def.slug}`,
      order: def.order,
    }));

    const nav = await strapi.documents('api::navigation.navigation').findFirst({
      locale: 'en',
    });

    if (!nav) continue;

    await strapi.documents('api::navigation.navigation').update({
      documentId: nav.documentId,
      locale,
      data: { items: localizedItems },
      status: 'published',
    });
  }

  strapi.log.info('[seed] Created navigation');
}

async function ensureGlobal(strapi: Core.Strapi) {
  const existing = await strapi.documents('api::global.global').findFirst({
    locale: 'en',
  });

  if (existing) return;

  const created = await strapi.documents('api::global.global').create({
    locale: 'en',
    data: {
      siteName: 'Santamar',
      tagline: 'Coastal calm, curated stays',
      contactEmail: 'hello@santamar.example',
      contactPhone: '+1 000 000 0000',
      address: 'Santamar',
      defaultSeo: {
        metaTitle: 'Santamar',
        metaDescription: 'Coastal hospitality with accommodations, local experiences, and easy booking.',
      },
    },
    status: 'published',
  });

  await strapi.documents('api::global.global').update({
    documentId: created.documentId,
    locale: 'es',
    data: {
      siteName: 'Santamar',
      tagline: 'Calma costera, estancias cuidadas',
    },
    status: 'published',
  });

  await strapi.documents('api::global.global').update({
    documentId: created.documentId,
    locale: 'pt',
    data: {
      siteName: 'Santamar',
      tagline: 'Calma costeira, estadias selecionadas',
    },
    status: 'published',
  });

  strapi.log.info('[seed] Created global settings');
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
    if (process.env.SEED_CONTENT === 'false') {
      return;
    }

    try {
      await ensureLocales(strapi);
      await ensurePages(strapi);
      await ensureNavigation(strapi);
      await ensureGlobal(strapi);
      await ensurePublicPermissions(strapi);
    } catch (error) {
      strapi.log.error('[seed] Failed to seed CMS framework content');
      strapi.log.error(error);
    }
  },
};
