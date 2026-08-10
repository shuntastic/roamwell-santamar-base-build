'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import type { BlocksContactForm } from '@/types/cms';
import { getStrapiMediaUrl } from '@/lib/strapi';
import { ThemeSection } from '@/components/layout/ThemeSection';

type Props = {
  block: BlocksContactForm;
};

export function ContactFormBlock({ block }: Props) {
  const theme = useTheme();
  const [submitted, setSubmitted] = React.useState(false);
  const imageUrl = getStrapiMediaUrl(block.image?.url);
  const radius = `${theme.layout.cardRadius}px`;

  return (
    <ThemeSection>
      <Grid
        container
        spacing={{ xs: 3, md: 6 }}
        sx={{
          alignItems: 'stretch',
          minHeight: { md: 480 },
        }}
      >
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: { xs: 280, md: '100%' },
              minHeight: { md: 480 },
              borderRadius: radius,
              overflow: 'hidden',
              bgcolor: 'action.hover',
            }}
          >
            {imageUrl ? (
              <Box
                component="img"
                src={imageUrl}
                alt={block.image?.alternativeText || block.title || ''}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : null}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 2,
              py: { md: 2 },
            }}
          >
            {block.title ? (
              <Typography variant="h2" sx={{ maxWidth: 520 }}>
                {block.title}
              </Typography>
            ) : null}
            {block.intro ? (
              <Typography color="text.secondary" sx={{ maxWidth: 480, mb: 1 }}>
                {block.intro}
              </Typography>
            ) : null}

            {submitted ? (
              <Typography>{block.successMessage || 'Thank you. We will be in touch soon.'}</Typography>
            ) : (
              <Box
                component="form"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSubmitted(true);
                }}
                sx={{ display: 'grid', gap: 2, maxWidth: 480, width: '100%' }}
              >
                <TextField name="name" label="Name" required fullWidth />
                <TextField name="email" type="email" label="Email" required fullWidth />
                <TextField name="message" label="Message" required fullWidth multiline minRows={4} />
                <Button type="submit" variant="contained" color="primary">
                  {block.submitLabel || 'Send Message'}
                </Button>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </ThemeSection>
  );
}
