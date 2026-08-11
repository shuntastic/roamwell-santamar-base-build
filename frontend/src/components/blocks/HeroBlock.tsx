'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import type { BlocksHero } from '@/types/cms';
import { getStrapiMediaUrl } from '@/lib/strapi';
import { HeroMotion } from '@/components/blocks/HeroMotion';
import { LinkButton } from '@/components/ui/LinkButton';
import { StyledCopy } from '@/components/ui/StyledCopy';

type Props = {
  block: BlocksHero;
  locale: string;
};

export function HeroBlock({ block, locale }: Props) {
  const theme = useTheme();
  const mediaUrl = getStrapiMediaUrl(block.backgroundMedia?.url);
  const isVideo = block.backgroundMedia?.mime?.startsWith('video/');
  const href = block.cta?.url
    ? block.cta.url.startsWith('http')
      ? block.cta.url
      : `/${locale}${block.cta.url === '/' ? '' : block.cta.url}`
    : null;

  const fallbackGradient = `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 45%, ${theme.palette.primary.light} 75%, ${theme.palette.secondary.main} 140%)`;

  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        minHeight: theme.layout.heroMinHeight,
        display: 'flex',
        alignItems: 'flex-end',
        color: 'primary.contrastText',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0 }}>
        {mediaUrl ? (
          isVideo ? (
            <Box
              component="video"
              src={mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Box
              component="img"
              src={mediaUrl}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )
        ) : (
          <Box sx={{ width: '100%', height: '100%', background: fallbackGradient }} />
        )}
        {block.showGradient !== false ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(41deg, #00000030 0%, #00000075 32%, #00000000 77%)`,
              // background: `linear-gradient(41deg, ${theme.palette.primary.dark}dd 0%, ${theme.palette.primary.dark}b8 34%, ${theme.palette.primary.dark}00 86%)`,
              // linear-gradient(41deg, #073A50dd 0%, #073A50b8 34%, #073A5000 86%)
            }}
          />
        ) : null}
      </Box>
      <Container
        maxWidth={theme.layout.contentMaxWidth}
        sx={{ position: 'relative', pb: { xs: 8, md: 8 }, pt: 16 }}
      >
        <HeroMotion>
          {block.eyebrow ? (
            <Typography variant="overline" sx={{ letterSpacing: '0.18em', opacity: 1.0, fontSize: '0.85rem', textShadow: '0 0 6px rgba(0, 0, 0, 0.5)' }}>
              {block.eyebrow}
            </Typography>
          ) : null}
          <Typography
            variant="h1"
            className="hero-headline"
            sx={{ fontSize: { xs: '3.2rem', md: '4.75rem' }, lineHeight: '1.05', maxWidth: 700, mt: 1 }}
          >
            {block.headline}
          </Typography>
          {block.subheadline ? (
            <Typography
              className="hero-sub"
              variant="body1"
              sx={{ mt: 2, maxWidth: 520, fontSize: { xs: '1.2rem', md: '1.5rem' }, fontWeight: 600, opacity: 1.0, letterSpacing: '0.03em' }}
            >
              {block.subheadline}
            </Typography>
          ) : null}
          {block.description ? (
            <Box
              className="hero-description"
              sx={{
                mt: 2,
                maxWidth: 560,
                opacity: 0.9,
                fontSize: { xs: '0.98rem', md: '1.125rem' },
              }}
            >
              <StyledCopy content={block.description} color="inherit" />
            </Box>
          ) : null}
          {block.cta && href ? (
            <LinkButton
              className="hero-cta"
              href={href}
              variant="contained"
              color="secondary"
              sx={{ mt: 4 }}
            >
              {block.cta.label}
            </LinkButton>
          ) : null}
        </HeroMotion>
      </Container>
    </Box>
  );
}
