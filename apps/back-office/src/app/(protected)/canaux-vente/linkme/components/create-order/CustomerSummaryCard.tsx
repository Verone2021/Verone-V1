'use client';

import { Building2, User } from 'lucide-react';
import type { CustomerType } from '../../hooks/use-create-linkme-order-form';
import type {
  EnseigneOrganisationCustomer,
  EnseigneIndividualCustomer,
} from '../../hooks/use-linkme-enseigne-customers';

interface CustomerSummaryCardProps {
  customerType: CustomerType;
  selectedCustomer: EnseigneOrganisationCustomer | EnseigneIndividualCustomer;
  onClear: () => void;
}

export function CustomerSummaryCard({
  customerType,
  selectedCustomer,
  onClear,
}: CustomerSummaryCardProps) {
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
            <p className="font-semibold text-purple-900">
              {customerType === 'organization'
                ? ((selectedCustomer as EnseigneOrganisationCustomer).name ??
                  (selectedCustomer as EnseigneOrganisationCustomer).legal_name)
                : (selectedCustomer as EnseigneIndividualCustomer).full_name}
            </p>
            {'email' in selectedCustomer && selectedCustomer.email && (
              <p className="text-sm text-purple-700">
                📧 {selectedCustomer.email}
              </p>
            )}
            {'phone' in selectedCustomer && selectedCustomer.phone && (
              <p className="text-sm text-purple-700">
                📞 {selectedCustomer.phone}
              </p>
            )}
            {(() => {
              const addr =
                'billing_address_line1' in selectedCustomer
                  ? (selectedCustomer.billing_address_line1 ??
                    selectedCustomer.address_line1)
                  : selectedCustomer.address_line1;
              const cp =
                'billing_postal_code' in selectedCustomer
                  ? (selectedCustomer.billing_postal_code ??
                    selectedCustomer.postal_code)
                  : selectedCustomer.postal_code;
              const ville =
                'billing_city' in selectedCustomer
                  ? (selectedCustomer.billing_city ?? selectedCustomer.city)
                  : selectedCustomer.city;
              return (addr ?? ville) ? (
                <p className="text-sm text-purple-700">
                  📍 {[addr, cp, ville].filter(Boolean).join(', ')}
                </p>
              ) : null;
            })()}
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-purple-600 hover:text-purple-800 underline"
        >
          Modifier
        </button>
      </div>
    </div>
  );
}
