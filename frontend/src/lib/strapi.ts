import type {
  CmsPage,
  GlobalSettings,
  Navigation,
} from '@/types/cms';
import type { Locale } from '@/lib/i18n';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

type StrapiListResponse<T> = {
  data: T[];
  meta?: unknown;
};

type StrapiSingleResponse<T> = {
  data: T | null;
  meta?: unknown;
};

/**
 * Deep populate for Page documents.
 * Uses indexed array populate params Strapi 5 expects.
 */
const PAGE_POPULATE: Record<string, unknown> = {
  slideshows: {
    populate: {
      slides: {
        populate: ['media'],
      },
    },
  },
  seo: {
    populate: ['ogImage'],
  },
  sections: {
    on: {
      'blocks.hero': {
        populate: ['backgroundMedia', 'cta'],
      },
      'blocks.rich-text': true,
      'blocks.image-text': {
        populate: ['images'],
      },
      'blocks.feature-grid': {
        populate: {
          items: {
            populate: ['image', 'link'],
          },
        },
      },
      'blocks.media-gallery': {
        populate: {
          slideshow: {
            populate: {
              slides: {
                populate: ['media'],
              },
            },
          },
        },
      },
      'blocks.location-map': true,
      'blocks.booking-cta': {
        populate: ['backgroundImage'],
      },
      'blocks.contact-form': true,
      'blocks.video-embed': {
        populate: ['videoFile', 'poster'],
      },
    },
  },
};

function buildQuery(params: Record<string, unknown>, prefix = ''): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;

    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item !== null && typeof item === 'object') {
          parts.push(buildQuery(item as Record<string, unknown>, `${fullKey}[${index}]`));
        } else {
          parts.push(`${encodeURIComponent(`${fullKey}[${index}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
      continue;
    }

    if (typeof value === 'object') {
      parts.push(buildQuery(value as Record<string, unknown>, fullKey));
      continue;
    }

    parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`);
  }

  return parts.filter(Boolean).join('&');
}

async function strapiFetch<T>(path: string, query?: Record<string, unknown>): Promise<T> {
  const qs = query ? `?${buildQuery(query)}` : '';
  const url = `${STRAPI_URL}/api${path}${qs}`;

  const response = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Strapi request failed (${response.status}): ${url}`);
  }

  return response.json() as Promise<T>;
}

export function getStrapiMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${STRAPI_URL}${url}`;
}

export async function getPageBySlug(slug: string, locale: Locale): Promise<CmsPage | null> {
  const normalized = slug === '' || slug === '/' ? 'home' : slug.replace(/^\/+|\/+$/g, '');

  try {
    const result = await strapiFetch<StrapiListResponse<CmsPage>>('/pages', {
      locale,
      status: 'published',
      filters: {
        slug: {
          $eq: normalized,
        },
      },
      populate: PAGE_POPULATE,
    });

    return result.data?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function getAllPages(locale: Locale): Promise<CmsPage[]> {
  try {
    const result = await strapiFetch<StrapiListResponse<CmsPage>>('/pages', {
      locale,
      status: 'published',
      populate: {
        seo: true,
      },
    });
    return result.data ?? [];
  } catch {
    return [];
  }
}

export async function getNavigation(locale: Locale): Promise<Navigation | null> {
  try {
    const result = await strapiFetch<StrapiSingleResponse<Navigation>>('/navigation', {
      locale,
      status: 'published',
      populate: {
        items: {
          populate: ['page'],
        },
      },
    });
    return result.data;
  } catch {
    return null;
  }
}

export async function getGlobal(locale: Locale): Promise<GlobalSettings | null> {
  try {
    const result = await strapiFetch<StrapiSingleResponse<GlobalSettings>>('/global', {
      locale,
      status: 'published',
      populate: {
        logo: true,
        defaultSeo: {
          populate: ['ogImage'],
        },
      },
    });
    return result.data;
  } catch {
    return null;
  }
}

export { STRAPI_URL };
