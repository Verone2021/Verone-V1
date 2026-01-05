import type { ReactNode } from 'react';

import type { Metadata } from 'next';

import { PublicProviders } from '@/components/providers/PublicProviders';

import '../globals.css';

export const metadata: Metadata = {
  title: 'Catalogue',
  description: 'Selection de produits',
};

/**
 * Layout pour les pages de selection PUBLIQUES
 *
 * IMPORTANT: Ce layout est WHITE-LABEL
 * - PAS de branding LinkMe visible
 * - PAS de lien vers l'accueil LinkMe
 * - Le client final ne doit pas savoir que c'est LinkMe
 * - Juste le catalogue et le panier
 */
export default function PublicSelectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50">
        <PublicProviders>
          {/* PAS DE HEADER - white label */}
          {children}
          {/* PAS DE FOOTER - white label */}
        </PublicProviders>
      </body>
    </html>
  );
}
