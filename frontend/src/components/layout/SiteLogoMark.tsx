'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import type { StrapiMedia } from '@/types/cms';
import { getStrapiMediaUrl } from '@/lib/strapi';

type Props = {
  logo: StrapiMedia;
  siteName: string;
  /** Pre-fetched SVG markup (preferred — avoids browser CORS on /uploads). */
  svgMarkup?: string | null;
};

/** Prefer smooth anti-aliased strokes over crispEdges / butt joins. */
function softenSvgLines(root: SVGElement) {
  root.setAttribute('shape-rendering', 'geometricPrecision');
  root.setAttribute('text-rendering', 'geometricPrecision');
  root.style.shapeRendering = 'geometricPrecision';

  root
    .querySelectorAll<SVGElement>('path, line, polyline, polygon, circle, ellipse, rect, text')
    .forEach((el) => {
      const stroke = el.getAttribute('stroke');
      if (stroke && stroke !== 'none') {
        if (!el.hasAttribute('stroke-linecap')) el.setAttribute('stroke-linecap', 'round');
        if (!el.hasAttribute('stroke-linejoin')) el.setAttribute('stroke-linejoin', 'round');
      }
      el.style.shapeRendering = 'geometricPrecision';
    });
}

export function SiteLogoMark({ logo, siteName, svgMarkup }: Props) {
  const logoUrl = getStrapiMediaUrl(logo.url);
  const hostRef = React.useRef<HTMLSpanElement | null>(null);
  const inlineSvg = Boolean(svgMarkup);

  React.useLayoutEffect(() => {
    const root = hostRef.current?.querySelector('svg');
    if (root) softenSvgLines(root);
  }, [svgMarkup]);

  if (!logoUrl) return null;

  const frameSx = {
    display: 'block',
    height: '100%',
    width: 'auto',
    maxWidth: '100%',
    objectFit: 'contain' as const,
    imageRendering: 'auto' as const,
  };

  if (inlineSvg && svgMarkup) {
    return (
      <Box
        ref={hostRef}
        component="span"
        role="img"
        aria-label={logo.alternativeText || siteName}
        sx={{
          ...frameSx,
          lineHeight: 0,
          '& svg': {
            display: 'block',
            height: '100%',
            width: 'auto',
            maxWidth: '100%',
            overflow: 'visible',
            shapeRendering: 'auto',
            textRendering: 'auto',
          },
          // Light contrast + GPU layer helps subpixel AA on thin strokes
          filter: 'contrast(1.02)',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
    );
  }

  return (
    <Box
      component="img"
      src={logoUrl}
      alt={logo.alternativeText || siteName}
      sx={frameSx}
    />
  );
}
