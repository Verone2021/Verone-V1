'use client';

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@/lib/supabase/client';

/**
 * Hook Universel CRUD Items Commandes
 *
 * Gère les items de commandes achats ET ventes avec une seule API.
 * Pattern réutilisable selon orderType: 'purchase' | 'sales'
 *
 * @example
 * // Commandes Achats
 * const { items, addItem, updateItem, removeItem } = useOrderItems({
 *   orderId: 'xxx',
 *   orderType: 'purchase'
 * })
 *
 * @example
 * // Commandes Ventes
 * const { items, addItem, updateItem, removeItem } = useOrderItems({
 *   orderId: 'yyy',
 *   orderType: 'sales'
 * })
 */

export type OrderType = 'purchase' | 'sales';

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  discount_percentage: number;
  eco_tax: number;
  total_ht?: number;
  notes?: string;

  // Champs spécifiques Purchase
  purchase_order_id?: string;
  quantity_received?: number;
  expected_delivery_date?: string | null;

  // Champs spécifiques Sales
  sales_order_id?: string;
  quantity_shipped?: number;
  tax_rate?: number;
  retrocession_rate?: number;
  retrocession_amount?: number;

  // Relations
  products?: any;

  created_at?: string;
  updated_at?: string;
}

export interface CreateOrderItemData {
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  discount_percentage?: number;
  eco_tax?: number;
  tax_rate?: number; // Sales only
  notes?: string;
}

interface UseOrderItemsProps {
  orderId: string | null | undefined;
  orderType: OrderType;
}

interface UseOrderItemsReturn {
  items: OrderItem[];
  loading: boolean;
  error: string | null;
  addItem: (data: CreateOrderItemData) => Promise<OrderItem>;
  updateItem: (itemId: string, data: Partial<OrderItem>) => Promise<OrderItem>;
  removeItem: (itemId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useOrderItems({
  orderId,
  orderType,
}: UseOrderItemsProps): UseOrderItemsReturn {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Configuration dynamique selon orderType
  const table =
    orderType === 'purchase' ? 'purchase_order_items' : 'sales_order_items';
  const fkColumn =
    orderType === 'purchase' ? 'purchase_order_id' : 'sales_order_id';

  // Récupérer items avec produits associés
  const fetchItems = useCallback(async () => {
    if (!orderId) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from(table)
        .select(
          `
          *,
          products (
            id,
            name,
            sku,
            cost_price,
            eco_tax_default,
            product_images (
              public_url,
              is_primary,
              display_order
            )
          )
        `
        )
        .eq(fkColumn, orderId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Cast to OrderItem[] car les types Supabase ne sont pas à jour avec eco_tax
      setItems((data || []) as OrderItem[]);
    } catch (err) {
      console.error(`❌ [useOrderItems] Erreur fetch items ${orderType}:`, err);
      setError(err instanceof Error ? err.message : 'Erreur fetch items');
    } finally {
      setLoading(false);
    }
  }, [orderId, orderType, table, fkColumn, supabase]);

  // Charger items au montage et quand orderId change
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Ajouter item UNIVERSEL
  const addItem = useCallback(
    async (data: CreateOrderItemData): Promise<OrderItem> => {
      if (!orderId) {
        throw new Error('Order ID requis pour ajouter un item');
      }

      try {
        // Préparer données item selon orderType
        const itemData: any = {
          [fkColumn]: orderId,
          product_id: data.product_id,
          quantity: data.quantity,
          unit_price_ht: data.unit_price_ht,
          discount_percentage: data.discount_percentage || 0,
          eco_tax: data.eco_tax || 0,
          notes: data.notes || null,
        };

        // Champs spécifiques ventes
        if (orderType === 'sales') {
          itemData.tax_rate = data.tax_rate || 0.2; // TVA 20% par défaut
        }

        const { data: newItem, error: insertError } = await supabase
          .from(table)
          .insert(itemData)
          .select(
            `
          *,
          products (
            id,
            name,
            sku,
            cost_price,
            eco_tax_default,
            product_images (
              public_url,
              is_primary,
              display_order
            )
          )
        `
          )
          .single();

        if (insertError) throw insertError;
        if (!newItem) throw new Error('Item créé mais non retourné');

        console.log(
          `✅ [useOrderItems] Item ajouté (${orderType}):`,
          newItem.id
        );

        // Trigger recalcul automatique via DB trigger
        await fetchItems();

        return newItem as OrderItem;
      } catch (err) {
        console.error(
          `❌ [useOrderItems] Erreur ajout item ${orderType}:`,
          err
        );
        throw err;
      }
    },
    [orderId, orderType, table, fkColumn, supabase, fetchItems]
  );

  // Modifier item UNIVERSEL
  const updateItem = useCallback(
    async (itemId: string, data: Partial<OrderItem>): Promise<OrderItem> => {
      try {
        // Préparer données à modifier
        const updateData: any = {};

        if (data.quantity !== undefined) updateData.quantity = data.quantity;
        if (data.unit_price_ht !== undefined)
          updateData.unit_price_ht = data.unit_price_ht;
        if (data.discount_percentage !== undefined)
          updateData.discount_percentage = data.discount_percentage;
        if (data.eco_tax !== undefined) updateData.eco_tax = data.eco_tax;
        if (data.notes !== undefined) updateData.notes = data.notes;

        // Champs spécifiques ventes
        if (orderType === 'sales' && data.tax_rate !== undefined) {
          updateData.tax_rate = data.tax_rate;
        }

        const { data: updated, error: updateError } = await supabase
          .from(table)
          .update(updateData)
          .eq('id', itemId)
          .select(
            `
          *,
          products (
            id,
            name,
            sku,
            cost_price,
            eco_tax_default,
            product_images (
              public_url,
              is_primary,
              display_order
            )
          )
        `
          )
          .single();

        if (updateError) throw updateError;
        if (!updated) throw new Error('Item modifié mais non retourné');

        console.log(`✅ [useOrderItems] Item modifié (${orderType}):`, itemId);

        // Trigger recalcul automatique via DB trigger
        await fetchItems();

        return updated as OrderItem;
      } catch (err) {
        console.error(
          `❌ [useOrderItems] Erreur modification item ${orderType}:`,
          err
        );
        throw err;
      }
    },
    [orderType, table, supabase, fetchItems]
  );

  // Supprimer item UNIVERSEL
  const removeItem = useCallback(
    async (itemId: string): Promise<void> => {
      try {
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', itemId);

        if (deleteError) throw deleteError;

        console.log(`✅ [useOrderItems] Item supprimé (${orderType}):`, itemId);

        // Trigger recalcul automatique via DB trigger
        await fetchItems();
      } catch (err) {
        console.error(
          `❌ [useOrderItems] Erreur suppression item ${orderType}:`,
          err
        );
        throw err;
      }
    },
    [orderType, table, supabase, fetchItems]
  );

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    refetch: fetchItems,
  };
}
