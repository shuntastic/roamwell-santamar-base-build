import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import type { GlobalSettings } from '@/types/cms';

type Props = {
  global: GlobalSettings | null;
};

export function SiteFooter({ global }: Props) {
  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 6,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(11, 79, 108, 0.04)',
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          sx={{ fontFamily: 'var(--font-display), Georgia, serif', color: 'primary.main', mb: 1 }}
        >
          {global?.siteName || 'Santamar'}
        </Typography>
        {global?.tagline ? (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {global.tagline}
          </Typography>
        ) : null}
        <Typography variant="body2" color="text.secondary">
          {[global?.address, global?.contactEmail, global?.contactPhone].filter(Boolean).join(' · ')}
        </Typography>
      </Container>
    </Box>
  );
}
