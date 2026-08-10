'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import type { BlocksModalButton } from '@/types/cms';
import { StyledCopy } from '@/components/ui/StyledCopy';
import { ThemeSection } from '@/components/layout/ThemeSection';

type Props = {
  block: BlocksModalButton;
};

function buttonProps(variant?: BlocksModalButton['buttonVariant']) {
  switch (variant) {
    case 'secondary':
      return { variant: 'outlined' as const, color: 'primary' as const };
    case 'text':
      return { variant: 'text' as const, color: 'primary' as const };
    case 'primary':
    default:
      return { variant: 'contained' as const, color: 'primary' as const };
  }
}

export function ModalButtonBlock({ block }: Props) {
  const [open, setOpen] = React.useState(false);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const hasModalTitle = Boolean(block.modalTitle);

  return (
    <ThemeSection narrow>
      {block.description ? (
        <Typography color="text.secondary" sx={{ mb: 2.5, maxWidth: 560 }}>
          {block.description}
        </Typography>
      ) : null}

      <Button {...buttonProps(block.buttonVariant)} onClick={() => setOpen(true)}>
        {block.buttonLabel}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby={hasModalTitle ? titleId : undefined}
        aria-describedby={descriptionId}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              bgcolor: 'background.paper',
              backgroundImage: 'none',
            },
          },
        }}
      >
        {hasModalTitle ? (
          <DialogTitle
            id={titleId}
            sx={{
              pr: 6,
              fontFamily: 'var(--font-display), "Times New Roman", serif',
              fontWeight: 400,
            }}
          >
            {block.modalTitle}
          </DialogTitle>
        ) : null}

        <IconButton
          aria-label="Close"
          onClick={() => setOpen(false)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'text.secondary',
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent
          id={descriptionId}
          sx={{
            pt: hasModalTitle ? 0 : 5,
            pb: 3,
          }}
        >
          <Box sx={{ maxWidth: '100%' }}>
            <StyledCopy content={block.modalContent} />
          </Box>
        </DialogContent>
      </Dialog>
    </ThemeSection>
  );
}
