/**
 * Theme system entry points.
 *
 * - `themes` / `getTheme(id)` — three visual systems (coastal, harbor, dune)
 * - `theme.layout` — layout tokens each component should prefer over hard-coded spacing
 * - `AppThemeProvider` + `ThemeSwitcher` — runtime switching while developing
 * - Shared fonts: Ledger (display) + Instrument Sans (body) via CSS variables
 */
export { themes, getTheme, theme } from '@/theme/theme';
export { AppThemeProvider, useAppTheme } from '@/theme/ThemeContext';
export {
  themeIds,
  themeLabels,
  themeDescriptions,
  defaultThemeId,
  type ThemeId,
  type LayoutTokens,
} from '@/theme/types';
export { sharedTypography } from '@/theme/typography';
