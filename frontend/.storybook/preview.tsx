import type { Preview } from '@storybook/nextjs-vite';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '../src/theme/theme';
import React from 'react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
    a11y: {
      test: 'todo',
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ fontFamily: 'var(--font-body), sans-serif' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;
