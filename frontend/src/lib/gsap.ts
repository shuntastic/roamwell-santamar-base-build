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

let activeScrollTween: gsap.core.Tween | null = null;
let detachScrollCancel: (() => void) | null = null;

/**
 * Scroll the window to an element or a y position.
 * `power3.inOut` eases in and out; reduced-motion users jump immediately.
 * `offsetY` clears a sticky header. A wheel or touch gesture cancels the tween.
 */
export function scrollToTarget(
  target: HTMLElement | number,
  options?: { offsetY?: number; duration?: number },
) {
  registerGsapPlugins();
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const offsetY = options?.offsetY ?? 0;
  const max = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  const raw =
    typeof target === 'number'
      ? target
      : target.getBoundingClientRect().top + window.scrollY - offsetY;
  const dest = Math.min(Math.max(0, raw), max);

  detachScrollCancel?.();
  detachScrollCancel = null;
  activeScrollTween?.kill();
  activeScrollTween = null;

  const proxy = { y: window.scrollY };
  let tween: gsap.core.Tween;

  const cleanup = () => {
    window.removeEventListener('wheel', cancelUserScroll);
    window.removeEventListener('touchmove', cancelUserScroll);
    if (detachScrollCancel === cleanup) detachScrollCancel = null;
  };

  const cancelUserScroll = () => {
    if (activeScrollTween !== tween) return;
    cleanup();
    tween.kill();
    activeScrollTween = null;
    ScrollTrigger.update();
  };

  tween = gsap.to(proxy, {
    y: dest,
    duration: reduce ? 0 : (options?.duration ?? 1.15),
    ease: 'power3.inOut',
    onUpdate: () => {
      window.scrollTo(0, proxy.y);
    },
    onComplete: () => {
      cleanup();
      if (activeScrollTween === tween) activeScrollTween = null;
      ScrollTrigger.update();
    },
  });

  activeScrollTween = tween;
  detachScrollCancel = cleanup;
  if (!reduce) {
    window.addEventListener('wheel', cancelUserScroll, { passive: true });
    window.addEventListener('touchmove', cancelUserScroll, { passive: true });
  }
  return tween;
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
