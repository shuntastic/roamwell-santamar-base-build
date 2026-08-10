'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import { gsap, playHeroEntrance, registerGsapPlugins, whenFontsReady } from '@/lib/gsap';

type Props = {
  children: React.ReactNode;
};

/**
 * Plays the hero text entrance once mounted (after fonts when available).
 * Cleans up GSAP tweens + SplitText on unmount so client navigations never leave
 * characters stuck invisible.
 */
export function HeroMotion({ children }: Props) {
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    registerGsapPlugins();

    const supporting = root.querySelectorAll('.hero-sub, .hero-description, .hero-cta');
    const headline = root.querySelector<HTMLElement>('.hero-headline');
    if (supporting.length) {
      gsap.set(supporting, { autoAlpha: 0 });
    }
    if (headline) {
      gsap.set(headline, { autoAlpha: 0 });
    }

    let cancelled = false;
    let dispose: (() => void) | undefined;

    const start = async () => {
      await whenFontsReady();
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      if (cancelled || !rootRef.current) return;
      dispose = playHeroEntrance(rootRef.current);
    };

    void start();

    return () => {
      cancelled = true;
      dispose?.();
      const clear = root.querySelectorAll(
        '.hero-headline, .hero-sub, .hero-description, .hero-cta',
      );
      if (clear.length) {
        gsap.set(clear, { clearProps: 'opacity,visibility,transform' });
      }
    };
  }, []);

  return <Box ref={rootRef}>{children}</Box>;
}
