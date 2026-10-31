'use client';

import Container, { type ContainerProps } from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';

type Props = {
  children: React.ReactNode;
  /** Use a narrower reading column (styled copy). */
  narrow?: boolean;
  /** Overrides both `narrow` and the theme's `contentMaxWidth`. */
  maxWidth?: ContainerProps['maxWidth'];
  sx?: ContainerProps['sx'];
  disableGutters?: boolean;
};

/** Section shell that follows the active theme's layout tokens. */
export function ThemeSection({
  children,
  narrow = false,
  maxWidth: maxWidthOverride,
  sx,
  disableGutters,
}: Props) {
  const theme = useTheme();
  const maxWidth = maxWidthOverride ?? (narrow ? 'md' : theme.layout.contentMaxWidth);

  return (
    <Container
      maxWidth={maxWidth}
      disableGutters={disableGutters}
      sx={[
        { py: theme.layout.sectionPaddingY },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Container>
  );
}
