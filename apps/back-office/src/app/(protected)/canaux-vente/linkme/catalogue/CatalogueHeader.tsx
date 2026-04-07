'use client';

import { ButtonV2 } from '@verone/ui';
import { Package, Plus } from 'lucide-react';

interface CatalogueHeaderProps {
  onAddProducts: () => void;
}

export function CatalogueHeader({ onAddProducts }: CatalogueHeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <Package className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Catalogue Produits</h1>
            <p className="text-sm text-gray-500">
              Gérez les produits disponibles pour les affiliés
            </p>
          </div>
        </div>

        <ButtonV2 onClick={onAddProducts}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter des produits
        </ButtonV2>
      </div>
    </div>
  );
}
