'use client';

import { useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import type { SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { useStockMovements } from '@verone/stock/hooks';
import type { createClient } from '@verone/utils/supabase/client';

import type { UnifiedCustomer } from '../../../modals/customer-selector';
import type { OrderItem } from '../OrderItemsTable';
import type { PricingV2Result } from '../types';

interface UseSalesOrderPricingOptions {
  selectedCustomer: UnifiedCustomer | null;
  channelId: string | null;
  items: OrderItem[];
  setItems: (items: OrderItem[]) => void;
  setStockWarnings: (w: string[]) => void;
  setShowProductSelector: (v: boolean) => void;
  supabase: ReturnType<typeof createClient>;
}

export function useSalesOrderPricing({
  selectedCustomer,
  channelId,
  items,
  setItems,
  setStockWarnings,
  setShowProductSelector,
  supabase,
}: UseSalesOrderPricingOptions) {
  const { getAvailableStock } = useStockMovements();
  const { toast } = useToast();

  const checkAllStockAvailability = useCallback(
    async (currentItems: OrderItem[]) => {
      const warnings: string[] = [];

      for (const item of currentItems) {
        const stockData = await getAvailableStock(item.product_id);
        const availableStock = stockData?.stock_available ?? 0;
        if (availableStock < item.quantity) {
          warnings.push(
            `${item.product?.name} : Stock insuffisant (Disponible: ${availableStock}, Demandé: ${item.quantity})`
          );
        }
      }

      setStockWarnings(warnings);
    },
    [getAvailableStock, setStockWarnings]
  );

  const calculateProductPrice = async (
    productId: string,
    quantity: number = 1
  ) => {
    if (!selectedCustomer) {
      return {
        unit_price_ht: 0,
        discount_percentage: 0,
        pricing_source: 'base_catalog' as const,
        original_price_ht: 0,
        auto_calculated: false,
      };
    }

    try {
      const { data: rawData, error } = await supabase.rpc(
        'calculate_product_price_v2',
        {
          p_product_id: productId,
          p_quantity: quantity,
          p_channel_id: channelId ?? undefined,
          p_customer_id: selectedCustomer.id,
          p_customer_type:
            selectedCustomer.type === 'professional'
              ? 'organization'
              : 'individual',
          p_date: new Date().toISOString().split('T')[0],
        }
      );

      if (error) {
        console.error('Erreur calcul pricing V2:', error);
        return {
          unit_price_ht: 0,
          discount_percentage: 0,
          pricing_source: 'base_catalog' as const,
          original_price_ht: 0,
          auto_calculated: false,
        };
      }

      const pricingResults = rawData as PricingV2Result[] | null;
      const pricingResult = pricingResults?.[0];
      if (pricingResult) {
        return {
          unit_price_ht: pricingResult.price_ht,
          discount_percentage: (pricingResult.discount_rate ?? 0) * 100,
          pricing_source: pricingResult.price_source,
          original_price_ht: pricingResult.original_price,
          auto_calculated: true,
        };
      }

      return {
        unit_price_ht: 0,
        discount_percentage: 0,
        pricing_source: 'base_catalog' as const,
        original_price_ht: 0,
        auto_calculated: false,
      };
    } catch (err) {
      console.error('Exception calcul pricing:', err);
      return {
        unit_price_ht: 0,
        discount_percentage: 0,
        pricing_source: 'base_catalog' as const,
        original_price_ht: 0,
        auto_calculated: false,
      };
    }
  };

  const handleProductsSelect = async (selectedProducts: SelectedProduct[]) => {
    try {
      const newItems: OrderItem[] = [];

      for (const product of selectedProducts) {
        const existingItem = items.find(item => item.product_id === product.id);

        if (existingItem) {
          continue;
        }

        const stockData = await getAvailableStock(product.id);

        const quantity = product.quantity ?? 1;
        const pricing = await calculateProductPrice(product.id, quantity);

        const finalPrice =
          pricing.unit_price_ht > 0
            ? pricing.unit_price_ht
            : (product.unit_price ?? 0);

        const finalOriginalPrice =
          pricing.original_price_ht > 0
            ? pricing.original_price_ht
            : (product.unit_price ?? 0);

        const newItem: OrderItem = {
          id: `temp-${Date.now()}-${product.id}`,
          product_id: product.id,
          quantity: quantity,
          unit_price_ht: finalPrice,
          tax_rate: 0.2,
          discount_percentage:
            product.discount_percentage ?? pricing.discount_percentage,
          eco_tax: 0,
          notes: product.notes ?? '',
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku ?? '',
            primary_image_url: product.product_images?.[0]?.public_url,
            stock_quantity: product.stock_real,
            eco_tax_default: 0,
          },
          availableStock: stockData?.stock_available ?? 0,
          pricing_source: pricing.pricing_source,
          original_price_ht: finalOriginalPrice,
          auto_calculated:
            pricing.auto_calculated || finalPrice === (product.unit_price ?? 0),
        };
        newItems.push(newItem);
      }

      const updatedItems = [...items, ...newItems];
      setItems(updatedItems);
      await checkAllStockAvailability(updatedItems);

      setShowProductSelector(false);

      toast({
        title: 'Produits ajoutés',
        description: `${newItems.length} produit(s) ajouté(s) à la commande`,
      });
    } catch (error) {
      console.error('Erreur ajout produits:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'ajouter les produits",
        variant: 'destructive',
      });
    }
  };

  const updateItem = async (
    itemId: string,
    field: keyof OrderItem,
    value: OrderItem[keyof OrderItem]
  ) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);

    if (field === 'quantity') {
      await checkAllStockAvailability(updatedItems);
    }
  };

  const removeItem = (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);
    void checkAllStockAvailability(updatedItems).catch(console.error);
  };

  return {
    checkAllStockAvailability,
    calculateProductPrice,
    handleProductsSelect,
    updateItem,
    removeItem,
  };
}
