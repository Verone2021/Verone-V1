import type { ReactNode } from 'react';

import { PublicSelectionProvider } from '@/contexts/PublicSelectionContext';

import { SelectionLayoutClient } from './SelectionLayoutClient';

/**
 * Layout pour les pages de sélection publique avec onglets
 *
 * Structure:
 * - Header avec logo et panier
 * - Onglets: Catalogue | FAQ | Contact
 * - Bouton panier flottant
 *
 * @module SelectionLayout
 * @since 2026-01-12
 */
export default async function SelectionLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: ReactNode;
}) {
  const { id } = await params;

  return (
    <PublicSelectionProvider selectionId={id}>
      <SelectionLayoutClient>{children}</SelectionLayoutClient>
    </PublicSelectionProvider>
  );
}
