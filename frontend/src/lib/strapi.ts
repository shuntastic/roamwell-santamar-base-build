import type {
  CmsPage,
  GlobalSettings,
  Navigation,
  Site,
} from '@/types/cms';
import type { Locale } from '@/lib/i18n';
import { getStaticSiteKey, normalizeHostname } from '@/lib/hostname';

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
 * Keep keys aligned with `cms/src/api/page/content-types/page/schema.json` —
 * unknown populate keys make Strapi 5 return 400.
 */
const PAGE_POPULATE: Record<string, unknown> = {
  seo: {
    populate: ['ogImage'],
  },
  sections: {
    on: {
      'blocks.hero': {
        populate: ['backgroundMedia', 'cta'],
      },
      'blocks.rich-text': true,
      'blocks.statement': true,
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
      'blocks.booking-calendar': true,
      'blocks.contact-form': {
        populate: ['image'],
      },
      'blocks.modal-button': true,
      'blocks.video-embed': {
        populate: ['videoFile', 'poster'],
      },
    },
  },
};

const SITE_POPULATE: Record<string, unknown> = {
  logo: true,
  defaultSeo: {
    populate: ['ogImage'],
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

const isStaticExport = process.env.STATIC_EXPORT === 'true';

async function strapiFetch<T>(path: string, query?: Record<string, unknown>): Promise<T> {
  const qs = query ? `?${buildQuery(query)}` : '';
  const url = `${STRAPI_URL}/api${path}${qs}`;

  // Static LAMP export bakes CMS data at build time — ISR is unavailable.
  const response = await fetch(url, isStaticExport ? { cache: 'force-cache' } : { next: { revalidate: 60 } });

  if (!response.ok) {
    let detail = '';
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      detail = body.error?.message ? ` — ${body.error.message}` : '';
    } catch {
      // ignore body parse failures
    }
    throw new Error(`Strapi request failed (${response.status}): ${url}${detail}`);
  }

  return response.json() as Promise<T>;
}

function logStrapiFailure(scope: string, error: unknown) {
  if (process.env.NODE_ENV === 'production') return;
  console.error(`[strapi] ${scope}`, error);
}

function siteKeyFilter(siteKey: string) {
  return {
    site: {
      key: {
        $eq: siteKey,
      },
    },
  };
}

export function getStrapiMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${STRAPI_URL}${url}`;
}

export function isSvgMedia(
  media: { mime?: string | null; url?: string | null } | null | undefined,
  url?: string | null,
): boolean {
  if (!media && !url) return false;
  const src = url || media?.url || '';
  return media?.mime === 'image/svg+xml' || /\.svg($|\?)/i.test(src);
}

export function siteToGlobalSettings(site: Site | null | undefined): GlobalSettings | null {
  if (!site) return null;
  return {
    siteName: site.siteName,
    tagline: site.tagline,
    logo: site.logo,
    contactEmail: site.contactEmail,
    contactPhone: site.contactPhone,
    address: site.address,
    instagramUrl: site.instagramUrl,
    defaultSeo: site.defaultSeo,
  };
}

/**
 * Resolve a published Site by hostname (exact match or hostnames aliases).
 * Uses GET /api/sites/resolve — localhost falls back to the primary site in CMS.
 */
export async function getSiteByHost(host: string, locale: Locale): Promise<Site | null> {
  const normalized = normalizeHostname(host);
  const staticKey = getStaticSiteKey();

  try {
    if (staticKey) {
      const byKey = await strapiFetch<StrapiListResponse<Site>>('/sites', {
        locale,
        status: 'published',
        filters: { key: { $eq: staticKey } },
        populate: SITE_POPULATE,
        pagination: { pageSize: 1 },
      });
      if (byKey.data?.[0]) return byKey.data[0];
    }

    if (!normalized) return getPrimarySite(locale);

    const result = await strapiFetch<StrapiSingleResponse<Site>>('/sites/resolve', {
      host: normalized,
      locale,
    });
    return result.data;
  } catch (error) {
    logStrapiFailure(`getSiteByHost(${normalized}, ${locale})`, error);
    const allowFallback =
      process.env.SITE_FALLBACK_PRIMARY === 'true' ||
      process.env.NODE_ENV === 'development' ||
      normalized === 'localhost' ||
      normalized === '127.0.0.1';
    if (allowFallback) {
      return getPrimarySite(locale);
    }
    return null;
  }
}

export async function getPrimarySite(locale: Locale): Promise<Site | null> {
  try {
    const result = await strapiFetch<StrapiListResponse<Site>>('/sites', {
      locale,
      status: 'published',
      filters: { isPrimary: { $eq: true } },
      populate: SITE_POPULATE,
      pagination: { pageSize: 1 },
    });
    if (result.data?.[0]) return result.data[0];

    // Last resort: first published site
    const any = await strapiFetch<StrapiListResponse<Site>>('/sites', {
      locale,
      status: 'published',
      populate: SITE_POPULATE,
      pagination: { pageSize: 1 },
    });
    return any.data?.[0] ?? null;
  } catch (error) {
    logStrapiFailure(`getPrimarySite(${locale})`, error);
    return null;
  }
}

export async function getPageBySlug(
  slug: string,
  locale: Locale,
  siteKey: string,
): Promise<CmsPage | null> {
  const normalized = slug === '' || slug === '/' ? 'home' : slug.replace(/^\/+|\/+$/g, '');

  try {
    const result = await strapiFetch<StrapiListResponse<CmsPage>>('/pages', {
      locale,
      status: 'published',
      filters: {
        slug: {
          $eq: normalized,
        },
        ...siteKeyFilter(siteKey),
      },
      populate: PAGE_POPULATE,
    });

    return result.data?.[0] ?? null;
  } catch (error) {
    logStrapiFailure(`getPageBySlug(${normalized}, ${locale}, ${siteKey})`, error);
    return null;
  }
}

export async function getAllPages(locale: Locale, siteKey: string): Promise<CmsPage[]> {
  try {
    const result = await strapiFetch<StrapiListResponse<CmsPage>>('/pages', {
      locale,
      status: 'published',
      filters: siteKeyFilter(siteKey),
      populate: {
        seo: true,
      },
    });
    return result.data ?? [];
  } catch (error) {
    logStrapiFailure(`getAllPages(${locale}, ${siteKey})`, error);
    return [];
  }
}

export async function getNavigation(locale: Locale, siteKey: string): Promise<Navigation | null> {
  try {
    const result = await strapiFetch<StrapiListResponse<Navigation>>('/navigations', {
      locale,
      status: 'published',
      filters: siteKeyFilter(siteKey),
      populate: {
        items: {
          populate: ['page'],
        },
      },
      pagination: { pageSize: 1 },
    });
    return result.data?.[0] ?? null;
  } catch (error) {
    logStrapiFailure(`getNavigation(${locale}, ${siteKey})`, error);
    return null;
  }
}

/** @deprecated Prefer site brand fields via getSiteByHost / siteToGlobalSettings. */
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
  } catch (error) {
    logStrapiFailure(`getGlobal(${locale})`, error);
    return null;
  }
}

export { STRAPI_URL };
