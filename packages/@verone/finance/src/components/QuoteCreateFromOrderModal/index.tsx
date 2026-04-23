'use client';

import { useCallback, useEffect, useState } from 'react';

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
  Textarea,
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
import { useParentOrgForBilling } from '../../hooks/use-parent-org-for-billing';
import type { IParentOrgSuggestion } from '../../hooks/use-parent-org-for-billing';

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
  const [issueDate, setIssueDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [footerNote, setFooterNote] = useState<string>('');
  const [itemComments, setItemComments] = useState<Record<string, string>>({});
  const [customLines, setCustomLines] = useState<ICustomLine[]>([]);
  const [fees, setFees] = useState<IQuoteFeesState>({
    shippingCostHt: order?.shipping_cost_ht ?? 0,
    handlingCostHt: order?.handling_cost_ht ?? 0,
    insuranceCostHt: order?.insurance_cost_ht ?? 0,
    feesVatRate: order?.fees_vat_rate ?? 0.2,
  });
  const [shippingAddress, setShippingAddress] =
    useState<IShippingAddressResolved | null>(null);

  // Adresse facturation — uniquement définie en mode maison mère (via handleUseParentOrg)
  const [billingAddressOverride, setBillingAddressOverride] =
    useState<IBillingAddressResolved | null>(null);
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

  // [BO-FIN-040] Auto-resolve maison mère si org commande sans SIRET
  const { parentOrg, isLoading: isLoadingParentOrg } = useParentOrgForBilling(
    order?.organisations?.enseigne_id ?? null,
    order?.customer_id ?? null
  );

  const handleUseParentOrg = useCallback(
    (parent: IParentOrgSuggestion): void => {
      // Qonto exige un code ISO 2 lettres (ex: "FR"), pas un nom ("France")
      const normalizeCountry = (raw: string | null | undefined): string => {
        if (!raw) return 'FR';
        const trimmed = raw.trim();
        if (trimmed.length === 2) return trimmed.toUpperCase();
        const map: Record<string, string> = {
          france: 'FR',
          belgique: 'BE',
          belgium: 'BE',
          luxembourg: 'LU',
          suisse: 'CH',
          switzerland: 'CH',
        };
        return map[trimmed.toLowerCase()] ?? 'FR';
      };

      setBillingOrgId(parent.id);
      // Livraison = org commande originale
      const org = order?.organisations;
      const shippingLine1 = org?.address_line1;
      const shippingCity = org?.city;
      if (shippingLine1 && shippingCity) {
        setShippingAddress({
          address_line1: shippingLine1,
          postal_code: org?.postal_code ?? '',
          city: shippingCity,
          country: normalizeCountry(org?.country),
        });
      }
      // Facturation = maison mère
      const billingLine1 = parent.billing_address_line1 ?? parent.address_line1;
      const billingCity = parent.billing_city ?? parent.city;
      if (billingLine1 && billingCity) {
        setBillingAddressOverride({
          address_line1: billingLine1,
          postal_code: parent.billing_postal_code ?? parent.postal_code ?? '',
          city: billingCity,
          country: normalizeCountry(parent.billing_country ?? parent.country),
        });
      }
    },
    [order?.organisations]
  );

  // [BO-FIN-040] Mode maison mère actif = billingOrgId défini + différent de l'org commande
  const isParentOrgMode =
    billingOrgId !== null && billingOrgId !== (order?.customer_id ?? null);

  // Activation automatique dès que parentOrg chargé et SIRET manquant
  useEffect(() => {
    if (
      !open ||
      isLoadingParentOrg ||
      !parentOrg ||
      !isMissingSiret ||
      isParentOrgMode
    )
      return;
    handleUseParentOrg(parentOrg);
  }, [
    open,
    isLoadingParentOrg,
    parentOrg,
    isMissingSiret,
    isParentOrgMode,
    handleUseParentOrg,
  ]);

  const resetFormState = useCallback((): void => {
    setExpiryDays(30);
    setIssueDate(new Date().toISOString().slice(0, 10));
    setFooterNote('');
    setItemComments({});
    setShippingAddress(null);
    setBillingAddressOverride(null);
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
    updateOrgBilling: false,
    shippingAddress,
    billingOrgId,
    issueDate,
    footerNote,
    itemComments,
    onSuccess,
    handleClose,
  });

  if (!order) return null;

  const customerName = resolveCustomerName(order);
  // [BO-FIN-040] Affiche l'override si actif (mode maison mère) sinon adresse initiale
  const initialBillingAddress =
    billingAddressOverride ?? resolveInitialBillingAddress(order);
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
              {isParentOrgMode && parentOrg && (
                <div className="rounded-lg border border-green-300 bg-green-50 p-3 space-y-1">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Mode maison mère activé
                  </p>
                  <p className="text-xs text-green-700">
                    Facturation :{' '}
                    <span className="font-semibold">
                      {parentOrg.trade_name ?? parentOrg.legal_name}
                    </span>{' '}
                    (SIRET{' '}
                    <span className="font-mono">
                      {parentOrg.siret ?? parentOrg.vat_number}
                    </span>
                    ). Livraison :{' '}
                    <span className="font-semibold">{orgDisplayName}</span>.
                  </p>
                  <p className="text-xs text-green-600 italic">
                    La commande {order.order_number} reste sur {orgDisplayName}{' '}
                    — rien ne change côté commande.
                  </p>
                </div>
              )}
              {!isConsultation && (
                <>
                  {!isParentOrgMode && (
                    <>
                      <BillingAddressEditor
                        initialBillingAddress={initialBillingAddress}
                      />
                      <QuoteShippingSection
                        order={order}
                        disabled={status === 'creating'}
                        onShippingAddressChange={setShippingAddress}
                      />
                    </>
                  )}
                </>
              )}
              <QuoteItemsTable
                order={order}
                itemComments={itemComments}
                onItemCommentsChange={setItemComments}
              />
              <QuoteFeesSection fees={fees} onFeesChange={setFees} />
              <QuoteCustomLinesSection
                customLines={customLines}
                onCustomLinesChange={setCustomLines}
              />
              <div className="space-y-2">
                <Label htmlFor="footerNote">
                  Commentaire pied de page (optionnel)
                </Label>
                <Textarea
                  id="footerNote"
                  value={footerNote}
                  onChange={e => setFooterNote(e.target.value)}
                  rows={3}
                  placeholder="Mentions spéciales, conditions particulières..."
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">
                  Apparaîtra en bas du devis Qonto
                </p>
              </div>

              <QuoteTotalsSection
                order={order}
                fees={fees}
                customLines={customLines}
              />

              <div className="space-y-2">
                <Label htmlFor="issueDate">Date d&apos;émission</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className="w-44"
                />
              </div>

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
                  parentOrg={parentOrg}
                  onUseParentOrg={
                    parentOrg ? () => handleUseParentOrg(parentOrg) : undefined
                  }
                  currentOrgName={orgDisplayName}
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
