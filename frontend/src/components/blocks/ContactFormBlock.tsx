'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { BlocksContactForm } from '@/types/cms';

type Props = {
  block: BlocksContactForm;
};

export function ContactFormBlock({ block }: Props) {
  const [submitted, setSubmitted] = React.useState(false);

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 } }}>
      {block.title ? (
        <Typography variant="h2" sx={{ mb: 1.5 }}>
          {block.title}
        </Typography>
      ) : null}
      {block.intro ? (
        <Typography color="text.secondary" sx={{ mb: 4 }}>
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
          sx={{ display: 'grid', gap: 2 }}
        >
          <TextField name="name" label="Name" required fullWidth />
          <TextField name="email" type="email" label="Email" required fullWidth />
          <TextField name="message" label="Message" required fullWidth multiline minRows={4} />
          <Button type="submit" variant="contained" color="primary">
            {block.submitLabel || 'Send Message'}
          </Button>
        </Box>
      )}
    </Container>
  );
}
