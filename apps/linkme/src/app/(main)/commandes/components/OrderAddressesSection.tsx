'use client';

import { FileTextIcon, MapPinIcon, TruckIcon } from 'lucide-react';

import { Badge } from '@verone/ui';

import type { LinkMeOrder } from '../../../../hooks/use-linkme-orders';
import { formatAddress } from './order-detail.helpers';

interface OrderAddressesSectionProps {
  order: LinkMeOrder;
  isSameAddress: boolean;
  hasDeliveryTextAddress: string | null | undefined;
}

export function OrderAddressesSection({
  order,
  isSameAddress,
  hasDeliveryTextAddress,
}: OrderAddressesSectionProps) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-[#183559] mb-3">
        <MapPinIcon className="h-4 w-4 text-[#5DBEBB]" />
        Adresses
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Adresse de facturation */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileTextIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Facturation
            </span>
          </div>
          {formatAddress(order.billing_address).map((line, i) => (
            <p key={i} className="text-sm text-gray-600">
              {line}
            </p>
          ))}
          {order.billing_name && (
            <p className="text-sm text-gray-600 mt-1">
              Contact: {order.billing_name}
            </p>
          )}
          {order.billing_email && (
            <p className="text-sm text-gray-500">{order.billing_email}</p>
          )}
        </div>

        {/* Adresse de livraison */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TruckIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Livraison</span>
          </div>
          {isSameAddress && !hasDeliveryTextAddress ? (
            <p className="text-sm text-gray-500 italic">
              Identique a l&apos;adresse de facturation
            </p>
          ) : hasDeliveryTextAddress ? (
            <>
              {order.delivery_contact_name && (
                <p className="text-sm font-medium text-gray-700">
                  {order.delivery_contact_name}
                </p>
              )}
              {order.delivery_address_text && (
                <p className="text-sm text-gray-600">
                  {order.delivery_address_text}
                </p>
              )}
              {(order.delivery_postal_code ?? order.delivery_city) && (
                <p className="text-sm text-gray-600">
                  {[order.delivery_postal_code, order.delivery_city]
                    .filter(Boolean)
                    .join(' ')}
                </p>
              )}
            </>
          ) : (
            formatAddress(order.shipping_address).map((line, i) => (
              <p key={i} className="text-sm text-gray-600">
                {line}
              </p>
            ))
          )}
          {order.is_mall_delivery && (
            <Badge variant="secondary" className="mt-2 text-xs">
              Livraison en centre commercial
            </Badge>
          )}
          {order.delivery_notes && (
            <p className="text-xs text-gray-500 mt-2 italic">
              {order.delivery_notes}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
