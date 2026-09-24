'use client';

import * as React from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getTheme } from '@/theme/theme';
import {
  defaultThemeId,
  themeIds,
  type ThemeId,
} from '@/theme/types';

const STORAGE_KEY = 'santamar.themeId';
const SWITCHER_STORAGE_KEY = 'santamar.themeSwitcherVisible';

type ThemeContextValue = {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  switcherVisible: boolean;
  setSwitcherVisible: (visible: boolean) => void;
  toggleSwitcher: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function isThemeId(value: string | null | undefined): value is ThemeId {
  return !!value && (themeIds as readonly string[]).includes(value);
}

function readStoredThemeId(fallback: ThemeId): ThemeId {
  if (typeof window === 'undefined') return fallback;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isThemeId(stored) ? stored : fallback;
}

function readSwitcherDefault(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = window.localStorage.getItem(SWITCHER_STORAGE_KEY);
  if (stored === 'true') return true;
  if (stored === 'false') return false;
  return process.env.NEXT_PUBLIC_ENABLE_THEME_SWITCHER === 'true';
}

type Props = {
  children: React.ReactNode;
  /** Theme from the resolved CMS Site. Production uses this; the dev switcher may override. */
  initialThemeId?: string | null;
};

export function AppThemeProvider({ children, initialThemeId }: Props) {
  const cmsTheme = isThemeId(initialThemeId) ? initialThemeId : defaultThemeId;
  const [themeId, setThemeIdState] = React.useState<ThemeId>(cmsTheme);
  const [switcherVisible, setSwitcherVisibleState] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const switcherOn = readSwitcherDefault();
    setSwitcherVisibleState(switcherOn);
    // Dev switcher may override via localStorage; otherwise CMS theme wins.
    setThemeIdState(switcherOn ? readStoredThemeId(cmsTheme) : cmsTheme);
    setReady(true);
  }, [cmsTheme]);

  React.useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = themeId;
    if (switcherVisible) {
      window.localStorage.setItem(STORAGE_KEY, themeId);
    }
  }, [themeId, ready, switcherVisible]);

  React.useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(SWITCHER_STORAGE_KEY, String(switcherVisible));
  }, [switcherVisible, ready]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === 't') {
        event.preventDefault();
        setSwitcherVisibleState((current) => !current);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const setThemeId = React.useCallback((id: ThemeId) => {
    setThemeIdState(id);
  }, []);

  const setSwitcherVisible = React.useCallback((visible: boolean) => {
    setSwitcherVisibleState(visible);
  }, []);

  const toggleSwitcher = React.useCallback(() => {
    setSwitcherVisibleState((current) => !current);
  }, []);

  const value = React.useMemo(
    () => ({
      themeId,
      setThemeId,
      switcherVisible,
      setSwitcherVisible,
      toggleSwitcher,
    }),
    [themeId, setThemeId, switcherVisible, setSwitcherVisible, toggleSwitcher],
  );

  const muiTheme = getTheme(themeId);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }
  return context;
}
