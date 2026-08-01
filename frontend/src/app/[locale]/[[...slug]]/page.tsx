import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageView } from '@/components/blocks/PageView';
import { isLocale, locales, type Locale } from '@/lib/i18n';
import { getAllPages, getPageBySlug } from '@/lib/strapi';
import { getFallbackPage } from '@/lib/fallbackContent';

type Props = {
  params: Promise<{ locale: string; slug?: string[] }>;
};

export async function generateStaticParams() {
  const params: Array<{ locale: string; slug?: string[] }> = [];

  for (const locale of locales) {
    params.push({ locale, slug: undefined });
    const pages = await getAllPages(locale);
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
  const path = slug?.join('/') || 'home';
  const page = (await getPageBySlug(path, locale)) ?? getFallbackPage(path, locale);

  return {
    title: page?.seo?.metaTitle || page?.title || 'Santamar',
    description: page?.seo?.metaDescription || undefined,
  };
}

export default async function CmsPageRoute({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const path = slug?.join('/') || 'home';

  const page = (await getPageBySlug(path, locale)) ?? getFallbackPage(path, locale);
  if (!page) notFound();

  return <PageView page={page} locale={locale} />;
}
