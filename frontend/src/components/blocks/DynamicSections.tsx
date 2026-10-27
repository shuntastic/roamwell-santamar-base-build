'use client';

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import type { PageSection } from '@/types/cms';
import { getStrapiMediaUrl } from '@/lib/strapi';
import { StyledCopy } from '@/components/ui/StyledCopy';
import { Slideshow } from '@/components/slideshow/Slideshow';
import { HeroBlock } from '@/components/blocks/HeroBlock';
import { ImageTextBlock } from '@/components/blocks/ImageTextBlock';
import { MediaGridBlock } from '@/components/blocks/MediaGridBlock';
import { ContactFormBlock } from '@/components/blocks/ContactFormBlock';
import { ModalButtonBlock } from '@/components/blocks/ModalButtonBlock';
import { EmbedWidgetBlock } from '@/components/blocks/EmbedWidgetBlock';
import { StatementBlock } from '@/components/blocks/StatementBlock';
import { SectionReveal } from '@/components/blocks/SectionReveal';
import { LinkButton } from '@/components/ui/LinkButton';
import { ThemeSection } from '@/components/layout/ThemeSection';

type Props = {
  sections?: PageSection[] | null;
  locale: string;
  /** Parallel ids for single_page hash nav (section index → anchor). */
  sectionAnchors?: string[] | null;
};

function SectionShell({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  if (!id) return <>{children}</>;
  return (
    <Box
      id={id}
      component="section"
      sx={{ scrollMarginTop: { xs: 72, md: 88 } }}
    >
      {children}
    </Box>
  );
}

export function DynamicSections({ sections, locale, sectionAnchors }: Props) {
  const theme = useTheme();

  if (!sections?.length) return null;

  return (
    <>
      {sections.map((section, index) => {
        const anchorId = sectionAnchors?.[index];
        switch (section.__component) {
          case 'blocks.hero':
            return (
              <SectionShell key={`${section.__component}-${section.id}`} id={anchorId}>
                <HeroBlock block={section} locale={locale} />
              </SectionShell>
            );

          case 'blocks.rich-text':
            return (
              <SectionShell key={`${section.__component}-${section.id}`} id={anchorId}>
                <SectionReveal>
                  <ThemeSection>
                    {section.title ? (
                      <Typography variant="h2" sx={{ mb: 3 }}>
                        {section.title}
                      </Typography>
                    ) : null}
                    <StyledCopy content={section.body} />
                  </ThemeSection>
                </SectionReveal>
              </SectionShell>
            );

          case 'blocks.statement':
            return (
              <SectionShell key={`${section.__component}-${section.id}`} id={anchorId}>
                <SectionReveal>
                  <StatementBlock block={section} />
                </SectionReveal>
              </SectionShell>
            );

          case 'blocks.image-text':
            return (
              <SectionShell key={`${section.__component}-${section.id}`} id={anchorId}>
                <SectionReveal>
                  <ImageTextBlock block={section} />
                </SectionReveal>
              </SectionShell>
            );

          case 'blocks.feature-grid':
            return (
              <SectionShell key={`${section.__component}-${section.id}`} id={anchorId}>
                <SectionReveal>
                  <ThemeSection>
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
                                    borderRadius: `${theme.layout.cardRadius}px`,
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
                  </ThemeSection>
                </SectionReveal>
              </SectionShell>
            );

          case 'blocks.media-gallery':
            return (
              <SectionShell key={`${section.__component}-${section.id}`} id={anchorId}>
                <SectionReveal>
                  <Slideshow slideshow={section.slideshow} />
                </SectionReveal>
              </SectionShell>
            );

          case 'blocks.media-grid':
            return (
              <SectionShell key={`${section.__component}-${section.id}`} id={anchorId}>
                <SectionReveal>
                  <MediaGridBlock block={section} />
                </SectionReveal>
              </SectionShell>
            );

          case 'blocks.location-map':
            return (
              <SectionShell key={`${section.__component}-${section.id}`} id={anchorId}>
                <SectionReveal>
                  <ThemeSection>
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
                        sx={{
                          width: '100%',
                          height: { xs: 280, md: 420 },
                          border: 0,
                          borderRadius: `${theme.layout.cardRadius}px`,
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <Box
                        sx={{
                          height: { xs: 240, md: 360 },
                          bgcolor: 'action.hover',
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: `${theme.layout.cardRadius}px`,
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
                  </ThemeSection>
                </SectionReveal>
              </SectionShell>
            );

          case 'blocks.booking-cta':
            return (
              <SectionShell key={`${section.__component}-${section.id}`} id={anchorId}>
                <SectionReveal>
                  <Box
                    sx={{
                      position: 'relative',
                      py: theme.layout.sectionPaddingY,
                      color: 'primary.contrastText',
                      backgroundImage: section.backgroundImage
                        ? `linear-gradient(120deg, ${theme.palette.primary.dark}e0, ${theme.palette.primary.main}b8), url(${getStrapiMediaUrl(section.backgroundImage.url)})`
                        : `linear-gradient(120deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main} 55%, ${theme.palette.secondary.main})`,
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
              </SectionShell>
            );

          case 'blocks.booking-calendar':
            return (
              <SectionShell key={`${section.__component}-${section.id}`} id={anchorId}>
                <SectionReveal>
                  <EmbedWidgetBlock
                    variant="calendar"
                    title={section.title}
                    embedCode={section.embedCode}
                  />
                </SectionReveal>
              </SectionShell>
            );

          case 'blocks.booking-search':
            return (
              <SectionShell key={`${section.__component}-${section.id}`} id={anchorId}>
                <SectionReveal>
                  <EmbedWidgetBlock
                    variant="search"
                    title={section.title}
                    embedCode={section.embedCode}
                  />
                </SectionReveal>
              </SectionShell>
            );

          case 'blocks.contact-form':
            return (
              <SectionShell key={`${section.__component}-${section.id}`} id={anchorId}>
                <SectionReveal>
                  <ContactFormBlock block={section} />
                </SectionReveal>
              </SectionShell>
            );

          case 'blocks.modal-button':
            return (
              <SectionShell key={`${section.__component}-${section.id}`} id={anchorId}>
                <SectionReveal>
                  <ModalButtonBlock block={section} />
                </SectionReveal>
              </SectionShell>
            );

          case 'blocks.video-embed': {
            const fileUrl = getStrapiMediaUrl(section.videoFile?.url);
            const posterUrl = getStrapiMediaUrl(section.poster?.url);
            return (
              <SectionShell key={`${section.__component}-${section.id}`} id={anchorId}>
                <SectionReveal>
                  <ThemeSection narrow>
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
                        sx={{
                          width: '100%',
                          aspectRatio: '16 / 9',
                          border: 0,
                          borderRadius: `${theme.layout.cardRadius}px`,
                        }}
                        allowFullScreen
                      />
                    ) : fileUrl ? (
                      <Box
                        component="video"
                        controls
                        poster={posterUrl ?? undefined}
                        src={fileUrl}
                        sx={{
                          width: '100%',
                          display: 'block',
                          borderRadius: `${theme.layout.cardRadius}px`,
                        }}
                      />
                    ) : null}
                    {section.caption ? (
                      <Typography color="text.secondary" sx={{ mt: 2 }}>
                        {section.caption}
                      </Typography>
                    ) : null}
                  </ThemeSection>
                </SectionReveal>
              </SectionShell>
            );
          }

          default:
            return null;
        }
      })}
    </>
  );
}
