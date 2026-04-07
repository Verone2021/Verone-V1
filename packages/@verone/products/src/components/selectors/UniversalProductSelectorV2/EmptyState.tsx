'use client';

import { ButtonV2 } from '@verone/ui';
import { Package, Plus, RotateCcw } from 'lucide-react';

// ============================================================================
// COMPOSANT - EmptyState
// ============================================================================

interface EmptyStateProps {
  type: 'no-results' | 'no-selection';
  searchQuery?: string;
  onReset?: () => void;
}

export function EmptyState({ type, searchQuery, onReset }: EmptyStateProps) {
  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Package className="h-10 w-10 text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Aucun produit trouvé
        </h3>
        <p className="text-sm text-[#6c7293] mb-4 max-w-sm">
          {searchQuery
            ? `Aucun résultat pour "${searchQuery}". Essayez de modifier votre recherche.`
            : 'Essayez de modifier vos filtres ou votre recherche'}
        </p>
        {onReset && (
          <ButtonV2 variant="outline" onClick={onReset} size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser les filtres
          </ButtonV2>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-[#844fc1]/10 rounded-full flex items-center justify-center mb-4">
        <Plus className="h-10 w-10 text-[#844fc1]" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        Aucun produit sélectionné
      </h3>
      <p className="text-sm text-[#6c7293] max-w-sm">
        Ajoutez des produits depuis la colonne de gauche
      </p>
    </div>
  );
}
