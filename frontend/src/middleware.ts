import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { defaultLocale, isLocale } from '@/lib/i18n';
import { SITE_HOST_HEADER, normalizeHostname } from '@/lib/hostname';

function withSiteHost(request: NextRequest) {
  const host = normalizeHostname(
    request.headers.get('x-forwarded-host') || request.headers.get('host'),
  );
  const requestHeaders = new Headers(request.headers);
  if (host) requestHeaders.set(SITE_HOST_HEADER, host);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const segment = pathname.split('/')[1];
  if (isLocale(segment)) {
    return withSiteHost(request);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;
  // Redirects cannot carry custom request headers into the next hop;
  // the follow-up request will hit middleware again with a locale prefix.
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
