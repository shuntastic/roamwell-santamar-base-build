import type { Locale } from '@/lib/i18n';
import type { CmsPage, NavItem } from '@/types/cms';

export const FALLBACK_NAV: Record<Locale, NavItem[]> = {
  en: [
    { label: 'Home', url: '/', order: 0 },
    { label: 'Accommodations', url: '/accommodations', order: 1 },
    { label: 'Location', url: '/location', order: 2 },
    { label: 'Things To Do', url: '/things-to-do', order: 3 },
    { label: 'Book Your Stay', url: '/book-your-stay', order: 4 },
    { label: 'About', url: '/about', order: 5 },
    { label: 'Contact', url: '/contact', order: 6 },
  ],
  es: [
    { label: 'Inicio', url: '/', order: 0 },
    { label: 'Alojamientos', url: '/accommodations', order: 1 },
    { label: 'Ubicación', url: '/location', order: 2 },
    { label: 'Qué Hacer', url: '/things-to-do', order: 3 },
    { label: 'Reservar', url: '/book-your-stay', order: 4 },
    { label: 'Nosotros', url: '/about', order: 5 },
    { label: 'Contacto', url: '/contact', order: 6 },
  ],
  pt: [
    { label: 'Início', url: '/', order: 0 },
    { label: 'Acomodações', url: '/accommodations', order: 1 },
    { label: 'Localização', url: '/location', order: 2 },
    { label: 'O Que Fazer', url: '/things-to-do', order: 3 },
    { label: 'Reservar', url: '/book-your-stay', order: 4 },
    { label: 'Sobre', url: '/about', order: 5 },
    { label: 'Contato', url: '/contact', order: 6 },
  ],
};

const PAGE_META: Record<
  string,
  Record<Locale, { title: string; intro: string }>
> = {
  home: {
    en: {
      title: 'Home',
      intro: 'Welcome to Santamar — coastal calm, curated stays, and local rhythm.',
    },
    es: {
      title: 'Inicio',
      intro: 'Bienvenido a Santamar — calma costera, estancias cuidadas y ritmo local.',
    },
    pt: {
      title: 'Início',
      intro: 'Bem-vindo à Santamar — calma costeira, estadias selecionadas e ritmo local.',
    },
  },
  accommodations: {
    en: { title: 'Accommodations', intro: 'Discover rooms and suites designed for restful coastal living.' },
    es: { title: 'Alojamientos', intro: 'Descubre habitaciones y suites pensadas para un descanso costero.' },
    pt: { title: 'Acomodações', intro: 'Conheça quartos e suítes pensados para um descanso à beira-mar.' },
  },
  location: {
    en: { title: 'Location', intro: 'Find us where the shoreline meets easy access to town and nature.' },
    es: { title: 'Ubicación', intro: 'Encuéntranos donde la costa se encuentra con el pueblo y la naturaleza.' },
    pt: { title: 'Localização', intro: 'Encontre-nos onde a costa encontra o acesso fácil à cidade e à natureza.' },
  },
  'things-to-do': {
    en: { title: 'Things To Do', intro: 'Beaches, markets, trails, and experiences worth lingering for.' },
    es: { title: 'Qué Hacer', intro: 'Playas, mercados, senderos y experiencias para disfrutar sin prisa.' },
    pt: { title: 'O Que Fazer', intro: 'Praias, mercados, trilhas e experiências para aproveitar com calma.' },
  },
  'book-your-stay': {
    en: { title: 'Book Your Stay', intro: 'Reserve your dates and settle into Santamar.' },
    es: { title: 'Reserve Su Estancia', intro: 'Reserve sus fechas y disfrute de Santamar.' },
    pt: { title: 'Reserve Sua Estadia', intro: 'Reserve suas datas e aproveite a Santamar.' },
  },
  about: {
    en: { title: 'About', intro: 'Our story, hospitality philosophy, and the people behind Santamar.' },
    es: { title: 'Nosotros', intro: 'Nuestra historia, filosofía de hospitalidad y el equipo de Santamar.' },
    pt: { title: 'Sobre', intro: 'Nossa história, filosofia de hospitalidade e as pessoas por trás da Santamar.' },
  },
  contact: {
    en: { title: 'Contact', intro: 'Reach our team in English, Spanish, or Portuguese.' },
    es: { title: 'Contacto', intro: 'Contacte a nuestro equipo en inglés, español o portugués.' },
    pt: { title: 'Contato', intro: 'Fale com nossa equipe em inglês, espanhol ou português.' },
  },
};

export function getFallbackPage(slug: string, locale: Locale): CmsPage | null {
  const meta = PAGE_META[slug]?.[locale];
  if (!meta) return null;

  const introBlocks = [
    {
      type: 'paragraph',
      children: [{ type: 'text', text: meta.intro }],
    },
  ];

  const base: CmsPage = {
    id: 0,
    documentId: `fallback-${slug}`,
    title: meta.title,
    slug,
    styledCopy: introBlocks,
    slideshows: [],
    sections: [],
    locale,
  };

  if (slug === 'home') {
    base.sections = [
      {
        __component: 'blocks.hero',
        id: 1,
        headline: 'Santamar',
        subheadline: meta.intro,
        cta: {
          label: locale === 'es' ? 'Reservar' : locale === 'pt' ? 'Reservar' : 'Book Your Stay',
          url: '/book-your-stay',
          variant: 'primary',
        },
      },
    ];
  }

  if (slug === 'contact') {
    base.sections = [
      {
        __component: 'blocks.contact-form',
        id: 1,
        title: meta.title,
        intro: meta.intro,
        submitLabel: locale === 'es' ? 'Enviar' : locale === 'pt' ? 'Enviar' : 'Send Message',
        successMessage:
          locale === 'es'
            ? 'Gracias. Nos pondremos en contacto pronto.'
            : locale === 'pt'
              ? 'Obrigado. Entraremos em contato em breve.'
              : 'Thank you. We will be in touch soon.',
      },
    ];
  }

  if (slug === 'book-your-stay') {
    base.sections = [
      {
        __component: 'blocks.booking-cta',
        id: 1,
        headline: meta.title,
        body: meta.intro,
        bookingUrl: '#booking',
        buttonLabel: locale === 'en' ? 'Check Availability' : 'Ver disponibilidad',
      },
    ];
  }

  if (slug === 'location') {
    base.sections = [
      {
        __component: 'blocks.location-map',
        id: 1,
        title: meta.title,
        address: 'Santamar',
        directionsLabel: locale === 'en' ? 'Get Directions' : 'Cómo llegar',
      },
    ];
  }

  return base;
}
