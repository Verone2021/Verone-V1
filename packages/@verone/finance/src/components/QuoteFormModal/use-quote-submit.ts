'use client';

import { useState, useMemo, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import type {
  CreateQuoteData,
  CreateQuoteItemData,
} from '@verone/finance/hooks';
import { useQuotes } from '@verone/finance/hooks';
import type { UnifiedCustomer } from '@verone/orders/components/modals/customer-selector';
import { computeFinancialTotals } from '@verone/finance/lib/finance-totals';
import type {
  FinancialItem,
  FinancialFees,
} from '@verone/finance/lib/finance-totals';

import type { QuoteItemLocal, QuoteTotals } from './types';

interface UseQuoteSubmitOptions {
  selectedCustomer: UnifiedCustomer | null;
  items: QuoteItemLocal[];
  channelId: string | null;
  validityDays: string;
  notes: string;
  reference: string;
  billingAddress: string;
  shippingAddress: string;
  shippingCostHt: number;
  handlingCostHt: number;
  insuranceCostHt: number;
  feesVatRate: number;
  selectedSelectionId: string | null;
  selectedAffiliateId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface UseQuoteSubmitReturn {
  isSubmitting: boolean;
  totals: QuoteTotals;
  handleSubmit: () => Promise<void>;
}

export function useQuoteSubmit({
  selectedCustomer,
  items,
  channelId,
  validityDays,
  notes,
  reference,
  billingAddress,
  shippingAddress,
  shippingCostHt,
  handlingCostHt,
  insuranceCostHt,
  feesVatRate,
  selectedSelectionId,
  selectedAffiliateId,
  onClose,
  onSuccess,
}: UseQuoteSubmitOptions): UseQuoteSubmitReturn {
  const { toast } = useToast();
  const { createQuote } = useQuotes();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totals = useMemo((): QuoteTotals => {
    // [BO-FIN-046] Module unique finance-totals
    const financialItems: FinancialItem[] = items.map(item => ({
      quantity: item.quantity,
      unit_price_ht: item.unit_price_ht,
      tax_rate: item.tva_rate / 100, // tva_rate est en % dans ce composant (ex: 20)
      discount_percentage: item.discount_percentage,
      eco_tax: item.eco_tax,
      description: item.description,
    }));

    const financialFees: FinancialFees = {
      shipping_cost_ht: shippingCostHt,
      handling_cost_ht: handlingCostHt,
      insurance_cost_ht: insuranceCostHt,
      fees_vat_rate: feesVatRate,
    };

    const computed = computeFinancialTotals(financialItems, financialFees, {
      strict: false,
    });

    // Reconstruire le format QuoteTotals attendu par QuoteTotalsCard
    const tvaByRate: Record<number, { base: number; tva: number }> = {};
    for (const [rateStr, vatAmount] of Object.entries(computed.vatByRate)) {
      const rate = Number(rateStr) * 100; // convertir décimal → % pour compatibilité
      tvaByRate[rate] = {
        base: 0, // non critique pour l'affichage
        tva: vatAmount,
      };
    }

    return {
      itemsTotalHt: computed.itemsHt,
      itemsTva:
        computed.totalVat -
        (computed.feesHt > 0 ? computed.feesHt * feesVatRate : 0),
      feesTotalHt: computed.feesHt,
      feesTva: computed.feesHt * feesVatRate,
      totalHt: computed.totalHt,
      totalTva: computed.totalVat,
      totalTtc: computed.totalTtc,
      tvaByRate,
    };
  }, [items, shippingCostHt, handlingCostHt, insuranceCostHt, feesVatRate]);

  const handleSubmit = useCallback(async () => {
    if (!selectedCustomer) {
      toast({
        title: 'Client requis',
        description: 'Veuillez sélectionner un client',
        variant: 'destructive',
      });
      return;
    }

    const validItems = items.filter(
      i =>
        (i.is_service ? i.description.trim() : i.product_id) &&
        i.unit_price_ht > 0
    );

    if (validItems.length === 0) {
      toast({
        title: 'Articles requis',
        description: 'Ajoutez au moins un article ou une prestation',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const customerType: 'organization' | 'individual' =
        selectedCustomer.type === 'professional'
          ? 'organization'
          : 'individual';

      const quoteItems: CreateQuoteItemData[] = validItems.map(item => ({
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        tva_rate: item.tva_rate,
        discount_percentage: item.discount_percentage,
        eco_tax: item.eco_tax,
        linkme_selection_item_id: null,
        base_price_ht: null,
        retrocession_rate: null,
      }));

      const quoteData: CreateQuoteData = {
        channel_id: channelId,
        customer_id: selectedCustomer.id,
        customer_type: customerType,
        individual_customer_id:
          customerType === 'individual' ? selectedCustomer.id : undefined,
        items: quoteItems,
        validity_days: Number(validityDays),
        notes: notes || undefined,
        reference: reference || undefined,
        billing_address: billingAddress
          ? { address: billingAddress }
          : undefined,
        shipping_address: shippingAddress
          ? { address: shippingAddress }
          : undefined,
        shipping_cost_ht: shippingCostHt,
        handling_cost_ht: handlingCostHt,
        insurance_cost_ht: insuranceCostHt,
        fees_vat_rate: feesVatRate,
        linkme_selection_id: selectedSelectionId ?? null,
        linkme_affiliate_id: selectedAffiliateId ?? null,
      };

      const quoteId = await createQuote(quoteData);

      if (quoteId) {
        onClose();
        onSuccess?.();
      }
    } catch (err) {
      console.error('[QuoteFormModal] Submit error:', err);
      toast({
        title: 'Erreur',
        description:
          err instanceof Error
            ? err.message
            : 'Erreur lors de la création du devis',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedCustomer,
    items,
    channelId,
    validityDays,
    notes,
    reference,
    billingAddress,
    shippingAddress,
    shippingCostHt,
    handlingCostHt,
    insuranceCostHt,
    feesVatRate,
    selectedSelectionId,
    selectedAffiliateId,
    createQuote,
    onClose,
    onSuccess,
    toast,
  ]);

  return { isSubmitting, totals, handleSubmit };
}
