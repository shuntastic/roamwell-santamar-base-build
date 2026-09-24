'use client';

import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

type Props = {
  children: React.ReactNode;
};

/** Root providers that do not depend on the resolved Site (theme lives in locale layout). */
export function AppProviders({ children }: Props) {
  return <AppRouterCacheProvider>{children}</AppRouterCacheProvider>;
}
