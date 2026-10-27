'use client';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import type { SinglePageSection } from '@/lib/singlePage';
import { PageView } from '@/components/blocks/PageView';

type Props = {
  sections: SinglePageSection[];
  locale: string;
};

/**
 * One scrolling view. Each CMS page is a section, in navigation order,
 * addressed by the nav item's section anchor.
 */
export function SinglePageView({ sections, locale }: Props) {
  const theme = useTheme();

  return (
    <Box component="article">
      {sections.map(({ page, anchor }, index) => (
        <Box
          key={page.documentId || `${page.slug}-${anchor}`}
          id={anchor}
          component="section"
          aria-label={page.navLabel || page.title}
          tabIndex={-1}
          data-page-section={page.slug}
          sx={{
            minHeight: '100vh',
            scrollMarginTop: `${theme.layout.headerHeight}px`,
            outline: 'none',
            ...(index > 0
              ? { borderTop: '1px solid', borderColor: 'divider' }
              : null),
          }}
        >
          <PageView page={page} locale={locale} embedded />
        </Box>
      ))}
    </Box>
  );
}
