'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
  Textarea,
} from '@verone/ui';

import { useSalesReturns, type ReturnableItem } from '@verone/orders/hooks';

interface SalesOrderReturnModalProps {
  order: {
    id: string;
    order_number: string;
  };
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SalesOrderReturnModal({
  order,
  open,
  onClose,
  onSuccess,
}: SalesOrderReturnModalProps) {
  const { loading, submitting, loadReturnableItems, submitReturn } =
    useSalesReturns();

  const [items, setItems] = useState<ReturnableItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Load returnable items when modal opens
  useEffect(() => {
    if (open && order.id) {
      void loadReturnableItems(order.id)
        .then(returnableItems => {
          setItems(returnableItems);
          // Initialize quantities to 0
          const initialQuantities: Record<string, number> = {};
          for (const item of returnableItems) {
            initialQuantities[item.product_id] = 0;
          }
          setQuantities(initialQuantities);
        })
        .catch((err: unknown) => {
          console.error('[SalesOrderReturnModal] Load failed:', err);
        });
    }
  }, [open, order.id, loadReturnableItems]);

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setReason('');
      setNotes('');
      setFormError(null);
      setQuantities({});
    }
  }, [open]);

  const handleQuantityChange = useCallback(
    (productId: string, value: string, maxQuantity: number) => {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 0) {
        setQuantities(prev => ({ ...prev, [productId]: 0 }));
        return;
      }
      if (num > maxQuantity) {
        setQuantities(prev => ({ ...prev, [productId]: maxQuantity }));
        return;
      }
      setQuantities(prev => ({ ...prev, [productId]: num }));
    },
    []
  );

  const hasAnyQuantity = Object.values(quantities).some(q => q > 0);

  const handleSubmit = useCallback(async () => {
    setFormError(null);

    if (!reason.trim()) {
      setFormError('La raison du retour est obligatoire');
      return;
    }

    if (!hasAnyQuantity) {
      setFormError('Saisissez au moins une quantité à retourner');
      return;
    }

    const returnItems = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => ({
        product_id: productId,
        quantity_returned: qty,
      }));

    const result = await submitReturn({
      sales_order_id: order.id,
      items: returnItems,
      reason: reason.trim(),
      notes: notes.trim() || undefined,
    });

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setFormError(result.error ?? 'Erreur lors du traitement du retour');
    }
  }, [
    reason,
    notes,
    quantities,
    hasAnyQuantity,
    order.id,
    submitReturn,
    onSuccess,
    onClose,
  ]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Retour produits
          </DialogTitle>
          <DialogDescription>
            Commande {order.order_number} — Sélectionnez les produits et
            quantités retournés
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">
              Chargement des articles...
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun article expédié à retourner
          </div>
        ) : (
          <div className="space-y-6">
            {/* Reason field */}
            <div className="space-y-2">
              <Label htmlFor="return-reason">Raison du retour *</Label>
              <Input
                id="return-reason"
                placeholder="Ex: Produit endommagé, erreur de commande..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>

            {/* Items table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">
                      Produit
                    </th>
                    <th className="text-center p-3 text-sm font-medium w-24">
                      Expédié
                    </th>
                    <th className="text-center p-3 text-sm font-medium w-32">
                      Retour
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.product_id} className="border-t">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-sm">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.product_sku}
                          </p>
                        </div>
                      </td>
                      <td className="text-center p-3 text-sm">
                        {item.quantity_shipped}
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min={0}
                          max={item.quantity_shipped}
                          value={quantities[item.product_id] ?? 0}
                          onChange={e =>
                            handleQuantityChange(
                              item.product_id,
                              e.target.value,
                              item.quantity_shipped
                            )
                          }
                          className="w-20 mx-auto text-center"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Notes field */}
            <div className="space-y-2">
              <Label htmlFor="return-notes">Notes (optionnel)</Label>
              <Textarea
                id="return-notes"
                placeholder="Informations complémentaires..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Error message */}
            {formError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {formError}
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  void handleSubmit().catch((err: unknown) => {
                    console.error(
                      '[SalesOrderReturnModal] Submit failed:',
                      err
                    );
                  });
                }}
                disabled={submitting || !hasAnyQuantity || !reason.trim()}
              >
                {submitting ? 'Traitement...' : 'Confirmer retour'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
