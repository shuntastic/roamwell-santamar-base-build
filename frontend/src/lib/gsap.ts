/**
 * GSAP club/bonus helpers for Santamar motion.
 * Bonus package lives at frontend/gsap-bonus.tgz (installed as `gsap`).
 */
"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

let registered = false;

export function registerGsapPlugins() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  registered = true;
}

export function fadeUpStagger(
  targets: gsap.TweenTarget,
  options?: gsap.TweenVars & { stagger?: gsap.NumberValue | gsap.StaggerVars },
) {
  registerGsapPlugins();
  return gsap.from(targets, {
    y: 36,
    opacity: 0,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.12,
    ...options,
  });
}

export function revealOnScroll(selector: string, trigger?: Element | string) {
  registerGsapPlugins();
  return gsap.utils.toArray<HTMLElement>(selector).map((element) =>
    gsap.fromTo(
      element,
      {
        y: 48,
        opacity: 0,
      },
      {
        scrollTrigger: {
          trigger: trigger ?? element,
          start: "top 85%",
          once: true,
        },
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: "power2.out",
      },
    ),
  );
}

export function splitHeadline(element: HTMLElement) {
  registerGsapPlugins();
  const split = new SplitText(element, { type: "words,chars" });
  gsap.from(split.chars, {
    yPercent: 105,
    opacity: 0,
    duration: 1.25,
    ease: "power3.out",
    stagger: 0.015,
  });
  return split;
}

export { gsap, ScrollTrigger, SplitText };
