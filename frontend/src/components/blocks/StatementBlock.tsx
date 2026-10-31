'use client';

import Typography from '@mui/material/Typography';
import type { BlocksStatement } from '@/types/cms';
import { ThemeSection } from '@/components/layout/ThemeSection';
import { CtaButtonGroup } from '@/components/ui/CtaButtonGroup';

type Props = {
  block: BlocksStatement;
  locale: string;
};

export function StatementBlock({ block, locale }: Props) {
  return (
    <ThemeSection
      narrow
      sx={{
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography
        variant="h2"
        component="p"
        sx={{
          fontFamily: 'var(--font-display), "Times New Roman", serif',
          maxWidth: 720,
          lineHeight: 1.25,
          color: 'primary.main',
          fontSize: { xs: '1.85rem', md: '2.75rem' },
        }}
      >
        {block.title}
      </Typography>
      {block.body ? (
        <Typography
          color="text.secondary"
          sx={{
            mt: 2.5,
            maxWidth: 520,
            fontSize: { xs: '1rem', md: '1.1rem' },
            lineHeight: 1.6,
          }}
        >
          {block.body}
        </Typography>
      ) : null}
      <CtaButtonGroup
        buttons={block.buttons}
        locale={locale}
        sx={{ mt: { xs: 3.5, md: 4.5 }, alignSelf: 'stretch' }}
      />
    </ThemeSection>
  );
}
