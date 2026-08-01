import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import type { PageSection } from '@/types/cms';
import { getStrapiMediaUrl } from '@/lib/strapi';
import { StyledCopy } from '@/components/ui/StyledCopy';
import { Slideshow } from '@/components/slideshow/Slideshow';
import { HeroBlock } from '@/components/blocks/HeroBlock';
import { ContactFormBlock } from '@/components/blocks/ContactFormBlock';
import { SectionReveal } from '@/components/blocks/SectionReveal';
import { LinkButton } from '@/components/ui/LinkButton';

type Props = {
  sections?: PageSection[] | null;
  locale: string;
};

export function DynamicSections({ sections, locale }: Props) {
  if (!sections?.length) return null;

  return (
    <>
      {sections.map((section) => {
        switch (section.__component) {
          case 'blocks.hero':
            return <HeroBlock key={`${section.__component}-${section.id}`} block={section} locale={locale} />;

          case 'blocks.rich-text':
            return (
              <SectionReveal key={`${section.__component}-${section.id}`}>
                <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
                  {section.title ? (
                    <Typography variant="h2" sx={{ mb: 3 }}>
                      {section.title}
                    </Typography>
                  ) : null}
                  <StyledCopy content={section.body} />
                </Container>
              </SectionReveal>
            );

          case 'blocks.feature-grid':
            return (
              <SectionReveal key={`${section.__component}-${section.id}`}>
                <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
                  {section.title ? (
                    <Typography variant="h2" sx={{ mb: 1.5 }}>
                      {section.title}
                    </Typography>
                  ) : null}
                  {section.intro ? (
                    <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 640 }}>
                      {section.intro}
                    </Typography>
                  ) : null}
                  <Grid container spacing={3}>
                    {(section.items ?? []).map((item) => {
                      const imageUrl = getStrapiMediaUrl(item.image?.url);
                      return (
                        <Grid key={item.id ?? item.title} size={{ xs: 12, md: 4 }}>
                          <Box sx={{ height: '100%' }}>
                            {imageUrl ? (
                              <Box
                                component="img"
                                src={imageUrl}
                                alt={item.title}
                                sx={{
                                  width: '100%',
                                  height: 220,
                                  objectFit: 'cover',
                                  mb: 2,
                                  display: 'block',
                                }}
                              />
                            ) : null}
                            <Typography variant="h4" sx={{ mb: 1 }}>
                              {item.title}
                            </Typography>
                            {item.description ? (
                              <Typography color="text.secondary" sx={{ mb: 2 }}>
                                {item.description}
                              </Typography>
                            ) : null}
                            {item.link ? (
                              <LinkButton
                                href={
                                  item.link.url.startsWith('http')
                                    ? item.link.url
                                    : `/${locale}${item.link.url}`
                                }
                                variant="text"
                                color="primary"
                              >
                                {item.link.label}
                              </LinkButton>
                            ) : null}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Container>
              </SectionReveal>
            );

          case 'blocks.media-gallery':
            return (
              <SectionReveal key={`${section.__component}-${section.id}`}>
                <Slideshow slideshow={section.slideshow} />
              </SectionReveal>
            );

          case 'blocks.location-map':
            return (
              <SectionReveal key={`${section.__component}-${section.id}`}>
                <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
                  {section.title ? (
                    <Typography variant="h2" sx={{ mb: 2 }}>
                      {section.title}
                    </Typography>
                  ) : null}
                  {section.address ? (
                    <Typography color="text.secondary" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
                      {section.address}
                    </Typography>
                  ) : null}
                  {section.mapEmbedUrl ? (
                    <Box
                      component="iframe"
                      title={section.title || 'Map'}
                      src={section.mapEmbedUrl}
                      sx={{ width: '100%', height: { xs: 280, md: 420 }, border: 0 }}
                      loading="lazy"
                    />
                  ) : (
                    <Box
                      sx={{
                        height: { xs: 240, md: 360 },
                        bgcolor: 'rgba(11,79,108,0.08)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Typography color="text.secondary">
                        Add a map embed URL in the CMS Location Map component.
                      </Typography>
                    </Box>
                  )}
                  {section.latitude != null && section.longitude != null ? (
                    <Button
                      href={`https://www.google.com/maps/dir/?api=1&destination=${section.latitude},${section.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      variant="outlined"
                      sx={{ mt: 3 }}
                    >
                      {section.directionsLabel || 'Get Directions'}
                    </Button>
                  ) : null}
                </Container>
              </SectionReveal>
            );

          case 'blocks.booking-cta':
            return (
              <SectionReveal key={`${section.__component}-${section.id}`}>
                <Box
                  sx={{
                    position: 'relative',
                    py: { xs: 8, md: 12 },
                    color: 'primary.contrastText',
                    backgroundImage: section.backgroundImage
                      ? `linear-gradient(120deg, rgba(7,58,80,0.88), rgba(11,79,108,0.72)), url(${getStrapiMediaUrl(section.backgroundImage.url)})`
                      : 'linear-gradient(120deg, #073A50, #0B4F6C 55%, #C45C26)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <Container maxWidth="md">
                    <Typography variant="h2" sx={{ mb: 2 }}>
                      {section.headline}
                    </Typography>
                    {section.body ? (
                      <Typography sx={{ mb: 3, maxWidth: 560, opacity: 0.92 }}>{section.body}</Typography>
                    ) : null}
                    <LinkButton href={section.bookingUrl} variant="contained" color="secondary">
                      {section.buttonLabel || 'Book Your Stay'}
                    </LinkButton>
                  </Container>
                </Box>
              </SectionReveal>
            );

          case 'blocks.contact-form':
            return (
              <SectionReveal key={`${section.__component}-${section.id}`}>
                <ContactFormBlock block={section} />
              </SectionReveal>
            );

          case 'blocks.video-embed': {
            const fileUrl = getStrapiMediaUrl(section.videoFile?.url);
            const posterUrl = getStrapiMediaUrl(section.poster?.url);
            return (
              <SectionReveal key={`${section.__component}-${section.id}`}>
                <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
                  {section.title ? (
                    <Typography variant="h2" sx={{ mb: 2 }}>
                      {section.title}
                    </Typography>
                  ) : null}
                  {section.videoUrl ? (
                    <Box
                      component="iframe"
                      title={section.title || 'Video'}
                      src={section.videoUrl}
                      sx={{ width: '100%', aspectRatio: '16 / 9', border: 0 }}
                      allowFullScreen
                    />
                  ) : fileUrl ? (
                    <Box
                      component="video"
                      controls
                      poster={posterUrl ?? undefined}
                      src={fileUrl}
                      sx={{ width: '100%', display: 'block' }}
                    />
                  ) : null}
                  {section.caption ? (
                    <Typography color="text.secondary" sx={{ mt: 2 }}>
                      {section.caption}
                    </Typography>
                  ) : null}
                </Container>
              </SectionReveal>
            );
          }

          default:
            return null;
        }
      })}
    </>
  );
}
