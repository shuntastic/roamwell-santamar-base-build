'use client';

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/types/cms';
import { localeLabels, localeNames, locales, type Locale } from '@/lib/i18n';

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

function LocaleSelect({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const rest = pathname.replace(/^\/(en|es|pt)/, '') || '';

  const close = () => setAnchorEl(null);

  return (
    <Box sx={{ flexShrink: 0, ml: { xs: 'auto', md: 0 } }}>
      <Button
        id="locale-select-button"
        size="small"
        color="inherit"
        aria-controls={open ? 'locale-select-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-label={`Language: ${localeNames[locale]}`}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        endIcon={
          <KeyboardArrowDownIcon
            sx={{
              fontSize: '1rem !important',
              transition: 'transform 0.18s ease',
              transform: open ? 'rotate(180deg)' : 'none',
            }}
          />
        }
        sx={{
          minWidth: 0,
          px: 1.1,
          py: 0.35,
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          lineHeight: 1.5,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'currentColor',
          opacity: open ? 1 : 0.78,
          '&:hover': { opacity: 1, bgcolor: 'action.hover' },
          '& .MuiButton-endIcon': { ml: 0.35 },
        }}
      >
        {localeLabels[locale]}
      </Button>

      <Menu
        id="locale-select-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          list: {
            'aria-labelledby': 'locale-select-button',
            dense: true,
            sx: { py: 0.5, minWidth: 148 },
          },
          paper: {
            elevation: 0,
            sx: {
              mt: 0.75,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
              bgcolor: 'background.paper',
              backgroundImage: 'none',
              boxShadow: '0 8px 24px rgba(15, 23, 28, 0.12)',
            },
          },
        }}
      >
        {locales.map((code) => {
          const selected = code === locale;
          return (
            <MenuItem
              key={code}
              component={Link}
              href={`/${code}${rest}`}
              selected={selected}
              onClick={close}
              sx={{
                py: 0.85,
                px: 1.5,
                fontSize: '0.875rem',
                fontWeight: selected ? 600 : 400,
                color: selected ? 'primary.main' : 'text.primary',
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                },
                '&.Mui-selected:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 28,
                  mr: 1,
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  opacity: 0.55,
                }}
              >
                {localeLabels[code]}
              </Box>
              {localeNames[code]}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}

export function SiteHeader({ locale, siteName, items }: Props) {
  const theme = useTheme();
  const pathname = usePathname();
  const sorted = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const { headerStyle, headerHeight, contentMaxWidth, navGap } = theme.layout;

  const headerSx =
    headerStyle === 'solid'
      ? {
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderBottom: '1px solid',
          borderColor: 'primary.dark',
        }
      : headerStyle === 'minimal'
        ? {
            bgcolor: 'transparent',
            color: 'text.primary',
            borderBottom: 'none',
            boxShadow: 'none',
          }
        : {
            bgcolor: 'rgba(247, 251, 252, 0.86)',
            color: 'text.primary',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          };

  return (
    <AppBar position="sticky" elevation={0} sx={headerSx}>
      <Container maxWidth={contentMaxWidth}>
        <Toolbar disableGutters sx={{ gap: 2, minHeight: headerHeight }}>
          <Typography
            component={Link}
            href={`/${locale}`}
            variant="h5"
            sx={{
              fontFamily: 'var(--font-display), "Times New Roman", serif',
              textDecoration: 'none',
              color: headerStyle === 'solid' ? 'inherit' : 'primary.main',
            }}
          >
            {siteName}
          </Typography>

          <Box
            component="nav"
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: navGap,
              flexWrap: 'wrap',
              ml: 'auto',
              mr: 1.5,
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
                  color={
                    headerStyle === 'solid'
                      ? 'inherit'
                      : active
                        ? 'secondary'
                        : 'inherit'
                  }
                  variant={active && headerStyle === 'solid' ? 'outlined' : 'text'}
                  size="small"
                  sx={
                    headerStyle === 'solid' && active
                      ? { borderColor: 'secondary.main', color: 'secondary.light' }
                      : undefined
                  }
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          <LocaleSelect locale={locale} />
        </Toolbar>
      </Container>
    </AppBar>
  );
}
