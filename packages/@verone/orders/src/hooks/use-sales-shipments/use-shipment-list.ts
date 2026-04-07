'use client';

import { useState, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import { enrichCustomerNames } from './utils/enrich-customer-names';

/**
 * Sub-hook : liste SOs prêts à expédier + historique expédiés
 */
export function useShipmentList() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger liste SOs prêts à expédition (pour page /stocks/expeditions)
   */
  const loadSalesOrdersReadyForShipment = useCallback(
    async (filters?: {
      status?: string;
      search?: string;
      urgent_only?: boolean;
      overdue_only?: boolean;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const defaultStatuses = ['validated', 'partially_shipped'] as const;

        const selectFields = `
          id,
          order_number,
          status,
          created_at,
          expected_delivery_date,
          shipped_at,
          customer_id,
          customer_type,
          individual_customer_id,
          sales_order_items (
            id,
            product_id,
            quantity,
            quantity_shipped,
            unit_price_ht,
            products (
              id,
              name,
              sku,
              stock_real,
              product_images!left (
                public_url,
                is_primary
              )
            )
          )
        `;

        let query = supabase
          .from('sales_orders')
          .select(selectFields)
          .in('status', defaultStatuses)
          .order('expected_delivery_date', {
            ascending: true,
            nullsFirst: false,
          });

        if (filters?.status) {
          query = supabase
            .from('sales_orders')
            .select(selectFields)
            .eq(
              'status',
              filters.status as
                | 'draft'
                | 'partially_shipped'
                | 'shipped'
                | 'delivered'
                | 'cancelled'
                | 'pending_approval'
                | 'validated'
                | 'closed'
            )
            .order('expected_delivery_date', {
              ascending: true,
              nullsFirst: false,
            });
        }

        if (filters?.search) {
          // TODO: Recherche client après implémentation RPC get_customer_name()
          query = query.ilike('order_number', `%${filters.search}%`);
        }

        const { data: orders, error: fetchError } = await query;

        if (fetchError) {
          console.error('Erreur chargement SOs:', fetchError);
          setError(fetchError.message);
          return [];
        }

        if (!orders || orders.length === 0) {
          return [];
        }

        return await enrichCustomerNames(supabase, orders);
      } catch (err) {
        console.error('Exception chargement SOs:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  /**
   * Charger historique des commandes expédiées (pour onglet Historique)
   * shipped = statut final (delivered réservé futur Packlink/Chronotruck)
   */
  const loadShippedOrdersHistory = useCallback(
    async (filters?: { status?: string; search?: string }) => {
      try {
        setLoading(true);
        setError(null);

        type ShippedStatus = 'shipped';
        let statusesToLoad: ShippedStatus[] = ['shipped'];
        if (filters?.status && filters.status !== 'all') {
          statusesToLoad = [filters.status as ShippedStatus];
        }

        let query = supabase
          .from('sales_orders')
          .select(
            `
            id,
            order_number,
            status,
            created_at,
            expected_delivery_date,
            shipped_at,
            delivered_at,
            customer_id,
            customer_type,
            individual_customer_id,
            sales_order_items (
              id,
              product_id,
              quantity,
              quantity_shipped,
              unit_price_ht,
              products (
                id,
                name,
                sku,
                stock_real,
                product_images!left (
                  public_url,
                  is_primary
                )
              )
            )
          `
          )
          .in('status', statusesToLoad)
          .order('shipped_at', { ascending: false, nullsFirst: false });

        if (filters?.search) {
          query = query.ilike('order_number', `%${filters.search}%`);
        }

        const { data: orders, error: fetchError } = await query;

        if (fetchError) {
          console.error('Erreur chargement historique SOs:', fetchError);
          setError(fetchError.message);
          return [];
        }

        if (!orders || orders.length === 0) {
          return [];
        }

        return await enrichCustomerNames(supabase, orders);
      } catch (err) {
        console.error('Exception chargement historique SOs:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  return {
    loading,
    error,
    loadSalesOrdersReadyForShipment,
    loadShippedOrdersHistory,
  };
}
