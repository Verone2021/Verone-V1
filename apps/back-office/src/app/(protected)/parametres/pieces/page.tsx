import type { Metadata } from 'next';

import { RoomOptionsTable } from './_components/RoomOptionsTable';

export const metadata: Metadata = {
  title: 'Pièces — Paramètres',
  description: 'Vocabulaire contrôlé des pièces du catalogue Vérone.',
};

export default function ParametresPiecesPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="w-full px-4 sm:px-6 py-6 space-y-6">
        <header>
          <h1 className="text-xl font-bold text-gray-900">Pièces</h1>
          <p className="text-xs text-gray-500 mt-1">
            Liste des pièces disponibles pour classer les produits du catalogue.
            Les pièces actives apparaissent dans les formulaires produit et dans
            les filtres du site.
          </p>
        </header>

        <RoomOptionsTable />
      </div>
    </div>
  );
}
