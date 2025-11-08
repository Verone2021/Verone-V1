'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Package, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { useSampleOrder } from '@verone/orders/hooks';

interface SampleOrderButtonProps {
  productId: string;
  productName: string;
  supplierName?: string;
  costPrice?: number;
  className?: string;
  variant?: 'secondary' | 'outline' | 'ghost';
  size?: 'secondary' | 'sm' | 'lg';
}

export function SampleOrderButton({
  productId,
  productName,
  supplierName,
  costPrice,
  className,
  variant = 'outline',
  size = 'secondary',
}: SampleOrderButtonProps) {
  const router = useRouter();
  const { requestSample, isLoading } = useSampleOrder();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    purchaseOrderId?: string;
    isNewOrder?: boolean;
  } | null>(null);

  const handleRequestSample = async () => {
    const response = await requestSample(productId);
    setResult(response);
    setShowConfirmDialog(false);

    // Si succès, proposer d'ouvrir la commande
    if (response.success && response.purchaseOrderId) {
      // Optionnel : rediriger vers la commande
      // router.push(`/commandes/fournisseurs/${response.purchaseOrderId}`)
    }
  };

  return (
    <>
      <ButtonV2
        variant={variant}
        size={size as any}
        onClick={() => setShowConfirmDialog(true)}
        disabled={isLoading}
        className={cn(
          'border-blue-300 text-blue-700 hover:bg-blue-50',
          className
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Traitement...
          </>
        ) : (
          <>
            <Package className="h-4 w-4 mr-2" />
            Commander échantillon
          </>
        )}
      </ButtonV2>

      {/* Dialog de confirmation */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commander un échantillon</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de commander un échantillon pour validation
              qualité.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">
                Détails de la commande
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Produit :</span>
                  <span className="font-medium text-blue-900">
                    {productName}
                  </span>
                </div>
                {supplierName && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Fournisseur :</span>
                    <span className="font-medium text-blue-900">
                      {supplierName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-blue-700">Quantité :</span>
                  <Badge
                    variant="outline"
                    className="bg-white border-blue-300 text-blue-700"
                  >
                    1 unité (échantillon)
                  </Badge>
                </div>
                {costPrice && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Prix unitaire :</span>
                    <span className="font-medium text-blue-900">
                      {costPrice.toFixed(2)} €
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
              <p className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  L'échantillon sera ajouté à une commande draft existante si
                  disponible, sinon une nouvelle commande sera créée
                  automatiquement.
                </span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <ButtonV2
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isLoading}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              onClick={handleRequestSample}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmer la commande
                </>
              )}
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
