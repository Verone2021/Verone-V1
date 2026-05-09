'use client';

import { ButtonUnified } from '@verone/ui';

interface ProductLoadingStateProps {
  loading: boolean;
  error: string | null;
  onBack: () => void;
}

export function ProductLoadingState({
  loading,
  error,
  onBack,
}: ProductLoadingStateProps) {
  if (loading) {
    return (
      <div className="w-full py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4" />
            <p>Chargement du produit...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-medium">
          {error ?? 'Produit non trouvé'}
        </p>
        <ButtonUnified onClick={onBack} variant="outline" className="mt-4">
          Retour au catalogue
        </ButtonUnified>
      </div>
    </div>
  );
}
