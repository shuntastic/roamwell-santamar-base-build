/** Hostname allowlist helpers for CMS-pasted third-party embed scripts. */

export const DEFAULT_EMBED_SCRIPT_ALLOWLIST = ['cloudfront.net'] as const;

const SCRIPT_MARKER = 'data-santamar-embed-src';

export type ParsedEmbedScript =
  | { kind: 'external'; src: string }
  | { kind: 'inline'; content: string };

export type ParsedEmbed = {
  markupHtml: string;
  scripts: ParsedEmbedScript[];
};

export function getEmbedScriptAllowlist(
  envValue: string | undefined = typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_EMBED_SCRIPT_ALLOWLIST
    : undefined,
): string[] {
  const raw = (envValue ?? '').trim();
  if (!raw) return [...DEFAULT_EMBED_SCRIPT_ALLOWLIST];
  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase().replace(/^\*\./, ''))
    .filter(Boolean);
}

/** Allow https (and http for local Hostaway base tooling) scripts whose host matches allowlist. */
export function isAllowedScriptSrc(src: string, allowlist: string[]): boolean {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;

  const host = url.hostname.toLowerCase();
  return allowlist.some((entry) => {
    const needle = entry.trim().toLowerCase().replace(/^\*\./, '');
    if (!needle) return false;
    return host === needle || host.endsWith(`.${needle}`);
  });
}

/**
 * Split pasted vendor HTML into sanitizable markup + ordered scripts.
 * Mount points (divs) are collected separately so they exist before init scripts run.
 */
export function parseEmbedCode(embedCode: string): ParsedEmbed {
  if (typeof DOMParser === 'undefined') {
    return { markupHtml: '', scripts: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(embedCode, 'text/html');
  const scripts: ParsedEmbedScript[] = [];
  const markupParts: string[] = [];

  const collect = (root: ParentNode) => {
    for (const node of Array.from(root.childNodes)) {
      if (node.nodeName === 'SCRIPT') {
        const el = node as HTMLScriptElement;
        const src = el.getAttribute('src')?.trim();
        if (src) {
          scripts.push({ kind: 'external', src });
        } else {
          scripts.push({ kind: 'inline', content: el.textContent ?? '' });
        }
        continue;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        markupParts.push((node as Element).outerHTML);
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? '';
        if (text.trim()) markupParts.push(text);
      }
    }
  };

  collect(doc.head);
  collect(doc.body);

  return {
    markupHtml: markupParts.join(''),
    scripts,
  };
}

export function loadExternalScript(src: string): Promise<void> {
  const existing = Array.from(
    document.querySelectorAll<HTMLScriptElement>(`script[${SCRIPT_MARKER}]`),
  ).find((el) => el.getAttribute(SCRIPT_MARKER) === src);

  if (existing) {
    if (existing.dataset.loaded === 'true') return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error(`Failed to load embed script: ${src}`)),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.setAttribute(SCRIPT_MARKER, src);
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load embed script: ${src}`));
    document.body.appendChild(script);
  });
}

/** Run an inline script via a real script element (not eval on the raw paste). */
export function runInlineScript(content: string, parent: ParentNode): void {
  if (!content.trim()) return;
  const script = document.createElement('script');
  script.text = content;
  parent.appendChild(script);
}
