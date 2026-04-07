'use client';

import {
  CustomerSelector,
  type UnifiedCustomer,
} from '@verone/orders/components/modals/customer-selector';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';

interface QuoteCustomerCardProps {
  selectedCustomer: UnifiedCustomer | null;
  onCustomerChange: (customer: UnifiedCustomer | null) => void;
  enseigneId?: string | null;
}

export function QuoteCustomerCard({
  selectedCustomer,
  onCustomerChange,
  enseigneId,
}: QuoteCustomerCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Client</CardTitle>
      </CardHeader>
      <CardContent>
        <CustomerSelector
          selectedCustomer={selectedCustomer}
          onCustomerChange={onCustomerChange}
          enseigneId={enseigneId ?? undefined}
        />
        {selectedCustomer?.type === 'professional' && (
          <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm space-y-1">
            {selectedCustomer.legal_name && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 min-w-[120px]">
                  Raison sociale :
                </span>
                <span className="font-medium">
                  {selectedCustomer.legal_name}
                </span>
              </div>
            )}
            {selectedCustomer.trade_name &&
              selectedCustomer.trade_name !== selectedCustomer.legal_name && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 min-w-[120px]">
                    Nom commercial :
                  </span>
                  <span className="font-medium">
                    {selectedCustomer.trade_name}
                  </span>
                </div>
              )}
            {selectedCustomer.siret && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 min-w-[120px]">SIRET :</span>
                <span className="font-mono text-xs">
                  {selectedCustomer.siret}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
