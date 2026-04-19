'use client';

import { useCallback, useEffect } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { FileText } from 'lucide-react';

import { BillingAddressEditor } from '../QuoteCreateFromOrderModal/BillingAddressEditor';
import type { IBillingAddressResolved } from '../QuoteCreateFromOrderModal/BillingAddressEditor';
import { QuoteShippingSection } from '../QuoteCreateFromOrderModal/QuoteShippingSection';
import type { IShippingAddressResolved } from '../QuoteCreateFromOrderModal/QuoteShippingSection';
import { useQuoteSiretGuard } from '../QuoteCreateFromOrderModal/useQuoteSiretGuard';

import type { IInvoiceListApiResponse } from './types';
import type { IInvoiceCreateFromOrderModalProps } from './types';
import { useInvoiceCreateState } from './useInvoiceCreateState';
import { useInvoiceActions } from './useInvoiceActions';
import { formatAmount } from './utils';
import { InvoiceSuccessView } from './InvoiceSuccessView';
import { InvoiceClientSection } from './InvoiceClientSection';
import { InvoiceInfoSection } from './InvoiceInfoSection';
import { InvoiceItemsSection } from './InvoiceItemsSection';
import { InvoiceFeesSection } from './InvoiceFeesSection';
import { InvoiceCustomLinesSection } from './InvoiceCustomLinesSection';
import { InvoiceTotalsSection } from './InvoiceTotalsSection';
import { InvoiceFooter } from './InvoiceFooter';

// ---------------------------------------------------------------------------
// Helper — résoudre l'adresse initiale depuis la commande/org
// ---------------------------------------------------------------------------

function resolveInitialBillingAddress(
  order: NonNullable<IInvoiceCreateFromOrderModalProps['order']>
): IBillingAddressResolved | null {
  const billingAddr = order.billing_address;
  const org = order.organisations;
  const line1 =
    billingAddr?.address_line1 ??
    org?.billing_address_line1 ??
    org?.address_line1;
  const postal =
    billingAddr?.postal_code ?? org?.billing_postal_code ?? org?.postal_code;
  const city = billingAddr?.city ?? org?.billing_city ?? org?.city;
  const country =
    billingAddr?.country ?? org?.billing_country ?? org?.country ?? 'FR';
  if (!city) return null;
  return {
    address_line1: line1 ?? '',
    postal_code: postal ?? '',
    city,
    country,
  };
}

