'use client';

import { useCallback, useState } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

import type { ICustomLine } from '../OrderSelectModal';
import type { IBillingAddressResolved } from './BillingAddressEditor';
import type { IShippingAddressResolved } from './QuoteShippingSection';
import type {
  CreateStatus,
  ICreatedQuote,
  IQuoteCreateFromOrderModalProps,
  IQuoteFeesState,
} from './types';

export interface IUseQuoteCreateFromOrderParams {
  order: NonNullable<IQuoteCreateFromOrderModalProps['order']>;
  isConsultation: boolean;
  consultationId: string | undefined;
  supersededQuoteIds: string[] | undefined;
  fees: IQuoteFeesState;
  expiryDays: number;
  customLines: ICustomLine[];
  billingAddressOverride: IBillingAddressResolved | null;
  updateOrgBilling: boolean;
  shippingAddress: IShippingAddressResolved | null;
  /** ID de l'org choisie comme destinataire de facturation (Option B). Null = org commande. */
  billingOrgId: string | null;
  onSuccess?: (id: string) => void;
  handleClose: () => void;
}

export interface IUseQuoteCreateFromOrderResult {
  status: CreateStatus;
  createdQuote: ICreatedQuote | null;
  showFinalizeWarning: boolean;
  setShowFinalizeWarning: (v: boolean) => void;
  handleCreateQuote: () => Promise<void>;
  handleFinalizeQuote: () => Promise<void>;
  handleDownloadPdf: () => Promise<void>;
  handleConvertToInvoice: () => Promise<void>;
  setCreatedQuote: (q: ICreatedQuote | null) => void;
  setStatus: (s: CreateStatus) => void;
}

export function useQuoteCreateFromOrder(
  params: IUseQuoteCreateFromOrderParams
): IUseQuoteCreateFromOrderResult {
  const {
    order,
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
  } = params;

  const { toast } = useToast();
  const [status, setStatus] = useState<CreateStatus>('idle');
  const [createdQuote, setCreatedQuote] = useState<ICreatedQuote | null>(null);
  const [showFinalizeWarning, setShowFinalizeWarning] = useState(false);

  const handleCreateQuote = useCallback(async (): Promise<void> => {
    setStatus('creating');

    try {
      const supabaseClient = createClient();
      const { data: userData } = await supabaseClient.auth.getUser();
      const currentUserId = userData.user?.id ?? null;

      // Override utilisateur en priorite, sinon adresse initiale
      const resolvedBillingAddress =
        billingAddressOverride ??
        (order.billing_address
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
            : undefined);

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
            updateOrgBilling: updateOrgBilling || undefined,
            shippingAddress: shippingAddress
              ? {
                  address_line1: shippingAddress.address_line1,
                  postal_code: shippingAddress.postal_code,
                  city: shippingAddress.city,
                  country: shippingAddress.country,
                }
              : undefined,
            updateOrgShipping: false,
            fees: feesPayload,
            customLines: allCustomLines,
            // Option B : org de facturation si différente de l'org commande
            billingOrgId: billingOrgId ?? undefined,
          };

      const response = await fetch('/api/qonto/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
        quote?: ICreatedQuote;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.message ?? data.error ?? 'Failed to create quote');
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
  }, [
    order,
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
    toast,
  ]);

  const handleFinalizeQuote = useCallback(async (): Promise<void> => {
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
  }, [createdQuote, toast]);

  const handleDownloadPdf = useCallback(async (): Promise<void> => {
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
  }, [createdQuote, toast]);

  const handleConvertToInvoice = useCallback(async (): Promise<void> => {
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
  }, [createdQuote, handleClose, toast]);

  return {
    status,
    createdQuote,
    showFinalizeWarning,
    setShowFinalizeWarning,
    handleCreateQuote,
    handleFinalizeQuote,
    handleDownloadPdf,
    handleConvertToInvoice,
    setCreatedQuote,
    setStatus,
  };
}
