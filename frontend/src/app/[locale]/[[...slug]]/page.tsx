import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PageView } from '@/components/blocks/PageView';
import { SinglePageView } from '@/components/blocks/SinglePageView';
import { isLocale, locales, type Locale } from '@/lib/i18n';
import { getAllPages, getNavigation, getPageBySlug, getPagesWithContent, getSiteByHost } from '@/lib/strapi';
import { anchorForPageSlug, composeSinglePage } from '@/lib/singlePage';
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

  if (site?.template === 'single_page') {
    const navigation = await getNavigation(locale, siteKey);

    // Deep links to a former page route land on that section in the single view.
    if (path !== 'home') {
      const anchor = anchorForPageSlug(path, navigation?.items);
      redirect(anchor ? `/${locale}#${anchor}` : `/${locale}`);
    }

    const pages = await getPagesWithContent(locale, siteKey);
    const composition = composeSinglePage(pages, navigation?.items);

    if (composition?.mode === 'pages') {
      return <SinglePageView sections={composition.sections} locale={locale} />;
    }

    if (composition?.mode === 'blocks') {
      return (
        <PageView
          page={composition.page}
          locale={locale}
          sectionAnchors={composition.anchors}
        />
      );
    }
  }

  const page = (await getPageBySlug(path, locale, siteKey)) ?? getFallbackPage(path, locale);
  if (!page) notFound();

  return <PageView page={page} locale={locale} />;
}
