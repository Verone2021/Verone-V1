import { Plus } from 'lucide-react';

import { ButtonUnified } from '@verone/ui';

interface CategoriesHeaderProps {
  familiesCount: number;
  loadTime: number;
  isLoading: boolean;
  onCreateFamily: () => void;
}

export function CategoriesHeader({
  familiesCount,
  loadTime,
  isLoading,
  onCreateFamily,
}: CategoriesHeaderProps) {
  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Catalogue - Hiérarchie
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des familles, catégories et sous-catégories
            {!isLoading && (
              <span className="ml-2 text-sm">
                ({familiesCount} familles • Chargé en {loadTime}ms)
              </span>
            )}
          </p>
        </div>
        <ButtonUnified
          onClick={onCreateFamily}
          variant="default"
          icon={Plus}
          iconPosition="left"
        >
          Nouvelle famille
        </ButtonUnified>
      </div>

      {loadTime > 0 && loadTime < 2000 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <span className="text-green-800 text-sm">
            Performance optimale : {loadTime}ms (SLO : &lt;2s)
          </span>
        </div>
      )}
    </>
  );
}
