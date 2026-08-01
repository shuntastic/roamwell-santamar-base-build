'use client';

import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { AppThemeProvider } from '@/theme/ThemeContext';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';

type Props = {
  children: React.ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <AppRouterCacheProvider>
      <AppThemeProvider>
        {children}
        <ThemeSwitcher />
      </AppThemeProvider>
    </AppRouterCacheProvider>
  );
}
