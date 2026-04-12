'use client';

import { AddressInput } from '@verone/common/components/address/AddressInput';
import type { UnifiedCustomer } from '@verone/orders/components/modals/customer-selector';
import { Label, Textarea } from '@verone/ui';

import type { QuoteItemLocal, QuoteTotals } from './types';
import { QuoteCustomerCard } from './QuoteCustomerCard';
import { QuoteItemsCard } from './QuoteItemsCard';
import { QuoteOptionsFeesCard } from './QuoteOptionsFeesCard';
import { QuoteTotalsCard } from './QuoteTotalsCard';

interface QuoteFormContentProps {
  // Customer
  selectedCustomer: UnifiedCustomer | null;
  onCustomerChange: (customer: UnifiedCustomer | null) => void;

  // Items
  items: QuoteItemLocal[];
  onAddServiceLine: () => void;
  onRemoveItem: (id: string) => void;
  onItemChange: (
    id: string,
    field: keyof QuoteItemLocal,
    value: string | number
  ) => void;

  // Options & Fees
  validityDays: string;
  onValidityDaysChange: (v: string) => void;
  reference: string;
  onReferenceChange: (v: string) => void;
  shippingCostHt: number;
  onShippingChange: (v: number) => void;
  handlingCostHt: number;
  onHandlingChange: (v: number) => void;
  insuranceCostHt: number;
  onInsuranceChange: (v: number) => void;
  feesVatRate: number;
  onFeesVatRateChange: (v: number) => void;

  // Addresses
  billingAddress: string;
  onBillingAddressChange: (v: string) => void;
  shippingAddress: string;
  onShippingAddressChange: (v: string) => void;

  // Notes
  notes: string;
  onNotesChange: (v: string) => void;

  // Totals
  totals: QuoteTotals;
}

export function QuoteFormContent({
  selectedCustomer,
  onCustomerChange,
  items,
  onAddServiceLine,
  onRemoveItem,
  onItemChange,
  validityDays,
  onValidityDaysChange,
  reference,
  onReferenceChange,
  shippingCostHt,
  onShippingChange,
  handlingCostHt,
  onHandlingChange,
  insuranceCostHt,
  onInsuranceChange,
  feesVatRate,
  onFeesVatRateChange,
  billingAddress,
  onBillingAddressChange,
  shippingAddress,
  onShippingAddressChange,
  notes,
  onNotesChange,
  totals,
}: QuoteFormContentProps) {
  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="space-y-6">
        <QuoteCustomerCard
          selectedCustomer={selectedCustomer}
          onCustomerChange={onCustomerChange}
        />

        <QuoteItemsCard
          items={items}
          onAddServiceLine={onAddServiceLine}
          onRemoveItem={onRemoveItem}
          onItemChange={onItemChange}
        />

        <QuoteOptionsFeesCard
          validityDays={validityDays}
          onValidityDaysChange={onValidityDaysChange}
          reference={reference}
          onReferenceChange={onReferenceChange}
          shippingCostHt={shippingCostHt}
          onShippingChange={onShippingChange}
          handlingCostHt={handlingCostHt}
          onHandlingChange={onHandlingChange}
          insuranceCostHt={insuranceCostHt}
          onInsuranceChange={onInsuranceChange}
          feesVatRate={feesVatRate}
          onFeesVatRateChange={onFeesVatRateChange}
        />

        <div className="grid grid-cols-2 gap-4">
          <AddressInput
            label="Adresse de facturation"
            value={billingAddress}
            onChange={onBillingAddressChange}
            placeholder="Adresse de facturation..."
            selectedCustomer={selectedCustomer ?? undefined}
            addressType="billing"
          />
          <AddressInput
            label="Adresse de livraison"
            value={shippingAddress}
            onChange={onShippingAddressChange}
            placeholder="Adresse de livraison..."
            selectedCustomer={selectedCustomer ?? undefined}
            addressType="shipping"
          />
        </div>

        <div>
          <Label className="text-xs">Notes (optionnel)</Label>
          <Textarea
            placeholder="Notes internes ou conditions particulieres..."
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            rows={3}
          />
        </div>

        <QuoteTotalsCard totals={totals} feesVatRate={feesVatRate} />
      </div>
    </div>
  );
}