export function InvoiceCreateFromOrderModal({
  order,
  open,
  onOpenChange,
  onSuccess,
}: IInvoiceCreateFromOrderModalProps): React.ReactNode {
  const state = useInvoiceCreateState(order);

  // Guard SIRET dynamique — réagit à billingOrgId (même logique que devis)
  const {
    isMissingSiret,
    siretInput,
    setSiretInput,
    savingSiret,
    handleSaveSiret,
    reset: resetSiretGuard,
  } = useQuoteSiretGuard(order, state.billingOrgId);

  const handleBillingAddressChange = useCallback(
    (addr: IBillingAddressResolved | null) => {
      if (addr) {
        state.setBillingAddress({
          address_line1: addr.address_line1,
          address_line2: '',
          postal_code: addr.postal_code,
          city: addr.city,
          country: addr.country,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleShippingAddressChange = useCallback(
    (addr: IShippingAddressResolved | null) => {
      if (addr) {
        state.setHasDifferentShipping(true);
        state.setShippingAddress({
          address_line1: addr.address_line1,
          address_line2: '',
          postal_code: addr.postal_code,
          city: addr.city,
          country: addr.country,
        });
      } else {
        state.setHasDifferentShipping(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { handleClose, handleCreateInvoice } = useInvoiceActions({
    order,
    issueDate: state.issueDate,
    invoiceLabel: state.invoiceLabel,
    billingAddress: state.billingAddress,
    hasDifferentShipping: state.hasDifferentShipping,
    shippingAddress: state.shippingAddress,
    shippingCostHt: state.shippingCostHt,
    handlingCostHt: state.handlingCostHt,
    insuranceCostHt: state.insuranceCostHt,
    feesVatRate: state.feesVatRate,
    customLines: state.customLines,
    billingOrgId: state.billingOrgId,
    onOpenChange: (isOpen: boolean) => {
      if (!isOpen) resetSiretGuard();
      onOpenChange(isOpen);
    },
    onSuccess,
    setStatus: state.setStatus,
    setCreatedInvoice: state.setCreatedInvoice,
    setSiretInput: state.setSiretInput,
    setSiretSaved: state.setSiretSaved,
    setIssueDate: state.setIssueDate,
    setInvoiceLabel: state.setInvoiceLabel,
    setSavingSiret: state.setSavingSiret,
    siretInput,
  });

  // Récupérer le prochain numéro de facture au chargement (GET /api/qonto/invoices)
  useEffect(() => {
    if (!open) return;
    state.setLoadingNextNumber(true);
    void fetch('/api/qonto/invoices?per_page=1&sort_by=number:desc')
      .then(res => res.json() as Promise<IInvoiceListApiResponse>)
      .then(data => {
        if (data.success && data.invoices?.[0]?.invoice_number) {
          const lastNumber = data.invoices[0].invoice_number;
          const match = lastNumber.match(/(\d+)$/);
          if (match) {
            const nextNum = String(parseInt(match[1], 10) + 1).padStart(
              match[1].length,
              '0'
            );
            const prefix = lastNumber.slice(
              0,
              lastNumber.length - match[1].length
            );
            state.setNextInvoiceNumber(`${prefix}${nextNum}`);
          } else {
            state.setNextInvoiceNumber(null);
          }
        }
      })
      .catch(() => {
        // Silently fail - non-critical info
      })
      .finally(() => state.setLoadingNextNumber(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!order) return null;

  const customerName =
    (order.organisations?.trade_name ??
      order.organisations?.legal_name ??
      order.organisations?.name ??
      `${order.individual_customers?.first_name ?? ''} ${order.individual_customers?.last_name ?? ''}`.trim()) ||
    'Client';

  const customerEmail =
    order.organisations?.email ?? order.individual_customers?.email;

  const initialBillingAddress = resolveInitialBillingAddress(order);
  const orgDisplayName =
    order.organisations?.trade_name ??
    order.organisations?.legal_name ??
    order.organisations?.name ??
    null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-4xl md:max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {state.status === 'success' ? 'Facture créée' : 'Créer une facture'}
          </DialogTitle>
          <DialogDescription>
            {state.status === 'success'
              ? `Facture ${state.createdInvoice?.invoice_number} - ${formatAmount(state.createdInvoice?.total_amount ?? 0)}`
              : `Commande ${order.order_number} - ${customerName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {state.status === 'success' && state.createdInvoice ? (
            <InvoiceSuccessView createdInvoice={state.createdInvoice} />
          ) : (
            <div className="space-y-4">
              <InvoiceClientSection
                customerName={customerName}
                customerEmail={customerEmail}
                legalName={order.organisations?.legal_name}
                billingAddress={state.billingAddress}
                setBillingAddress={state.setBillingAddress}
                editingBilling={state.editingBilling}
                setEditingBilling={state.setEditingBilling}
                hasDifferentShipping={state.hasDifferentShipping}
                setHasDifferentShipping={state.setHasDifferentShipping}
                shippingAddress={state.shippingAddress}
                setShippingAddress={state.setShippingAddress}
                editingShipping={state.editingShipping}
                setEditingShipping={state.setEditingShipping}
              />
              <BillingAddressEditor
                enseigneId={order.organisations?.enseigne_id}
                defaultOrgId={order.customer_id}
                initialBillingAddress={initialBillingAddress}
                orgName={orgDisplayName ?? undefined}
                disabled={state.status === 'creating'}
                onBillingAddressChange={handleBillingAddressChange}
                onUpdateOrgBillingChange={() => {
                  /* factures : pas de save-to-org côté billing */
                }}
                onBillingOrgChange={state.setBillingOrgId}
              />
              <QuoteShippingSection
                enseigneId={order.organisations?.enseigne_id}
                defaultOrgId={order.customer_id}
                orgName={orgDisplayName}
                disabled={state.status === 'creating'}
                onShippingAddressChange={handleShippingAddressChange}
              />
              <InvoiceInfoSection
                issueDate={state.issueDate}
                setIssueDate={state.setIssueDate}
                invoiceLabel={state.invoiceLabel}
                setInvoiceLabel={state.setInvoiceLabel}
                loadingNextNumber={state.loadingNextNumber}
                nextInvoiceNumber={state.nextInvoiceNumber}
              />
              <InvoiceItemsSection order={order} />
              <InvoiceFeesSection
                shippingCostHt={state.shippingCostHt}
                setShippingCostHt={state.setShippingCostHt}
                handlingCostHt={state.handlingCostHt}
                setHandlingCostHt={state.setHandlingCostHt}
                insuranceCostHt={state.insuranceCostHt}
                setInsuranceCostHt={state.setInsuranceCostHt}
                feesVatRate={state.feesVatRate}
                setFeesVatRate={state.setFeesVatRate}
              />
              <InvoiceCustomLinesSection
                customLines={state.customLines}
                setCustomLines={state.setCustomLines}
                showAddLine={state.showAddLine}
                setShowAddLine={state.setShowAddLine}
                newLineTitle={state.newLineTitle}
                setNewLineTitle={state.setNewLineTitle}
                newLineQty={state.newLineQty}
                setNewLineQty={state.setNewLineQty}
                newLinePriceHt={state.newLinePriceHt}
                setNewLinePriceHt={state.setNewLinePriceHt}
                newLineVatRate={state.newLineVatRate}
                setNewLineVatRate={state.setNewLineVatRate}
              />
              <InvoiceTotalsSection
                order={order}
                shippingCostHt={state.shippingCostHt}
                handlingCostHt={state.handlingCostHt}
                insuranceCostHt={state.insuranceCostHt}
                feesVatRate={state.feesVatRate}
                customLines={state.customLines}
              />
            </div>
          )}
        </div>

        <InvoiceFooter
          status={state.status}
          isMissingSiret={isMissingSiret}
          siretInput={siretInput}
          setSiretInput={setSiretInput}
          savingSiret={savingSiret}
          onSaveSiret={() => {
            void handleSaveSiret();
          }}
          onClose={handleClose}
          onCreateInvoice={() => {
            void handleCreateInvoice();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
