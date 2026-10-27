'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InstagramIcon from '@mui/icons-material/Instagram';
import { useTheme } from '@mui/material/styles';
import type { GlobalSettings } from '@/types/cms';

type Props = {
  global: GlobalSettings | null;
};

export function SiteFooter({ global }: Props) {
  const theme = useTheme();
  const solid = theme.layout.headerStyle === 'solid';
  const flat = theme.layout.headerStyle === 'flat';
  const instagramUrl = global?.instagramUrl?.trim();

  return (
    <Box
      component="footer"
      sx={{
        mt: '60px',
        py: theme.layout.sectionPaddingY,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: solid ? 'primary.main' : flat ? 'background.default' : 'action.hover',
        color: solid ? 'primary.contrastText' : 'inherit',
      }}
    >
      <Container maxWidth={theme.layout.contentMaxWidth}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'var(--font-display), "Times New Roman", serif',
                color: solid ? 'inherit' : 'primary.main',
                mb: 1,
              }}
            >
              {global?.siteName || 'Santamar'}
            </Typography>
            {global?.tagline ? (
              <Typography
                sx={{
                  mb: 2,
                  color: solid ? 'inherit' : 'text.secondary',
                  opacity: solid ? 0.85 : 1,
                }}
              >
                {global.tagline}
              </Typography>
            ) : null}
            <Typography
              variant="body2"
              sx={{
                color: solid ? 'inherit' : 'text.secondary',
                opacity: solid ? 0.75 : 1,
              }}
            >
              {[global?.address, global?.contactEmail, global?.contactPhone]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>

          {instagramUrl ? (
            <IconButton
              component="a"
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              sx={{
                color: solid ? 'inherit' : 'primary.main',
                border: '1px solid',
                borderColor: solid ? 'rgba(255,255,255,0.35)' : 'divider',
                '&:hover': {
                  bgcolor: solid ? 'rgba(255,255,255,0.12)' : 'action.selected',
                },
              }}
            >
              <InstagramIcon />
            </IconButton>
          ) : null}
        </Box>
      </Container>
    </Box>
  );
}
