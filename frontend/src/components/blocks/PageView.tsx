import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import type { CmsPage } from '@/types/cms';
import { StyledCopy } from '@/components/ui/StyledCopy';
import { Slideshow } from '@/components/slideshow/Slideshow';
import { DynamicSections } from '@/components/blocks/DynamicSections';
import { SectionReveal } from '@/components/blocks/SectionReveal';

type Props = {
  page: CmsPage;
  locale: string;
};

export function PageView({ page, locale }: Props) {
  const hasHero = page.sections?.some((section) => section.__component === 'blocks.hero');

  return (
    <Box component="article">
      <DynamicSections sections={page.sections} locale={locale} />

      {!hasHero ? (
        <SectionReveal>
          <Container maxWidth="md" sx={{ pt: { xs: 6, md: 10 }, pb: 2 }}>
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: '2.6rem', md: '3.8rem' }, color: 'primary.main', mb: 3 }}
            >
              {page.title}
            </Typography>
            <StyledCopy content={page.styledCopy} />
          </Container>
        </SectionReveal>
      ) : page.styledCopy ? (
        <SectionReveal>
          <Container maxWidth="md" sx={{ py: { xs: 6, md: 8 } }}>
            <StyledCopy content={page.styledCopy} />
          </Container>
        </SectionReveal>
      ) : null}

      {(page.slideshows ?? []).map((slideshow) => (
        <SectionReveal key={slideshow.id ?? slideshow.title}>
          <Box sx={{ my: { xs: 2, md: 4 } }}>
            <Slideshow slideshow={slideshow} />
          </Box>
        </SectionReveal>
      ))}
    </Box>
  );
}
