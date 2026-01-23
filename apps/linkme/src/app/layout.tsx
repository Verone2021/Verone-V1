import type { Metadata, Viewport } from 'next';

import './globals.css';

/**
 * Configuration SEO globale LinkMe
 */
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://linkme.verone.io';
const SITE_NAME = 'LinkMe by Verone';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LinkMe - Plateforme d'affiliation B2B | Verone",
    template: '%s | LinkMe',
  },
  description:
    "Rejoignez LinkMe, la plateforme d'affiliation B2B pour les professionnels du mobilier et de la decoration d'interieur. Monetisez votre reseau avec des commissions attractives.",
  keywords: [
    'affiliation B2B',
    'plateforme affiliation',
    'mobilier interieur',
    'decoration interieur',
    'commission vente',
    'partenariat professionnel',
    'LinkMe',
    'Verone',
  ],
  authors: [{ name: 'Verone', url: 'https://verone.io' }],
  creator: 'Verone',
  publisher: 'Verone',
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
    title: "LinkMe - Plateforme d'affiliation B2B",
    description:
      "Monetisez votre reseau avec LinkMe, la plateforme d'affiliation B2B pour le mobilier et la decoration d'interieur.",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LinkMe - Plateforme affiliation B2B',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "LinkMe - Plateforme d'affiliation B2B",
    description:
      "Monetisez votre reseau avec LinkMe, la plateforme d'affiliation B2B pour le mobilier et la decoration d'interieur.",
    images: ['/og-image.png'],
    creator: '@verone_io',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
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
      <body className="min-h-screen bg-gray-50/50">{children}</body>
    </html>
  );
}
