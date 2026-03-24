'use client';

import { Card, CardContent } from '@verone/ui';
import { Building2, AlertTriangle, Mail, Phone, MapPin } from 'lucide-react';

import type { OrderWithDetails } from './types';
import type { LinkMeOrderDetails } from '../../../hooks/use-linkme-order-actions';

interface RestaurantSectionProps {
  organisation: OrderWithDetails['organisation'];
  details: LinkMeOrderDetails | null;
}

export function RestaurantSection({
  organisation,
  details,
}: RestaurantSectionProps) {
  return (
    <Card>
      <CardContent className="p-4">
        {organisation ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Building2 className="h-4 w-4 text-orange-600 flex-shrink-0" />
              <span className="font-semibold text-gray-900">
                {organisation.trade_name ?? organisation.legal_name}
              </span>
              {details?.owner_type && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                    details.owner_type === 'franchise'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {details.owner_type === 'propre'
                    ? 'Propre'
                    : details.owner_type === 'succursale'
                      ? 'Succursale'
                      : details.owner_type === 'franchise'
                        ? 'Franchise'
                        : details.owner_type}
                </span>
              )}
              {details?.is_new_restaurant && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                  Nouveau
                </span>
              )}
              {organisation.approval_status === 'pending_validation' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  Validation
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {organisation.siret && <span>SIRET : {organisation.siret}</span>}
              {organisation.vat_number && (
                <span>TVA : {organisation.vat_number}</span>
              )}
              {(organisation.address_line1 ?? organisation.postal_code) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[
                    organisation.address_line1,
                    organisation.postal_code,
                    organisation.city,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              )}
              {organisation.email && (
                <a
                  href={`mailto:${organisation.email}`}
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  {organisation.email}
                </a>
              )}
              {organisation.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {organisation.phone}
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Organisation non renseignee</p>
        )}
      </CardContent>
    </Card>
  );
}
