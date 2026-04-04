'use client';

import { useState, useCallback } from 'react';

import type { UnifiedCustomer } from '@verone/orders/components/modals/customer-selector';
import type { SelectionItem } from '@verone/orders/hooks';

import type { QuoteItemLocal, QuoteTotals } from './types';
import { useQuoteChannels } from './use-quote-channels';
import { useQuoteCustomer } from './use-quote-customer';
import { useQuoteItems } from './use-quote-items';
import { useQuoteSubmit } from './use-quote-submit';
import type { UseQuoteChannelsReturn } from './use-quote-channels';

// -----------------------------------------------------------------------
// Aggregated return type (all public surface the modal needs)
// -----------------------------------------------------------------------
export interface UseQuoteFormReturn
  extends Omit<
    UseQuoteChannelsReturn,
    'resetChannels' | 'setSelectedChannel' | 'setChannelId'
  > {
  // Customer
  selectedCustomer: UnifiedCustomer | null;
  handleCustomerChange: (customer: UnifiedCustomer | null) => void;

  // Addresses
  billingAddress: string;
  setBillingAddress: (v: string) => void;
  shippingAddress: string;
  setShippingAddress: (v: string) => void;

  // Items
  items: QuoteItemLocal[];
  showAddProduct: boolean;
  setShowAddProduct: (v: boolean) => void;
  handleAddProduct: (data: {
    product_id: string;
    quantity: number;
    unit_price_ht: number;
    tax_rate?: number;
    discount_percentage?: number;
    eco_tax?: number;
    notes?: string;
    product_name?: string;
    product_sku?: string;
    product_image_url?: string;
    product_description?: string;
  }) => void;
  handleAddLinkMeProduct: (item: SelectionItem) => void;
  handleAddServiceLine: () => void;
  handleRemoveItem: (itemId: string) => void;
  handleItemChange: (
    itemId: string,
    field: keyof QuoteItemLocal,
    value: string | number
  ) => void;

  // Options
  validityDays: string;
  setValidityDays: (v: string) => void;
  reference: string;
  setReference: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;

  // Fees
  shippingCostHt: number;
  setShippingCostHt: (v: number) => void;
  handlingCostHt: number;
  setHandlingCostHt: (v: number) => void;
  insuranceCostHt: number;
  setInsuranceCostHt: (v: number) => void;
  feesVatRate: number;
  setFeesVatRate: (v: number) => void;

  // Totals & submission
  totals: QuoteTotals;
  isSubmitting: boolean;
  handleSubmit: () => Promise<void>;
  handleClose: () => void;
  handleBackFromForm: () => void;
}

// -----------------------------------------------------------------------
// Orchestrator hook
// -----------------------------------------------------------------------
export function useQuoteForm(
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onSuccess?: () => void
): UseQuoteFormReturn {
  // Options state (not split into sub-hooks as they are simple scalars)
  const [validityDays, setValidityDays] = useState('30');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [shippingCostHt, setShippingCostHt] = useState(0);
  const [handlingCostHt, setHandlingCostHt] = useState(0);
  const [insuranceCostHt, setInsuranceCostHt] = useState(0);
  const [feesVatRate, setFeesVatRate] = useState(0.2);

  // Sub-hooks
  const itemsHook = useQuoteItems();
  const customerHook = useQuoteCustomer();
  const channelsHook = useQuoteChannels({
    open,
    setItems: itemsHook.setItems,
    resetItems: itemsHook.resetItems,
  });

  const resetOptions = useCallback(() => {
    setValidityDays('30');
    setReference('');
    setNotes('');
    setShippingCostHt(0);
    setHandlingCostHt(0);
    setInsuranceCostHt(0);
    setFeesVatRate(0.2);
  }, []);

  const handleClose = useCallback(() => {
    channelsHook.resetChannels();
    itemsHook.resetItems();
    customerHook.resetCustomer();
    resetOptions();
    onOpenChange(false);
  }, [channelsHook, itemsHook, customerHook, resetOptions, onOpenChange]);

  const submitHook = useQuoteSubmit({
    selectedCustomer: customerHook.selectedCustomer,
    items: itemsHook.items,
    channelId: channelsHook.channelId,
    validityDays,
    notes,
    reference,
    billingAddress: customerHook.billingAddress,
    shippingAddress: customerHook.shippingAddress,
    shippingCostHt,
    handlingCostHt,
    insuranceCostHt,
    feesVatRate,
    selectedSelectionId: channelsHook.selectedSelectionId,
    selectedAffiliateId: channelsHook.selectedAffiliateId,
    onClose: handleClose,
    onSuccess,
  });

  const handleBackFromForm = useCallback(() => {
    channelsHook.handleBackFromForm(channelsHook.selectedChannel);
  }, [channelsHook]);

  return {
    // Channels
    wizardStep: channelsHook.wizardStep,
    setWizardStep: channelsHook.setWizardStep,
    selectedChannel: channelsHook.selectedChannel,
    channelId: channelsHook.channelId,
    channelLabel: channelsHook.channelLabel,
    isServiceMode: channelsHook.isServiceMode,
    isLinkMeMode: channelsHook.isLinkMeMode,
    selectedAffiliateId: channelsHook.selectedAffiliateId,
    setSelectedAffiliateId: channelsHook.setSelectedAffiliateId,
    selectedSelectionId: channelsHook.selectedSelectionId,
    setSelectedSelectionId: channelsHook.setSelectedSelectionId,
    affiliateSearch: channelsHook.affiliateSearch,
    setAffiliateSearch: channelsHook.setAffiliateSearch,
    linkmeAffiliates: channelsHook.linkmeAffiliates,
    linkmeSelections: channelsHook.linkmeSelections,
    linkmeSelectionDetails: channelsHook.linkmeSelectionDetails,
    handleChannelSelect: channelsHook.handleChannelSelect,
    handleBackToChannelSelection: channelsHook.handleBackToChannelSelection,
    handleBackFromLinkmeSelection: channelsHook.handleBackFromLinkmeSelection,

    // Customer
    selectedCustomer: customerHook.selectedCustomer,
    handleCustomerChange: customerHook.handleCustomerChange,

    // Addresses
    billingAddress: customerHook.billingAddress,
    setBillingAddress: customerHook.setBillingAddress,
    shippingAddress: customerHook.shippingAddress,
    setShippingAddress: customerHook.setShippingAddress,

    // Items
    items: itemsHook.items,
    showAddProduct: itemsHook.showAddProduct,
    setShowAddProduct: itemsHook.setShowAddProduct,
    handleAddProduct: itemsHook.handleAddProduct,
    handleAddLinkMeProduct: itemsHook.handleAddLinkMeProduct,
    handleAddServiceLine: itemsHook.handleAddServiceLine,
    handleRemoveItem: itemsHook.handleRemoveItem,
    handleItemChange: itemsHook.handleItemChange,

    // Options
    validityDays,
    setValidityDays,
    reference,
    setReference,
    notes,
    setNotes,

    // Fees
    shippingCostHt,
    setShippingCostHt,
    handlingCostHt,
    setHandlingCostHt,
    insuranceCostHt,
    setInsuranceCostHt,
    feesVatRate,
    setFeesVatRate,

    // Submission
    totals: submitHook.totals,
    isSubmitting: submitHook.isSubmitting,
    handleSubmit: submitHook.handleSubmit,
    handleClose,
    handleBackFromForm,
  };
}
