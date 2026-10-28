'use client';

import { createTheme, type Theme, type ThemeOptions } from '@mui/material/styles';
import { sharedTypography } from '@/theme/typography';
import type { LayoutTokens, ThemeId } from '@/theme/types';

type ContainedButtonTokens = {
  backgroundColor: string;
  color: string;
  hoverBackgroundColor: string;
};

type ThemeDefinition = {
  id: ThemeId;
  layout: LayoutTokens;
  palette: NonNullable<ThemeOptions['palette']>;
  shape: { borderRadius: number };
  backgroundImage: string;
  buttonContainedHoverShadow: string;
  buttonRadius: number | string;
  /** Filled buttons. When set, every contained color uses this fill. */
  containedButton?: ContainedButtonTokens;
  /** Per-theme typography overrides merged onto `sharedTypography`. */
  typography?: ThemeOptions['typography'];
};

const BLACKBOX_BUTTON: ContainedButtonTokens = {
  backgroundColor: '#c1e1ff',
  color: '#332b1b',
  hoverBackgroundColor: '#7f97af',
};

function containedButtonOverrides(tokens: ContainedButtonTokens | undefined) {
  if (!tokens) return {};
  const filled = {
    backgroundColor: tokens.backgroundColor,
    color: tokens.color,
    '&:hover': {
      backgroundColor: tokens.hoverBackgroundColor,
      color: tokens.color,
    },
  };
  return {
    containedPrimary: filled,
    containedSecondary: filled,
  };
}

function buildTheme(definition: ThemeDefinition): Theme {
  return createTheme(
    {
      cssVariables: true,
      palette: definition.palette,
      typography: sharedTypography,
      shape: definition.shape,
      layout: definition.layout,
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: definition.buttonRadius,
              paddingInline: '1.35rem',
              paddingBlock: '0.65rem',
            },
            contained: {
              boxShadow: 'none',
              ...(definition.containedButton
                ? {
                    backgroundColor: definition.containedButton.backgroundColor,
                    color: definition.containedButton.color,
                  }
                : {}),
              '&:hover': {
                boxShadow: definition.buttonContainedHoverShadow,
                ...(definition.containedButton
                  ? {
                      backgroundColor: definition.containedButton.hoverBackgroundColor,
                      color: definition.containedButton.color,
                    }
                  : {}),
              },
            },
            ...containedButtonOverrides(definition.containedButton),
          },
        },
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: (
                definition.palette.background as { default?: string } | undefined
              )?.default,
              backgroundImage: definition.backgroundImage,
              backgroundAttachment: 'fixed',
              minHeight: '100vh',
            },
            a: {
              color: 'inherit',
            },
          },
        },
      },
    },
    definition.typography ? { typography: definition.typography } : {},
  );
}

/** Default — coastal hospitality: Atlantic teal + coral. */
const coastal = buildTheme({
  id: 'coastal',
  layout: {
    id: 'coastal',
    label: 'Coastal',
    headerStyle: 'glass',
    headerHeight: 72,
    contentMaxWidth: 'lg',
    sectionPaddingY: { xs: 6, md: 10 },
    heroMinHeight: { xs: '88vh', md: '92vh' },
    buttonRadius: 999,
    cardRadius: 4,
    navGap: 0.5,
  },
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
    h3: {
      color: '#c45c26',
    },
  },
  shape: { borderRadius: 4 },
  buttonRadius: 999,
  buttonContainedHoverShadow: '0 8px 24px rgba(11, 79, 108, 0.22)',
  backgroundImage:
    'radial-gradient(ellipse 90% 60% at 10% -10%, rgba(27, 107, 138, 0.18), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 0%, rgba(196, 92, 38, 0.1), transparent 50%), linear-gradient(180deg, #E8F1F4 0%, #F4F8FA 40%, #EAF3F6 100%)',
});

/** Alternate — harbor: ink navy, brass accent, squared chrome. */
const harbor = buildTheme({
  id: 'harbor',
  layout: {
    id: 'harbor',
    label: 'Harbor',
    headerStyle: 'solid',
    headerHeight: 64,
    contentMaxWidth: 'lg',
    sectionPaddingY: { xs: 5, md: 8 },
    heroMinHeight: { xs: '78vh', md: '85vh' },
    buttonRadius: 2,
    cardRadius: 2,
    navGap: 1,
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#15233B',
      light: '#2A3F63',
      dark: '#0C1526',
      contrastText: '#F3F0E8',
    },
    secondary: {
      main: '#B08D57',
      light: '#C9A978',
      dark: '#8A6B3C',
      contrastText: '#1A140C',
    },
    background: {
      default: '#EEF0F3',
      paper: '#F8F7F4',
    },
    text: {
      primary: '#121820',
      secondary: '#4A5564',
    },
    divider: 'rgba(21, 35, 59, 0.16)',
  },
  shape: { borderRadius: 2 },
  buttonRadius: 2,
  buttonContainedHoverShadow: '0 6px 18px rgba(21, 35, 59, 0.2)',
  backgroundImage:
    'linear-gradient(180deg, #E6E9EE 0%, #EEF0F3 45%, #E8E4DB 100%), repeating-linear-gradient(90deg, rgba(21,35,59,0.03) 0 1px, transparent 1px 72px)',
});

