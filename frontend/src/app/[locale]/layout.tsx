import Box from '@mui/material/Box';
import { notFound } from 'next/navigation';
import {
  isSvgMedia,
  getNavigation,
  getSiteByHost,
  getStrapiMediaUrl,
  siteToGlobalSettings,
} from '@/lib/strapi';
import { getRequestSiteHost } from '@/lib/siteHost';
import { FALLBACK_NAV } from '@/lib/fallbackContent';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { AppThemeProvider } from '@/theme/ThemeContext';
import { isLocale, type Locale } from '@/lib/i18n';
import type { Site } from '@/types/cms';

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

async function loadLogoSvgMarkup(logo: Site['logo']) {
  if (!logo) return null;
  const url = getStrapiMediaUrl(logo.url);
  if (!url || !isSvgMedia(logo, url)) return null;

  try {
    const res = await fetch(
      url,
      process.env.STATIC_EXPORT === 'true' ? { cache: 'force-cache' } : { next: { revalidate: 60 } },
    );
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

  const host = await getRequestSiteHost();
  const site = await getSiteByHost(host, locale);
  if (!site) notFound();

  const navigation = await getNavigation(locale, site.key);
  const brand = siteToGlobalSettings(site);

  const items = navigation?.items?.length ? navigation.items : FALLBACK_NAV[locale];
  const logoSvgMarkup = await loadLogoSvgMarkup(site.logo);
  const siteName = site.siteName || 'Santamar';

  return (
    <AppThemeProvider initialThemeId={site.theme || 'coastal'}>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader
          locale={locale}
          siteName={siteName}
          logo={site.logo}
          logoSvgMarkup={logoSvgMarkup}
          items={items}
          template={site.template || 'multi_page'}
        />
        <Box component="main" sx={{ flex: 1 }}>
          {children}
        </Box>
        <SiteFooter global={brand} />
      </Box>
      <ThemeSwitcher />
    </AppThemeProvider>
  );
}
