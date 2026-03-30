'use client';

import { ButtonV2 } from '@verone/ui';
import { ArrowUpDown, Eye, RefreshCw } from 'lucide-react';

interface MovementsEmptyStateProps {
  hasFilters: boolean;
  emptyMessage: string;
  onResetFilters: () => void;
}

export function MovementsEmptyState({
  hasFilters,
  emptyMessage,
  onResetFilters,
}: MovementsEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <Eye className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-black mb-2">
            Aucun mouvement trouvé
          </h3>
          <p className="text-gray-500 mb-4">
            Aucun mouvement ne correspond aux critères sélectionnés.
          </p>
          <ButtonV2
            variant="outline"
            onClick={onResetFilters}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser les filtres
          </ButtonV2>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8">
      <div className="text-center">
        <ArrowUpDown className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-black mb-2">{emptyMessage}</h3>
        <p className="text-gray-500">
          Les mouvements apparaîtront ici dès qu'ils seront créés.
        </p>
      </div>
    </div>
  );
}
