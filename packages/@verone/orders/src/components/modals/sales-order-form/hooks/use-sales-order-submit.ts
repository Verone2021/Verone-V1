'use client';

import { useCallback, useEffect } from 'react';

import type { Database } from '@verone/types';
import type { createClient } from '@verone/utils/supabase/client';

import type { CreateSalesOrderData } from '@verone/orders/hooks';
import { useSalesOrders } from '@verone/orders/hooks';

import type { UnifiedCustomer } from '../../../modals/customer-selector';
import type { OrderItem } from '../OrderItemsTable';
import type {
  SalesOrderExtended,
  SalesOrderItemExtended,
  ProductExtended,
} from '../types';

interface UseSalesOrderSubmitOptions {
  mode: 'create' | 'edit';
  orderId?: string;
  open: boolean;

  // State setters from useSalesOrderForm
  setLoading: (v: boolean) => void;
  setLoadingOrder: (v: boolean) => void;
  setSelectedCustomer: (c: UnifiedCustomer | null) => void;
  setOrderDate: (d: string) => void;
  setExpectedDeliveryDate: (d: string | null) => void;
  setShippingAddress: (a: string) => void;
  setBillingAddress: (a: string) => void;
  setNotes: (n: string) => void;
  setEcoTaxVatRate: (r: number | null) => void;
  setPaymentTermsType: (
    t: Database['public']['Enums']['payment_terms_type'] | null
  ) => void;
  setPaymentTermsNotes: (n: string) => void;
  setChannelId: (id: string | null) => void;
  setShippingCostHt: (v: number) => void;
  setInsuranceCostHt: (v: number) => void;
  setHandlingCostHt: (v: number) => void;
  setItems: (items: OrderItem[]) => void;
  setShowConfirmation: (v: boolean) => void;

  // Current state values
  selectedCustomer: UnifiedCustomer | null;
  orderDate: string;
  expectedDeliveryDate: string | null;
  shippingAddress: string;
  billingAddress: string;
  paymentTermsType: Database['public']['Enums']['payment_terms_type'] | null;
  paymentTermsNotes: string;
  channelId: string | null;
  notes: string;
  ecoTaxVatRate: number | null;
  shippingCostHt: number;
  insuranceCostHt: number;
  handlingCostHt: number;
  items: OrderItem[];

  // Callbacks
  resetForm: () => void;
  setOpen: (v: boolean) => void;
  onSuccess?: () => void;
  checkAllStockAvailability: (currentItems: OrderItem[]) => Promise<void>;
  getAvailableStock: (
    productId: string
  ) => Promise<{ stock_available: number } | null | undefined>;
  supabase: ReturnType<typeof createClient>;
}

