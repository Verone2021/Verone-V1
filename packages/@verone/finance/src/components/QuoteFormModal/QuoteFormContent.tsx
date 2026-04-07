'use client';

import { AddressInput } from '@verone/common/components/address/AddressInput';
import type { UnifiedCustomer } from '@verone/orders/components/modals/customer-selector';
import type { SelectionItem } from '@verone/orders/hooks';
import { ButtonV2, Label, Textarea } from '@verone/ui';
import { ArrowLeft } from 'lucide-react';

import type { QuoteItemLocal, QuoteTotals } from './types';
import { QuoteCustomerCard } from './QuoteCustomerCard';
import { QuoteItemsCard } from './QuoteItemsCard';
import { QuoteLinkmeProductsCard } from './QuoteLinkmeProductsCard';
import { QuoteOptionsFeesCard } from './QuoteOptionsFeesCard';
import { QuoteTotalsCard } from './QuoteTotalsCard';

interface QuoteFormContentProps {
  // Navigation
  onBack: () => void;

  // Customer
  selectedCustomer: UnifiedCustomer | null;
  onCustomerChange: (customer: UnifiedCustomer | null) => void;
  enseigneId?: string | null;

  // LinkMe
  isLinkMeMode: boolean;
  isServiceMode: boolean;
  linkmeSelectionName?: string;
  linkmeSelectionItems?: SelectionItem[];
  onAddLinkMeProduct: (item: SelectionItem) => void;

  // Items
  items: QuoteItemLocal[];
  onAddServiceLine: () => void;
  onOpenAddProduct: () => void;
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
  onBack,
  selectedCustomer,
  onCustomerChange,
  enseigneId,
  isLinkMeMode,
  isServiceMode,
  linkmeSelectionName,
  linkmeSelectionItems,
  onAddLinkMeProduct,
  items,
  onAddServiceLine,
  onOpenAddProduct,
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
    <>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="mb-4">
          <ButtonV2
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </ButtonV2>
        </div>

        <div className="space-y-6">
          <QuoteCustomerCard
            selectedCustomer={selectedCustomer}
            onCustomerChange={onCustomerChange}
            enseigneId={enseigneId}
          />

          {isLinkMeMode &&
            linkmeSelectionName !== undefined &&
            linkmeSelectionItems !== undefined && (
              <QuoteLinkmeProductsCard
                selectionName={linkmeSelectionName}
                items={linkmeSelectionItems}
                addedProductIds={items.map(i => i.product_id)}
                onAddProduct={onAddLinkMeProduct}
              />
            )}

          <QuoteItemsCard
            items={items}
            isServiceMode={isServiceMode}
            isLinkMeMode={isLinkMeMode}
            onAddServiceLine={onAddServiceLine}
            onOpenAddProduct={onOpenAddProduct}
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
              placeholder="Notes internes ou conditions particulières..."
              value={notes}
              onChange={e => onNotesChange(e.target.value)}
              rows={3}
            />
          </div>

          <QuoteTotalsCard totals={totals} feesVatRate={feesVatRate} />
        </div>
      </div>
    </>
  );
}
