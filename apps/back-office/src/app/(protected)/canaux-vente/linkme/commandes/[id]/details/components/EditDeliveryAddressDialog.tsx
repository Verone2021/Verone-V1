'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  AddressAutocomplete,
} from '@verone/ui';
import type { AddressResult } from '@verone/ui';
import { MapPin } from 'lucide-react';

import type { LinkMeOrderDetails } from '../../../../hooks/use-linkme-order-actions';
import type { OrderWithDetails } from './types';

interface EditDeliveryAddressDialogProps {
  open: boolean;
  onClose: () => void;
  order: OrderWithDetails;
  editForm: Partial<LinkMeOrderDetails>;
  setEditForm: React.Dispatch<
    React.SetStateAction<Partial<LinkMeOrderDetails>>
  >;
  onSaveEdit: () => void;
  updateDetailsPending: boolean;
}

export function EditDeliveryAddressDialog({
  open,
  onClose,
  order,
  editForm,
  setEditForm,
  onSaveEdit,
  updateDetailsPending,
}: EditDeliveryAddressDialogProps) {
  const org = order.organisation;

  const handleUseOrgAddress = () => {
    if (!org) return;
    const useShipping = org.has_different_shipping_address;
    setEditForm(prev => ({
      ...prev,
      delivery_address: useShipping
        ? [org.shipping_address_line1, org.shipping_address_line2]
            .filter(Boolean)
            .join(', ')
        : [org.address_line1, org.address_line2].filter(Boolean).join(', '),
      delivery_postal_code:
        (useShipping ? org.shipping_postal_code : org.postal_code) ?? '',
      delivery_city: (useShipping ? org.shipping_city : org.city) ?? '',
    }));
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;adresse de livraison</DialogTitle>
          <DialogDescription>
            Modifiez l&apos;adresse ou sélectionnez celle du restaurant.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {org && (org.address_line1 ?? org.shipping_address_line1) && (
            <button
              type="button"
              className="w-full text-left p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-colors"
              onClick={handleUseOrgAddress}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  <p className="text-xs font-medium text-blue-700">
                    Adresse restaurant
                  </p>
                </div>
                <span className="text-[10px] font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                  Utiliser cette adresse
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {org.has_different_shipping_address
                  ? [org.shipping_address_line1, org.shipping_address_line2]
                      .filter(Boolean)
                      .join(', ')
                  : [org.address_line1, org.address_line2]
                      .filter(Boolean)
                      .join(', ')}
              </p>
              <p className="text-sm text-gray-600">
                {org.has_different_shipping_address
                  ? [org.shipping_postal_code, org.shipping_city]
                      .filter(Boolean)
                      .join(' ')
                  : [org.postal_code, org.city].filter(Boolean).join(' ')}
              </p>
            </button>
          )}
          <div className="space-y-2">
            <Label>Adresse</Label>
            <AddressAutocomplete
              value={editForm.delivery_address ?? ''}
              onChange={(v: string) =>
                setEditForm(prev => ({ ...prev, delivery_address: v }))
              }
              onSelect={(address: AddressResult) => {
                setEditForm(prev => ({
                  ...prev,
                  delivery_address: address.streetAddress,
                  delivery_postal_code: address.postalCode,
                  delivery_city: address.city,
                }));
              }}
              placeholder="Rechercher une adresse..."
              id="edit-delivery-address"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code postal</Label>
              <Input
                value={editForm.delivery_postal_code ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    delivery_postal_code: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input
                value={editForm.delivery_city ?? ''}
                onChange={e =>
                  setEditForm(prev => ({
                    ...prev,
                    delivery_city: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSaveEdit} disabled={updateDetailsPending}>
            {updateDetailsPending ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
