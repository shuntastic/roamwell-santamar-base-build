import type { Metadata } from 'next';
import { Fraunces, Outfit } from 'next/font/google';
import { AppProviders } from '@/components/layout/AppProviders';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Outfit({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Santamar',
    template: '%s | Santamar',
  },
  description: 'Coastal hospitality with accommodations, local experiences, and easy booking.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
