export const themeIds = ['coastal', 'harbor', 'dune'] as const;

export type ThemeId = (typeof themeIds)[number];

export const defaultThemeId: ThemeId = 'coastal';

export const themeLabels: Record<ThemeId, string> = {
  coastal: 'Coastal',
  harbor: 'Harbor',
  dune: 'Dune',
};

export const themeDescriptions: Record<ThemeId, string> = {
  coastal: 'Atlantic teal, soft glass header, rounded CTAs',
  harbor: 'Ink & brass, solid header, squared geometry',
  dune: 'Warm sand & olive, airy header, soft editorial rhythm',
};

export type LayoutTokens = {
  id: ThemeId;
  label: string;
  headerStyle: 'glass' | 'solid' | 'minimal';
  headerHeight: number;
  contentMaxWidth: 'md' | 'lg' | 'xl';
  sectionPaddingY: { xs: number; md: number };
  heroMinHeight: { xs: string; md: string };
  buttonRadius: number | string;
  cardRadius: number;
  navGap: number;
  /** Pixel gap between Media Grid cells. When omitted, the grid keeps its default spacing. */
  mediaGridGap?: number;
  /** Corner radius for Media Grid tiles. Defaults to `cardRadius`. */
  mediaGridRadius?: number;
  /** Stretch the Media Grid to the width of the browser window. */
  mediaGridFullBleed?: boolean;
  /**
   * When set, item titles overlap the bottom of the thumbnail.
   * `maxWidth` is relative to the item. `background` is the title panel fill.
   */
  mediaGridTitle?: {
    maxWidth: string;
    background: string;
  };
};

declare module '@mui/material/styles' {
  interface Theme {
    layout: LayoutTokens;
  }
  interface ThemeOptions {
    layout?: Partial<LayoutTokens>;
  }
}
