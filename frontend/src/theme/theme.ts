'use client';

import { createTheme } from '@mui/material/styles';

/**
 * Santamar visual system — coastal hospitality.
 * Deep Atlantic teal + warm sand + coral accent.
 * Avoids common AI-default palettes (purple gradients, cream/terracotta, broadsheet).
 */
export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: {
      main: '#0B4F6C',
      light: '#1B6B8A',
      dark: '#073A50',
      contrastText: '#F7F4EF',
    },
    secondary: {
      main: '#C45C26',
      light: '#D97845',
      dark: '#9A4318',
      contrastText: '#FFF8F2',
    },
    background: {
      default: '#E8F1F4',
      paper: '#F7FBFC',
    },
    text: {
      primary: '#132A33',
      secondary: '#3D5A66',
    },
    divider: 'rgba(11, 79, 108, 0.14)',
  },
  typography: {
    fontFamily: 'var(--font-body), "Segoe UI", sans-serif',
    h1: {
      fontFamily: 'var(--font-display), Georgia, serif',
      fontWeight: 500,
      letterSpacing: '-0.02em',
      lineHeight: 1.05,
    },
    h2: {
      fontFamily: 'var(--font-display), Georgia, serif',
      fontWeight: 500,
      letterSpacing: '-0.015em',
      lineHeight: 1.15,
    },
    h3: {
      fontFamily: 'var(--font-display), Georgia, serif',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    h4: {
      fontFamily: 'var(--font-display), Georgia, serif',
      fontWeight: 500,
    },
    button: {
      fontFamily: 'var(--font-body), "Segoe UI", sans-serif',
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'none',
    },
    body1: {
      fontSize: '1.05rem',
      lineHeight: 1.7,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: '1.35rem',
          paddingBlock: '0.65rem',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(11, 79, 108, 0.22)',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            'radial-gradient(ellipse 90% 60% at 10% -10%, rgba(27, 107, 138, 0.18), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 0%, rgba(196, 92, 38, 0.1), transparent 50%), linear-gradient(180deg, #E8F1F4 0%, #F4F8FA 40%, #EAF3F6 100%)',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
        a: {
          color: 'inherit',
        },
      },
    },
  },
});
