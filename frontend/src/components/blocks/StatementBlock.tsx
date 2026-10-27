'use client';

import Typography from '@mui/material/Typography';
import type { BlocksStatement } from '@/types/cms';
import { ThemeSection } from '@/components/layout/ThemeSection';

type Props = {
  block: BlocksStatement;
};

export function StatementBlock({ block }: Props) {
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
    </ThemeSection>
  );
}
