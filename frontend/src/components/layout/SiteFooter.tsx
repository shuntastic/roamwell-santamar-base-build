'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import type { GlobalSettings } from '@/types/cms';

type Props = {
  global: GlobalSettings | null;
};

export function SiteFooter({ global }: Props) {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        mt: '60px',
        py: theme.layout.sectionPaddingY,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor:
          theme.layout.headerStyle === 'solid'
            ? 'primary.main'
            : 'action.hover',
        color: theme.layout.headerStyle === 'solid' ? 'primary.contrastText' : 'inherit',
      }}
    >
      <Container maxWidth={theme.layout.contentMaxWidth}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: 'var(--font-display), "Times New Roman", serif',
            color: theme.layout.headerStyle === 'solid' ? 'inherit' : 'primary.main',
            mb: 1,
          }}
        >
          {global?.siteName || 'Santamar'}
        </Typography>
        {global?.tagline ? (
          <Typography
            sx={{
              mb: 2,
              color: theme.layout.headerStyle === 'solid' ? 'inherit' : 'text.secondary',
              opacity: theme.layout.headerStyle === 'solid' ? 0.85 : 1,
            }}
          >
            {global.tagline}
          </Typography>
        ) : null}
        <Typography
          variant="body2"
          sx={{
            color: theme.layout.headerStyle === 'solid' ? 'inherit' : 'text.secondary',
            opacity: theme.layout.headerStyle === 'solid' ? 0.75 : 1,
          }}
        >
          {[global?.address, global?.contactEmail, global?.contactPhone].filter(Boolean).join(' · ')}
        </Typography>
      </Container>
    </Box>
  );
}
