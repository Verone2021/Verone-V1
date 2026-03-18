import { Playfair_Display, Inter } from 'next/font/google';

import type { Metadata } from 'next';

import './globals.css';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { CookieConsent } from '@/components/CookieConsent';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { PromoBanner } from '@/components/layout/PromoBanner';
import { JsonLdOrganization } from '@/components/seo/JsonLdOrganization';

import { Providers } from './providers';

// Fonts Vérone Luxury
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://verone.fr';

export const metadata: Metadata = {
  title: {
    default: 'Vérone — Mobilier & Décoration Haut de Gamme',
    template: '%s | Vérone',
  },
  description:
    "Découvrez notre sélection de mobilier et décoration d'intérieur haut de gamme. Livraison soignée en France métropolitaine.",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Vérone',
    title: 'Vérone — Mobilier & Décoration Haut de Gamme',
    description:
      "Mobilier et décoration d'intérieur haut de gamme pour sublimer votre espace de vie.",
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vérone — Mobilier & Décoration Haut de Gamme',
    description:
      "Mobilier et décoration d'intérieur haut de gamme pour sublimer votre espace de vie.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${playfairDisplay.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-verone-white font-inter antialiased">
        <GoogleAnalytics />
        <JsonLdOrganization />
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <PromoBanner />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
