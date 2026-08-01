import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import type { BlocksHero } from '@/types/cms';
import { getStrapiMediaUrl } from '@/lib/strapi';
import { HeroMotion } from '@/components/blocks/HeroMotion';
import { LinkButton } from '@/components/ui/LinkButton';

type Props = {
  block: BlocksHero;
  locale: string;
};

export function HeroBlock({ block, locale }: Props) {
  const mediaUrl = getStrapiMediaUrl(block.backgroundMedia?.url);
  const isVideo = block.backgroundMedia?.mime?.startsWith('video/');
  const href = block.cta?.url
    ? block.cta.url.startsWith('http')
      ? block.cta.url
      : `/${locale}${block.cta.url === '/' ? '' : block.cta.url}`
    : null;

  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        minHeight: { xs: '88vh', md: '92vh' },
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
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background:
                'linear-gradient(135deg, #073A50 0%, #0B4F6C 45%, #1B6B8A 75%, #C45C26 140%)',
            }}
          />
        )}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(7,58,80,0.25) 0%, rgba(7,58,80,0.72) 70%, rgba(7,58,80,0.88) 100%)',
          }}
        />
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', pb: { xs: 8, md: 12 }, pt: 16 }}>
        <HeroMotion>
          {block.eyebrow ? (
            <Typography variant="overline" sx={{ letterSpacing: '0.18em', opacity: 0.9 }}>
              {block.eyebrow}
            </Typography>
          ) : null}
          <Typography
            variant="h1"
            className="hero-headline"
            sx={{ fontSize: { xs: '3.2rem', md: '5.5rem' }, maxWidth: 900, mt: 1 }}
          >
            {block.headline}
          </Typography>
          {block.subheadline ? (
            <Typography
              className="hero-sub"
              variant="body1"
              sx={{ mt: 2, maxWidth: 520, fontSize: { xs: '1.05rem', md: '1.2rem' }, opacity: 0.92 }}
            >
              {block.subheadline}
            </Typography>
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
