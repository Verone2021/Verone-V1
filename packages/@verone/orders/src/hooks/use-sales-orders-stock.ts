'use client';

/**
 * Sales Orders — Stock operations (check availability, forecasted, warehouse exit)
 * Internal helper for use-sales-orders.ts orchestrator
 */

import { useCallback } from 'react';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { CreateSalesOrderItemData } from './types/sales-order.types';

type ToastFn = ReturnType<
  typeof import('@verone/common/hooks').useToast
>['toast'];

interface StockDeps {
  supabase: SupabaseClient;
  toastRef: { current: ToastFn };
  fetchOrders: () => Promise<void>;
  fetchOrder: (orderId: string) => Promise<unknown>;
  currentOrderRef: { readonly current: { id: string } | null };
  getAvailableStock: (
    productId: string
  ) => Promise<{ stock_available?: number }>;
}

export function useSalesOrdersStock({
  supabase,
  toastRef,
  fetchOrders,
  fetchOrder,
  currentOrderRef,
  getAvailableStock,
}: StockDeps) {
  const checkStockAvailability = useCallback(
    async (items: CreateSalesOrderItemData[]) => {
      const availabilityCheck: Array<{
        product_id: string;
        requested_quantity: number;
        available_stock: unknown;
        is_available: boolean;
      }> = [];

      for (const item of items) {
        const availableStock = await getAvailableStock(item.product_id);
        availabilityCheck.push({
          product_id: item.product_id,
          requested_quantity: item.quantity,
          available_stock: availableStock,
          is_available: (availableStock as unknown as number) >= item.quantity,
        });
      }

      return availabilityCheck;
    },
    [getAvailableStock]
  );

  const getStockWithForecasted = useCallback(
    async (productId: string) => {
      try {
        const result = await supabase
          .from('products')
          .select('stock_real, stock_forecasted_in, stock_forecasted_out')
          .eq('id', productId)
          .single();

        if (result.error) throw result.error;

        const stockData = result.data as unknown as {
          stock_real: number | null;
          stock_forecasted_in: number | null;
          stock_forecasted_out: number | null;
        } | null;

        const real = stockData?.stock_real ?? 0;
        const forecastIn = stockData?.stock_forecasted_in ?? 0;
        const forecastOut = stockData?.stock_forecasted_out ?? 0;

        return {
          stock_real: real,
          stock_forecasted_in: forecastIn,
          stock_forecasted_out: forecastOut,
          stock_available: real + forecastIn - forecastOut,
          stock_future: real + forecastIn,
        };
      } catch (error) {
        console.error('Erreur lors de la récupération du stock:', error);
        return {
          stock_real: 0,
          stock_forecasted_in: 0,
          stock_forecasted_out: 0,
          stock_available: 0,
          stock_future: 0,
        };
      }
    },
    [supabase]
  );

  const markWarehouseExit = useCallback(
    async (orderId: string) => {
      try {
        const { error } = await supabase.rpc('mark_warehouse_exit', {
          p_order_id: orderId,
        });

        if (error) throw error;

        toastRef.current({
          title: 'Succès',
          description: 'Sortie entrepôt enregistrée avec succès',
        });

        await fetchOrders();
        if (currentOrderRef.current?.id === orderId) {
          await fetchOrder(orderId);
        }
      } catch (error: unknown) {
        console.error('Erreur lors de la sortie entrepôt:', error);
        const errMsg =
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer la sortie entrepôt";
        toastRef.current({
          title: 'Erreur',
          description: errMsg,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [supabase, fetchOrders, fetchOrder, currentOrderRef, toastRef]
  );

  return { checkStockAvailability, getStockWithForecasted, markWarehouseExit };
}
