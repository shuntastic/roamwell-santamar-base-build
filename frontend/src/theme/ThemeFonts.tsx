'use client';

/** Adobe Fonts kit: widescreen (700), mokoko (400), sweet-sans-pro. */
export const BLACKBOX_TYPEKIT_HREF = 'https://use.typekit.net/dns0ufe.css';

type Props = {
  themeId: string;
};

/**
 * Loads the Black Box typekit and points the shared font variables at it.
 * `!important` wins over the root next/font classes, which set the same variables.
 * Unmounting restores the default faces for every other theme.
 */
export function ThemeFonts({ themeId }: Props) {
  if (themeId !== 'blackbox') return null;

  return (
    <>
      <link rel="stylesheet" href={BLACKBOX_TYPEKIT_HREF} />
      <style>{`
        html {
          --font-display: "widescreen", sans-serif !important;
          --font-body: "mokoko", serif !important;
        }
      `}</style>
    </>
  );
}
