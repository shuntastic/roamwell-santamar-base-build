'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import type { BlocksImageText } from '@/types/cms';
import { getStrapiMediaUrl } from '@/lib/strapi';
import { StyledCopy } from '@/components/ui/StyledCopy';
import { ThemeSection } from '@/components/layout/ThemeSection';

type Props = {
  block: BlocksImageText;
};

export function ImageTextBlock({ block }: Props) {
  const theme = useTheme();
  const imageUrl = getStrapiMediaUrl(block.image?.url);
  const alt = block.image?.alternativeText || block.title || '';
  const hasCopy = Boolean(block.title || block.subheadline || block.body);

  return (
    <ThemeSection>
      <Grid
        container
        spacing={{ xs: 3, md: 6 }}
        sx={{
          alignItems: 'stretch',
          minHeight: { md: 420 },
        }}
      >
        <Grid size={{ xs: 12, md: 6 }}>
          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt={alt}
              sx={{
                width: '100%',
                height: { xs: 280, md: '100%' },
                minHeight: { md: 420 },
                objectFit: 'cover',
                display: 'block',
                borderRadius: `${theme.layout.cardRadius}px`,
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: { xs: 280, md: '100%' },
                minHeight: { md: 420 },
                bgcolor: 'action.hover',
                borderRadius: `${theme.layout.cardRadius}px`,
              }}
            />
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {hasCopy ? (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                textAlign: 'left',
                gap: 2,
                py: { md: 2 },
              }}
            >
              {block.title ? (
                <Typography variant="h2" sx={{ maxWidth: 520 }}>
                  {block.title}
                </Typography>
              ) : null}
              {block.subheadline ? (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    maxWidth: 480,
                    fontSize: { xs: '1.05rem', md: '1.15rem' },
                    lineHeight: 1.5,
                  }}
                >
                  {block.subheadline}
                </Typography>
              ) : null}
              {block.body ? <StyledCopy content={block.body} /> : null}
            </Box>
          ) : null}
        </Grid>
      </Grid>
    </ThemeSection>
  );
}
