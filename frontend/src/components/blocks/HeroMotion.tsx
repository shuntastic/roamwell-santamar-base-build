'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import { fadeUpStagger, registerGsapPlugins, splitHeadline } from '@/lib/gsap';

type Props = {
  children: React.ReactNode;
};

export function HeroMotion({ children }: Props) {
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    registerGsapPlugins();
    const root = rootRef.current;
    if (!root) return;

    const headline = root.querySelector<HTMLElement>('.hero-headline');
    if (headline) {
      try {
        splitHeadline(headline);
      } catch {
        fadeUpStagger(headline);
      }
    }

    fadeUpStagger(root.querySelectorAll('.hero-sub, .hero-cta'), { delay: 0.25 });
  }, []);

  return <Box ref={rootRef}>{children}</Box>;
}
