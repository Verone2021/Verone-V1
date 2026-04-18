'use client';

import { useState, useCallback } from 'react';
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
  Separator,
  AddressAutocomplete,
  type AddressResult,
} from '@verone/ui';
import { Building2, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@verone/utils/supabase/client';

import { useUpdateLinkMeDetails } from '../../hooks/use-linkme-order-actions';
import type { OrderWithMissing } from './types';

interface AddressEditDialogProps {
  order: OrderWithMissing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddressEditDialog({
  order,
  open,
  onOpenChange,
}: AddressEditDialogProps) {
  const queryClient = useQueryClient();
  const updateDetails = useUpdateLinkMeDetails();

  const [addressForm, setAddressForm] = useState({
    delivery_address: order.details?.delivery_address ?? '',
    delivery_postal_code: order.details?.delivery_postal_code ?? '',
    delivery_city: order.details?.delivery_city ?? '',
  });

  // Fetch org address on demand for "Utiliser adresse restaurant" button
  const { data: orgAddress } = useQuery({
    queryKey: ['org-address', order.organisationId],
    queryFn: async () => {
      if (!order.organisationId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organisations')
        .select('address_line1, postal_code, city')
        .eq('id', order.organisationId)
        .single();
      if (error) return null;
      return data as {
        address_line1: string | null;
        postal_code: string | null;
        city: string | null;
      };
    },
    enabled: open && !!order.organisationId,
  });

  const handleAddressSelect = useCallback((addr: AddressResult) => {
    setAddressForm({
      delivery_address: addr.streetAddress,
      delivery_postal_code: addr.postalCode,
      delivery_city: addr.city,
    });
  }, []);

  const handleUseOrgAddress = useCallback(() => {
    if (!orgAddress) return;
    setAddressForm({
      delivery_address: orgAddress.address_line1 ?? '',
      delivery_postal_code: orgAddress.postal_code ?? '',
      delivery_city: orgAddress.city ?? '',
    });
  }, [orgAddress]);

  const handleSave = useCallback(async () => {
    await updateDetails.mutateAsync({
      orderId: order.id,
      updates: addressForm,
    });
    await queryClient.invalidateQueries({
      queryKey: ['orders-missing-fields'],
    });
    toast.success('Adresse mise a jour');
    onOpenChange(false);
  }, [updateDetails, order.id, addressForm, queryClient, onOpenChange]);

  const hasOrgAddress = orgAddress?.address_line1 ?? orgAddress?.city;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adresse de livraison</DialogTitle>
          <DialogDescription>
            {order.order_number} — {order.organisationName ?? '-'}
            <br />
            Recherchez une adresse ou saisissez-la manuellement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Button "Utiliser adresse restaurant" */}
          {hasOrgAddress && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-sm"
              onClick={handleUseOrgAddress}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Utiliser adresse restaurant
              <span className="ml-2 text-xs text-gray-400 truncate max-w-[200px]">
                ({orgAddress?.address_line1}, {orgAddress?.city})
              </span>
            </Button>
          )}

          {/* AddressAutocomplete */}
          <div className="space-y-2">
            <Label>Recherche d&apos;adresse</Label>
            <AddressAutocomplete
              value=""
              onSelect={handleAddressSelect}
              placeholder="Tapez une adresse pour rechercher..."
            />
          </div>

          <Separator />

          {/* Manual fields */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={addressForm.delivery_address}
                onChange={e =>
                  setAddressForm(prev => ({
                    ...prev,
                    delivery_address: e.target.value,
                  }))
                }
                placeholder="15 rue de la Paix"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code postal</Label>
                <Input
                  value={addressForm.delivery_postal_code}
                  onChange={e =>
                    setAddressForm(prev => ({
                      ...prev,
                      delivery_postal_code: e.target.value,
                    }))
                  }
                  placeholder="75001"
                />
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input
                  value={addressForm.delivery_city}
                  onChange={e =>
                    setAddressForm(prev => ({
                      ...prev,
                      delivery_city: e.target.value,
                    }))
                  }
                  placeholder="Paris"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              void handleSave().catch(err => {
                console.error('[AddressEditDialog] save failed:', err);
              });
            }}
            disabled={updateDetails.isPending}
          >
            {updateDetails.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