export function useSalesOrderSubmit({
  mode,
  orderId,
  open,
  setLoading,
  setLoadingOrder,
  setSelectedCustomer,
  setOrderDate,
  setExpectedDeliveryDate,
  setShippingAddress,
  setBillingAddress,
  setNotes,
  setEcoTaxVatRate,
  setPaymentTermsType,
  setPaymentTermsNotes,
  setChannelId,
  setShippingCostHt,
  setInsuranceCostHt,
  setHandlingCostHt,
  setItems,
  setShowConfirmation,
  selectedCustomer,
  orderDate,
  expectedDeliveryDate,
  shippingAddress,
  billingAddress,
  paymentTermsType,
  paymentTermsNotes,
  channelId,
  notes,
  ecoTaxVatRate,
  shippingCostHt,
  insuranceCostHt,
  handlingCostHt,
  items,
  resetForm,
  setOpen,
  onSuccess,
  checkAllStockAvailability,
  getAvailableStock,
}: UseSalesOrderSubmitOptions) {
  const { createOrder, updateOrderWithItems, fetchOrder } = useSalesOrders();

  // Charger la commande existante en mode édition
  const loadExistingOrder = useCallback(
    async (orderIdToLoad: string) => {
      setLoadingOrder(true);
      try {
        const order = await fetchOrder(orderIdToLoad);
        if (!order) throw new Error('Commande non trouvée');

        const orderExt = order as typeof order & SalesOrderExtended;

        const extractAddress = (addr: unknown): string => {
          if (!addr) return '';
          if (typeof addr === 'string') return addr;
          if (typeof addr === 'object' && addr !== null && 'address' in addr) {
            const val = (addr as { address: unknown }).address;
            return typeof val === 'string' ? val : '';
          }
          return '';
        };

        const customer: UnifiedCustomer =
          order.customer_type === 'organization'
            ? {
                id: order.customer_id,
                type: 'professional' as const,
                name:
                  order.organisations?.trade_name ??
                  order.organisations?.legal_name ??
                  '',
                payment_terms: null,
                prepayment_required: false,
              }
            : {
                id: order.customer_id,
                type: 'individual' as const,
                name: `${order.individual_customers?.first_name ?? ''} ${order.individual_customers?.last_name ?? ''}`.trim(),
                payment_terms: null,
                prepayment_required: false,
              };

        setSelectedCustomer(customer);
        setOrderDate(
          order.order_date ?? new Date().toISOString().split('T')[0]
        );
        setExpectedDeliveryDate(order.expected_delivery_date ?? null);
        setShippingAddress(extractAddress(order.shipping_address));
        setBillingAddress(extractAddress(order.billing_address));
        setNotes(order.notes ?? '');
        setEcoTaxVatRate(order.eco_tax_vat_rate ?? null);
        setPaymentTermsType(orderExt.payment_terms_type ?? null);
        setPaymentTermsNotes(orderExt.payment_terms_notes ?? '');
        setChannelId(order.channel_id ?? null);
        setShippingCostHt(order.shipping_cost_ht ?? 0);
        setInsuranceCostHt(order.insurance_cost_ht ?? 0);
        setHandlingCostHt(order.handling_cost_ht ?? 0);

        const loadedItems: OrderItem[] = await Promise.all(
          (order.sales_order_items ?? []).map(async item => {
            const stockData = await getAvailableStock(item.product_id);
            const itemExt = item as typeof item & SalesOrderItemExtended;
            const prodExt = item.products as
              | (typeof item.products & ProductExtended)
              | undefined;

            return {
              id: item.id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price_ht: item.unit_price_ht,
              tax_rate: item.tax_rate ?? 0.2,
              discount_percentage: item.discount_percentage,
              eco_tax: itemExt.eco_tax ?? 0,
              expected_delivery_date: item.expected_delivery_date,
              notes: item.notes,
              is_sample: itemExt.is_sample ?? false,
              product: item.products
                ? {
                    id: item.products.id,
                    name: item.products.name,
                    sku: item.products.sku,
                    primary_image_url: undefined,
                    stock_quantity: item.products.stock_quantity,
                    eco_tax_default: prodExt?.eco_tax_default ?? 0,
                  }
                : undefined,
              availableStock: stockData?.stock_available ?? 0,
              pricing_source: 'base_catalog' as const,
              original_price_ht: item.unit_price_ht,
              auto_calculated: false,
            };
          })
        );

        setItems(loadedItems);
        await checkAllStockAvailability(loadedItems);
      } catch (error) {
        console.error('Erreur lors du chargement de la commande:', error);
      } finally {
        setLoadingOrder(false);
      }
    },
    [
      fetchOrder,
      getAvailableStock,
      checkAllStockAvailability,
      setLoadingOrder,
      setSelectedCustomer,
      setOrderDate,
      setExpectedDeliveryDate,
      setShippingAddress,
      setBillingAddress,
      setNotes,
      setEcoTaxVatRate,
      setPaymentTermsType,
      setPaymentTermsNotes,
      setChannelId,
      setShippingCostHt,
      setInsuranceCostHt,
      setHandlingCostHt,
      setItems,
    ]
  );

  // Effet : charger la commande en mode édition quand la modal s'ouvre
  useEffect(() => {
    if (open && mode === 'edit' && orderId) {
      void loadExistingOrder(orderId).catch(console.error);
    }
  }, [open, mode, orderId, loadExistingOrder]);

  const handleSubmitConfirmed = async () => {
    if (!selectedCustomer || items.length === 0) return;

    setLoading(true);
    try {
      const itemsData = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        tax_rate: item.tax_rate,
        discount_percentage: item.discount_percentage,
        eco_tax: item.eco_tax ?? 0,
        expected_delivery_date: item.expected_delivery_date,
        notes: item.notes,
        is_sample: item.is_sample ?? false,
      }));

      if (mode === 'edit' && orderId) {
        const updateData = {
          order_date: orderDate,
          expected_delivery_date: expectedDeliveryDate ?? undefined,
          shipping_address: shippingAddress
            ? { address: shippingAddress }
            : undefined,
          billing_address: billingAddress
            ? { address: billingAddress }
            : undefined,
          payment_terms_type: paymentTermsType ?? undefined,
          payment_terms_notes: paymentTermsNotes ?? undefined,
          channel_id: channelId ?? undefined,
          notes: notes ?? undefined,
          eco_tax_vat_rate: ecoTaxVatRate,
          shipping_cost_ht: shippingCostHt ?? 0,
          insurance_cost_ht: insuranceCostHt ?? 0,
          handling_cost_ht: handlingCostHt ?? 0,
        };

        await updateOrderWithItems(orderId, updateData, itemsData);
      } else {
        const orderData: CreateSalesOrderData = {
          customer_id: selectedCustomer.id,
          customer_type:
            selectedCustomer.type === 'professional'
              ? 'organization'
              : 'individual',
          order_date: orderDate,
          expected_delivery_date: expectedDeliveryDate ?? undefined,
          shipping_address: shippingAddress
            ? { address: shippingAddress }
            : undefined,
          billing_address: billingAddress
            ? { address: billingAddress }
            : undefined,
          payment_terms_type: paymentTermsType ?? undefined,
          payment_terms_notes: paymentTermsNotes ?? undefined,
          channel_id: channelId ?? undefined,
          notes: notes ?? undefined,
          eco_tax_vat_rate: ecoTaxVatRate,
          shipping_cost_ht: shippingCostHt ?? 0,
          insurance_cost_ht: insuranceCostHt ?? 0,
          handling_cost_ht: handlingCostHt ?? 0,
          items: itemsData,
        };

        await createOrder(orderData);
      }

      resetForm();
      setOpen(false);
      setShowConfirmation(false);
      onSuccess?.();
    } catch (error) {
      console.error(
        `Erreur lors de ${mode === 'edit' ? 'la mise à jour' : 'la création'}:`,
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || items.length === 0) return;
    setShowConfirmation(true);
  };

  return {
    handleSubmitConfirmed,
    handleSubmit,
    loadExistingOrder,
  };
}
