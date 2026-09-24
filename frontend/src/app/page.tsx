import { redirect } from 'next/navigation';
import { defaultLocale } from '@/lib/i18n';

const isStaticExport = process.env.STATIC_EXPORT === 'true';

/**
 * Node mode uses a server redirect. Static LAMP export cannot call `redirect()`
 * here — Apache `.htaccess` handles `/` → `/en/`, with a meta refresh fallback.
 */
export default function RootPage() {
  if (isStaticExport) {
    const href = `/${defaultLocale}/`;
    return (
      <>
        <meta httpEquiv="refresh" content={`0;url=${href}`} />
        <p>
          <a href={href}>Continue to site</a>
        </p>
      </>
    );
  }

  redirect(`/${defaultLocale}`);
}
