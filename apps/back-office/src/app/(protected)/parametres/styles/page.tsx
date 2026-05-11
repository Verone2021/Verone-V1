import type { Metadata } from 'next';

import { StyleOptionsTable } from './_components/StyleOptionsTable';

export const metadata: Metadata = {
  title: 'Styles — Paramètres',
  description:
    'Vocabulaire contrôlé des styles décoratifs du catalogue Vérone.',
};

export default function ParametresStylesPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="w-full px-4 sm:px-6 py-6 space-y-6">
        <header>
          <h1 className="text-xl font-bold text-gray-900">Styles décoratifs</h1>
          <p className="text-xs text-gray-500 mt-1">
            Liste des styles décoratifs disponibles dans le catalogue. Les
            styles actifs apparaissent dans les formulaires produit et dans les
            filtres du site.
          </p>
        </header>

        <StyleOptionsTable />
      </div>
    </div>
  );
}
