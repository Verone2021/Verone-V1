'use client';

import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Loader2 } from 'lucide-react';

import type { QuoteFormModalProps } from './types';
import { useQuoteForm } from './use-quote-form';
import { QuoteFormContent } from './QuoteFormContent';

export function QuoteFormModal({
  open,
  onOpenChange,
  onSuccess,
}: QuoteFormModalProps) {
  const form = useQuoteForm(open, onOpenChange, onSuccess);

  return (
    <Dialog open={open} onOpenChange={form.handleClose}>
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-4xl md:max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Devis de service</DialogTitle>
          <DialogDescription>
            Creer un devis pour des prestations de service (lignes libres)
          </DialogDescription>
        </DialogHeader>

        <QuoteFormContent
          selectedCustomer={form.selectedCustomer}
          onCustomerChange={form.handleCustomerChange}
          items={form.items}
          onAddServiceLine={form.handleAddServiceLine}
          onRemoveItem={form.handleRemoveItem}
          onItemChange={form.handleItemChange}
          validityDays={form.validityDays}
          onValidityDaysChange={form.setValidityDays}
          reference={form.reference}
          onReferenceChange={form.setReference}
          shippingCostHt={form.shippingCostHt}
          onShippingChange={form.setShippingCostHt}
          handlingCostHt={form.handlingCostHt}
          onHandlingChange={form.setHandlingCostHt}
          insuranceCostHt={form.insuranceCostHt}
          onInsuranceChange={form.setInsuranceCostHt}
          feesVatRate={form.feesVatRate}
          onFeesVatRateChange={form.setFeesVatRate}
          billingAddress={form.billingAddress}
          onBillingAddressChange={form.setBillingAddress}
          shippingAddress={form.shippingAddress}
          onShippingAddressChange={form.setShippingAddress}
          notes={form.notes}
          onNotesChange={form.setNotes}
          totals={form.totals}
        />

        <DialogFooter className="mt-6 flex-shrink-0 flex-col gap-2 md:flex-row">
          <ButtonV2
            type="button"
            variant="outline"
            className="w-full md:w-auto"
            onClick={form.handleClose}
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            type="button"
            className="w-full md:w-auto"
            onClick={() => {
              void form.handleSubmit().catch((err: unknown) => {
                console.error('[QuoteFormModal] submit error:', err);
              });
            }}
            disabled={
              form.isSubmitting ||
              !form.selectedCustomer ||
              form.items.length === 0
            }
          >
            {form.isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creation...
              </>
            ) : (
              'Enregistrer le brouillon'
            )}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
