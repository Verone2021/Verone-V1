'use client';

import { useCallback, useState } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';
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
import { QuoteClientCard } from './QuoteClientCard';
import { QuoteCustomLinesSection } from './QuoteCustomLinesSection';
import { QuoteFeesSection } from './QuoteFeesSection';
import { QuoteFinalizeWarning } from './QuoteFinalizeWarning';
import { QuoteItemsTable } from './QuoteItemsTable';
import { QuoteShippingSection } from './QuoteShippingSection';
import type { IShippingAddressResolved } from './QuoteShippingSection';
import { QuoteSuccessView } from './QuoteSuccessView';
import { QuoteTotalsSection } from './QuoteTotalsSection';
import type {
  CreateStatus,
  ICreatedQuote,
  IQuoteCreateFromOrderModalProps,
  IQuoteFeesState,
} from './types';
import { resolveCustomerName } from './quote-utils';

export function QuoteCreateFromOrderModal({
  order,
  open,
  onOpenChange,
  onSuccess,
  isConsultation = false,
  consultationId,
  supersededQuoteIds,
}: IQuoteCreateFromOrderModalProps): React.ReactNode {
  const { toast } = useToast();
  const [status, setStatus] = useState<CreateStatus>('idle');
  const [expiryDays, setExpiryDays] = useState(30);
  const [createdQuote, setCreatedQuote] = useState<ICreatedQuote | null>(null);
  const [showFinalizeWarning, setShowFinalizeWarning] = useState(false);
  const [customLines, setCustomLines] = useState<ICustomLine[]>([]);
  const [fees, setFees] = useState<IQuoteFeesState>({
    shippingCostHt: order?.shipping_cost_ht ?? 0,
    handlingCostHt: order?.handling_cost_ht ?? 0,
    insuranceCostHt: order?.insurance_cost_ht ?? 0,
    feesVatRate: order?.fees_vat_rate ?? 0.2,
  });
  const [shippingAddress, setShippingAddress] =
    useState<IShippingAddressResolved | null>(null);

  const resetState = useCallback((): void => {
    setStatus('idle');
    setExpiryDays(30);
    setCreatedQuote(null);
    setShowFinalizeWarning(false);
    setShippingAddress(null);
  }, []);

  const handleClose = useCallback((): void => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  const handleCreateQuote = async (): Promise<void> => {
    if (!order) return;

    setStatus('creating');

    try {
      const supabaseClient = createClient();
      const { data: userData } = await supabaseClient.auth.getUser();
      const currentUserId = userData.user?.id ?? null;

      const resolvedBillingAddress = order.billing_address
        ? {
            address_line1: order.billing_address?.address_line1 ?? '',
            postal_code: order.billing_address?.postal_code ?? '',
            city: order.billing_address?.city ?? '',
            country: order.billing_address?.country ?? 'FR',
          }
        : order.organisations
          ? {
              address_line1:
                order.organisations.billing_address_line1 ??
                order.organisations.address_line1 ??
                '',
              postal_code:
                order.organisations.billing_postal_code ??
                order.organisations.postal_code ??
                '',
              city:
                order.organisations.billing_city ??
                order.organisations.city ??
                '',
              country: order.organisations.billing_country ?? 'FR',
            }
          : undefined;

      const allCustomLines = customLines.map(line => ({
        title: line.title,
        description: line.description,
        quantity: line.quantity,
        unit_price_ht: line.unit_price_ht,
        vat_rate: line.vat_rate,
      }));

      const consultationLines = isConsultation
        ? [
            ...(order.sales_order_items ?? []).map(item => ({
              title: item.products?.name ?? 'Produit',
              quantity: item.quantity,
              unit_price_ht: item.unit_price_ht,
              vat_rate: item.tax_rate,
            })),
            ...allCustomLines,
          ]
        : allCustomLines;

      const feesPayload = {
        shipping_cost_ht: fees.shippingCostHt,
        handling_cost_ht: fees.handlingCostHt,
        insurance_cost_ht: fees.insuranceCostHt,
        fees_vat_rate: fees.feesVatRate,
      };

      const requestBody = isConsultation
        ? {
            consultationId,
            userId: currentUserId,
            supersededQuoteIds: supersededQuoteIds?.length
              ? supersededQuoteIds
              : undefined,
            customer: {
              customerId: order.customer_id,
              customerType: order.customer_type ?? 'organization',
            },
            customerEmail: order.organisations?.email ?? undefined,
            expiryDays,
            billingAddress: resolvedBillingAddress,
            fees: feesPayload,
            customLines: consultationLines,
          }
        : {
            salesOrderId: order.id,
            userId: currentUserId,
            expiryDays,
            billingAddress: resolvedBillingAddress,
            shippingAddress: shippingAddress ?? undefined,
            fees: feesPayload,
            customLines: allCustomLines,
          };

      const response = await fetch('/api/qonto/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        quote?: ICreatedQuote;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to create quote');
      }

      setCreatedQuote(data.quote ?? null);
      setStatus('success');
      if (data.quote) {
        toast({
          title: 'Devis créé',
          description: `Devis ${data.quote.quote_number} créé en brouillon`,
        });
        onSuccess?.(data.quote.id);
      }
    } catch (error) {
      setStatus('error');
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Erreur lors de la création',
        variant: 'destructive',
      });
    }
  };

  const handleFinalizeQuote = async (): Promise<void> => {
    if (!createdQuote?.id) return;

    setShowFinalizeWarning(false);

    try {
      const response = await fetch(
        `/api/qonto/quotes/${createdQuote.id}/finalize`,
        { method: 'POST' }
      );

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        quote?: ICreatedQuote;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to finalize quote');
      }

      setCreatedQuote(data.quote ?? null);
      toast({
        title: 'Devis finalisé',
        description: 'Devis finalisé et envoyable au client',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la finalisation',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPdf = async (): Promise<void> => {
    if (!createdQuote?.id) return;

    try {
      const response = await fetch(`/api/qonto/quotes/${createdQuote.id}/pdf`);

      if (!response.ok) throw new Error('Failed to download PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-${createdQuote.quote_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'PDF téléchargé',
        description: 'Le devis a été téléchargé',
      });
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le PDF',
        variant: 'destructive',
      });
    }
  };

  const handleConvertToInvoice = async (): Promise<void> => {
    if (!createdQuote?.id) return;

    try {
      const response = await fetch(
        `/api/qonto/quotes/${createdQuote.id}/convert`,
        { method: 'POST' }
      );

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Failed to convert quote');
      }

      toast({
        title: 'Devis converti',
        description: 'Facture créée en brouillon depuis le devis',
      });
      handleClose();
    } catch (error) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la conversion',
        variant: 'destructive',
      });
    }
  };

  if (!order) return null;

  const customerName = resolveCustomerName(order);

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
                <QuoteShippingSection
                  enseigneId={order.organisations?.enseigne_id}
                  defaultOrgId={order.customer_id}
                  disabled={status === 'creating'}
                  onShippingAddressChange={setShippingAddress}
                />
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

        <DialogFooter className="flex-col gap-2 md:flex-row">
          {status === 'success' ? (
            <Button className="w-full md:w-auto" onClick={handleClose}>
              Fermer
            </Button>
          ) : (
            <>
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
                disabled={status === 'creating'}
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
            </>
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
