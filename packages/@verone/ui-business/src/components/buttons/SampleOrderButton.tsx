'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { useSampleOrder } from '@verone/orders/hooks';
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
import { Package, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SampleOrderButtonProps {
  productId: string;
  productName: string;
  supplierName?: string;
  costPrice?: number;
  className?: string;
  variant?: 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function SampleOrderButton({
  productId,
  productName,
  supplierName,
  costPrice,
  className,
  variant = 'outline',
  size = 'md',
}: SampleOrderButtonProps) {
  const router = useRouter();
  const { requestSample, isLoading } = useSampleOrder();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    purchaseOrderId?: string;
    isNewOrder?: boolean;
  } | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleRequestSample = async () => {
    const response = await requestSample(productId);
    setResult(response);
    setShowConfirmDialog(false);

    // Si succès, afficher le modal de confirmation
    if (response.success) {
      setShowSuccessDialog(true);
    }
  };

  const handleViewOrder = () => {
    if (result?.purchaseOrderId) {
      router.push(`/commandes/fournisseurs/${result.purchaseOrderId}`);
    }
    setShowSuccessDialog(false);
  };

  return (
    <>
      <ButtonV2
        variant={variant}
        size={size}
        onClick={() => setShowConfirmDialog(true)}
        disabled={isLoading}
        icon={Package}
        iconPosition="left"
        loading={isLoading}
        className={className}
      >
        {isLoading ? 'Traitement...' : 'Commander échantillon'}
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

      {/* Dialog de succès */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Échantillon commandé !
            </DialogTitle>
            <DialogDescription>
              Votre demande d'échantillon a bien été prise en compte.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Produit :</span>
                  <span className="font-medium text-green-900">
                    {productName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Quantité :</span>
                  <Badge
                    variant="outline"
                    className="bg-white border-green-300 text-green-700"
                  >
                    1 unité
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Statut :</span>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    {result?.isNewOrder
                      ? 'Nouvelle commande créée'
                      : 'Ajouté à commande existante'}
                  </Badge>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              L'échantillon a été ajouté à une commande fournisseur en
              brouillon. Vous pouvez la consulter et la valider quand vous le
              souhaitez.
            </p>
          </div>

          <DialogFooter>
            <ButtonV2
              variant="outline"
              onClick={() => setShowSuccessDialog(false)}
            >
              Fermer
            </ButtonV2>
            <ButtonV2
              onClick={handleViewOrder}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Package className="h-4 w-4 mr-2" />
              Voir la commande
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
