'use client';

import { useState, useEffect } from 'react';

import { useToast } from '@verone/common';
import {
  Alert,
  AlertDescription,
  ButtonV2,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@verone/ui';

import { useShipmentEdit } from '@verone/orders/hooks/use-sales-shipments/use-shipment-edit';

interface EditShipmentModalProps {
  shipment: {
    id: string;
    delivery_method: string | null;
    carrier_name?: string | null;
    tracking_number?: string | null;
    tracking_url?: string | null;
    shipping_cost?: number | null;
    notes?: string | null;
  };
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditShipmentModal({
  shipment,
  open,
  onClose,
  onSuccess,
}: EditShipmentModalProps) {
  const { toast } = useToast();
  const { updating, updateShipment } = useShipmentEdit();

  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [notes, setNotes] = useState('');

  const isManual = shipment.delivery_method === 'manual';

  // Synchroniser les champs avec le shipment à l'ouverture
  useEffect(() => {
    if (open) {
      setCarrierName(shipment.carrier_name ?? '');
      setTrackingNumber(shipment.tracking_number ?? '');
      setTrackingUrl(shipment.tracking_url ?? '');
      setShippingCost(
        shipment.shipping_cost != null ? String(shipment.shipping_cost) : ''
      );
      setNotes(shipment.notes ?? '');
    }
  }, [open, shipment]);

  const handleSave = () => {
    const costValue =
      shippingCost !== '' ? parseFloat(shippingCost) : undefined;

    void updateShipment({
      shipment_id: shipment.id,
      carrier_name: carrierName || undefined,
      tracking_number: trackingNumber || undefined,
      tracking_url: trackingUrl || undefined,
      shipping_cost: costValue,
      notes: notes || undefined,
    })
      .then(result => {
        if (result.success) {
          toast({
            title: 'Expédition mise à jour',
            description: 'Les informations ont été sauvegardées.',
          });
          onSuccess?.();
          onClose();
        } else {
          toast({
            title: 'Erreur',
            description: result.error ?? 'Une erreur est survenue.',
            variant: 'destructive',
          });
        }
      })
      .catch(err => {
        console.error('[EditShipmentModal] handleSave:', err);
        toast({
          title: 'Erreur',
          description: 'Une erreur inattendue est survenue.',
          variant: 'destructive',
        });
      });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;expédition</DialogTitle>
          <DialogDescription>
            Mise à jour des informations transporteur et suivi.
          </DialogDescription>
        </DialogHeader>

        {!isManual ? (
          <Alert variant="destructive">
            <AlertDescription>
              L&apos;édition est impossible : seules les expéditions manuelles
              peuvent être modifiées. Cette expédition utilise le mode «{' '}
              {shipment.delivery_method ?? 'inconnu'} ».
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="carrier-name">Transporteur</Label>
              <Input
                id="carrier-name"
                value={carrierName}
                onChange={e => setCarrierName(e.target.value)}
                placeholder="ex: Colissimo, DHL, Chronopost..."
                disabled={updating}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tracking-number">Numéro de suivi</Label>
              <Input
                id="tracking-number"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="ex: 6A23456789012"
                disabled={updating}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tracking-url">URL de suivi</Label>
              <Input
                id="tracking-url"
                type="url"
                value={trackingUrl}
                onChange={e => setTrackingUrl(e.target.value)}
                placeholder="https://..."
                disabled={updating}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="shipping-cost">
                Coût transport Vérone (€ HT)
              </Label>
              <Input
                id="shipping-cost"
                type="number"
                min="0"
                step="0.01"
                value={shippingCost}
                onChange={e => setShippingCost(e.target.value)}
                placeholder="0.00"
                disabled={updating}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Informations complémentaires..."
                disabled={updating}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <ButtonV2 variant="ghost" onClick={onClose} disabled={updating}>
                Annuler
              </ButtonV2>
              <ButtonV2 onClick={handleSave} disabled={updating}>
                {updating ? 'Sauvegarde...' : 'Sauvegarder'}
              </ButtonV2>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
