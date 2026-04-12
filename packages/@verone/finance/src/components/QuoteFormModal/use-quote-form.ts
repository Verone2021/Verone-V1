'use client';

import { useState, useCallback, useEffect } from 'react';

import type { UnifiedCustomer } from '@verone/orders/components/modals/customer-selector';

import type { QuoteItemLocal, QuoteTotals } from './types';
import { useQuoteCustomer } from './use-quote-customer';
import { useQuoteItems } from './use-quote-items';
import { useQuoteSubmit } from './use-quote-submit';

// -----------------------------------------------------------------------
// Public surface the modal needs
// -----------------------------------------------------------------------
export interface UseQuoteFormReturn {
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
}

// -----------------------------------------------------------------------
// Orchestrator hook — service-only mode
// -----------------------------------------------------------------------
export function useQuoteForm(
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onSuccess?: () => void
): UseQuoteFormReturn {
  // Options state
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
    itemsHook.resetItems();
    customerHook.resetCustomer();
    resetOptions();
    onOpenChange(false);
  }, [itemsHook, customerHook, resetOptions, onOpenChange]);

  // Initialize with one empty service line when modal opens
  const setItems = itemsHook.setItems;
  useEffect(() => {
    if (open) {
      setItems([
        {
          id: Math.random().toString(36).substring(2, 9),
          product_id: null,
          description: '',
          quantity: 1,
          unit_price_ht: 0,
          tva_rate: 20,
          discount_percentage: 0,
          eco_tax: 0,
          is_service: true,
        },
      ]);
    }
  }, [open, setItems]);

  const submitHook = useQuoteSubmit({
    selectedCustomer: customerHook.selectedCustomer,
    items: itemsHook.items,
    channelId: null,
    validityDays,
    notes,
    reference,
    billingAddress: customerHook.billingAddress,
    shippingAddress: customerHook.shippingAddress,
    shippingCostHt,
    handlingCostHt,
    insuranceCostHt,
    feesVatRate,
    selectedSelectionId: null,
    selectedAffiliateId: null,
    onClose: handleClose,
    onSuccess,
  });

  return {
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
  };
}
