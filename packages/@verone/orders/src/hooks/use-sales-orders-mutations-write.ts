'use client';

/**
 * Sales Orders — Write mutations (createOrder, updateOrderWithItems)
 * Extracted from use-sales-orders-mutations.ts for max-lines compliance
 */

import { useCallback } from 'react';

import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  SalesOrder,
  SalesOrderFilters,
  CreateSalesOrderData,
  CreateSalesOrderItemData,
  UpdateSalesOrderData,
} from './types/sales-order.types';

type ToastFn = ReturnType<
  typeof import('@verone/common/hooks').useToast
>['toast'];

export interface WriteMutationDeps {
  supabase: SupabaseClient;
  toastRef: { current: ToastFn };
  setLoading: (loading: boolean) => void;
  fetchOrders: (filters?: SalesOrderFilters) => Promise<void>;
  fetchOrder: (orderId: string) => Promise<SalesOrder | null>;
  currentOrderRef: { readonly current: { id: string } | null };
  checkStockAvailability: (items: CreateSalesOrderItemData[]) => Promise<
    Array<{
      product_id: string;
      requested_quantity: number;
      available_stock: unknown;
      is_available: boolean;
    }>
  >;
  getAvailableStock: (
    productId: string
  ) => Promise<{ stock_available?: number }>;
}

