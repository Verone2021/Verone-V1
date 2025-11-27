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
import { Textarea } from '@verone/ui';
import { Label } from '@verone/ui';
import { AlertTriangle, Package, XCircle } from 'lucide-react';

import { usePurchaseReceptions } from '@verone/orders/hooks';

interface RemainderItem {
  product_name: string;
  product_sku: string;
  quantity_remaining: number;
}

interface CancelRemainderModalProps {
  open: boolean;
  onClose: () => void;
  purchaseOrderId: string;
  poNumber: string;
  remainderItems: RemainderItem[];
  onSuccess?: () => void;
}

export function CancelRemainderModal({
  open,
  onClose,
  purchaseOrderId,
  poNumber,
  remainderItems,
  onSuccess,
}: CancelRemainderModalProps) {
  const { toast } = useToast();
  const { cancelRemainder, cancelling } = usePurchaseReceptions();
  const [reason, setReason] = useState('');

  const totalRemaining = remainderItems.reduce(
    (sum, item) => sum + item.quantity_remaining,
    0
  );

  const handleConfirm = async () => {
    const result = await cancelRemainder({
      purchase_order_id: purchaseOrderId,
      reason: reason || undefined,
    });

    if (result.success) {
      toast({
        title: 'Reliquat annulé',
        description: `${result.details?.total_quantity_cancelled || totalRemaining} unités annulées. Commande ${poNumber} clôturée.`,
        variant: 'default',
      });
      onSuccess?.();
      onClose();
    } else {
      toast({
        title: 'Erreur',
        description: result.error || "Impossible d'annuler le reliquat",
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-orange-500" />
            Annuler le reliquat de commande
          </DialogTitle>
          <DialogDescription>
            Annuler les quantités non reçues de la commande{' '}
            <span className="font-semibold">{poNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Résumé des items avec reliquat */}
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-md">
            <Package className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-orange-900 mb-2">
                {totalRemaining} unité{totalRemaining > 1 ? 's' : ''} non reçue
                {totalRemaining > 1 ? 's' : ''} à annuler :
              </p>
              <ul className="space-y-1 text-orange-700">
                {remainderItems.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span className="truncate max-w-[200px]">
                      {item.product_name}
                    </span>
                    <span className="font-medium ml-2">
                      {item.quantity_remaining} unité
                      {item.quantity_remaining > 1 ? 's' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Motif (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motif d'annulation (optionnel)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ex: Fournisseur en rupture, produit discontinué..."
              rows={2}
            />
          </div>

          {/* Conséquences */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">
              Conséquences de l'annulation :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                Le statut de la commande passera à{' '}
                <span className="font-medium text-green-700">Reçue</span>{' '}
                (clôturée)
              </li>
              <li>
                Le stock prévisionnel entrant sera diminué de {totalRemaining}{' '}
                unités
              </li>
              <li>
                Si le seuil de stock n'est plus couvert, une{' '}
                <span className="font-medium text-red-600">alerte stock</span>{' '}
                sera réactivée
              </li>
              <li>
                Vous pourrez{' '}
                <span className="font-medium">créer une nouvelle commande</span>{' '}
                pour compenser le manque
              </li>
            </ul>
          </div>

          {/* Avertissement */}
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Cette action est irréversible</span>
          </div>
        </div>

        <DialogFooter>
          <ButtonV2 variant="outline" onClick={onClose} disabled={cancelling}>
            Annuler
          </ButtonV2>
          <ButtonV2
            variant="destructive"
            onClick={handleConfirm}
            loading={cancelling}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Confirmer l'annulation
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
