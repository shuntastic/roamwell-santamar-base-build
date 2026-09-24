import { headers } from 'next/headers';
import { SITE_HOST_HEADER, normalizeHostname } from '@/lib/hostname';

/**
 * Resolve the incoming site host for RSC / route handlers.
 * Prefers middleware header; static builds use SITE_HOSTNAME / SITE_KEY build env.
 */
export async function getRequestSiteHost(): Promise<string> {
  const fromEnv = normalizeHostname(process.env.SITE_HOSTNAME);
  if (process.env.STATIC_EXPORT === 'true' && fromEnv) {
    return fromEnv;
  }

  try {
    const h = await headers();
    const fromHeader = normalizeHostname(h.get(SITE_HOST_HEADER));
    if (fromHeader) return fromHeader;

    const host = normalizeHostname(h.get('x-forwarded-host') || h.get('host'));
    if (host) return host;
  } catch {
    // headers() unavailable outside a request (e.g. generateStaticParams)
  }

  return fromEnv || 'localhost';
}

export { SITE_HOST_HEADER, normalizeHostname, getStaticSiteKey } from '@/lib/hostname';
