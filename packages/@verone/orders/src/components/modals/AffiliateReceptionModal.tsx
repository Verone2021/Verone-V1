'use client';

/**
 * Modal Reception Produit Affilie
 * Gere la reception complete/partielle et l'annulation du reliquat
 * Similaire a PurchaseOrderReceptionForm mais adapte pour 1 produit
 */

import { useState } from 'react';

import { ProductThumbnail } from '@verone/products';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Textarea } from '@verone/ui';
import {
  Package,
  Truck,
  XCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

import { usePurchaseReceptions } from '@verone/orders/hooks';

export interface AffiliateReception {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image_url?: string;
  affiliate_name: string;
  enseigne_name?: string;
  quantity_expected: number;
  quantity_received: number;
  status: 'pending' | 'partial' | 'completed' | 'cancelled';
}

interface AffiliateReceptionModalProps {
  reception: AffiliateReception;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AffiliateReceptionModal({
  reception,
  open,
  onClose,
  onSuccess,
}: AffiliateReceptionModalProps) {
  const { confirmAffiliateReception, cancelAffiliateRemainder, validating } =
    usePurchaseReceptions();

  const [quantityToReceive, setQuantityToReceive] = useState(
    reception.quantity_expected - (reception.quantity_received || 0)
  );
  const [notes, setNotes] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Calculs
  const quantityAlreadyReceived = reception.quantity_received || 0;
  const quantityRemaining =
    reception.quantity_expected - quantityAlreadyReceived;
  const willBeComplete =
    quantityAlreadyReceived + quantityToReceive >= reception.quantity_expected;
  const progressPercent =
    reception.quantity_expected > 0
      ? Math.round(
          (quantityAlreadyReceived / reception.quantity_expected) * 100
        )
      : 0;

  // Handler reception
  const handleConfirmReception = async () => {
    if (quantityToReceive <= 0) return;

    const result = await confirmAffiliateReception(
      reception.id,
      quantityToReceive,
      notes || undefined
    );

    if (result.success) {
      onSuccess?.();
      onClose();
    }
  };

  // Handler annulation reliquat
  const handleCancelRemainder = async () => {
    const result = await cancelAffiliateRemainder(
      reception.id,
      cancelReason || undefined
    );

    if (result.success) {
      onSuccess?.();
      onClose();
    }
  };

  // Recevoir tout
  const handleReceiveAll = () => {
    setQuantityToReceive(quantityRemaining);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Truck className="h-5 w-5 text-verone-primary" />
            Reception Produit Affilie
          </DialogTitle>
          <DialogDescription>
            {reception.affiliate_name}
            {reception.enseigne_name && ` - ${reception.enseigne_name}`}
          </DialogDescription>
        </DialogHeader>

        {/* Affichage annulation reliquat */}
        {showCancelConfirm ? (
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-orange-800">
                  Confirmer l'annulation du reliquat
                </span>
              </div>
              <p className="text-sm text-orange-700 mb-4">
                Vous allez annuler <strong>{quantityRemaining} unite(s)</strong>{' '}
                restante(s). Cette action supprimera ces unites du stock
                previsionnel.
              </p>
              <div>
                <Label>Motif d'annulation (optionnel)</Label>
                <Textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="Ex: Stock non disponible, commande annulee..."
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <ButtonV2
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                disabled={validating}
              >
                Retour
              </ButtonV2>
              <ButtonV2
                onClick={handleCancelRemainder}
                disabled={validating}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {validating ? 'Annulation...' : 'Confirmer annulation'}
              </ButtonV2>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Info produit */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <ProductThumbnail
                src={reception.product_image_url}
                alt={reception.product_name}
                size="md"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {reception.product_name}
                </h3>
                <p className="text-sm text-gray-500 font-mono">
                  {reception.product_sku}
                </p>
                {/* Barre de progression */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {progressPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-3 border-l-4 border-l-blue-500">
                <div className="text-sm text-gray-600">Attendu</div>
                <div className="text-2xl font-bold text-blue-600">
                  {reception.quantity_expected}
                </div>
              </Card>
              <Card className="p-3 border-l-4 border-l-green-500">
                <div className="text-sm text-gray-600">Deja recu</div>
                <div className="text-2xl font-bold text-green-600">
                  {quantityAlreadyReceived}
                </div>
              </Card>
              <Card className="p-3 border-l-4 border-l-amber-500">
                <div className="text-sm text-gray-600">Restant</div>
                <div className="text-2xl font-bold text-amber-600">
                  {quantityRemaining}
                </div>
              </Card>
            </div>

            {/* Saisie quantite */}
            {quantityRemaining > 0 && (
              <div className="space-y-4">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label>Quantite a recevoir</Label>
                    <Input
                      type="number"
                      min={0}
                      max={quantityRemaining}
                      value={quantityToReceive}
                      onChange={e =>
                        setQuantityToReceive(
                          Math.min(
                            Math.max(0, Number(e.target.value)),
                            quantityRemaining
                          )
                        )
                      }
                      className="mt-1 text-lg"
                    />
                  </div>
                  <ButtonV2 variant="outline" onClick={handleReceiveAll}>
                    Tout recevoir ({quantityRemaining})
                  </ButtonV2>
                </div>

                <div>
                  <Label>Notes (optionnel)</Label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Notes de reception..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {/* Indication partiel/complet */}
                {quantityToReceive > 0 && (
                  <div className="flex items-center gap-2">
                    {willBeComplete ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 font-medium">
                          Reception complete
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <span className="text-amber-700 font-medium">
                          Reception partielle -{' '}
                          {quantityRemaining - quantityToReceive} unite(s)
                          resteront en previsionnel
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Message si tout recu */}
            {quantityRemaining === 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 font-medium">
                    Reception complete - Toutes les unites ont ete recues
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              {/* Bouton annuler reliquat (a gauche) */}
              <div>
                {quantityRemaining > 0 && (
                  <ButtonV2
                    variant="outline"
                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={validating}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {quantityAlreadyReceived === 0
                      ? `Annuler reception (${quantityRemaining})`
                      : `Annuler reliquat (${quantityRemaining})`}
                  </ButtonV2>
                )}
              </div>

              {/* Boutons principaux (a droite) */}
              <div className="flex gap-3">
                <ButtonV2
                  variant="outline"
                  onClick={onClose}
                  disabled={validating}
                >
                  Fermer
                </ButtonV2>
                {quantityRemaining > 0 && (
                  <ButtonV2
                    onClick={handleConfirmReception}
                    disabled={validating || quantityToReceive <= 0}
                    className="bg-verone-success hover:bg-verone-success/90"
                  >
                    {validating
                      ? 'Validation...'
                      : willBeComplete
                        ? 'Valider Reception Complete'
                        : 'Valider Reception Partielle'}
                  </ButtonV2>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
