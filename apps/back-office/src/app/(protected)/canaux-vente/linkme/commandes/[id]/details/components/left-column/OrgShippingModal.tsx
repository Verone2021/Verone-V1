'use client';

import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { AddressAutocomplete } from '@verone/ui';
import type { AddressResult } from '@verone/ui';
import { useToast } from '@verone/common/hooks';
import { Loader2, MapPin, Truck } from 'lucide-react';

interface OrgShippingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  orgDisplayName: string;
  onUpdateOrganisation: (
    orgId: string,
    updates: Record<string, unknown>
  ) => Promise<void>;
}

export function OrgShippingModal({
  open,
  onOpenChange,
  orgId,
  orgDisplayName,
  onUpdateOrganisation,
}: OrgShippingModalProps) {
  const { toast } = useToast();
  const [shippingInput, setShippingInput] = useState('');
  const [shippingResolved, setShippingResolved] = useState<{
    address_line1: string;
    postal_code: string;
    city: string;
    country: string;
  } | null>(null);
  const [savingShipping, setSavingShipping] = useState(false);

  const handleAddressSelect = (result: AddressResult) => {
    setShippingResolved({
      address_line1: result.streetAddress,
      postal_code: result.postalCode,
      city: result.city,
      country: result.countryCode ?? 'FR',
    });
  };

  const handleSaveShipping = async () => {
    if (!shippingResolved) return;

    setSavingShipping(true);
    try {
      await onUpdateOrganisation(orgId, {
        shipping_address_line1: shippingResolved.address_line1,
        shipping_postal_code: shippingResolved.postal_code,
        shipping_city: shippingResolved.city,
        shipping_country: shippingResolved.country,
        has_different_shipping_address: true,
      });
      toast({
        title: 'Adresse de livraison mise à jour',
        description: `${shippingResolved.address_line1}, ${shippingResolved.city}`,
      });
      onOpenChange(false);
      setShippingInput('');
      setShippingResolved(null);
    } catch (err) {
      toast({
        title: 'Erreur',
        description:
          err instanceof Error
            ? err.message
            : "Impossible de sauvegarder l'adresse",
        variant: 'destructive',
      });
    } finally {
      setSavingShipping(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Modifier l&apos;adresse de livraison
          </DialogTitle>
          <DialogDescription>
            {orgDisplayName} — adresse de livraison enregistrée pour les
            prochains devis
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <AddressAutocomplete
            value={shippingInput}
            onChange={setShippingInput}
            onSelect={handleAddressSelect}
            placeholder="Rechercher une adresse..."
            id="org-shipping-autocomplete"
          />
          {shippingResolved && (
            <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
              <div>
                <p>{shippingResolved.address_line1}</p>
                <p>
                  {[shippingResolved.postal_code, shippingResolved.city]
                    .filter(Boolean)
                    .join(' ')}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => void handleSaveShipping()}
            disabled={savingShipping || !shippingResolved}
          >
            {savingShipping ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
