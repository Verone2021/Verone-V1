import type { FamilyWithStats } from '@verone/categories';
import { ButtonUnified } from '@verone/ui';
import { FolderPlus } from 'lucide-react';

import type { HierarchyCallbacks } from '../types';
import { FamilyRow } from './FamilyRow';

interface HierarchyTreeProps {
  isLoading: boolean;
  hasError: string | null | false | undefined;
  familiesError: string | null | undefined;
  categoriesError: string | null | undefined;
  subcategoriesError: string | null | undefined;
  filteredFamilies: FamilyWithStats[];
  expandedFamilies: string[];
  expandedCategories: string[];
  selectedItems: string[];
  callbacks: HierarchyCallbacks;
  onCreateFamily: () => void;
}

export function HierarchyTree({
  isLoading,
  hasError,
  familiesError,
  categoriesError,
  subcategoriesError,
  filteredFamilies,
  expandedFamilies,
  expandedCategories,
  selectedItems,
  callbacks,
  onCreateFamily,
}: HierarchyTreeProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
        <p className="text-gray-600 mt-2">Chargement des données Supabase...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Erreur de chargement</h3>
        {familiesError && (
          <p className="text-red-700 text-sm mt-1">Familles: {familiesError}</p>
        )}
        {categoriesError && (
          <p className="text-red-700 text-sm mt-1">
            Catégories: {categoriesError}
          </p>
        )}
        {subcategoriesError && (
          <p className="text-red-700 text-sm mt-1">
            Sous-catégories: {subcategoriesError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {filteredFamilies.length === 0 ? (
        <div className="text-center py-8">
          <FolderPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucune famille trouvée</p>
          <ButtonUnified
            onClick={onCreateFamily}
            variant="outline"
            className="mt-3"
          >
            Créer la première famille
          </ButtonUnified>
        </div>
      ) : (
        filteredFamilies.map(family => (
          <FamilyRow
            key={family.id}
            family={family}
            isExpanded={expandedFamilies.includes(family.id)}
            isSelected={selectedItems.includes(family.id)}
            familyCategories={callbacks.getCategoriesForFamily(family.id)}
            expandedCategories={expandedCategories}
            selectedItems={selectedItems}
            callbacks={callbacks}
          />
        ))
      )}
    </div>
  );
}
