'use client';

import { ButtonV2, Card, CardContent } from '@verone/ui';
import { AlertCircle, ArrowLeft, Package } from 'lucide-react';

/** Fiche sourcing en cours de chargement. */
export function SourcingProductLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <Package className="mx-auto mb-4 h-12 w-12 animate-spin text-gray-400" />
        <p className="text-gray-600">Chargement du produit sourcing...</p>
      </div>
    </div>
  );
}

interface SourcingProductNotFoundProps {
  onBack: () => void;
}

/** Produit absent ou sorti du sourcing (validé au catalogue). */
export function SourcingProductNotFound({
  onBack,
}: SourcingProductNotFoundProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md border-black">
        <CardContent className="p-6 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-black">
            Produit sourcing non trouvé
          </h3>
          <p className="mb-4 text-gray-600">
            Ce produit n&apos;existe pas ou a quitté le sourcing (validé au
            catalogue).
          </p>
          <ButtonV2
            onClick={onBack}
            className="bg-black text-white hover:bg-gray-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au sourcing
          </ButtonV2>
        </CardContent>
      </Card>
    </div>
  );
}
