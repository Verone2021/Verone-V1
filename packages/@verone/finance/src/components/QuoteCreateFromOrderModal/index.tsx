'use client';

import { useCallback, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@verone/ui';
import { FileEdit, Loader2 } from 'lucide-react';

import type { ICustomLine } from '../OrderSelectModal';
import { BillingAddressEditor } from './BillingAddressEditor';
import type { IBillingAddressResolved } from './BillingAddressEditor';
import { QuoteClientCard } from './QuoteClientCard';
import { QuoteCustomLinesSection } from './QuoteCustomLinesSection';
import { QuoteFeesSection } from './QuoteFeesSection';
import { QuoteFinalizeWarning } from './QuoteFinalizeWarning';
import { QuoteItemsTable } from './QuoteItemsTable';
import { QuoteShippingSection } from './QuoteShippingSection';
import type { IShippingAddressResolved } from './QuoteShippingSection';
import { QuoteSiretGuardBanner } from './QuoteSiretGuardBanner';
import { QuoteSuccessView } from './QuoteSuccessView';
import { QuoteTotalsSection } from './QuoteTotalsSection';
import type { IQuoteCreateFromOrderModalProps, IQuoteFeesState } from './types';
import { resolveCustomerName } from './quote-utils';
import { useQuoteCreateFromOrder } from './use-quote-create-from-order';
import { useQuoteSiretGuard } from './useQuoteSiretGuard';

// ---------------------------------------------------------------------------
// Helper — resoudre l adresse de facturation initiale depuis la commande/org
// ---------------------------------------------------------------------------

function resolveInitialBillingAddress(
  order: NonNullable<IQuoteCreateFromOrderModalProps['order']>
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

export function QuoteCreateFromOrderModal({
  order,
  open,
  onOpenChange,
  onSuccess,
  isConsultation = false,
  consultationId,
  supersededQuoteIds,
}: IQuoteCreateFromOrderModalProps): React.ReactNode {
  const [expiryDays, setExpiryDays] = useState(30);
  const [customLines, setCustomLines] = useState<ICustomLine[]>([]);
  const [fees, setFees] = useState<IQuoteFeesState>({
    shippingCostHt: order?.shipping_cost_ht ?? 0,
    handlingCostHt: order?.handling_cost_ht ?? 0,
    insuranceCostHt: order?.insurance_cost_ht ?? 0,
    feesVatRate: order?.fees_vat_rate ?? 0.2,
  });
  const [shippingAddress, setShippingAddress] =
    useState<IShippingAddressResolved | null>(null);

  // Adresse facturation overridee (null = adresse initiale de l org)
  const [billingAddressOverride, setBillingAddressOverride] =
    useState<IBillingAddressResolved | null>(null);
  const [updateOrgBilling, setUpdateOrgBilling] = useState(false);
  // Org de facturation choisie (null = org commande par defaut)
  const [billingOrgId, setBillingOrgId] = useState<string | null>(null);

  const {
    isMissingSiret,
    siretInput,
    setSiretInput,
    savingSiret,
    handleSaveSiret,
    reset: resetSiretGuard,
  } = useQuoteSiretGuard(order, billingOrgId);

  const resetFormState = useCallback((): void => {
    setExpiryDays(30);
    setShippingAddress(null);
    setBillingAddressOverride(null);
    setUpdateOrgBilling(false);
    setBillingOrgId(null);
    resetSiretGuard();
  }, [resetSiretGuard]);

  const handleClose = useCallback((): void => {
    resetFormState();
    onOpenChange(false);
  }, [onOpenChange, resetFormState]);

  const {
    status,
    createdQuote,
    showFinalizeWarning,
    setShowFinalizeWarning,
    handleCreateQuote,
    handleFinalizeQuote,
    handleDownloadPdf,
    handleConvertToInvoice,
  } = useQuoteCreateFromOrder({
    order: order!,
    isConsultation,
    consultationId,
    supersededQuoteIds,
    fees,
    expiryDays,
    customLines,
    billingAddressOverride,
    updateOrgBilling,
    shippingAddress,
    billingOrgId,
    onSuccess,
    handleClose,
  });

  if (!order) return null;

  const customerName = resolveCustomerName(order);
  const initialBillingAddress = resolveInitialBillingAddress(order);
  const orgDisplayName =
    order.organisations?.trade_name ??
    order.organisations?.legal_name ??
    order.organisations?.name ??
    null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="h-screen md:h-auto max-w-full md:max-w-2xl md:max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            {status === 'success' ? 'Devis créé' : 'Créer un devis'}
          </DialogTitle>
          <DialogDescription>
            {status === 'success'
              ? `Devis ${createdQuote?.quote_number} - ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(createdQuote?.total_amount ?? 0)}`
              : `Commande ${order.order_number} - ${customerName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          {status === 'success' && createdQuote ? (
            <QuoteSuccessView
              createdQuote={createdQuote}
              onDownloadPdf={() => void handleDownloadPdf()}
              onFinalize={() => setShowFinalizeWarning(true)}
              onConvertToInvoice={() => void handleConvertToInvoice()}
            />
          ) : (
            <div className="space-y-4">
              <QuoteClientCard order={order} customerName={customerName} />
              {!isConsultation && (
                <>
                  <BillingAddressEditor
                    enseigneId={order.organisations?.enseigne_id}
                    defaultOrgId={order.customer_id}
                    initialBillingAddress={initialBillingAddress}
                    orgName={orgDisplayName ?? undefined}
                    disabled={status === 'creating'}
                    onBillingAddressChange={setBillingAddressOverride}
                    onUpdateOrgBillingChange={setUpdateOrgBilling}
                    onBillingOrgChange={setBillingOrgId}
                  />
                  <QuoteShippingSection
                    enseigneId={order.organisations?.enseigne_id}
                    defaultOrgId={order.customer_id}
                    orgName={orgDisplayName}
                    disabled={status === 'creating'}
                    onShippingAddressChange={setShippingAddress}
                  />
                </>
              )}
              <QuoteItemsTable order={order} />
              <QuoteFeesSection fees={fees} onFeesChange={setFees} />
              <QuoteCustomLinesSection
                customLines={customLines}
                onCustomLinesChange={setCustomLines}
              />
              <QuoteTotalsSection
                order={order}
                fees={fees}
                customLines={customLines}
              />

              <div className="space-y-2">
                <Label htmlFor="expiryDays">Validité du devis (jours)</Label>
                <Input
                  id="expiryDays"
                  type="number"
                  min={1}
                  max={365}
                  value={expiryDays}
                  onChange={e => setExpiryDays(Number(e.target.value))}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Le devis expirera dans {expiryDays} jours
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
          {status === 'success' ? (
            <Button className="w-full md:w-auto" onClick={handleClose}>
              Fermer
            </Button>
          ) : (
            <div className="flex flex-col gap-3 w-full">
              {isMissingSiret && (
                <QuoteSiretGuardBanner
                  siretInput={siretInput}
                  setSiretInput={setSiretInput}
                  savingSiret={savingSiret}
                  onSaveSiret={() => void handleSaveSiret()}
                />
              )}
              <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                <Button
                  variant="outline"
                  className="w-full md:w-auto"
                  onClick={handleClose}
                >
                  Annuler
                </Button>
                <Button
                  className="w-full md:w-auto"
                  onClick={() => void handleCreateQuote()}
                  disabled={status === 'creating' || isMissingSiret}
                >
                  {status === 'creating' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <FileEdit className="mr-2 h-4 w-4" />
                      Créer le devis (brouillon)
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>

      <QuoteFinalizeWarning
        open={showFinalizeWarning}
        onOpenChange={setShowFinalizeWarning}
        onConfirm={() => void handleFinalizeQuote()}
      />
    </Dialog>
  );
}
