'use client';

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem, StrapiMedia } from '@/types/cms';
import { SiteLogoMark } from '@/components/layout/SiteLogoMark';
import { localeLabels, localeNames, locales, type Locale } from '@/lib/i18n';

/** MUI `md` — 900px. Nav collapses to a hamburger below this width. */
const NAV_BREAKPOINT = 'md' as const;

type Props = {
  locale: Locale;
  siteName: string;
  logo?: StrapiMedia | null;
  logoSvgMarkup?: string | null;
  items: NavItem[];
};

function localizeHref(locale: Locale, url: string) {
  if (url.startsWith('http')) return url;
  const path = url === '/' ? '' : url;
  return `/${locale}${path}`;
}

function LocaleSelect({
  locale,
  idPrefix = 'locale-select',
}: {
  locale: Locale;
  idPrefix?: string;
}) {
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const rest = pathname.replace(/^\/(en|es|pt)/, '') || '';
  const buttonId = `${idPrefix}-button`;
  const menuId = `${idPrefix}-menu`;

  const close = () => setAnchorEl(null);

  return (
    <Box sx={{ flexShrink: 0 }}>
      <Button
        id={buttonId}
        size="small"
        color="inherit"
        aria-controls={open ? menuId : undefined}
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
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          list: {
            'aria-labelledby': buttonId,
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

export function SiteHeader({ locale, siteName, logo, logoSvgMarkup, items }: Props) {
  const theme = useTheme();
  const pathname = usePathname();
  const sorted = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const { headerStyle, headerHeight, contentMaxWidth, navGap } = theme.layout;
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
            bgcolor: 'rgba(247, 251, 252, 1.0)',
            color: 'text.primary',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          };

  const closeMobile = () => setMobileOpen(false);

  return (
    <AppBar position="sticky" elevation={0} sx={headerSx}>
      <Container maxWidth={contentMaxWidth}>
        <Toolbar disableGutters sx={{ gap: 2, minHeight: headerHeight }}>
          {logo ? (
            <Box
              component={Link}
              href={`/${locale}`}
              aria-label={siteName}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                lineHeight: 0,
                flexShrink: 0,
                height: { xs: 38, sm: 38 },
                maxWidth: { xs: 150, sm: 200, md: 240 },
              }}
            >
              <SiteLogoMark logo={logo} siteName={siteName} svgMarkup={logoSvgMarkup} />
            </Box>
          ) : (
            <Typography
              component={Link}
              href={`/${locale}`}
              variant="h5"
              sx={{
                fontFamily: 'var(--font-display), "Times New Roman", serif',
                textDecoration: 'none',
                fontSize: '2.025rem',
                color: headerStyle === 'solid' ? 'inherit' : 'secondary.main',
              }}
            >
              {siteName}
            </Typography>
          )}

          <Box
            component="nav"
            aria-label="Primary"
            sx={{
              display: { xs: 'none', [NAV_BREAKPOINT]: 'flex' },
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

          <Box
            sx={{
              display: { xs: 'none', [NAV_BREAKPOINT]: 'block' },
              flexShrink: 0,
            }}
          >
            <LocaleSelect locale={locale} idPrefix="locale-header" />
          </Box>

          <IconButton
            color="inherit"
            aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
            aria-controls="mobile-navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((current) => !current)}
            sx={{
              display: { xs: 'inline-flex', [NAV_BREAKPOINT]: 'none' },
              ml: 'auto',
            }}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Toolbar>
      </Container>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={closeMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', [NAV_BREAKPOINT]: 'none' },
          '& .MuiDrawer-paper': {
            width: 'min(100vw - 48px, 320px)',
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            color: 'text.primary',
            px: 1,
            pt: 1,
            pb: 3,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1,
            minHeight: headerHeight,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}
          >
            Menu
          </Typography>
          <IconButton aria-label="Close navigation" onClick={closeMobile} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        <Box
          component="nav"
          id="mobile-navigation"
          aria-label="Primary"
          sx={{ pt: 1 }}
        >
          <List disablePadding>
            {sorted.map((item) => {
              const href = localizeHref(locale, item.url);
              const active =
                pathname === href || (item.url !== '/' && pathname.startsWith(href));
              return (
                <ListItemButton
                  key={`${item.label}-${item.url}`}
                  component={Link}
                  href={href}
                  selected={active}
                  onClick={closeMobile}
                  sx={{
                    borderRadius: 1,
                    mx: 0.5,
                    '&.Mui-selected': {
                      color: 'secondary.main',
                    },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        sx: { fontWeight: active ? 600 : 400 },
                      },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ px: 1.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 1, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Language
          </Typography>
          <LocaleSelect locale={locale} idPrefix="locale-drawer" />
        </Box>
      </Drawer>
    </AppBar>
  );
}
