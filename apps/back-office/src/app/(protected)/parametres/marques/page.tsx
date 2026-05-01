import type { Metadata } from 'next';

import { BrandsManagementTable } from './_components/BrandsManagementTable';

export const metadata: Metadata = {
  title: 'Marques internes — Paramètres',
  description:
    'Gestion des marques internes Vérone Group (Vérone, Boêmia, Solar, Flos)',
};

export default function ParametresMarquesPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="w-full px-4 sm:px-6 py-6 space-y-6">
        <header>
          <h1 className="text-xl font-bold text-gray-900">Marques internes</h1>
          <p className="text-xs text-gray-500 mt-1">
            Gestion des 4 marques internes du groupe Vérone : Vérone, Boêmia,
            Solar, Flos. Édition de la couleur, du logo, du site web et des
            liens sociaux. Création et suppression désactivées (les marques sont
            figées).
          </p>
        </header>

        <BrandsManagementTable />
      </div>
    </div>
  );
}
