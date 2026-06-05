import type { Metadata, Viewport } from 'next';

import 'driver.js/dist/driver.css';

import './globals.css';
import '../styles/driver-theme.css';

/**
 * Configuration SEO globale LinkMe
 */
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://linkme.network';
const SITE_NAME = 'LinkMe';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LinkMe - Marketplace d'affiliation multi-marques",
    template: '%s | LinkMe',
  },
  description:
    'Ton réseau génère des ventes. LinkMe te les paie. Catalogue multi-marques, marge configurable, zéro stock. Accès sur demande.',
  keywords: [
    'ambassadeur de marque',
    'affiliation multi-marques',
    'marketplace affiliation',
    'commission produit physique',
  ],
  authors: [{ name: 'LinkMe', url: SITE_URL }],
  creator: 'LinkMe',
  publisher: 'LinkMe',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "LinkMe - Marketplace d'affiliation multi-marques",
    description:
      'Deviens ambassadeur de marques sélectionnées sur LinkMe. Catalogue multi-marques (déco, éclairage, végétal, électronique et plus). Tu fixes ta marge, tu touches ta commission.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: "LinkMe - Marketplace d'affiliation multi-marques",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "LinkMe - Marketplace d'affiliation multi-marques",
    description:
      'Deviens ambassadeur de marques sélectionnées sur LinkMe. Catalogue multi-marques (déco, éclairage, végétal, électronique et plus). Tu fixes ta marge, tu touches ta commission.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#5DBEBB' },
    { media: '(prefers-color-scheme: dark)', color: '#183559' },
  ],
  width: 'device-width',
  initialScale: 1,
};

/**
 * Root Layout LinkMe
 * Layout racine requis par Next.js 15 App Router
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="fr">
      <head>
        <link
          rel="preconnect"
          href="https://aorroydfjsrygmosnzrl.supabase.co"
        />
        <link
          rel="dns-prefetch"
          href="https://aorroydfjsrygmosnzrl.supabase.co"
        />
      </head>
      <body className="min-h-screen bg-gray-50/50">{children}</body>
    </html>
  );
}
