'use client';

import { Badge } from '@verone/ui';
import { MapPin } from 'lucide-react';

import type { CustomerAddress } from '../../hooks/use-customer-detail';

interface Props {
  addresses: CustomerAddress[];
  isLoading: boolean;
}

export function CustomerAddressesTab({ addresses, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <p className="text-center text-sm text-gray-500 py-6">
        Aucune adresse enregistree.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.map(addr => (
        <div
          key={addr.id}
          className="bg-white border rounded-lg px-4 py-3 space-y-1"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {addr.label ?? 'Adresse'}
              </span>
            </div>
            {addr.is_default && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 text-xs"
              >
                Par defaut
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 pl-6">
            {addr.first_name} {addr.last_name}
          </p>
          <p className="text-sm text-gray-600 pl-6">{addr.address}</p>
          <p className="text-sm text-gray-600 pl-6">
            {addr.postal_code} {addr.city}
            {addr.country && addr.country !== 'FR' ? `, ${addr.country}` : ''}
          </p>
          {addr.phone && (
            <p className="text-xs text-gray-500 pl-6">{addr.phone}</p>
          )}
        </div>
      ))}
    </div>
  );
}
