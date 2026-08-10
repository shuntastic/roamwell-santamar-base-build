import type { ThemeOptions } from '@mui/material/styles';

/** Shared type ramp — Bentham (display) + Instrument Sans (body). */
export const sharedTypography: ThemeOptions['typography'] = {
  fontFamily: 'var(--font-body), "Helvetica Neue", Arial, sans-serif',
  h1: {
    fontFamily: 'var(--font-display), "Times New Roman", serif',
    fontWeight: 400,
    letterSpacing: '-0.02em',
    lineHeight: 1.05,
  },
  h2: {
    fontFamily: 'var(--font-display), "Times New Roman", serif',
    fontWeight: 400,
    letterSpacing: '-0.015em',
    lineHeight: 1.15,
  },
  h3: {
    fontFamily: 'var(--font-display), "Times New Roman", serif',
    fontWeight: 400,
    lineHeight: 1.2,
  },
  h4: {
    fontFamily: 'var(--font-display), "Times New Roman", serif',
    fontWeight: 400,
  },
  h5: {
    fontFamily: 'var(--font-display), "Times New Roman", serif',
    fontWeight: 400,
  },
  h6: {
    fontFamily: 'var(--font-display), "Times New Roman", serif',
    fontWeight: 400,
  },
  button: {
    fontFamily: 'var(--font-body), "Helvetica Neue", Arial, sans-serif',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'none',
  },
  body1: {
    fontSize: '1.05rem',
    lineHeight: 1.7,
  },
  body2: {
    fontSize: '0.95rem',
    lineHeight: 1.65,
  },
};
