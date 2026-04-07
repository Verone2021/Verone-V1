'use client';

import { Badge } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Calendar, Truck, Package, FileText, User, MapPin } from 'lucide-react';

import type { SalesOrder } from '@verone/orders/hooks';

import {
  buildOrgBillingAddress,
  buildOrgShippingAddress,
  getEffectiveAddress,
  isSameFormattedAddress,
} from './address-utils';

function formatDate(date: string | null): string {
  if (!date) return 'Non définie';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export interface OrderCustomerCardProps {
  order: SalesOrder;
  onShowOrgModal: () => void;
}

export function OrderCustomerCard({
  order,
  onShowOrgModal,
}: OrderCustomerCardProps) {
  const getCustomerName = () => {
    if (order.customer_type === 'organization' && order.organisations) {
      return order.organisations.trade_name ?? order.organisations.legal_name;
    } else if (
      order.customer_type === 'individual' &&
      order.individual_customers
    ) {
      const customer = order.individual_customers;
      return `${customer.first_name} ${customer.last_name}`;
    }
    return 'Client inconnu';
  };

  const getCustomerType = () => {
    return order.customer_type === 'organization'
      ? 'Professionnel'
      : 'Particulier';
  };

  const org = order.organisations;
  const orgBilling = org ? buildOrgBillingAddress(org) : null;
  const orgShipping = org ? buildOrgShippingAddress(org) : null;

  const billing = getEffectiveAddress(order.billing_address, orgBilling);
  const shipping = getEffectiveAddress(order.shipping_address, orgShipping);

  const indiv = order.individual_customers;
  const indivAddress =
    order.customer_type === 'individual' && indiv?.address_line1
      ? {
          source: 'manual' as const,
          formatted: {
            lines: [indiv.address_line1, indiv.address_line2].filter(
              Boolean
            ) as string[],
            cityLine: [indiv.postal_code, indiv.city].filter(Boolean).join(' '),
          },
        }
      : null;

  const effectiveBilling = billing ?? indivAddress;
  const effectiveShipping = shipping ?? indivAddress;

  const areSame =
    !!effectiveBilling &&
    !!effectiveShipping &&
    effectiveBilling.source === effectiveShipping.source &&
    isSameFormattedAddress(
      effectiveBilling.formatted,
      effectiveShipping.formatted
    );

  const sourceLabel = (s: 'manual' | 'organisation') =>
    s === 'organisation' ? '(organisation)' : '(manuelle)';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              {order.customer_id && order.customer_type === 'organization' ? (
                <button
                  type="button"
                  onClick={onShowOrgModal}
                  className="text-left text-primary hover:underline cursor-pointer"
                >
                  {getCustomerName()}
                </button>
              ) : (
                getCustomerName()
              )}
            </CardTitle>
            <Badge variant="outline" className="mt-1 text-xs">
              {getCustomerType()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="h-3 w-3" />
          <span>Créée : {formatDate(order.created_at)}</span>
        </div>
        {order.creator && (
          <div className="flex items-center gap-2 text-gray-600">
            <User className="h-3 w-3" />
            <span>
              Par : {order.creator.first_name} {order.creator.last_name}
            </span>
          </div>
        )}
        {order.expected_delivery_date && (
          <div className="flex items-center gap-2 text-gray-600">
            <Truck className="h-3 w-3" />
            <span>Livraison : {formatDate(order.expected_delivery_date)}</span>
          </div>
        )}
        {order.shipped_at && (
          <div className="flex items-center gap-2 text-blue-600">
            <Package className="h-3 w-3" />
            <span>Expédiée : {formatDate(order.shipped_at)}</span>
          </div>
        )}
        {order.delivered_at && (
          <div className="flex items-center gap-2 text-green-600">
            <Package className="h-3 w-3" />
            <span>Livrée : {formatDate(order.delivered_at)}</span>
          </div>
        )}
        {order.customer_type === 'individual' &&
          order.individual_customers?.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <FileText className="h-3 w-3" />
              <span>{order.individual_customers.email}</span>
            </div>
          )}
        {order.customer_type === 'individual' &&
          order.individual_customers?.phone && (
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-3 w-3" />
              <span>{order.individual_customers.phone}</span>
            </div>
          )}

        {/* Adresses condensees */}
        {effectiveBilling || effectiveShipping ? (
          areSame && effectiveBilling ? (
            <div className="flex items-start gap-2 text-gray-600 pt-1 border-t mt-2">
              <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-gray-700 mb-0.5">
                  Facturation et livraison{' '}
                  {sourceLabel(effectiveBilling.source)}
                </p>
                {effectiveBilling.formatted.lines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                {effectiveBilling.formatted.cityLine && (
                  <p>{effectiveBilling.formatted.cityLine}</p>
                )}
              </div>
            </div>
          ) : (
            <>
              {effectiveBilling && (
                <div className="flex items-start gap-2 text-gray-600 pt-1 border-t mt-2">
                  <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-gray-700 mb-0.5">
                      Facturation {sourceLabel(effectiveBilling.source)}
                    </p>
                    {effectiveBilling.formatted.lines.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                    {effectiveBilling.formatted.cityLine && (
                      <p>{effectiveBilling.formatted.cityLine}</p>
                    )}
                  </div>
                </div>
              )}
              {effectiveShipping && (
                <div className="flex items-start gap-2 text-gray-600 pt-1 border-t mt-2">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-gray-700 mb-0.5">
                      Livraison {sourceLabel(effectiveShipping.source)}
                    </p>
                    {effectiveShipping.formatted.lines.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                    {effectiveShipping.formatted.cityLine && (
                      <p>{effectiveShipping.formatted.cityLine}</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
