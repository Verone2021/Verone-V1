'use client';

import { AddProductToOrderModal } from '@verone/orders/components/modals/AddProductToOrderModal';
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
import { QuoteChannelStep } from './QuoteChannelStep';
import { QuoteFormContent } from './QuoteFormContent';
import { QuoteLinkmeAffiliateStep } from './QuoteLinkmeAffiliateStep';
import { QuoteLinkmeSelectionStep } from './QuoteLinkmeSelectionStep';

export function QuoteFormModal({
  open,
  onOpenChange,
  onSuccess,
}: QuoteFormModalProps) {
  const form = useQuoteForm(open, onOpenChange, onSuccess);

  const dialogTitle =
    form.wizardStep === 'channel-selection'
      ? 'Nouveau Devis'
      : form.wizardStep === 'linkme-affiliate'
        ? "Devis LinkMe — Choix de l'affilié"
        : form.wizardStep === 'linkme-selection'
          ? 'Devis LinkMe — Choix de la sélection'
          : `Devis ${form.channelLabel}`;

  const dialogDescription =
    form.wizardStep === 'channel-selection'
      ? 'Sélectionnez le type de devis à créer'
      : form.wizardStep === 'linkme-affiliate'
        ? "Sélectionnez l'affilié LinkMe pour ce devis"
        : form.wizardStep === 'linkme-selection'
          ? 'Sélectionnez la sélection de produits'
          : form.isServiceMode
            ? 'Créer un devis pour des prestations de service'
            : `Créer un devis ${form.channelLabel} avec produits du catalogue`;

  const enseigneId = form.isLinkMeMode
    ? (form.linkmeAffiliates?.find(a => a.id === form.selectedAffiliateId)
        ?.enseigne_id ?? null)
    : null;

  return (
    <Dialog open={open} onOpenChange={form.handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        {form.wizardStep === 'channel-selection' && (
          <QuoteChannelStep onSelect={form.handleChannelSelect} />
        )}

        {form.wizardStep === 'linkme-affiliate' && (
          <QuoteLinkmeAffiliateStep
            affiliates={form.linkmeAffiliates}
            affiliateSearch={form.affiliateSearch}
            onAffiliateSearchChange={form.setAffiliateSearch}
            onAffiliateSelect={id => {
              form.setSelectedAffiliateId(id);
              form.setWizardStep('linkme-selection');
            }}
            onBack={form.handleBackToChannelSelection}
          />
        )}

        {form.wizardStep === 'linkme-selection' && (
          <QuoteLinkmeSelectionStep
            selections={form.linkmeSelections}
            onSelectionSelect={id => {
              form.setSelectedSelectionId(id);
              form.setWizardStep('form');
            }}
            onBack={form.handleBackFromLinkmeSelection}
          />
        )}

        {form.wizardStep === 'form' && (
          <>
            <QuoteFormContent
              onBack={form.handleBackFromForm}
              selectedCustomer={form.selectedCustomer}
              onCustomerChange={form.handleCustomerChange}
              enseigneId={enseigneId}
              isLinkMeMode={form.isLinkMeMode}
              isServiceMode={form.isServiceMode}
              linkmeSelectionName={
                form.linkmeSelectionDetails?.name ?? undefined
              }
              linkmeSelectionItems={
                form.isLinkMeMode && form.linkmeSelectionDetails
                  ? (form.linkmeSelectionDetails.items ?? [])
                  : undefined
              }
              onAddLinkMeProduct={form.handleAddLinkMeProduct}
              items={form.items}
              onAddServiceLine={form.handleAddServiceLine}
              onOpenAddProduct={() => form.setShowAddProduct(true)}
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

            <DialogFooter className="mt-6 flex-shrink-0">
              <ButtonV2
                type="button"
                variant="outline"
                onClick={form.handleClose}
              >
                Annuler
              </ButtonV2>
              <ButtonV2
                type="button"
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
                    Création...
                  </>
                ) : (
                  'Enregistrer le brouillon'
                )}
              </ButtonV2>
            </DialogFooter>
          </>
        )}

        {/* AddProductToOrderModal rendered outside wizardStep conditional */}
        {!form.isServiceMode && !form.isLinkMeMode && (
          <AddProductToOrderModal
            open={form.showAddProduct}
            onClose={() => form.setShowAddProduct(false)}
            orderType="sales"
            onAdd={form.handleAddProduct}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
