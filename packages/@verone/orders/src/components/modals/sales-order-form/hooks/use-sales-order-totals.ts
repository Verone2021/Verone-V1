'use client';

import { useMemo } from 'react';

import { DEFAULT_VAT_RATE } from '@verone/organisations';

import type { OrderItem } from '../OrderItemsTable';
import type { SalesChannelType } from '../types';

interface UseSalesOrderTotalsOptions {
  items: OrderItem[];
  shippingCostHt: number;
  insuranceCostHt: number;
  handlingCostHt: number;
  ecoTaxVatRate: number | null;
  /** TVA par défaut du client (organisations.default_vat_rate). Fallback DEFAULT_VAT_RATE si null. */
  customerVatRate?: number | null;
  availableChannels: Array<{ id: string; name: string; code: string }>;
  setChannelId: (id: string | null) => void;
  setSelectedSalesChannel: (channel: SalesChannelType | null) => void;
  setWizardStep: (step: 'channel-selection' | 'form') => void;
}

export function useSalesOrderTotals({
  items,
  shippingCostHt,
  insuranceCostHt,
  handlingCostHt,
  ecoTaxVatRate,
  customerVatRate,
  availableChannels,
  setChannelId,
  setSelectedSalesChannel,
  setWizardStep,
}: UseSalesOrderTotalsOptions) {
  const fallbackVatRate = customerVatRate ?? DEFAULT_VAT_RATE;

  const totalHTProducts = useMemo(
    () =>
      items.reduce((sum, item) => {
        const itemSubtotal =
          item.quantity *
          item.unit_price_ht *
          (1 - (item.discount_percentage ?? 0) / 100);
        const itemEcoTax = (item.eco_tax ?? 0) * item.quantity;
        return sum + itemSubtotal + itemEcoTax;
      }, 0),
    [items]
  );

  const totalCharges = shippingCostHt + insuranceCostHt + handlingCostHt;

  const totalTVA = useMemo(
    () =>
      items.reduce((sum, item) => {
        const lineHT =
          item.quantity *
          item.unit_price_ht *
          (1 - (item.discount_percentage ?? 0) / 100);
        const lineTVA = lineHT * (item.tax_rate ?? fallbackVatRate);
        const ecoTaxHT = (item.eco_tax ?? 0) * item.quantity;
        const ecoTaxTvaRate =
          ecoTaxVatRate !== null
            ? ecoTaxVatRate / 100
            : (item.tax_rate ?? fallbackVatRate);
        const ecoTaxTVA = ecoTaxHT * ecoTaxTvaRate;
        return sum + lineTVA + ecoTaxTVA;
      }, 0) +
      totalCharges * fallbackVatRate,
    [items, ecoTaxVatRate, totalCharges, fallbackVatRate]
  );

  const totalTTC = totalHTProducts + totalCharges + totalTVA;

  const excludeProductIds = useMemo(
    () => items.map(item => item.product_id),
    [items]
  );

  const handleChannelSelect = (channel: SalesChannelType) => {
    setSelectedSalesChannel(channel);
    setWizardStep('form');

    if (channel === 'manual') {
      const manualChannel = availableChannels.find(
        c =>
          c.code === 'MANUEL' ||
          c.code === 'manuel' ||
          c.code === 'general' ||
          c.code === 'GENERAL'
      );
      if (manualChannel) setChannelId(manualChannel.id);
    } else if (channel === 'site-internet') {
      const siteChannel = availableChannels.find(
        c => c.code === 'SITE_INTERNET' || c.code === 'site-internet'
      );
      if (siteChannel) setChannelId(siteChannel.id);
    } else if (channel === 'linkme') {
      const linkmeChannel = availableChannels.find(
        c => c.code === 'LINKME' || c.code === 'linkme'
      );
      if (linkmeChannel) setChannelId(linkmeChannel.id);
    }
  };

  const handleBackToChannelSelection = (
    setWizardStepFn: (step: 'channel-selection' | 'form') => void
  ) => {
    setWizardStepFn('channel-selection');
    setSelectedSalesChannel(null);
    setChannelId(null);
  };

  return {
    totalHTProducts,
    totalCharges,
    totalTVA,
    totalTTC,
    excludeProductIds,
    handleChannelSelect,
    handleBackToChannelSelection,
  };
}
