'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import DOMPurify from 'dompurify';
import { ThemeSection } from '@/components/layout/ThemeSection';
import {
  getEmbedScriptAllowlist,
  isAllowedScriptSrc,
  loadExternalScript,
  parseEmbedCode,
  runInlineScript,
} from '@/lib/embedScripts';

export type EmbedWidgetVariant = 'calendar' | 'search';

type Props = {
  title?: string | null;
  embedCode: string;
  variant?: EmbedWidgetVariant;
};

function sanitizeMarkup(html: string): string {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base'],
    FORBID_ATTR: ['style'],
    ADD_ATTR: ['target', 'rel'],
  });
}

export function EmbedWidgetBlock({ title, embedCode, variant = 'calendar' }: Props) {
  const theme = useTheme();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    setError(null);

    const code = embedCode?.trim();
    if (!code) {
      setError('No embed code provided.');
      return;
    }

    const allowlist = getEmbedScriptAllowlist();
    const { markupHtml, scripts } = parseEmbedCode(code);

    for (const script of scripts) {
      if (script.kind !== 'external') continue;
      if (!isAllowedScriptSrc(script.src, allowlist)) {
        setError(
          `Blocked embed script host (not allowlisted): ${script.src}. Allowed: ${allowlist.join(', ')}`,
        );
        return;
      }
    }

    const clean = sanitizeMarkup(markupHtml);
    if (clean) {
      container.innerHTML = clean;
    }

    (async () => {
      try {
        for (const script of scripts) {
          if (cancelled) return;
          if (script.kind === 'external') {
            await loadExternalScript(script.src);
          } else {
            runInlineScript(script.content, container);
          }
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to load booking embed.');
      }
    })();

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [embedCode]);

  const minHeight = variant === 'search' ? 72 : 320;

  return (
    <ThemeSection>
      {title ? (
        <Typography variant="h2" sx={{ mb: 3 }}>
          {title}
        </Typography>
      ) : null}

      <Box
        sx={{
          width: '100%',
          minHeight,
          borderRadius: `${theme.layout.cardRadius}px`,
          overflow: 'hidden',
        }}
      >
        <Box ref={containerRef} />
        {error ? (
          <Typography color="error" sx={{ mt: 2 }} role="alert">
            {error}
          </Typography>
        ) : null}
      </Box>
    </ThemeSection>
  );
}
