/**
 * GSAP club/bonus helpers for Santamar motion.
 * Bonus package lives at frontend/gsap-bonus.tgz (installed as `gsap`).
 */
'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

let registered = false;

export function registerGsapPlugins() {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  registered = true;
}

/** Wait for document fonts so SplitText measures final glyph metrics. */
export function whenFontsReady(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  const fonts = document.fonts;
  if (!fonts?.ready) return Promise.resolve();
  return fonts.ready.then(
    () => undefined,
    () => undefined,
  );
}

/**
 * Fade/slide elements in with explicit from→to values.
 * Prefer this over `gsap.from()` in React — `from()` records the live style as
 * the end state, which breaks under Strict Mode remounts and interrupted navigations.
 * Uses `autoAlpha` so visibility cannot stick at hidden.
 */
export function fadeUpStagger(
  targets: gsap.TweenTarget,
  options?: gsap.TweenVars & { stagger?: gsap.NumberValue | gsap.StaggerVars },
) {
  registerGsapPlugins();
  const elements = gsap.utils.toArray<HTMLElement>(targets);
  if (!elements.length) return null;

  return gsap.fromTo(
    elements,
    { y: 36, autoAlpha: 0 },
    {
      y: 0,
      autoAlpha: 1,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      ...options,
    },
  );
}

export function revealOnScroll(selector: string, trigger?: Element | string) {
  registerGsapPlugins();
  return gsap.utils.toArray<HTMLElement>(selector).map((element) =>
    gsap.fromTo(
      element,
      {
        y: 48,
        autoAlpha: 0,
      },
      {
        scrollTrigger: {
          trigger: trigger ?? element,
          start: 'top 95%',
          once: true,
        },
        y: 0,
        autoAlpha: 1,
        duration: 1.15,
        ease: 'power2.out',
      },
    ),
  );
}

/**
 * Split a headline into chars and animate them in.
 * Returns the SplitText instance (caller should `revert()` on cleanup).
 */
export function splitHeadline(element: HTMLElement) {
  registerGsapPlugins();
  const split = new SplitText(element, { type: 'words,chars' });

  if (!split.chars.length) {
    fadeUpStagger(element);
    return split;
  }

  gsap.fromTo(
    split.chars,
    { yPercent: 105, autoAlpha: 0 },
    {
      yPercent: 0,
      autoAlpha: 1,
      duration: 1.25,
      ease: 'power3.out',
      stagger: 0.015,
    },
  );

  return split;
}

/**
 * Run the hero entrance inside a GSAP context so tweens + SplitText revert cleanly
 * on route changes. Call after fonts are ready when possible.
 */
export function playHeroEntrance(root: HTMLElement) {
  registerGsapPlugins();

  const splits: SplitText[] = [];
  const supporting = root.querySelectorAll('.hero-sub, .hero-description, .hero-cta');

  // Hide supporting copy immediately. Headline is handled below — its parent must
  // stay visible once SplitText wraps chars, or the chars remain invisible.
  if (supporting.length) {
    gsap.set(supporting, { autoAlpha: 0 });
  }

  const ctx = gsap.context(() => {
    const headline = root.querySelector<HTMLElement>('.hero-headline');
    if (headline) {
      try {
        gsap.set(headline, { autoAlpha: 0 });
        const split = new SplitText(headline, { type: 'words,chars' });
        splits.push(split);

        // Parent must be visible; animate the generated chars instead.
        gsap.set(headline, { autoAlpha: 1 });

        if (split.chars.length) {
          gsap.fromTo(
            split.chars,
            { yPercent: 105, autoAlpha: 0 },
            {
              yPercent: 0,
              autoAlpha: 1,
              duration: 1.25,
              ease: 'power3.out',
              stagger: 0.015,
            },
          );
        } else {
          gsap.fromTo(
            headline,
            { y: 36, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power3.out' },
          );
        }
      } catch {
        fadeUpStagger(headline);
      }
    }

    fadeUpStagger(supporting, { delay: 0.25 });
  }, root);

  return () => {
    splits.forEach((split) => {
      try {
        split.revert();
      } catch {
        // element may already be unmounted
      }
    });
    ctx.revert();
  };
}

export { gsap, ScrollTrigger, SplitText };
