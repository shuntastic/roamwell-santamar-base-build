import Box from '@mui/material/Box';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { isLocale, type Locale } from '@/lib/i18n';
import { getGlobal, getNavigation } from '@/lib/strapi';
import { FALLBACK_NAV } from '@/lib/fallbackContent';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale = localeParam as Locale;

  const [navigation, global] = await Promise.all([
    getNavigation(locale),
    getGlobal(locale),
  ]);

  const items = navigation?.items?.length ? navigation.items : FALLBACK_NAV[locale];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader
        locale={locale}
        siteName={global?.siteName || 'Santamar'}
        items={items}
      />
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
      <SiteFooter global={global} />
    </Box>
  );
}
