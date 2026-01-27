'use client';

/**
 * QuickEditShippingAddressModal
 *
 * Modal dédié pour modifier l'adresse de livraison d'une organisation
 * Utilise AddressAutocomplete avec géocodage automatique
 *
 * @module QuickEditShippingAddressModal
 * @since 2026-01-12
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AddressAutocomplete,
  type AddressResult,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Loader2, Truck } from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface QuickEditShippingAddressModalProps {
  organisationId: string;
  organisationName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function QuickEditShippingAddressModal({
  organisationId,
  organisationName,
  isOpen,
  onClose,
  onSuccess,
}: QuickEditShippingAddressModalProps) {
  const queryClient = useQueryClient();

  // Mutation pour mise à jour
  const updateMutation = useMutation({
    mutationFn: async (address: AddressResult) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('organisations')
        .update({
          shipping_address_line1: address.streetAddress,
          shipping_city: address.city,
          shipping_postal_code: address.postalCode,
          shipping_country: address.country,
          // Mise à jour des coordonnées GPS
          latitude: address.latitude,
          longitude: address.longitude,
        })
        .eq('id', organisationId);

      if (error) throw error;
      return address;
    },
    onSuccess: async address => {
      await queryClient.invalidateQueries({
        queryKey: ['enseigne-organisations'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['organisation-detail', organisationId],
      });
      toast.success(`Adresse de livraison mise à jour : ${address.city}`);
      onSuccess?.();
      onClose();
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour de l'adresse");
    },
  });

  const handleAddressSelect = (address: AddressResult) => {
    updateMutation.mutate(address);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Truck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <DialogTitle>Adresse de livraison</DialogTitle>
              <DialogDescription className="text-sm">
                {organisationName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Recherchez et sélectionnez l&apos;adresse de livraison du
            restaurant.
          </p>

          <AddressAutocomplete
            placeholder="Ex: 15 rue de la Paix, Paris..."
            onSelect={handleAddressSelect}
            disabled={updateMutation.isPending}
          />

          {updateMutation.isPending && (
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Enregistrement en cours...</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
