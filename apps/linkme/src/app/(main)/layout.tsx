// Deploy: 2026-01-05
import type { Metadata } from 'next';

import { Footer } from '../../components/layout/Footer';
import { Header } from '../../components/layout/Header';
import { Providers } from '../../components/providers/Providers';
import '../globals.css';

export const metadata: Metadata = {
  title: "LINKME - Plateforme d'affiliation Vérone",
  description:
    "Découvrez les sélections de mobilier et décoration d'intérieur par nos partenaires affiliés.",
};

/**
 * Layout pour les pages INTERNES LinkMe (dashboard, login, etc.)
 * Avec Header, Footer et AuthProvider
 */
export default function MainLayout({
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
