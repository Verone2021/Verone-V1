import { Playfair_Display, Inter } from 'next/font/google';

import type { Metadata } from 'next';

import './globals.css';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

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

export const metadata: Metadata = {
  title: 'Vérone - Mobilier Haut de Gamme',
  description: "E-commerce mobilier et décoration d'intérieur haut de gamme",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${playfairDisplay.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-verone-white font-inter antialiased">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
