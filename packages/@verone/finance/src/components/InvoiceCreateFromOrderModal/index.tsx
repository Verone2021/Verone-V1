'use client';

import { useEffect } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { FileText } from 'lucide-react';

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

export function InvoiceCreateFromOrderModal({
  order,
  open,
  onOpenChange,
  onSuccess,
}: IInvoiceCreateFromOrderModalProps): React.ReactNode {
  const state = useInvoiceCreateState(order);

  const { handleClose, handleSaveSiret, handleCreateInvoice } =
    useInvoiceActions({
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
      onOpenChange,
      onSuccess,
      setStatus: state.setStatus,
      setCreatedInvoice: state.setCreatedInvoice,
      setSiretInput: state.setSiretInput,
      setSiretSaved: state.setSiretSaved,
      setIssueDate: state.setIssueDate,
      setInvoiceLabel: state.setInvoiceLabel,
      setSavingSiret: state.setSavingSiret,
      siretInput: state.siretInput,
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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
          isMissingSiret={state.isMissingSiret}
          siretInput={state.siretInput}
          setSiretInput={state.setSiretInput}
          savingSiret={state.savingSiret}
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
