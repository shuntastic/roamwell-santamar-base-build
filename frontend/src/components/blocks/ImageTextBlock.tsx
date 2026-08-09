'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTheme } from '@mui/material/styles';
import type { BlocksImageText, StrapiMedia } from '@/types/cms';
import { getStrapiMediaUrl } from '@/lib/strapi';
import { StyledCopy } from '@/components/ui/StyledCopy';
import { ThemeSection } from '@/components/layout/ThemeSection';

type Props = {
  block: BlocksImageText;
};

const CROSSFADE_MS = 700;

function normalizeImages(images: BlocksImageText['images']): StrapiMedia[] {
  if (!images) return [];
  return Array.isArray(images) ? images.filter((item) => Boolean(item?.url)) : [images];
}

function ImagePanel({
  images,
  autoplay,
  intervalMs,
  fallbackAlt,
}: {
  images: StrapiMedia[];
  autoplay?: boolean | null;
  intervalMs?: number | null;
  fallbackAlt: string;
}) {
  const theme = useTheme();
  const [index, setIndex] = React.useState(0);
  const isSlideshow = images.length > 1;
  const radius = `${theme.layout.cardRadius}px`;

  React.useEffect(() => {
    if (!isSlideshow || !autoplay) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, intervalMs && intervalMs >= 1000 ? intervalMs : 5000);

    return () => window.clearInterval(timer);
  }, [autoplay, intervalMs, images.length, isSlideshow, index]);

  React.useEffect(() => {
    if (index >= images.length) setIndex(0);
  }, [images.length, index]);

  if (images.length === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          height: { xs: 280, md: '100%' },
          minHeight: { md: 420 },
          bgcolor: 'action.hover',
          borderRadius: radius,
        }}
      />
    );
  }

  const goPrev = () => setIndex((current) => (current - 1 + images.length) % images.length);
  const goNext = () => setIndex((current) => (current + 1) % images.length);

  return (
    <Box
      role={isSlideshow ? 'region' : undefined}
      aria-roledescription={isSlideshow ? 'carousel' : undefined}
      aria-label={isSlideshow ? 'Image slideshow' : undefined}
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 280, md: '100%' },
        minHeight: { md: 420 },
        borderRadius: radius,
        overflow: 'hidden',
        bgcolor: 'action.hover',
      }}
    >
      {images.map((image, imageIndex) => {
        const src = getStrapiMediaUrl(image.url);
        if (!src) return null;
        const active = imageIndex === index;

        return (
          <Box
            key={`${image.id ?? image.url}-${imageIndex}`}
            component="img"
            src={src}
            alt={image.alternativeText || fallbackAlt}
            aria-hidden={isSlideshow ? !active : undefined}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              opacity: active ? 1 : 0,
              transition: isSlideshow ? `opacity ${CROSSFADE_MS}ms ease` : 'none',
              pointerEvents: active ? 'auto' : 'none',
            }}
          />
        );
      })}

      {isSlideshow ? (
        <Box
          sx={{
            position: 'absolute',
            right: 12,
            bottom: 12,
            zIndex: 2,
            display: 'flex',
            gap: 0.5,
          }}
        >
          <IconButton
            aria-label="Previous image"
            onClick={goPrev}
            size="small"
            sx={{
              color: 'common.white',
              bgcolor: 'rgba(15, 23, 28, 0.35)',
              backdropFilter: 'blur(6px)',
              '&:hover': { bgcolor: 'rgba(15, 23, 28, 0.5)' },
            }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <IconButton
            aria-label="Next image"
            onClick={goNext}
            size="small"
            sx={{
              color: 'common.white',
              bgcolor: 'rgba(15, 23, 28, 0.35)',
              backdropFilter: 'blur(6px)',
              '&:hover': { bgcolor: 'rgba(15, 23, 28, 0.5)' },
            }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : null}
    </Box>
  );
}

export function ImageTextBlock({ block }: Props) {
  const images = normalizeImages(block.images);
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
          <ImagePanel
            images={images}
            autoplay={block.autoplay}
            intervalMs={block.intervalMs}
            fallbackAlt={block.title || ''}
          />
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
