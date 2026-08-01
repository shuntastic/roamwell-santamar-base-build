'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import { revealOnScroll } from '@/lib/gsap';

type Props = {
  children: React.ReactNode;
};

export function SectionReveal({ children }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.classList.add('reveal-section');
    const tweens = revealOnScroll('.reveal-section > *', node);
    return () => {
      tweens.forEach((tween) => tween.scrollTrigger?.kill());
      tweens.forEach((tween) => tween.kill());
    };
  }, []);

  return <Box ref={ref}>{children}</Box>;
}
