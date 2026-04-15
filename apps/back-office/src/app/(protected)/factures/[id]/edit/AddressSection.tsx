'use client';

import { Button, Input } from '@verone/ui';
import { Copy } from 'lucide-react';

import type { IAddress } from './types';

interface AddressSectionProps {
  billingAddress: IAddress;
  shippingAddress: IAddress;
  onBillingChange: (update: Partial<IAddress>) => void;
  onShippingChange: (update: Partial<IAddress>) => void;
  onCopyBillingToShipping: () => void;
}

export function AddressSection({
  billingAddress,
  shippingAddress,
  onBillingChange,
  onShippingChange,
  onCopyBillingToShipping,
}: AddressSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Adresse de facturation</h4>
        <div className="space-y-2">
          <Input
            placeholder="Rue"
            value={billingAddress.street}
            onChange={e => onBillingChange({ street: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Code postal"
              value={billingAddress.zip_code}
              onChange={e => onBillingChange({ zip_code: e.target.value })}
            />
            <Input
              placeholder="Ville"
              value={billingAddress.city}
              onChange={e => onBillingChange({ city: e.target.value })}
            />
          </div>
          <Input
            placeholder="Pays"
            value={billingAddress.country}
            onChange={e => onBillingChange({ country: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Adresse de livraison</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={onCopyBillingToShipping}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copier facturation
          </Button>
        </div>
        <div className="space-y-2">
          <Input
            placeholder="Rue"
            value={shippingAddress.street}
            onChange={e => onShippingChange({ street: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Code postal"
              value={shippingAddress.zip_code}
              onChange={e => onShippingChange({ zip_code: e.target.value })}
            />
            <Input
              placeholder="Ville"
              value={shippingAddress.city}
              onChange={e => onShippingChange({ city: e.target.value })}
            />
          </div>
          <Input
            placeholder="Pays"
            value={shippingAddress.country}
            onChange={e => onShippingChange({ country: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
