import type { Metadata } from 'next';
import { Bentham, Instrument_Sans } from 'next/font/google';
import { AppProviders } from '@/components/layout/AppProviders';
import './globals.css';

const display = Bentham({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

const body = Instrument_Sans({
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
