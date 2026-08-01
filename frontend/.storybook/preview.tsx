import type { Preview } from '@storybook/nextjs-vite';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import React from 'react';
import { getTheme } from '../src/theme/theme';
import { themeIds, themeLabels, type ThemeId } from '../src/theme/types';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Active Santa Mar visual theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: themeIds.map((id) => ({
          value: id,
          title: themeLabels[id],
        })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'coastal',
  },
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
    (Story, context) => {
      const themeId = (context.globals.theme as ThemeId) || 'coastal';
      const theme = getTheme(themeId);

      return (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div
            data-theme={themeId}
            style={{
              fontFamily: 'var(--font-body), "Helvetica Neue", Arial, sans-serif',
              minHeight: '100vh',
            }}
          >
            <Story />
          </div>
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
