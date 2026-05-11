import type { Metadata } from 'next';

import { ColorOptionsTable } from './_components/ColorOptionsTable';

export const metadata: Metadata = {
  title: 'Couleurs — Paramètres',
  description: 'Vocabulaire contrôlé des couleurs produit du catalogue Vérone.',
};

export default function ParametresCouleurPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="w-full px-4 sm:px-6 py-6 space-y-6">
        <header>
          <h1 className="text-xl font-bold text-gray-900">Couleurs</h1>
          <p className="text-xs text-gray-500 mt-1">
            Liste des couleurs disponibles dans le catalogue. Les couleurs
            actives apparaissent dans les formulaires produit et dans les
            filtres du site.
          </p>
        </header>

        <ColorOptionsTable />
      </div>
    </div>
  );
}
