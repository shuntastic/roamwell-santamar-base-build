'use client';

import Box, { type BoxProps } from '@mui/material/Box';
import Button, { type ButtonProps } from '@mui/material/Button';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { StrapiCtaButton } from '@/types/cms';
import { isLocale, type Locale } from '@/lib/i18n';
import { LinkButton } from '@/components/ui/LinkButton';

type Props = {
  buttons?: StrapiCtaButton[] | null;
  locale: string;
  /** Horizontal alignment from `sm` up; buttons always stack full-width on phones. */
  align?: 'center' | 'start';
  sx?: BoxProps['sx'];
};

/** Mirrors the `max` on every `shared.cta-button` repeatable in the CMS. */
export const MAX_CTA_BUTTONS = 3;

const NEW_TAB_NOTICE: Record<Locale, string> = {
  en: '(opens in a new tab)',
  es: '(se abre en una pestaña nueva)',
  pt: '(abre em uma nova aba)',
};

const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  p: 0,
  m: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

function styleProps(style: StrapiCtaButton['style']): Pick<ButtonProps, 'variant' | 'color'> {
  switch (style) {
    case 'secondary':
      return { variant: 'outlined', color: 'primary' };
    case 'text':
      return { variant: 'text', color: 'primary' };
    case 'primary':
    default:
      return { variant: 'contained', color: 'primary' };
  }
}

/** Absolute, mailto:, tel:, and #anchor URLs pass through; site paths get the locale prefix. */
export function resolveHref(url: string, locale: string): { href: string; isSitePath: boolean } {
  const trimmed = url.trim();
  if (/^([a-z][a-z\d+.-]*:|\/\/|#)/i.test(trimmed)) {
    return { href: trimmed, isSitePath: false };
  }
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const firstSegment = path.split(/[/?#]/)[1] ?? '';
  if (isLocale(firstSegment)) {
    return { href: path, isSitePath: true };
  }
  return { href: `/${locale}${path === '/' ? '' : path}`, isSitePath: true };
}

function usableButtons(buttons: StrapiCtaButton[] | null | undefined): StrapiCtaButton[] {
  return (buttons ?? [])
    .filter((button) => button.label?.trim() && button.url?.trim())
    .slice(0, MAX_CTA_BUTTONS);
}

export function hasCtaButtons(buttons: StrapiCtaButton[] | null | undefined): boolean {
  return usableButtons(buttons).length > 0;
}

export function CtaButtonGroup({ buttons: rawButtons, locale, align = 'center', sx }: Props) {
  const buttons = usableButtons(rawButtons);

  if (!buttons.length) return null;

  const newTabNotice = NEW_TAB_NOTICE[isLocale(locale) ? locale : 'en'];
  const justify = align === 'start' ? 'flex-start' : 'center';

  return (
    <Box
      sx={[
        {
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          flexWrap: { sm: 'wrap' },
          justifyContent: { sm: justify },
          alignItems: { xs: justify, sm: 'center' },
          gap: { xs: 1.5, sm: 2 },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {buttons.map((button, index) => {
        const { href, isSitePath } = resolveHref(button.url, locale);
        const newTab = Boolean(button.openInNewTab);
        const shared: ButtonProps = {
          ...styleProps(button.style),
          size: button.size ?? 'medium',
          endIcon: newTab ? <OpenInNewIcon aria-hidden fontSize="inherit" /> : undefined,
          sx: {
            width: { xs: '100%', sm: 'auto' },
            maxWidth: { xs: 360, sm: 'none' },
            // 40-char labels at size="large" exceed a 320px viewport; let them wrap on phones.
            whiteSpace: { xs: 'normal', sm: 'nowrap' },
          },
        };
        const content = (
          <>
            {button.label}
            {newTab ? <Box component="span" sx={visuallyHidden}>{` ${newTabNotice}`}</Box> : null}
          </>
        );

        if (isSitePath && !newTab) {
          return (
            <LinkButton key={button.id ?? index} href={href} {...shared}>
              {content}
            </LinkButton>
          );
        }

        return (
          <Button
            key={button.id ?? index}
            href={href}
            {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
            {...shared}
          >
            {content}
          </Button>
        );
      })}
    </Box>
  );
}
