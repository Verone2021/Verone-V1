import {
  Playfair_Display,
  Inter,
  Bodoni_Moda,
  Montserrat,
  DM_Sans,
} from 'next/font/google';

import type { Metadata } from 'next';

import './globals.css';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { MetaPixel } from '@/components/analytics/MetaPixel';
import { CookieConsent } from '@/components/CookieConsent';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { PromoBanner } from '@/components/layout/PromoBanner';
import { JsonLdOrganization } from '@/components/seo/JsonLdOrganization';

import { Providers } from './providers';

// Fonts Vérone — design system 2026 (Stitch)
const bodoniModa = Bodoni_Moda({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-bodoni',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
});

// Fonts legacy — conservées pour pages non encore migrées (catalogue, fiche produit, etc.)
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
  verification: {
    other: {
      'facebook-domain-verification': 'trojockg37hwcn77so0hup2246lqfx',
    },
  },
  title: {
    default: 'Vérone — Concept Store Déco & Mobilier Original',
    template: '%s | Vérone',
  },
  description:
    'Vérone déniche pour vous des pièces originales de décoration et mobilier. Sourcing créatif, produits introuvables ailleurs, prix justes. Livraison soignée en France.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Vérone',
    title: 'Vérone — Concept Store Déco & Mobilier Original',
    description:
      'Concept store en ligne — produits originaux de déco et mobilier, sourcés avec soin, au juste prix.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vérone — Concept Store Déco & Mobilier Original',
    description:
      'Concept store en ligne — produits originaux de déco et mobilier, sourcés avec soin, au juste prix.',
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
    <html
      lang="fr"
      className={`${bodoniModa.variable} ${montserrat.variable} ${dmSans.variable} ${playfairDisplay.variable} ${inter.variable}`}
    >
      <body className="min-h-screen bg-verone-white font-montserrat antialiased">
        <GoogleAnalytics />
        <MetaPixel />
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
