import Box from '@mui/material/Box';
import { notFound } from 'next/navigation';
import { isSvgMedia, getGlobal, getNavigation, getStrapiMediaUrl } from '@/lib/strapi';
import { FALLBACK_NAV } from '@/lib/fallbackContent';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { isLocale, type Locale } from '@/lib/i18n';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/** Strip executable bits from CMS SVG before inlining in the header. */
function sanitizeSvgMarkup(markup: string): string {
  return markup
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/xlink:href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, '');
}

async function loadLogoSvgMarkup(logo: NonNullable<Awaited<ReturnType<typeof getGlobal>>>['logo']) {
  if (!logo) return null;
  const url = getStrapiMediaUrl(logo.url);
  if (!url || !isSvgMedia(logo, url)) return null;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return sanitizeSvgMarkup(await res.text());
  } catch {
    return null;
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;

  const [navigation, global] = await Promise.all([
    getNavigation(locale),
    getGlobal(locale),
  ]);

  const items = navigation?.items?.length ? navigation.items : FALLBACK_NAV[locale];
  const logoSvgMarkup = await loadLogoSvgMarkup(global?.logo);
  const siteName = global?.siteName || 'Santamar';

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader
        locale={locale}
        siteName={siteName}
        logo={global?.logo}
        logoSvgMarkup={logoSvgMarkup}
        items={items}
      />
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
      <SiteFooter global={global} />
    </Box>
  );
}
