'use client';

import { Building2, User } from 'lucide-react';

import type {
  EnseigneOrganisationCustomer,
  EnseigneIndividualCustomer,
} from '../../../hooks/linkme/use-linkme-enseigne-customers';
import type { CustomerType } from './types';

type AnyCustomer = EnseigneOrganisationCustomer | EnseigneIndividualCustomer;

interface CustomerSummaryCardProps {
  customer: AnyCustomer;
  customerType: CustomerType;
  onDeselect: () => void;
}

export function CustomerSummaryCard({
  customer,
  customerType,
  onDeselect,
}: CustomerSummaryCardProps) {
  const displayName =
    customerType === 'organization'
      ? ((customer as EnseigneOrganisationCustomer).name ??
        (customer as EnseigneOrganisationCustomer).legal_name)
      : (customer as EnseigneIndividualCustomer).full_name;

  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            {customerType === 'organization' ? (
              <Building2 className="h-5 w-5 text-purple-600" />
            ) : (
              <User className="h-5 w-5 text-purple-600" />
            )}
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-purple-900">{displayName}</p>
            {'email' in customer && customer.email && (
              <p className="text-sm text-purple-700">📧 {customer.email}</p>
            )}
            {'phone' in customer && customer.phone && (
              <p className="text-sm text-purple-700">📞 {customer.phone}</p>
            )}
            {'address_line1' in customer &&
              (customer.address_line1 ?? customer.city) && (
                <p className="text-sm text-purple-700">
                  📍{' '}
                  {[customer.address_line1, customer.postal_code, customer.city]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
          </div>
        </div>
        <button
          onClick={onDeselect}
          className="text-xs text-purple-600 hover:text-purple-800 underline"
        >
          Modifier
        </button>
      </div>
    </div>
  );
}
