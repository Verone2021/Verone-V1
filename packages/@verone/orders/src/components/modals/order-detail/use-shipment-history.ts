'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type { ShipmentHistoryItem } from './OrderShipmentHistoryCard';

export interface OrderItemSummary {
  id: string;
  quantity: number;
  products: { sku: string } | null;
}

export interface ShipmentHistoryResult {
  shipmentHistory: ShipmentHistoryItem[];
  salesOrderItems: OrderItemSummary[];
}

/**
 * Lightweight hook that loads shipment history + order items for any order ID.
 * Used by contexts that don't have a full SalesOrder object
 * (e.g. site-internet OrderDetailModal).
 *
 * Returns both shipmentHistory and salesOrderItems so the caller can
 * display the qtyOrdered ratio (shipped / ordered) without a cast.
 */
export function useShipmentHistory(
  orderId: string | null | undefined,
  open: boolean
): ShipmentHistoryResult {
  const [shipmentHistory, setShipmentHistory] = useState<ShipmentHistoryItem[]>(
    []
  );
  const [salesOrderItems, setSalesOrderItems] = useState<OrderItemSummary[]>(
    []
  );

  useEffect(() => {
    if (!open || !orderId) {
      setShipmentHistory([]);
      setSalesOrderItems([]);
      return;
    }

    const supabase = createClient();

    // Packlink does not emit a webhook when a shipment is deleted from the
    // PRO web interface. Without this on-demand sync, a user who cancels
    // a shipment on Packlink sees a phantom "a_payer" row in our UI. This
    // POST checks each DB row with packlink_status='a_payer' against the
    // Packlink API and deletes the row if Packlink returns 404.
    const loadAfterSync = async () => {
      try {
        await fetch('/api/packlink/shipments/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sales_order_id: orderId }),
        }).catch(() => null);
      } catch {
        // Sync failure should not block the history display — fall
        // through to load whatever is in DB.
      }
      return loadFromDb();
    };

    const loadFromDb = () =>
      supabase
        .from('sales_order_shipments')
        .select(
          `
        id,
        shipped_at,
        tracking_number,
        tracking_url,
        notes,
        quantity_shipped,
        product_id,
        delivery_method,
        carrier_name,
        carrier_service,
        shipping_cost,
        packlink_status,
        packlink_shipment_id,
        label_url,
        products:product_id (name, sku)
      `
        )
        .eq('sales_order_id', orderId)
        .order('shipped_at', { ascending: true })
        .then(({ data, error: queryError }) => {
          if (queryError) {
            console.error('[useShipmentHistory] query failed:', queryError);
            return;
          }
          if (!data || data.length === 0) {
            setShipmentHistory([]);
            return;
          }

          const rows = data as unknown as Array<
            Record<string, unknown> & {
              id: string;
              shipped_at: string;
              tracking_number: string | null;
              notes: string | null;
              quantity_shipped: number;
              products: { name: string; sku: string } | null;
            }
          >;

          const grouped = new Map<string, ShipmentHistoryItem>();
          for (const row of rows) {
            const key = row.shipped_at;
            const product = row.products;
            if (!grouped.has(key)) {
              grouped.set(key, {
                id: row.id,
                shipped_at: row.shipped_at,
                tracking_number: row.tracking_number,
                tracking_url: (row.tracking_url as string) ?? null,
                notes: row.notes,
                delivery_method: (row.delivery_method as string) ?? null,
                carrier_name: (row.carrier_name as string) ?? null,
                carrier_service: (row.carrier_service as string) ?? null,
                shipping_cost: (row.shipping_cost as number) ?? null,
                packlink_status: (row.packlink_status as string) ?? null,
                packlink_shipment_id:
                  (row.packlink_shipment_id as string) ?? null,
                label_url: (row.label_url as string) ?? null,
                items: [],
              });
            }
            grouped.get(key)!.items.push({
              product_name: product?.name ?? 'Produit inconnu',
              product_sku: product?.sku ?? '-',
              quantity_shipped: row.quantity_shipped,
            });
          }
          setShipmentHistory(Array.from(grouped.values()));
        });

    // Sync Packlink → DB, then load shipment history from DB
    void loadAfterSync();

    // Load order items to display qtyOrdered ratio
    void supabase
      .from('sales_order_items')
      .select('id, quantity, products:product_id (sku)')
      .eq('sales_order_id', orderId)
      .then(({ data: itemsData, error: itemsError }) => {
        if (itemsError) {
          console.error('[useShipmentHistory] items query failed:', itemsError);
          return;
        }
        setSalesOrderItems((itemsData ?? []) as unknown as OrderItemSummary[]);
      });
  }, [orderId, open]);

  return { shipmentHistory, salesOrderItems };
}
