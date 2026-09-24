import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageView } from '@/components/blocks/PageView';
import { isLocale, locales, type Locale } from '@/lib/i18n';
import { getAllPages, getNavigation, getPageBySlug, getSiteByHost } from '@/lib/strapi';
import { getRequestSiteHost, getStaticSiteKey } from '@/lib/siteHost';
import { getFallbackPage } from '@/lib/fallbackContent';

type Props = {
  params: Promise<{ locale: string; slug?: string[] }>;
};

async function resolveSiteKey(locale: Locale): Promise<string | null> {
  const staticKey = getStaticSiteKey();
  if (staticKey) return staticKey;
  const host = await getRequestSiteHost();
  const site = await getSiteByHost(host, locale);
  return site?.key ?? null;
}

export async function generateStaticParams() {
  const params: Array<{ locale: string; slug?: string[] }> = [];
  const siteKey = getStaticSiteKey() || 'santamar';

  for (const locale of locales) {
    params.push({ locale, slug: undefined });
    const pages = await getAllPages(locale, siteKey);
    for (const page of pages) {
      if (page.slug === 'home') continue;
      params.push({ locale, slug: page.slug.split('/') });
    }

    // Ensure framework routes exist even before CMS is seeded
    for (const slug of [
      'accommodations',
      'location',
      'things-to-do',
      'book-your-stay',
      'about',
      'contact',
    ]) {
      if (!params.some((entry) => entry.locale === locale && entry.slug?.[0] === slug)) {
        params.push({ locale, slug: [slug] });
      }
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam)) return {};
  const locale = localeParam as Locale;
  const siteKey = await resolveSiteKey(locale);
  const path = slug?.join('/') || 'home';
  const page = siteKey
    ? ((await getPageBySlug(path, locale, siteKey)) ?? getFallbackPage(path, locale))
    : getFallbackPage(path, locale);

  return {
    title: page?.seo?.metaTitle || page?.title || 'Santamar',
    description: page?.seo?.metaDescription || undefined,
  };
}

export default async function CmsPageRoute({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const siteKey = await resolveSiteKey(locale);
  if (!siteKey) notFound();

  const host = await getRequestSiteHost();
  const site = await getSiteByHost(host, locale);
  const path = slug?.join('/') || 'home';

  // single_page sites only expose the home (landing) document
  if (site?.template === 'single_page' && path !== 'home') {
    notFound();
  }

  const page = (await getPageBySlug(path, locale, siteKey)) ?? getFallbackPage(path, locale);
  if (!page) notFound();

  const navigation = await getNavigation(locale, siteKey);
  const sectionAnchors =
    site?.template === 'single_page'
      ? (navigation?.items ?? [])
          .filter((item) => (item.targetType || 'page') === 'section' && item.sectionAnchor)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((item) => item.sectionAnchor as string)
      : undefined;

  return (
    <PageView
      page={page}
      locale={locale}
      sectionAnchors={sectionAnchors}
    />
  );
}
