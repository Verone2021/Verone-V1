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
    default: 'Sélection déco design — Vérone, le regard qui choisit',
    template: '%s | Vérone',
  },
  description:
    'Boutique déco en ligne. Mille pièces vues, cinquante retenues. Objets et mobilier sélectionnés avec exigence — pas un catalogue, un regard.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Vérone',
    title: 'Sélection déco design — Vérone, le regard qui choisit',
    description:
      'Boutique déco en ligne. Mille pièces vues, cinquante retenues. Objets et mobilier sélectionnés avec exigence — pas un catalogue, un regard.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sélection déco design — Vérone, le regard qui choisit',
    description:
      'Boutique déco en ligne. Mille pièces vues, cinquante retenues. Objets et mobilier sélectionnés avec exigence — pas un catalogue, un regard.',
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
