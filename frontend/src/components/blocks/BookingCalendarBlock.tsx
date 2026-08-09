'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import type { BlocksBookingCalendar } from '@/types/cms';
import { ThemeSection } from '@/components/layout/ThemeSection';

type Props = {
  block: BlocksBookingCalendar;
};

const DEFAULT_CLOUDFRONT_SUBDOMAIN = 'd2q3n06xhbi0am';
const WIDGET_CONTAINER_ID = 'hostaway-calendar-widget';
const SCRIPT_ATTR = 'data-hostaway-calendar-script';

type HostawayCalendarOptions = {
  baseUrl: string;
  listingId: number;
  numberOfMonths?: number;
  openInNewTab?: boolean;
  font?: string;
  rounded?: boolean;
  button?: {
    action?: 'checkout' | 'inquiry';
    text?: string;
  };
  clearButtonText?: string;
  color?: {
    mainColor?: string;
    frameColor?: string;
    textColor?: string;
  };
};

declare global {
  interface Window {
    hostawayCalendarWidget?: (options: HostawayCalendarOptions) => void;
  }
}

function sanitizeSubdomain(value?: string | null) {
  const cleaned = (value ?? '').trim().replace(/[^a-zA-Z0-9-]/g, '');
  return cleaned || DEFAULT_CLOUDFRONT_SUBDOMAIN;
}

function calendarScriptSrc(subdomain: string) {
  return `https://${subdomain}.cloudfront.net/calendar.js`;
}

function loadHostawayScript(src: string) {
  const existing = document.querySelector<HTMLScriptElement>(`script[${SCRIPT_ATTR}]`);
  if (existing?.src === src) {
    return existing.dataset.loaded === 'true'
      ? Promise.resolve()
      : new Promise<void>((resolve, reject) => {
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', () => reject(new Error('Failed to load Hostaway calendar script')), {
            once: true,
          });
        });
  }

  if (existing) existing.remove();

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.setAttribute(SCRIPT_ATTR, 'true');
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Hostaway calendar script'));
    document.body.appendChild(script);
  });
}

export function BookingCalendarBlock({ block }: Props) {
  const theme = useTheme();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  const subdomain = sanitizeSubdomain(block.cloudfrontSubdomain);
  const scriptSrc = calendarScriptSrc(subdomain);

  React.useEffect(() => {
    let cancelled = false;
    setError(null);

    const container = containerRef.current;
    if (container) container.innerHTML = '';

    const options: HostawayCalendarOptions = {
      baseUrl: block.baseUrl,
      listingId: block.listingId,
      numberOfMonths: block.numberOfMonths === '1' ? 1 : 2,
      openInNewTab: block.openInNewTab ?? true,
      rounded: block.rounded ?? true,
      button: {
        action: block.buttonAction === 'inquiry' ? 'inquiry' : 'checkout',
        text: block.buttonText || 'Book now',
      },
      clearButtonText: block.clearButtonText || 'Clear dates',
    };

    if (block.font) options.font = block.font;

    const color: HostawayCalendarOptions['color'] = {};
    if (block.mainColor) color.mainColor = block.mainColor;
    if (block.frameColor) color.frameColor = block.frameColor;
    if (block.textColor) color.textColor = block.textColor;
    if (Object.keys(color).length > 0) options.color = color;

    loadHostawayScript(scriptSrc)
      .then(() => {
        if (cancelled) return;
        if (typeof window.hostawayCalendarWidget !== 'function') {
          throw new Error('Hostaway calendar widget is unavailable.');
        }
        window.hostawayCalendarWidget(options);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to load booking calendar.');
      });

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [
    scriptSrc,
    block.baseUrl,
    block.listingId,
    block.numberOfMonths,
    block.openInNewTab,
    block.rounded,
    block.buttonAction,
    block.buttonText,
    block.clearButtonText,
    block.font,
    block.mainColor,
    block.frameColor,
    block.textColor,
  ]);

  return (
    <ThemeSection>
      {block.title ? (
        <Typography variant="h2" sx={{ mb: 3 }}>
          {block.title}
        </Typography>
      ) : null}

      <Box
        sx={{
          width: '100%',
          minHeight: 320,
          borderRadius: `${theme.layout.cardRadius}px`,
          overflow: 'hidden',
        }}
      >
        <Box id={WIDGET_CONTAINER_ID} ref={containerRef} />
        {error ? (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        ) : null}
      </Box>
    </ThemeSection>
  );
}
