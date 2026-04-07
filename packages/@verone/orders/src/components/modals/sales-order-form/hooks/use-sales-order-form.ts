'use client';

import { useState, useEffect } from 'react';

import type { Database } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

import type { UnifiedCustomer } from '../../../modals/customer-selector';
import type { OrderItem } from '../OrderItemsTable';
import type { SalesChannelType, WizardStep } from '../types';

interface UseSalesOrderFormOptions {
  controlledOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface SalesOrderFormState {
  // Dialog open state
  open: boolean;
  setOpen: (value: boolean) => void;

  // Wizard state
  wizardStep: WizardStep;
  setWizardStep: (step: WizardStep) => void;
  selectedSalesChannel: SalesChannelType | null;
  setSelectedSalesChannel: (channel: SalesChannelType | null) => void;

  // Loading
  loading: boolean;
  setLoading: (v: boolean) => void;
  loadingOrder: boolean;
  setLoadingOrder: (v: boolean) => void;

  // Form data
  selectedCustomer: UnifiedCustomer | null;
  setSelectedCustomer: (c: UnifiedCustomer | null) => void;
  orderDate: string;
  setOrderDate: (d: string) => void;
  expectedDeliveryDate: string | null;
  setExpectedDeliveryDate: (d: string | null) => void;
  shippingAddress: string;
  setShippingAddress: (a: string) => void;
  billingAddress: string;
  setBillingAddress: (a: string) => void;
  notes: string;
  setNotes: (n: string) => void;
  ecoTaxVatRate: number | null;
  setEcoTaxVatRate: (r: number | null) => void;

  // Payment terms
  paymentTermsType: Database['public']['Enums']['payment_terms_type'] | null;
  setPaymentTermsType: (
    t: Database['public']['Enums']['payment_terms_type'] | null
  ) => void;
  paymentTermsNotes: string;
  setPaymentTermsNotes: (n: string) => void;

  // Sales channel
  channelId: string | null;
  setChannelId: (id: string | null) => void;
  availableChannels: Array<{ id: string; name: string; code: string }>;

  // Additional costs
  shippingCostHt: number;
  setShippingCostHt: (v: number) => void;
  insuranceCostHt: number;
  setInsuranceCostHt: (v: number) => void;
  handlingCostHt: number;
  setHandlingCostHt: (v: number) => void;

  // Items
  items: OrderItem[];
  setItems: (items: OrderItem[]) => void;
  showProductSelector: boolean;
  setShowProductSelector: (v: boolean) => void;
  stockWarnings: string[];
  setStockWarnings: (w: string[]) => void;

  // Confirmation
  showConfirmation: boolean;
  setShowConfirmation: (v: boolean) => void;

  // Reset
  resetForm: () => void;

  // Supabase client
  supabase: ReturnType<typeof createClient>;
}

export function useSalesOrderForm({
  controlledOpen,
  onOpenChange,
}: UseSalesOrderFormOptions): SalesOrderFormState {
  const [internalOpen, setInternalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('channel-selection');
  const [selectedSalesChannel, setSelectedSalesChannel] =
    useState<SalesChannelType | null>(null);

  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    if (controlledOpen !== undefined) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };

  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const supabase = createClient();

  const [selectedCustomer, setSelectedCustomer] =
    useState<UnifiedCustomer | null>(null);
  const [orderDate, setOrderDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<
    string | null
  >(null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [ecoTaxVatRate, setEcoTaxVatRate] = useState<number | null>(null);

  const [paymentTermsType, setPaymentTermsType] = useState<
    Database['public']['Enums']['payment_terms_type'] | null
  >(null);
  const [paymentTermsNotes, setPaymentTermsNotes] = useState('');

  const [channelId, setChannelId] = useState<string | null>(null);
  const [availableChannels, setAvailableChannels] = useState<
    Array<{ id: string; name: string; code: string }>
  >([]);

  const [shippingCostHt, setShippingCostHt] = useState<number>(0);
  const [insuranceCostHt, setInsuranceCostHt] = useState<number>(0);
  const [handlingCostHt, setHandlingCostHt] = useState<number>(0);

  const [items, setItems] = useState<OrderItem[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [stockWarnings, setStockWarnings] = useState<string[]>([]);

  const [showConfirmation, setShowConfirmation] = useState(false);

  // Charger les canaux de vente disponibles
  useEffect(() => {
    const loadChannels = async () => {
      const { data, error } = await supabase
        .from('sales_channels')
        .select('id, name, code')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Erreur chargement canaux:', error);
        return;
      }

      setAvailableChannels(data ?? []);
    };

    void loadChannels().catch(console.error);
  }, [supabase]);

  const resetForm = () => {
    setWizardStep('channel-selection');
    setSelectedSalesChannel(null);
    setSelectedCustomer(null);
    setOrderDate(new Date().toISOString().split('T')[0]);
    setExpectedDeliveryDate(null);
    setShippingAddress('');
    setBillingAddress('');
    setNotes('');
    setEcoTaxVatRate(null);
    setPaymentTermsType(null);
    setPaymentTermsNotes('');
    setChannelId(null);
    setItems([]);
    setStockWarnings([]);
    setShippingCostHt(0);
    setInsuranceCostHt(0);
    setHandlingCostHt(0);
  };

  return {
    open,
    setOpen,
    wizardStep,
    setWizardStep,
    selectedSalesChannel,
    setSelectedSalesChannel,
    loading,
    setLoading,
    loadingOrder,
    setLoadingOrder,
    selectedCustomer,
    setSelectedCustomer,
    orderDate,
    setOrderDate,
    expectedDeliveryDate,
    setExpectedDeliveryDate,
    shippingAddress,
    setShippingAddress,
    billingAddress,
    setBillingAddress,
    notes,
    setNotes,
    ecoTaxVatRate,
    setEcoTaxVatRate,
    paymentTermsType,
    setPaymentTermsType,
    paymentTermsNotes,
    setPaymentTermsNotes,
    channelId,
    setChannelId,
    availableChannels,
    shippingCostHt,
    setShippingCostHt,
    insuranceCostHt,
    setInsuranceCostHt,
    handlingCostHt,
    setHandlingCostHt,
    items,
    setItems,
    showProductSelector,
    setShowProductSelector,
    stockWarnings,
    setStockWarnings,
    showConfirmation,
    setShowConfirmation,
    resetForm,
    supabase,
  };
}
