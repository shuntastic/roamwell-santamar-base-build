'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { StrapiSlideshow } from '@/types/cms';
import { getStrapiMediaUrl } from '@/lib/strapi';

type Props = {
  slideshow: StrapiSlideshow;
};

export function Slideshow({ slideshow }: Props) {
  const slides = slideshow.slides ?? [];
  const [index, setIndex] = React.useState(0);
  const active = slides[index];

  React.useEffect(() => {
    if (!slideshow.autoplay || slides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, slideshow.intervalMs ?? 5000);
    return () => window.clearInterval(timer);
  }, [slideshow.autoplay, slideshow.intervalMs, slides.length]);

  if (!active?.media) return null;

  const mediaUrl = getStrapiMediaUrl(active.media.url);
  const isVideo = active.media.mime?.startsWith('video/');

  return (
    <Box
      component="section"
      aria-roledescription="carousel"
      aria-label={slideshow.title || 'Slideshow'}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'primary.dark',
        color: 'primary.contrastText',
        minHeight: { xs: 280, md: 480 },
      }}
    >
      {slideshow.title ? (
        <Typography
          variant="overline"
          sx={{ position: 'absolute', top: 16, left: 20, zIndex: 2, opacity: 0.85 }}
        >
          {slideshow.title}
        </Typography>
      ) : null}

      <Box sx={{ position: 'absolute', inset: 0 }}>
        {isVideo ? (
          <Box
            component="video"
            key={mediaUrl}
            src={mediaUrl ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box
            component="img"
            key={mediaUrl}
            src={mediaUrl ?? undefined}
            alt={active.altText || active.caption || slideshow.title || ''}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(7,58,80,0.15) 0%, rgba(7,58,80,0.55) 100%)',
          }}
        />
      </Box>

      {active.caption ? (
        <Typography
          variant="body1"
          sx={{
            position: 'absolute',
            left: { xs: 20, md: 40 },
            right: { xs: 20, md: 120 },
            bottom: { xs: 24, md: 36 },
            zIndex: 2,
            maxWidth: 640,
            fontFamily: 'var(--font-display), Georgia, serif',
            fontSize: { xs: '1.15rem', md: '1.5rem' },
          }}
        >
          {active.caption}
        </Typography>
      ) : null}

      {slides.length > 1 ? (
        <Box sx={{ position: 'absolute', right: 12, bottom: 12, zIndex: 2, display: 'flex', gap: 0.5 }}>
          <IconButton
            aria-label="Previous slide"
            onClick={() => setIndex((current) => (current - 1 + slides.length) % slides.length)}
            sx={{ color: 'inherit', bgcolor: 'rgba(255,255,255,0.12)' }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            aria-label="Next slide"
            onClick={() => setIndex((current) => (current + 1) % slides.length)}
            sx={{ color: 'inherit', bgcolor: 'rgba(255,255,255,0.12)' }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      ) : null}
    </Box>
  );
}