export function useSalesOrdersWriteMutations({
  supabase,
  toastRef,
  setLoading,
  fetchOrders,
  fetchOrder,
  currentOrderRef,
  checkStockAvailability,
  getAvailableStock,
}: WriteMutationDeps) {
  const createOrder = useCallback(
    async (data: CreateSalesOrderData, autoReserve = false) => {
      setLoading(true);
      try {
        const stockCheck = await checkStockAvailability(data.items);
        const unavailableItems = stockCheck.filter(item => !item.is_available);

        if (unavailableItems.length > 0) {
          toastRef.current({
            title: '⚠️ Attention Stock',
            description: `Stock insuffisant pour ${unavailableItems.length} produit(s). La commande sera créée en stock prévisionnel négatif.`,
            variant: 'default',
          });
        }

        const soNumberResult = await supabase.rpc('generate_so_number');
        if (soNumberResult.error) throw soNumberResult.error;
        const soNumber = soNumberResult.data as unknown as string;

        const totalHT = data.items.reduce(
          (sum, item) =>
            sum +
            item.quantity *
              item.unit_price_ht *
              (1 - (item.discount_percentage ?? 0) / 100),
          0
        );
        const totalTTC = totalHT * (1 + 0.2);

        const orderResult = await supabase
          .from('sales_orders')
          .insert([
            {
              order_number: soNumber,
              customer_id:
                data.customer_type === 'organization' ? data.customer_id : null,
              customer_type: data.customer_type,
              individual_customer_id:
                data.customer_type === 'individual'
                  ? (data.individual_customer_id ?? data.customer_id)
                  : null,
              order_date: data.order_date ?? null,
              channel_id: data.channel_id ?? null,
              expected_delivery_date: data.expected_delivery_date ?? null,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- JSONB address passthrough
              shipping_address: data.shipping_address,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- JSONB address passthrough
              billing_address: data.billing_address,
              payment_terms: data.payment_terms,
              notes: data.notes,
              total_ht: totalHT,
              total_ttc: totalTTC,
              created_by: (await supabase.auth.getUser()).data.user?.id,
              tax_rate: 0.2,
              shipping_cost_ht: data.shipping_cost_ht ?? 0,
              insurance_cost_ht: data.insurance_cost_ht ?? 0,
              handling_cost_ht: data.handling_cost_ht ?? 0,
              consultation_id: data.consultation_id ?? null,
            },
          ] as never)
          .select('id, order_number, status')
          .single();

        if (orderResult.error) throw orderResult.error;
        const order = orderResult.data as unknown as {
          id: string;
          order_number: string;
          status: string | null;
        };

        const itemsInsertResult = await supabase
          .from('sales_order_items')
          .insert(
            data.items.map(item => ({
              sales_order_id: order.id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price_ht: item.unit_price_ht,
              tax_rate: item.tax_rate ?? 0.2,
              discount_percentage: item.discount_percentage ?? 0,
              eco_tax: item.eco_tax ?? 0,
              expected_delivery_date: item.expected_delivery_date ?? null,
              notes: item.notes,
              is_sample: item.is_sample ?? false,
            }))
          );
        if (itemsInsertResult.error) throw itemsInsertResult.error;

        const initialStatus = order.status ?? 'draft';
        if (initialStatus === 'validated') {
          for (const item of data.items) {
            const productResult = await supabase
              .from('products')
              .select('stock_real, stock_forecasted_out')
              .eq('id', item.product_id)
              .single();
            if (productResult.error) {
              console.error(
                'Erreur récupération produit pour forecast:',
                productResult.error
              );
              continue;
            }
            const product = productResult.data as unknown as {
              stock_real: number | null;
              stock_forecasted_out: number | null;
            };
            const updateForecastResult = await supabase
              .from('products')
              .update({
                stock_forecasted_out:
                  (product?.stock_forecasted_out ?? 0) + item.quantity,
              })
              .eq('id', item.product_id);
            if (updateForecastResult.error)
              console.error(
                'Erreur mise à jour stock prévisionnel:',
                updateForecastResult.error
              );
          }
        }

        if (autoReserve) {
          try {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            for (const item of data.items) {
              const stockInfo = stockCheck.find(
                s => s.product_id === item.product_id
              );
              if (stockInfo?.is_available) {
                await supabase.from('stock_reservations').insert([
                  {
                    product_id: item.product_id,
                    reserved_quantity: item.quantity,
                    reference_type: 'sales_order',
                    reference_id: order.id,
                    reserved_by: userId,
                    expires_at: data.expected_delivery_date
                      ? new Date(
                          new Date(data.expected_delivery_date).getTime() +
                            7 * 24 * 60 * 60 * 1000
                        ).toISOString()
                      : null,
                  },
                ] as never);
              }
            }
          } catch {
            /* Ne pas faire échouer la création */
          }
        }

        toastRef.current({
          title: 'Succès',
          description: `Commande ${soNumber} créée avec succès`,
        });
        try {
          await fetchOrders();
        } catch {
          /* Non-blocking */
        }
        return order;
      } catch (error: unknown) {
        const errMsg =
          error instanceof Error
            ? error.message
            : typeof error === 'object' && error !== null && 'message' in error
              ? String((error as Record<string, unknown>).message)
              : String(error);
        console.error('[createOrder] Erreur:', errMsg, error);
        toastRef.current({
          title: 'Erreur',
          description: errMsg ?? 'Impossible de créer la commande',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [supabase, fetchOrders, checkStockAvailability, toastRef, setLoading]
  );

  const updateOrderWithItems = useCallback(
    async (
      orderId: string,
      data: UpdateSalesOrderData,
      items: CreateSalesOrderItemData[]
    ) => {
      setLoading(true);
      try {
        const existingOrderResult = await supabase
          .from('sales_orders')
          .select('payment_status_v2, status, order_number')
          .eq('id', orderId)
          .single();
        if (existingOrderResult.error) throw existingOrderResult.error;
        const existingOrder = existingOrderResult.data as unknown as {
          payment_status_v2: string | null;
          status: string | null;
          order_number: string;
        };
        if (!existingOrder) throw new Error('Commande non trouvée');
        // [BO-FIN-009 Phase 3 — R6 finance.md] Aucun champ modifiable hors draft.
        // Pour corriger : dévalider (validated → draft), modifier, revalider.
        if (existingOrder.status !== 'draft') {
          throw new Error(
            `Commande ${existingOrder.order_number} en statut "${existingOrder.status ?? 'inconnu'}" : dévalidez-la d'abord (retour en brouillon) pour modifier, puis revalidez-la après modification.`
          );
        }
        if (existingOrder.payment_status_v2 === 'paid')
          throw new Error('Impossible de modifier une commande déjà payée');

        const existingItemsResult = await supabase
          .from('sales_order_items')
          .select(
            'id, product_id, quantity, unit_price_ht, discount_percentage'
          )
          .eq('sales_order_id', orderId);
        if (existingItemsResult.error) throw existingItemsResult.error;
        const existingItems = existingItemsResult.data as unknown as Array<{
          id: string;
          product_id: string;
          quantity: number;
          unit_price_ht: number;
          discount_percentage: number | null;
        }>;

        const existingItemsMap = new Map(
          (existingItems ?? []).map(item => [item.product_id, item])
        );

        for (const item of items) {
          const availableStockData = await getAvailableStock(item.product_id);
          const availableStock = availableStockData.stock_available ?? 0;
          const currentlyAllocated =
            existingItemsMap.get(item.product_id)?.quantity ?? 0;
          if (availableStock + currentlyAllocated < item.quantity) {
            toastRef.current({
              title: '⚠️ Attention Stock',
              description: 'Stock insuffisant pour certains produits.',
              variant: 'default',
            });
            break;
          }
        }

        const newItemsMap = new Map(items.map(item => [item.product_id, item]));
        const itemsToDelete = (existingItems ?? []).filter(
          item => !newItemsMap.has(item.product_id)
        );
        const itemsToAdd = items.filter(
          item => !existingItemsMap.has(item.product_id)
        );
        const itemsToUpdate = items.filter(newItem => {
          const existing = existingItemsMap.get(newItem.product_id);
          return (
            existing &&
            (existing.quantity !== newItem.quantity ||
              existing.unit_price_ht !== newItem.unit_price_ht ||
              (existing.discount_percentage ?? 0) !==
                (newItem.discount_percentage ?? 0))
          );
        });

        if (itemsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('sales_order_items')
            .delete()
            .in(
              'id',
              itemsToDelete.map(item => item.id)
            );
          if (deleteError) throw deleteError;
        }
        if (itemsToAdd.length > 0) {
          const { error: insertError } = await supabase
            .from('sales_order_items')
            .insert(
              itemsToAdd.map(item => ({
                sales_order_id: orderId,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price_ht: item.unit_price_ht,
                tax_rate: item.tax_rate ?? 0.2,
                discount_percentage: item.discount_percentage ?? 0,
                eco_tax: item.eco_tax ?? 0,
                expected_delivery_date: item.expected_delivery_date,
                notes: item.notes,
                is_sample: item.is_sample ?? false,
              }))
            );
          if (insertError) throw insertError;
        }
        if (itemsToUpdate.length > 0) {
          const updatePayloads = itemsToUpdate
            .map(u => {
              const e = existingItemsMap.get(u.product_id);
              return e
                ? {
                    id: e.id,
                    sales_order_id: orderId,
                    product_id: u.product_id,
                    quantity: u.quantity,
                    unit_price_ht: u.unit_price_ht,
                    tax_rate: u.tax_rate ?? 0.2,
                    discount_percentage: u.discount_percentage ?? 0,
                    eco_tax: u.eco_tax ?? 0,
                    expected_delivery_date: u.expected_delivery_date,
                    notes: u.notes,
                    is_sample: u.is_sample ?? false,
                  }
                : null;
            })
            .filter(Boolean);
          if (updatePayloads.length > 0) {
            const { error: updateItemsError } = await supabase
              .from('sales_order_items')
              .upsert(updatePayloads as never);
            if (updateItemsError) throw updateItemsError;
          }
        }

        const totalHT = items.reduce(
          (sum, item) =>
            sum +
            item.quantity *
              item.unit_price_ht *
              (1 - (item.discount_percentage ?? 0) / 100),
          0
        );
        const { error: updateOrderError } = await supabase
          .from('sales_orders')
          .update({ ...data, total_ht: totalHT, total_ttc: totalHT * 1.2 })
          .eq('id', orderId);
        if (updateOrderError) throw updateOrderError;

        toastRef.current({
          title: 'Succès',
          description: `Commande ${existingOrder.order_number} mise à jour avec succès`,
        });
        await fetchOrders();
        if (currentOrderRef.current?.id === orderId) await fetchOrder(orderId);
        return true;
      } catch (error: unknown) {
        console.error('Erreur lors de la mise à jour de la commande:', error);
        toastRef.current({
          title: 'Erreur',
          description:
            error instanceof Error
              ? error.message
              : 'Impossible de mettre à jour la commande',
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [
      supabase,
      fetchOrders,
      fetchOrder,
      getAvailableStock,
      currentOrderRef,
      toastRef,
      setLoading,
    ]
  );

  return { createOrder, updateOrderWithItems };
}
