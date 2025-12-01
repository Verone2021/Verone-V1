import type { Metadata } from 'next';

import { Providers } from '../components/providers/Providers';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'LINKME - Plateforme d\'affiliation Vérone',
  description:
    'Découvrez les sélections de mobilier et décoration d\'intérieur par nos partenaires affiliés.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
