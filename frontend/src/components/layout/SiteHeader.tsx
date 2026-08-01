'use client';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/types/cms';
import { localeLabels, locales, type Locale } from '@/lib/i18n';

type Props = {
  locale: Locale;
  siteName: string;
  items: NavItem[];
};

function localizeHref(locale: Locale, url: string) {
  if (url.startsWith('http')) return url;
  const path = url === '/' ? '' : url;
  return `/${locale}${path}`;
}

export function SiteHeader({ locale, siteName, items }: Props) {
  const pathname = usePathname();
  const sorted = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(247, 251, 252, 0.86)',
        color: 'text.primary',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 2, minHeight: 72 }}>
          <Typography
            component={Link}
            href={`/${locale}`}
            variant="h5"
            sx={{
              fontFamily: 'var(--font-display), Georgia, serif',
              textDecoration: 'none',
              color: 'primary.main',
              mr: 'auto',
            }}
          >
            {siteName}
          </Typography>

          <Box
            component="nav"
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.5,
              flexWrap: 'wrap',
            }}
          >
            {sorted.map((item) => {
              const href = localizeHref(locale, item.url);
              const active = pathname === href || (item.url !== '/' && pathname.startsWith(href));
              return (
                <Button
                  key={`${item.label}-${item.url}`}
                  component={Link}
                  href={href}
                  color={active ? 'secondary' : 'inherit'}
                  size="small"
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {locales.map((code) => {
              const rest = pathname.replace(/^\/(en|es|pt)/, '') || '';
              return (
                <Button
                  key={code}
                  component={Link}
                  href={`/${code}${rest}`}
                  size="small"
                  variant={code === locale ? 'outlined' : 'text'}
                  sx={{ minWidth: 40 }}
                >
                  {localeLabels[code]}
                </Button>
              );
            })}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
