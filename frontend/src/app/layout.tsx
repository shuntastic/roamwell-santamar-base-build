import type { Metadata } from 'next';
import { Instrument_Sans, Ledger } from 'next/font/google';
import { AppProviders } from '@/components/layout/AppProviders';
import './globals.css';

const display = Ledger({
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
