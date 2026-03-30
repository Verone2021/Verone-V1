'use client';

import { MapPin } from 'lucide-react';

import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';
import type { OrderWithDetails } from './types';

interface RestaurantAddressButtonProps {
  org: OrderWithDetails['organisation'];
  setEditForm: React.Dispatch<
    React.SetStateAction<Partial<LinkMeOrderDetails>>
  >;
}

export function RestaurantAddressButton({
  org,
  setEditForm,
}: RestaurantAddressButtonProps) {
  if (!org || !(org.address_line1 ?? org.shipping_address_line1)) return null;
  const useShipping = org.has_different_shipping_address;
  const addressLine = useShipping
    ? [org.shipping_address_line1, org.shipping_address_line2]
        .filter(Boolean)
        .join(', ')
    : [org.address_line1, org.address_line2].filter(Boolean).join(', ');
  const cityLine = useShipping
    ? [org.shipping_postal_code, org.shipping_city].filter(Boolean).join(' ')
    : [org.postal_code, org.city].filter(Boolean).join(' ');
  return (
    <button
      type="button"
      className="w-full text-left p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 transition-colors"
      onClick={() => {
        setEditForm(prev => ({
          ...prev,
          delivery_address: addressLine,
          delivery_postal_code: useShipping
            ? (org.shipping_postal_code ?? '')
            : (org.postal_code ?? ''),
          delivery_city: useShipping
            ? (org.shipping_city ?? '')
            : (org.city ?? ''),
        }));
      }}
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
      <p className="text-sm text-gray-600">{addressLine}</p>
      <p className="text-sm text-gray-600">{cityLine}</p>
    </button>
  );
}
