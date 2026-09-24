/** Shared hostname helpers (safe for Edge middleware — no next/headers). */

export const SITE_HOST_HEADER = 'x-santamar-site-host';

/** Normalize a Host / hostname value (no protocol, no port, lowercase). */
export function normalizeHostname(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .split(',')[0]
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
}

export function getStaticSiteKey(): string | undefined {
  return process.env.SITE_KEY?.trim() || undefined;
}
