'use client';

import { useState } from 'react';

import { useToast } from '@verone/common';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { AlertTriangle, Package } from 'lucide-react';

import { useShipments } from '@verone/orders/hooks';

interface CloseOrderModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  remainingUnits: number;
  onSuccess?: () => void;
}

export function CloseOrderModal({
  open,
  onClose,
  orderId,
  orderNumber,
  remainingUnits,
  onSuccess,
}: CloseOrderModalProps) {
  const { toast } = useToast();
  const { closeOrder } = useShipments();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);

    try {
      const result = await closeOrder(orderId);

      toast({
        title: 'Commande clôturée',
        description:
          result.message || `Commande ${orderNumber} clôturée avec succès`,
        variant: 'default',
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('[CloseOrderModal] Error:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de clôturer la commande',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Clôturer la commande partiellement
          </DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir clôturer la commande{' '}
            <span className="font-semibold">{orderNumber}</span> ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Avertissement unités restantes */}
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-md">
            <Package className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-orange-900 mb-1">
                {remainingUnits} unité{remainingUnits > 1 ? 's' : ''} non
                expédiée{remainingUnits > 1 ? 's' : ''}
              </p>
              <p className="text-orange-700">
                Ces unités ne seront jamais expédiées et seront libérées du
                stock prévisionnel.
              </p>
            </div>
          </div>

          {/* Explications */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">
              Conséquences de la clôture :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                Le statut de la commande passera à{' '}
                <span className="font-medium">Clôturée</span>
              </li>
              <li>
                Les {remainingUnits} unités restantes seront libérées du stock
                prévu en sortie (forecasted_out)
              </li>
              <li>Aucune nouvelle expédition ne pourra être créée</li>
              <li>Cette action est irréversible</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <ButtonV2 variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </ButtonV2>
          <ButtonV2
            variant="destructive"
            onClick={handleConfirm}
            loading={loading}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Clôturer la commande
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