/** Alternate — dune: warm sand, olive, softer editorial spacing. */
const dune = buildTheme({
  id: 'dune',
  layout: {
    id: 'dune',
    label: 'Dune',
    headerStyle: 'minimal',
    headerHeight: 80,
    contentMaxWidth: 'md',
    sectionPaddingY: { xs: 7, md: 12 },
    heroMinHeight: { xs: '90vh', md: '96vh' },
    buttonRadius: 12,
    cardRadius: 12,
    navGap: 1.25,
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#3F4F3A',
      light: '#5A6B54',
      dark: '#2A3527',
      contrastText: '#F8F4EC',
    },
    secondary: {
      main: '#C47A4A',
      light: '#D4966D',
      dark: '#9C5C34',
      contrastText: '#FFF8F2',
    },
    background: {
      default: '#F3EBDD',
      paper: '#FBF7F0',
    },
    text: {
      primary: '#2C261F',
      secondary: '#6B5E50',
    },
    divider: 'rgba(63, 79, 58, 0.14)',
  },
  shape: { borderRadius: 12 },
  buttonRadius: 12,
  buttonContainedHoverShadow: '0 10px 28px rgba(63, 79, 58, 0.18)',
  backgroundImage:
    'radial-gradient(ellipse 80% 50% at 80% -5%, rgba(196, 122, 74, 0.16), transparent 55%), radial-gradient(ellipse 70% 45% at 0% 10%, rgba(63, 79, 58, 0.1), transparent 50%), linear-gradient(165deg, #F6F0E4 0%, #F3EBDD 50%, #EBE2D2 100%)',
});

const blackboxHeading = {
  fontFamily: '"widescreen", sans-serif',
  fontWeight: 700,
  fontStyle: 'normal',
  letterSpacing: 'normal',
} as const;

const blackboxBody = {
  fontFamily: '"mokoko", serif',
  fontWeight: 400,
  fontStyle: 'normal',
} as const;

/** Black Box — Widescreen titles, Mokoko body, stone type on a cool gray field. */
const blackbox = buildTheme({
  id: 'blackbox',
  layout: {
    id: 'blackbox',
    label: 'Black Box',
    headerStyle: 'flat',
    headerHeight: 72,
    contentMaxWidth: 'lg',
    sectionPaddingY: { xs: 6, md: 10 },
    heroMinHeight: { xs: '88vh', md: '92vh' },
    buttonRadius: 0,
    cardRadius: 0,
    navGap: 1,
    mediaGridGap: 1,
    mediaGridRadius: 0,
    mediaGridFullBleed: true,
    mediaGridTitle: {
      maxWidth: '100%',
      background: 'rgba(255, 255, 255, 0.55)',
      // backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0))',
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#332b1b',
      light: '#5c5142',
      dark: '#1c170f',
      contrastText: '#c1e1ff',
    },
    secondary: {
      main: '#ffffff',
      light: '#c5d2de',
      dark: '#5d7590',
      contrastText: '#332b1b',
    },
    background: {
      default: '#e9ecf1',
      paper: '#f7f8fa',
    },
    text: {
      primary: '#332b1b',
      secondary: '#ffffff',
    },
    divider: 'rgba(51, 43, 27, 0.16)',
  },
  typography: {
    fontFamily: blackboxBody.fontFamily,
    fontWeightRegular: 400,
    fontWeightMedium: 400,
    h1: blackboxHeading,
    h2: blackboxHeading,
    h3: blackboxHeading,
    h4: blackboxHeading,
    h5: blackboxHeading,
    h6: blackboxHeading,
    subtitle1: blackboxBody,
    subtitle2: blackboxBody,
    body1: blackboxBody,
    body2: blackboxBody,
    button: blackboxBody,
    caption: blackboxBody,
    overline: blackboxBody,
  },
  shape: { borderRadius: 0 },
  buttonRadius: 0,
  containedButton: BLACKBOX_BUTTON,
  buttonContainedHoverShadow: 'none',
  backgroundImage: 'none',
});

export const themes: Record<ThemeId, Theme> = {
  coastal,
  harbor,
  dune,
  blackbox,
};

export function getTheme(id: ThemeId): Theme {
  return themes[id] ?? themes.coastal;
}

/** @deprecated Prefer `getTheme(themeId)` / ThemeProvider context. */
export const theme = themes.coastal;
